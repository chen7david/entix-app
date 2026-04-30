import { expect, type Page, type Route, test } from "@playwright/test";
import { createUserAndOrganization, impersonateUserByEmail } from "./helpers/admin";
import { loginAsRootAdmin } from "./helpers/auth";

type SessionVocabularyItem = {
    id: string;
    userId: string;
    orgId: string;
    attendanceId: string;
    createdAt: number;
    vocabulary: {
        id: string;
        text: string;
        zhTranslation: string | null;
        pinyin: string | null;
        enAudioUrl: string | null;
        zhAudioUrl: string | null;
        status: "new" | "processing_text" | "text_ready" | "processing_audio" | "active" | "review";
        createdAt: number;
        updatedAt: number;
    };
};

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
    if (!match) {
        throw new Error("Could not resolve organization slug from impersonated URL");
    }
    return match[1];
}

test.describe("Session vocabulary happy path", () => {
    test.setTimeout(120_000);

    test("adds vocabulary and retains it after reload", async ({ page }) => {
        const nonce = Date.now();
        const user = {
            fullName: "Vocabulary Teacher",
            email: `e2e.vocab.${nonce}@example.com`,
            organizationName: `Vocabulary Org ${nonce}`,
            password: "TempPass123!",
        };
        const sessionId = `e2e-session-${nonce}`;

        let sessionVocabulary: SessionVocabularyItem[] = [];

        await page.route("**/api/v1/orgs/*/sessions/*/vocabulary", async (route) => {
            if (route.request().method() !== "GET") {
                return route.continue();
            }
            return jsonResponse(route, sessionVocabulary);
        });

        await page.route("**/api/v1/orgs/*/vocabulary", async (route) => {
            if (route.request().method() !== "POST") {
                return route.continue();
            }

            const payload = route.request().postDataJSON() as { text: string };
            const now = Date.now();
            const item: SessionVocabularyItem = {
                id: `assignment-${now}`,
                userId: "test-user-1",
                orgId: "test-org-1",
                attendanceId: "attendance-1",
                createdAt: now,
                vocabulary: {
                    id: `vocab-${now}`,
                    text: payload.text,
                    zhTranslation: null,
                    pinyin: null,
                    enAudioUrl: null,
                    zhAudioUrl: null,
                    status: "new",
                    createdAt: now,
                    updatedAt: now,
                },
            };
            sessionVocabulary = [item, ...sessionVocabulary];

            return jsonResponse(route, { vocabulary: item.vocabulary, assignedCount: 1 });
        });

        await loginAsRootAdmin(page);
        await createUserAndOrganization(page, user);
        await impersonateUserByEmail(page, user.email);

        const slug = await resolveImpersonatedOrgSlug(page);
        await page.goto(`/org/${slug}/teaching/sessions/${sessionId}/vocabulary`);

        await expect(page.getByRole("heading", { name: "Session Vocabulary" })).toBeVisible();
        await expect(page.getByPlaceholder("Enter vocabulary text")).toBeVisible();

        const newWord = `vocab-${nonce}`;
        await page.getByPlaceholder("Enter vocabulary text").fill(newWord);
        await page.getByRole("button", { name: "Add" }).click();

        await expect(page.getByText("Vocabulary added")).toBeVisible();
        await expect(page.getByText("Assigned to 1 student(s)")).toBeVisible();
        await expect(page.locator("tr", { hasText: newWord })).toBeVisible();
        await expect(page.locator("tr", { hasText: newWord }).getByText("New")).toBeVisible();

        await page.reload();
        await expect(page.getByRole("heading", { name: "Session Vocabulary" })).toBeVisible();
        await expect(page.locator("tr", { hasText: newWord })).toBeVisible();
    });
});
