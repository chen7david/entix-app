import { test } from "@playwright/test";
import { loginAsRootAdmin } from "./helpers/auth";

test.describe("Root admin login flow", () => {
    test("allows root admin login after DB reset", async ({ page }) => {
        await loginAsRootAdmin(page);
    });
});
