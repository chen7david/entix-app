import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Finance E2E Verification', () => {
    let BASE_URL: string;

    beforeAll(() => {
        const envPath = path.join(__dirname, 'test-env.json');
        if (!fs.existsSync(envPath)) {
            throw new Error('test-env.json not found. Did global setup run?');
        }
        const testEnv = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
        BASE_URL = testEnv.baseUrl;
    });

    async function request(endpoint: string, method = 'GET', body: any = null, headers: any = {}) {
        const opts: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${BASE_URL}${endpoint}`, opts);
        return res;
    }

    test('Full E2E Flow: Auth -> PIN -> Org -> Balance -> Transfer', async () => {
        // 1. Authenticate User A
        console.log("1. Authenticating User A...");
        const emailA = `userA_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
        const password = "Password123!";

        // Sign Up
        let resA = await request('/auth/sign-up/email', 'POST', {
            email: emailA,
            password: password,
            name: "User A"
        });

        if (!resA.ok) {
            console.error("Failed to sign up User A", resA.status, await resA.text());
        }
        expect(resA.ok).toBe(true);

        // Handle Cookie
        let cookieA = resA.headers.get('set-cookie');
        if (cookieA) {
            cookieA = cookieA.split(';')[0];
        } else {
            console.log("No cookie from sign-up, attempting sign-in...");
            const resSignIn = await request('/auth/sign-in/email', 'POST', {
                email: emailA,
                password
            });
            expect(resSignIn.ok).toBe(true);
            const setCookieSignIn = resSignIn.headers.get('set-cookie');
            expect(setCookieSignIn).toBeTruthy();
            if (setCookieSignIn) {
                cookieA = setCookieSignIn.split(';')[0];
            }
        }

        expect(cookieA).toBeTruthy();
        const headersA = { 'Cookie': cookieA };

        // Get User A Session
        const sessionA = await request('/auth/get-session', 'GET', null, headersA);
        const sessionAData = await sessionA.json() as any;
        expect(sessionAData.user).toBeDefined();
        const userAId = sessionAData.user.id;
        console.log("User A ID:", userAId);

        // 2. Set PIN for A
        console.log("2. Setting PIN for User A...");
        const pin = "1234";
        const resPin = await request('/finance/pin', 'POST', { pin, password }, headersA);
        if (!resPin.ok) {
            console.log("PIN Error:", await resPin.text());
        }
        expect(resPin.ok).toBe(true);

        // 3. Create Organization for A (if needed)
        // Check if user has active org
        if (!sessionAData.session.activeOrganizationId) {
            console.log("Creating Organization for A...");
            const resOrg = await request('/auth/organization/create', 'POST', { name: "Org A", slug: `org-a-${Date.now()}` }, headersA);

            // It might fail if org creation isn't open or checking limits, but let's assume it works or we check status
            if (resOrg.ok) {
                const orgData = await resOrg.json() as any;
                // Set Active
                await request('/auth/organization/set-active', 'POST', { organizationId: orgData.id }, headersA);
            }
        }

        // 4. Initial Balances
        console.log("4. Checking Initial Balances...");
        const resBalA = await request('/finance/balance?currency=ETP', 'GET', null, headersA);
        if (resBalA.ok) {
            const balA = await resBalA.json() as any;
            console.log("Balance A:", balA);
            // Just ensure it returns a structure we expect, e.g. amount
            expect(Array.isArray(balA)).toBe(true);
            expect(balA[0]).toHaveProperty('balance');
            console.log("Balance A checked:", balA[0]);
        } else {
            // If balance endpoint fails, catch it
            console.error("Balance check failed", await resBalA.text());
            // Fail test if this is critical
            expect(resBalA.ok).toBe(true);
        }

        // 5. Self-Transfer (Should Fail)
        console.log("5. Testing Transfer (Email)...");
        const resTransfer = await request('/finance/transfer', 'POST', {
            email: emailA, // Self transfer
            amount: 100,
            currency: "ETP",
            pin: "1234"
        }, headersA);

        expect(resTransfer.status).not.toBe(200);
        const txt = await resTransfer.text();
        console.log("Transfer Response:", txt);
        expect(txt).toMatch(/Cannot transfer to self|Self transfer not allowed|error/i);
    });
});
