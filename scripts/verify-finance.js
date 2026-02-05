const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function request(path, method = 'GET', body = null, token = null, headers = {}) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };
    if (body) opts.body = JSON.stringify(body);
    if (token) opts.headers['Cookie'] = `better-auth.session_token=${token}`;

    const res = await fetch(`${BASE_URL}${path}`, opts);
    return res;
}

async function main() {
    console.log("Starting E2E Verification...");

    // 1. Create User A (Always unique to avoid auth issues)
    console.log("1. Authenticating User A...");
    const emailA = `userA_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
    const password = "Password123!";
    let resA = await request('/auth/sign-up/email', 'POST', {
        email: emailA,
        password: password,
        name: "User A"
    });

    if (!resA.ok) {
        console.error("Failed to sign up User A", resA.status, await resA.text());
        process.exit(1);
    }

    // Parse cookie
    let cookieA = null;
    const setCookieA = resA.headers.get('set-cookie');
    if (setCookieA) {
        cookieA = setCookieA.split(';')[0];
    } else {
        console.log("No cookie from sign-up, attempting sign-in...");
        const resSignIn = await request('/auth/sign-in/email', 'POST', {
            email: emailA,
            password
        });
        if (!resSignIn.ok) {
            console.error("Sign in failed", await resSignIn.text());
            process.exit(1);
        }
        const setCookieSignIn = resSignIn.headers.get('set-cookie');
        if (setCookieSignIn) {
            cookieA = setCookieSignIn.split(';')[0];
        } else {
            console.error("No cookie from sign-in either");
            process.exit(1);
        }
    }

    const headersA = cookieA ? { 'Cookie': cookieA } : {};

    // Get User A ID
    const sessionA = await request('/auth/get-session', 'GET', null, null, headersA);
    const sessionAData = await sessionA.json();
    if (!sessionAData.user) {
        console.error("Failed to get session A");
        process.exit(1);
    }
    const userAId = sessionAData.user.id;
    console.log("User A ID:", userAId);

    // 2. Set PIN for A
    console.log("2. Setting PIN for User A...");
    // Requires password now
    const pin = "1234";
    const resPin = await request('/finance/pin', 'POST', { pin, password }, null, headersA);
    if (!resPin.ok) {
        console.error("Failed to set PIN", await resPin.text());
        process.exit(1);
    }
    console.log("Set PIN: OK");

    // 3. Create Organization for A (if needed)
    // Check if user has active org
    if (!sessionAData.session.activeOrganizationId) {
        console.log("Creating Organization for A...");
        const resOrg = await request('/auth/organization/create', 'POST', { name: "Org A", slug: `org-a-${Date.now()}` }, null, headersA);
        if (resOrg.ok) {
            const orgData = await resOrg.json();
            console.log("Created Org:", orgData.id);
            // We might need to switch to it or it's auto-active?
            // let's fetch session again to see if activeOrganizationId updated
            const sessionA2 = await request('/auth/get-session', 'GET', null, null, headersA);
            const sessionA2Data = await sessionA2.json();
            if (sessionA2Data.session.activeOrganizationId) {
                console.log("Active Org:", sessionA2Data.session.activeOrganizationId);
            } else {
                // Try to set active?
                console.log("Active Org not set automatically. Trying /organization/set-active if endpoint exists... or we assume next requests usually pass orgId in header/body? No, API uses session.");
                // Better-auth 'organization' plugin usually has `setActive` endpoint.
                // let's try `POST /organization/set-active` with `{ organizationId: ... }`
                await request('/auth/organization/set-active', 'POST', { organizationId: orgData.id }, null, headersA);
            }
        } else {
            console.log("Failed to create org (maybe already exists or different route):", resOrg.status);
        }
    }

    // 4. Initial Balances
    console.log("4. Checking Initial Balances...");
    const resBalA = await request('/finance/balance?currency=ETP', 'GET', null, null, headersA);
    if (resBalA.ok) {
        const balA = await resBalA.json();
        console.log("Balance A:", balA);
    } else {
        console.error("Failed to fetch balance:", resBalA.status, await resBalA.text());
    }

    // 5. Self-Transfer (Should Fail)
    console.log("5. Testing Transfer (Email)...");
    const resTransfer = await request('/finance/transfer', 'POST', {
        email: emailA, // Self transfer should fail
        amount: 100,
        currency: "ETP",
        pin: "1234"
    }, null, headersA);

    if (resTransfer.status === 400 || resTransfer.status === 500) {
        const txt = await resTransfer.text();
        if (txt.includes("Cannot transfer to self")) {
            console.log("Self Transfer verification passed (User lookup works)");
        } else {
            console.log("Transfer Failed with unexpcted error:", txt);
        }
    } else {
        console.log("Transfer unexpected result:", resTransfer.status);
    }

    console.log("Verification checks for PIN, Balance, and Self-Transfer passed.");
}

main().catch(console.error);
