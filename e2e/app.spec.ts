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
