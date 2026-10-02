import { expect, test, type Page } from "@playwright/test";

const username = "e2euser";
const password = "password123";

async function signUp(page: Page, name: string) {
  await page.goto("/auth/signup");
  await page.getByLabel("Username").fill(name);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await expect(page).toHaveURL("/");
}

async function signIn(page: Page) {
  await page.goto("/auth/signin");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}

test.describe.configure({ mode: "serial" });

test("redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/auth\/signin/);
});

test("first visit goes to sign up and signs the user in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/auth\/signup/);

  await signUp(page, username);
  await expect(page.getByRole("button", { name: "Add account" })).toBeVisible();
});

test("rejects a wrong password", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/signin/);
});

test("adds a bank account from the welcome screen", async ({ page }) => {
  await signIn(page);

  await page.getByRole("button", { name: "Add account" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Account Name").fill("Main Checking");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Checking" }).click();
  await dialog.getByPlaceholder("0.00").fill("1000");
  await dialog.getByRole("button", { name: "Add Account" }).click();

  await expect(dialog).toBeHidden();
  await page.goto("/accounts");
  await expect(page.getByText("Main Checking")).toBeVisible();
});

test("adds an expense and updates the account balance", async ({ page }) => {
  await signIn(page);
  await page.goto("/transactions");

  await page.getByRole("button", { name: /^Add/ }).first().click();
  await page.getByRole("menuitem", { name: /Transaction/ }).first().click();

  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("0.00").fill("42.50");
  await dialog.getByLabel("Description").fill("Grocery Store");
  await dialog.getByRole("combobox").filter({ hasText: "Select account" }).click();
  await page.getByRole("option", { name: "Main Checking" }).click();
  await dialog.getByRole("button", { name: "Add", exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("table").getByText("Grocery Store")).toBeVisible();

  // Balances are masked by default
  await page.goto("/accounts");
  await expect(page.getByText("$957.50")).toHaveCount(0);
  await page.getByRole("button", { name: "Show balances" }).first().click();
  await expect(page.getByText("$957.50").first()).toBeVisible();
});

test("adds a category", async ({ page }) => {
  await signIn(page);
  await page.goto("/categories");

  await page.getByRole("button", { name: /^Add/ }).first().click();
  await page.getByRole("menuitem", { name: /Category/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("e.g., Food & Dining").fill("Secret Stash");
  await dialog.getByRole("button", { name: "Create Category" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Secret Stash")).toBeVisible();
});

test("a second user sees none of the first user's data", async ({ page }) => {
  await signUp(page, "otheruser");

  for (const path of ["/accounts", "/transactions", "/categories"]) {
    await page.goto(path);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByText("Main Checking")).toHaveCount(0);
    await expect(page.getByText("Grocery Store")).toHaveCount(0);
    await expect(page.getByText("Secret Stash")).toHaveCount(0);
  }
});

test("registers a passkey and signs in with it", async ({ page, context }) => {
  // A virtual authenticator stands in for Touch ID / a security key
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });

  await signIn(page);
  await page.goto("/settings");
  const addPasskey = page.getByRole("button", { name: "Add Passkey" });
  // Passkeys require an email on the account
  await expect(addPasskey).toBeDisabled();
  await page.getByLabel("Email").fill("e2e@example.com");
  await page.getByRole("button", { name: "Update Profile" }).click();
  await expect(addPasskey).toBeEnabled();

  await addPasskey.click();
  await expect
    .poll(async () => {
      const { credentials } = await cdp.send("WebAuthn.getCredentials", { authenticatorId });
      return credentials.length;
    })
    .toBe(1);

  // A successful "Add Passkey" triggers a refresh of this page's own data
  // (the new passkey's details) - without waiting for that to settle first,
  // it can still be in flight when clearCookies()+goto() below fire, and
  // Playwright sees that as "navigation interrupted by another navigation"
  // (observed flaky in CI, not reliably reproducible locally).
  await page.waitForLoadState("networkidle");

  await context.clearCookies();
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await page.getByRole("button", { name: "Sign in with Passkey" }).click();
  await expect(page).toHaveURL("/transactions");
  await expect(page.getByRole("table").getByText("Grocery Store")).toBeVisible();
});
