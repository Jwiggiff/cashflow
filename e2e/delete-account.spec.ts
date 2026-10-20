import { expect, test, type Page } from "@playwright/test";

const username = `delete${Date.now()}`;
const password = "password123";

const checking = "Doomed Checking";
const savings = "Kept Savings";

async function addAccount(page: Page, name: string) {
  await page.getByRole("button", { name: /^Add/ }).first().click();
  await page.getByRole("menuitem", { name: /Account/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Account Name").fill(name);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Checking" }).click();
  await dialog.getByPlaceholder("0.00").fill("1000");
  await dialog.getByRole("button", { name: "Add Account" }).click();
  await expect(dialog).toBeHidden();
}

async function addTransfer(page: Page, from: string, to: string) {
  await page.getByRole("button", { name: /^Add/ }).first().click();
  await page.getByRole("menuitem", { name: /^Transfer/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: from }).click();
  await dialog.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: to }).click();
  await dialog.getByPlaceholder("0.00").fill("20");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog).toBeHidden();
}

function deleteButtonFor(page: Page, accountName: string) {
  return page
    .getByRole("link", { name: accountName })
    .locator("..")
    .getByRole("button", { name: "Delete account" });
}

test("delete dialog lists what else is deleted, and closes with a toast if that check fails", async ({
  page,
  context,
}) => {
  await page.goto("/auth/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await expect(page).toHaveURL("/");

  await addAccount(page, checking);
  await addAccount(page, savings);
  await addTransfer(page, checking, savings);

  await page.goto("/accounts");
  await deleteButtonFor(page, checking).click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByText("This will also permanently delete 1 transfer.")
  ).toBeVisible();
  await expect(
    dialog.getByText("The other accounts in these transfers keep their current balances.")
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  // Delete the account from another tab, so this tab's list is stale
  const other = await context.newPage();
  await other.goto("/accounts");
  await deleteButtonFor(other, checking).click();
  await other.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(other.getByText("Account deleted")).toBeVisible();
  await other.close();

  await deleteButtonFor(page, checking).click();
  await expect(page.getByText("Account not found")).toBeVisible();
  await expect(dialog).toBeHidden();
});
