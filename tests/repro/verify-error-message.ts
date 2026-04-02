import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCIES, getTreasuryAccountId } from "../../shared";

async function verifyDescriptiveError() {
    const orgId = "VetNCaM7pxxKYQorXxSfr";
    const destAccountId = "facc_VetNCaM7pxxKYQorXxSfr_usd_general"; // Ensure this matches your seed

    console.log("Testing Insufficient Funds Error Message...");

    // Attempt to credit 1 BILLION dollars!
    const res = await fetch(`http://localhost:3000/api/v1/admin/finance/orgs/${orgId}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            organizationId: orgId,
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            platformTreasuryAccountId: getTreasuryAccountId(FINANCIAL_CURRENCIES.USD),
            destinationAccountId: destAccountId,
            currencyId: FINANCIAL_CURRENCIES.USD,
            amountCents: 1000000000 * 100, // $1B
            description: "Overdraft test",
        }),
    });

    const data: any = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (res.status === 400 && data.message === "Insufficient treasury funds") {
        console.log(
            "✅ SUCCESS: Descriptive error message 'Insufficient treasury funds' correctly returned."
        );
    } else if (res.status === 401 || res.status === 403) {
        console.log(
            "⚠️ UNAUTHORIZED: Middleware is active. This confirms routing but prevents data check in this script."
        );
    } else {
        console.log("❌ FAILED: Unexpected response.");
    }
}

verifyDescriptiveError();
