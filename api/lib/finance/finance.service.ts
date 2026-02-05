import { AppContext } from "@api/helpers/types.helpers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema.db";
import { eq, and } from "drizzle-orm";
import { auth } from "@api/lib/auth/auth";

export class FinanceService {
    private db;
    private ctx: AppContext;

    constructor(ctx: AppContext) {
        this.db = drizzle(ctx.env.DB, { schema });
        this.ctx = ctx;
    }

    private async hashPin(pin: string) {
        const myText = new TextEncoder().encode(pin);
        const myDigest = await crypto.subtle.digest(
            { name: 'SHA-256' },
            myText
        );
        const hashArray = Array.from(new Uint8Array(myDigest));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async setPin(userId: string, pin: string) {
        const hashedPin = await this.hashPin(pin);
        await this.db.update(schema.user)
            .set({ transactionPin: hashedPin, updatedAt: new Date() })
            .where(eq(schema.user.id, userId));
    }

    async setPinWithPasswordCheck(userId: string, pin: string, password: string) {
        // Verify password
        const user = await this.db.query.user.findFirst({
            where: eq(schema.user.id, userId),
            columns: { email: true }
        });

        if (!user) throw new Error("User not found");

        // Use better-auth internal sign-in to verify credentials without creating session
        // However, better-auth doesn't expose simple checkPassword easily without full auth flow or accessing adapter.
        // We can check if `auth.api.signInEmail` can be used or we query `account` table.
        // Direct DB Query for 'credential' provider and check hash is risky if hashing algo changes.
        // Best: use auth.api.signInEmail

        try {
            // We need to pass a request context to auth? or just use `auth` instance.
            // auth(this.ctx) gives us the initialized instance.
            // But signInEmail is an API endpoint handler usually.
            // Let's rely on `account` table query and manual check if we knew the hash, 
            // BUT better-auth uses bcrypt or scrypt.
            // Actually, better-auth exposes `internal` or we can try to "sign in".

            // Simpler approach for now:
            const authInstance = auth(this.ctx);
            // We can't easily call signIn without a request object that mimics a real request?
            // Wait, better-auth's `api` object functions often take headers.

            // Let's try to find the account and use typical verify.
            // Actually, to avoid complexity of importing specific hash verify, 
            // we can assume for this specific codebase we can trust better-auth's signIn to throw if invalid?
            // No, signIn returns session or null/error.

            const processSignIn = await authInstance.api.signInEmail({
                body: {
                    email: user.email,
                    password: password
                },
                asResponse: false // we want the data
            });

            if (!processSignIn) {
                throw new Error("Invalid password");
            }
        } catch (e) {
            throw new Error("Invalid password");
        }

        await this.setPin(userId, pin);
    }

    async getUserByEmail(email: string) {
        return await this.db.query.user.findFirst({
            where: eq(schema.user.email, email)
        });
    }

    async getFinancialAccount(userId: string, organizationId: string, currency: string) {
        return await this.db.query.financialAccount.findFirst({
            where: and(
                eq(schema.financialAccount.userId, userId),
                eq(schema.financialAccount.organizationId, organizationId),
                eq(schema.financialAccount.currency, currency)
            )
        });
    }

    async createFinancialAccount(userId: string, organizationId: string, currency: string) {
        // Double check existence to avoid race conditions if possible (though unique constraint on code might help if we had one on user+org+currency)
        // We don't have a unique constraint on user+org+currency in schema, maybe we should have?
        // For now, let's just insert.

        try {
            const [account] = await this.db.insert(schema.financialAccount).values({
                id: crypto.randomUUID(),
                userId,
                organizationId,
                currency,
                type: "LIABILITY",
                balance: 0,
                code: `ACCT-${userId.substring(0, 8)}-${currency}-${Date.now()}` // Ensure uniqueness
            }).returning();
            return account;
        } catch (e) {
            // Handle duplicate if we add unique constraint later
            throw e;
        }
    }

    async ensureFinancialAccount(userId: string, organizationId: string, currency: string) {
        const account = await this.getFinancialAccount(userId, organizationId, currency);
        if (account) return account;
        return await this.createFinancialAccount(userId, organizationId, currency);
    }

    async transfer({
        senderId,
        recipientId,
        organizationId,
        amount,
        currency,
        pin,
        description
    }: {
        senderId: string;
        recipientId: string;
        organizationId: string;
        amount: number;
        currency: string;
        pin: string;
        description?: string;
    }) {
        if (amount <= 0) throw new Error("Amount must be positive");
        if (senderId === recipientId) throw new Error("Cannot transfer to self");

        // 1. Verify PIN
        const sender = await this.db.query.user.findFirst({
            where: eq(schema.user.id, senderId),
            columns: {
                transactionPin: true
            }
        });

        if (!sender?.transactionPin) {
            throw new Error("Transaction PIN not set");
        }

        const hashedPin = await this.hashPin(pin);
        if (sender.transactionPin !== hashedPin) {
            throw new Error("Invalid PIN");
        }

        return await this.db.transaction(async (tx) => {
            // Ensure Recipient Has Account
            let recipientAccount = await tx.query.financialAccount.findFirst({
                where: and(
                    eq(schema.financialAccount.userId, recipientId),
                    eq(schema.financialAccount.organizationId, organizationId),
                    eq(schema.financialAccount.currency, currency)
                )
            });

            if (!recipientAccount) {
                [recipientAccount] = await tx.insert(schema.financialAccount).values({
                    id: crypto.randomUUID(),
                    userId: recipientId,
                    organizationId,
                    currency,
                    type: "LIABILITY",
                    balance: 0,
                    code: `ACCT-${recipientId.substring(0, 8)}-${currency}-${Date.now()}`
                }).returning();
            }

            // Get Sender Account
            const senderAccount = await tx.query.financialAccount.findFirst({
                where: and(
                    eq(schema.financialAccount.userId, senderId),
                    eq(schema.financialAccount.organizationId, organizationId),
                    eq(schema.financialAccount.currency, currency)
                )
            });

            if (!senderAccount) {
                throw new Error("Sender account not found");
            }

            // Check Balance
            if (senderAccount.balance < amount) {
                throw new Error("Insufficient funds");
            }

            // Create Transaction
            const [transaction] = await tx.insert(schema.financialTransaction).values({
                id: crypto.randomUUID(),
                organizationId,
                type: "TRANSFER",
                description: description || `Transfer from ${senderId} to ${recipientId}`,
                createdAt: new Date(),
            }).returning();

            // Create Postings
            await tx.insert(schema.financialPosting).values([
                {
                    id: crypto.randomUUID(),
                    transactionId: transaction.id,
                    accountId: senderAccount.id,
                    amount: -amount,
                    createdAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    transactionId: transaction.id,
                    accountId: recipientAccount.id,
                    amount: amount,
                    createdAt: new Date(),
                }
            ]);

            // Update Balances
            await tx.update(schema.financialAccount)
                .set({
                    updatedAt: new Date(),
                    balance: senderAccount.balance - amount
                })
                .where(eq(schema.financialAccount.id, senderAccount.id));

            await tx.update(schema.financialAccount)
                .set({
                    updatedAt: new Date(),
                    balance: recipientAccount.balance + amount
                })
                .where(eq(schema.financialAccount.id, recipientAccount.id));

            return transaction;
        });
    }

    async transferByEmail({
        senderId,
        recipientEmail,
        organizationId,
        amount,
        currency,
        pin,
        description
    }: {
        senderId: string;
        recipientEmail: string;
        organizationId: string;
        amount: number;
        currency: string;
        pin: string;
        description?: string;
    }) {
        const recipientUser = await this.getUserByEmail(recipientEmail);
        if (!recipientUser) {
            throw new Error(`Recipient user not found for email: ${recipientEmail}`);
        }

        return this.transfer({
            senderId,
            recipientId: recipientUser.id,
            organizationId,
            amount,
            currency,
            pin,
            description
        });
    }

    async getTransactions({
        organizationId,
        currency,
        limit = 50,
        cursor
    }: {
        organizationId: string;
        currency?: string;
        limit?: number;
        cursor?: string;
    }) {
        // Query transactions with postings
        // TODO: complex filtering with filters on joined tables might need raw queries or careful relation queries.
        // For now, let's fetch transactions for the org.

        return await this.db.query.financialTransaction.findMany({
            where: and(
                eq(schema.financialTransaction.organizationId, organizationId),
                // If currency is provided, we arguably should filter by transactions that have matching postings??
                // Or just filter in application layer? querying deep relations is tricky.
                // Simpler: Just return all org transactions for now, or filter by cursor/date.
            ),
            with: {
                postings: {
                    with: {
                        account: true
                    }
                }
            },
            limit: limit,
            orderBy: (finTx, { desc }) => [desc(finTx.createdAt)]
        });
    }

    async reverseTransaction({
        organizationId,
        transactionId,
        reason
    }: {
        organizationId: string;
        transactionId: string;
        reason: string;
    }) {
        return await this.db.transaction(async (tx) => {
            const originalTx = await tx.query.financialTransaction.findFirst({
                where: and(
                    eq(schema.financialTransaction.id, transactionId),
                    eq(schema.financialTransaction.organizationId, organizationId)
                ),
                with: {
                    postings: true
                }
            });

            if (!originalTx) throw new Error("Transaction not found");
            if (originalTx.type === "REVERSAL") throw new Error("Cannot reverse a reversal");

            // Create Reversal Transaction
            const [reversalTx] = await tx.insert(schema.financialTransaction).values({
                id: crypto.randomUUID(),
                organizationId,
                type: "REVERSAL",
                description: `Reversal of ${originalTx.description}: ${reason}`,
                reference: originalTx.id,
                createdAt: new Date()
            }).returning();

            // Invert postings
            for (const posting of originalTx.postings) {
                await tx.insert(schema.financialPosting).values({
                    id: crypto.randomUUID(),
                    transactionId: reversalTx.id,
                    accountId: posting.accountId,
                    amount: -posting.amount, // Invert
                    description: "Reversal",
                    createdAt: new Date()
                });

                // Update Account Balance
                const account = await tx.query.financialAccount.findFirst({
                    where: eq(schema.financialAccount.id, posting.accountId)
                });

                if (account) {
                    await tx.update(schema.financialAccount)
                        .set({
                            balance: account.balance + (-posting.amount),
                            updatedAt: new Date()
                        })
                        .where(eq(schema.financialAccount.id, account.id));
                }
            }

            return reversalTx;
        });
    }
}
