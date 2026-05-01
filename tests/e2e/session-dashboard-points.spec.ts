import { expect, type Page, type Route, test } from "@playwright/test";
import { createUserAndOrganization, impersonateUserByEmail } from "./helpers/admin";
import { loginAsRootAdmin } from "./helpers/auth";

function jsonResponse(route: Route, body: unknown) {
    return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
    });
}

async function resolveImpersonatedOrgSlug(page: Page): Promise<string> {
    await page.goto("/");
    await expect(page).toHaveURL(/\/org\/[^/]+\//);
    const match = page.url().match(/\/org\/([^/]+)\//);
    if (!match) throw new Error("Could not resolve organization slug from impersonated URL");
    return match[1];
}

test.describe("Session dashboard points flow", () => {
    test.setTimeout(120_000);

    test("persists local staged points and clears after save", async ({ page }) => {
        const nonce = Date.now();
        const user = {
            fullName: "Points Teacher",
            email: `e2e.points.${nonce}@example.com`,
            organizationName: `Points Org ${nonce}`,
            password: "TempPass123!",
        };
        const sessionId = `e2e-session-${nonce}`;
        const studentUserId = "student-user-1";
        let transferCalls = 0;

        await page.route("**/api/v1/orgs/*/schedule/*", async (route) => {
            if (route.request().method() !== "GET") return route.continue();
            return jsonResponse(route, {
                id: sessionId,
                organizationId: "org-1",
                lessonId: "lesson-1",
                teacherId: "teacher-1",
                title: "English Session",
                description: null,
                startTime: Date.now() + 3600000,
                durationMinutes: 60,
                status: "scheduled",
                seriesId: null,
                recurrenceRule: null,
                attendances: [
                    {
                        sessionId,
                        organizationId: "org-1",
                        userId: studentUserId,
                        absent: false,
                        absenceReason: null,
                        notes: null,
                        user: {
                            id: studentUserId,
                            name: "Student One",
                            email: "student.one@example.com",
                            image: null,
                        },
                    },
                ],
            });
        });

        await page.route("**/api/v1/orgs/*/finance/summary", async (route) =>
            jsonResponse(route, {
                data: {
                    accounts: [
                        {
                            id: "org-funding-etd",
                            ownerId: "org-1",
                            ownerType: "org",
                            organizationId: "org-1",
                            currencyId: "fcur_etd",
                            name: "Funding ETD",
                            balanceCents: 100000,
                            isActive: true,
                            accountType: "funding",
                            overdraftLimitCents: null,
                            archivedAt: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    ],
                },
            })
        );

        await page.route("**/api/v1/orgs/*/members/*/wallet/summary", async (route) =>
            jsonResponse(route, {
                data: {
                    accounts: [
                        {
                            id: "student-wallet-etd",
                            ownerId: studentUserId,
                            ownerType: "user",
                            organizationId: "org-1",
                            currencyId: "fcur_etd",
                            name: "Student Points",
                            balanceCents: 500,
                            isActive: true,
                            accountType: "savings",
                            overdraftLimitCents: 0,
                            archivedAt: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    ],
                },
            })
        );

        await page.route("**/api/v1/orgs/*/finance/transfer", async (route) => {
            if (route.request().method() !== "POST") return route.continue();
            transferCalls += 1;
            return jsonResponse(route, { data: { txId: `tx-${transferCalls}` } });
        });
        await page.route("**/api/v1/orgs/*/sessions/*/vocabulary", async (route) =>
            jsonResponse(route, [])
        );

        await loginAsRootAdmin(page);
        await createUserAndOrganization(page, user);
        await impersonateUserByEmail(page, user.email);
        const slug = await resolveImpersonatedOrgSlug(page);

        await page.goto(`/org/${slug}/teaching/sessions/${sessionId}/vocabulary`);
        await expect(
            page.getByText("Adjust points for students currently enrolled in this class")
        ).toBeVisible();

        await page
            .locator("tr", { hasText: "Student One" })
            .getByRole("button", { name: "+" })
            .click();
        await expect(page.getByText("Net delta: +1")).toBeVisible();

        await page.reload();
        await expect(page.getByText("Net delta: +1")).toBeVisible();

        await page.getByRole("button", { name: "Save points" }).click();
        await expect(page.getByText("Points saved")).toBeVisible();
        await expect.poll(() => transferCalls).toBe(1);

        await page.reload();
        await expect(page.getByText("Net delta: 0")).toBeVisible();
    });
});
