import { expect, test, type Page } from "@playwright/test";

async function signUp(page: Page) {
  await page.goto("/auth/signup");
  await page.getByLabel("Username").fill(`notify${Date.now()}`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm Password").fill("password123");
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await expect(page).toHaveURL("/");
}

// Reports an existing push subscription without contacting a push service.
async function mockPushSubscription(page: Page) {
  await page.addInitScript(() => {
    PushManager.prototype.getSubscription = async () =>
      ({
        endpoint: "https://push.example.test/e2e",
        unsubscribe: async () => true,
      }) as unknown as PushSubscription;
  });
}

function collectHydrationErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => {
    // #418/#423/#425 are production React's hydration mismatch errors.
    if (/hydrat|#41[89]|#42[35]/i.test(err.message)) errors.push(err.message);
  });
  return errors;
}

const enableSwitch = (page: Page) =>
  page.getByRole("switch", { name: "Enable push notifications" });
const newTransactionsSwitch = (page: Page) =>
  page.getByLabel("New Transaction Notifications");

test("shows notifications as off without a push subscription", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/settings");

  await expect(enableSwitch(page)).not.toBeChecked();
  await expect(newTransactionsSwitch(page)).toBeDisabled();
});

test("shows notifications as on and persists preferences with a push subscription", async ({
  page,
}) => {
  const hydrationErrors = collectHydrationErrors(page);
  await mockPushSubscription(page);
  await signUp(page);
  await page.goto("/settings");

  await expect(enableSwitch(page)).toBeChecked();
  await expect(newTransactionsSwitch(page)).toBeEnabled();
  await expect(newTransactionsSwitch(page)).toBeChecked();

  await newTransactionsSwitch(page).click();
  await expect(newTransactionsSwitch(page)).not.toBeChecked();

  // The server renders the default (on); the stored preference must win
  // after hydration without a mismatch.
  await page.reload();
  await expect(enableSwitch(page)).toBeChecked();
  await expect(newTransactionsSwitch(page)).not.toBeChecked();
  expect(hydrationErrors).toEqual([]);
});

test("explains when push notifications are unsupported", async ({ page }) => {
  await page.addInitScript(() => {
    delete (window as { PushManager?: unknown }).PushManager;
  });
  await signUp(page);
  await page.goto("/settings");

  await expect(
    page.getByText("Push notifications are not supported in this browser.")
  ).toBeVisible();
});
