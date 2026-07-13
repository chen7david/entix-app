import {
    FINANCIAL_CATEGORIES,
    SESSION_BILLING_CURRENCY_ID,
    STUDENT_VISIBLE_CURRENCY_ID,
} from "./financial";

/**
 * Canonical product rules for the org double-entry ledger.
 * Agents and reviewers should treat this as the source of truth when changing finance code.
 */
export const FINANCIAL_PRODUCT_RULES = {
    /** Parents pay cash; finance credits the student fiat wallet from org funding. */
    cashTopUpCategoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,

    /** Class fees after a session is marked done: minutes × billing-plan tier. */
    sessionFeeCategoryId: FINANCIAL_CATEGORIES.SESSION_PAYMENT,
    sessionBillingCurrencyId: SESSION_BILLING_CURRENCY_ID,

    /**
     * Deduct until balance is zero; if overdraftLimitCents is set, continue until
     * balance + overdraft is exhausted, then notify parents (ops / audit path).
     */
    overdraft: "honor-configured-overdraft-then-contact-parents",

    /** Mirror transfer with REFUND category + IdempotencyKeys.refund(originalTxId). */
    reverseCategoryId: FINANCIAL_CATEGORIES.REFUND,

    /** Same ledger as cash; teachers award/revoke ETD points. */
    pointsAwardCategoryId: FINANCIAL_CATEGORIES.POINTS_AWARD,
    pointsRedeemCategoryId: FINANCIAL_CATEGORIES.POINTS_REDEEM,
    pointsCurrencyId: STUDENT_VISIBLE_CURRENCY_ID,

    /**
     * Students may fully see and manage their ETD (points) ledger only.
     * Fiat/CNY balances and history are finance-staff only.
     */
    studentVisibleCurrencyId: STUDENT_VISIBLE_CURRENCY_ID,

    /**
     * Amount UI must sign by the viewer's line direction (credit/debit), never by
     * category isRevenue/isExpense alone — the same tx is opposite for buyer vs seller.
     */
    amountSigning: "viewer-direction",
} as const;
