import { expect, test, type Browser, type Page } from "@playwright/test";
import { format } from "date-fns";

const username = `table${Date.now()}`;
const password = "password123";

const checking = "Daily Checking";
const savings = "Rainy Day Savings";

// One transaction per day of the current month: 12 expenses, then 6 incomes
const now = new Date();
const dayOfMonth = (day: number) =>
  new Date(now.getFullYear(), now.getMonth(), day, 12);
const transactions = Array.from({ length: 18 }, (_, i) => {
  const day = i + 1;
  return day <= 12
    ? {
        description: `Coffee shop ${day}`,
        amount: 5 + day,
        type: "EXPENSE",
        account: checking,
        date: dayOfMonth(day).toISOString(),
      }
    : {
        description: `Freelance payment ${day}`,
        amount: 100 + day,
        type: "INCOME",
        account: savings,
        date: dayOfMonth(day).toISOString(),
      };
});
const total = transactions.length;

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

async function seed(browser: Browser) {
  const page = await browser.newPage();
  await page.goto("/auth/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await expect(page).toHaveURL("/");

  await addAccount(page, checking);
  await addAccount(page, savings);

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  for (const transaction of transactions) {
    const response = await page.request.post("/api/transactions", {
      headers: { Authorization: `Basic ${auth}` },
      data: transaction,
    });
    expect(response.ok()).toBe(true);
  }
  await page.close();
}

async function openTable(page: Page) {
  await page.goto("/auth/signin");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
  await page.goto("/transactions");
}

const bodyRows = (page: Page) => page.locator("table tbody tr");
const selectionStatus = (page: Page) => page.getByText(/row\(s\) selected/);
const pageStatus = (page: Page) => page.getByText(/^Page \d+ of \d+$/);
const search = (page: Page) =>
  page.getByPlaceholder("Search transactions...").first();
const rowCheckboxes = (page: Page) =>
  page.getByRole("checkbox", { name: "Select row" });
const selectAll = (page: Page) =>
  page.getByRole("checkbox", { name: "Select all" });

async function expectFilteredCount(page: Page, count: number) {
  await expect(selectionStatus(page)).toContainText(`of ${count} row(s)`);
}

async function pickOption(page: Page, trigger: RegExp, option: string) {
  await page.getByRole("combobox").filter({ hasText: trigger }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  await seed(browser);
});

test.describe("wide layout", () => {
  test.use({ viewport: { width: 1600, height: 1000 } });

  test.beforeEach(async ({ page }) => {
    await openTable(page);
    await expectFilteredCount(page, total);
  });

  test("paginates 10 rows per page", async ({ page }) => {
    await expect(bodyRows(page)).toHaveCount(10);
    await expect(pageStatus(page)).toHaveText("Page 1 of 2");
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();

    await page.getByRole("button", { name: "Next" }).click();
    await expect(pageStatus(page)).toHaveText("Page 2 of 2");
    await expect(bodyRows(page)).toHaveCount(total - 10);
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();

    await page.getByRole("button", { name: "Previous" }).click();
    await expect(pageStatus(page)).toHaveText("Page 1 of 2");
  });

  test("changes the page size", async ({ page }) => {
    await pickOption(page, /^10$/, "20");
    await expect(bodyRows(page)).toHaveCount(total);
    await expect(pageStatus(page)).toHaveText("Page 1 of 1");
  });

  test("selects single rows, shift-click ranges, and the whole page", async ({
    page,
  }) => {
    await rowCheckboxes(page).nth(0).click();
    await expect(selectionStatus(page)).toHaveText(
      `1 of ${total} row(s) selected.`,
    );

    await rowCheckboxes(page).nth(3).click({ modifiers: ["Shift"] });
    await expect(selectionStatus(page)).toHaveText(
      `4 of ${total} row(s) selected.`,
    );
    for (const i of [0, 1, 2, 3]) {
      await expect(rowCheckboxes(page).nth(i)).toBeChecked();
    }
    await expect(rowCheckboxes(page).nth(4)).not.toBeChecked();

    await selectAll(page).click();
    await expect(selectionStatus(page)).toHaveText(
      `10 of ${total} row(s) selected.`,
    );
    await selectAll(page).click();
    await expect(selectionStatus(page)).toHaveText(
      `0 of ${total} row(s) selected.`,
    );
  });

  test("searches descriptions case-insensitively", async ({ page }) => {
    await search(page).fill("FREELANCE");
    await expectFilteredCount(page, 6);
    for (const text of await bodyRows(page).allInnerTexts()) {
      expect(text).toContain("Freelance payment");
    }

    await search(page).fill("");
    await expectFilteredCount(page, total);
  });

  test("filters by account and keeps it in the URL", async ({ page }) => {
    await pickOption(page, /All accounts/, savings);
    await expectFilteredCount(page, 6);
    await expect(page).toHaveURL(/[?&]account=\d+/);

    await pickOption(page, new RegExp(savings), "All accounts");
    await expectFilteredCount(page, total);
    await expect(page).not.toHaveURL(/account=/);
  });

  test("filters by type", async ({ page }) => {
    await pickOption(page, /All types/, "Income");
    await expectFilteredCount(page, 6);

    await pickOption(page, /Income/, "Expense");
    await expectFilteredCount(page, 12);
  });

  test("filters by date range", async ({ page }) => {
    await page.getByRole("button", { name: "Select date range" }).click();
    await page
      .getByRole("button", { name: new RegExp(format(dayOfMonth(5), "MMMM do, yyyy")) })
      .click();
    await page
      .getByRole("button", { name: new RegExp(format(dayOfMonth(9), "MMMM do, yyyy")) })
      .click();
    await page.keyboard.press("Escape");
    await expectFilteredCount(page, 5);

    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expectFilteredCount(page, total);
  });

  test("shows hidden columns from the Columns menu", async ({ page }) => {
    const typeHeader = page.getByRole("columnheader", { name: "Type" });
    await expect(typeHeader).toBeHidden();

    await page.getByRole("button", { name: /Columns/ }).click();
    await page.getByRole("menuitemcheckbox", { name: "type" }).click();
    await page.keyboard.press("Escape");
    await expect(typeHeader).toBeVisible();
  });
});

test.describe("compact filters", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("filters from the sheet and clears with the chips", async ({ page }) => {
    await openTable(page);
    await expectFilteredCount(page, total);

    await page.getByRole("button", { name: "Filters" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("combobox").filter({ hasText: /All accounts/ }).click();
    await page.getByRole("option", { name: checking, exact: true }).click();
    await sheet.getByRole("combobox").filter({ hasText: /All types/ }).click();
    await page.getByRole("option", { name: "Expense", exact: true }).click();
    await sheet.getByRole("button", { name: "Apply Filters" }).click();
    await expect(sheet).toBeHidden();
    await expectFilteredCount(page, 12);
    await expect(page.getByText(`Account: ${checking}`)).toBeVisible();

    await search(page).fill("coffee shop 1");
    // Coffee shop 1, 10, 11, 12
    await expectFilteredCount(page, 4);

    await page.getByRole("button", { name: "Clear All" }).click();
    await expectFilteredCount(page, total);
  });
});

test.describe("mobile list", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("groups the page's rows by date", async ({ page }) => {
    await openTable(page);
    const list = page.locator("ul").filter({ hasText: "Freelance payment 18" });
    const items = list
      .getByRole("listitem")
      .filter({ hasText: /Coffee shop|Freelance payment/ });
    await expect(items).toHaveCount(10);
    const dateHeader = dayOfMonth(18).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    await expect(list.getByText(dateHeader)).toBeVisible();

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator("ul").getByText("Coffee shop 1", { exact: true }))
      .toBeVisible();
  });
});

test.describe("bulk actions", () => {
  test.use({ viewport: { width: 1600, height: 1000 } });

  test("deletes the selected rows", async ({ page }) => {
    await openTable(page);
    await expectFilteredCount(page, total);

    await rowCheckboxes(page).nth(0).click();
    await rowCheckboxes(page).nth(1).click();
    await page.getByRole("button", { name: "Delete 2 selected" }).click();

    await expectFilteredCount(page, total - 2);
    await expect(page.getByText("Freelance payment 18")).toBeHidden();
  });
});
