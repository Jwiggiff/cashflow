import { expect, test, type Page } from "@playwright/test";
import { mockStandaloneMode } from "./helpers";

// PWA passkey auto-prompt on the sign-in page. Each case creates its own user
// and authenticator rather than sharing app.spec.ts's serial state, since it
// needs a passkey registered before the sign-in page loads.
const password = "password123";

// Counts navigator.credentials.get calls, so negative cases can assert the
// prompt never fired rather than inferring it from the URL after a fixed wait.
async function spyOnCredentialsGet(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __credentialsGetCalls: number }).__credentialsGetCalls = 0;
    const original = navigator.credentials.get.bind(navigator.credentials);
    navigator.credentials.get = (...args: Parameters<typeof original>) => {
      (window as unknown as { __credentialsGetCalls: number }).__credentialsGetCalls++;
      return original(...args);
    };
  });
}

async function credentialsGetCallCount(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __credentialsGetCalls: number }).__credentialsGetCalls
  );
}

async function setUpUserWithPasskey(page: Page, context: import("@playwright/test").BrowserContext) {
  // Unique per attempt, so a CI retry doesn't collide with the first attempt's user
  const username = `pwaautouser${Date.now()}`;
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

  await page.goto("/auth/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/settings");
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByRole("button", { name: "Update Profile" }).click();
  const addPasskey = page.getByRole("button", { name: "Add Passkey" });
  await expect(addPasskey).toBeEnabled();
  // Registering reloads the page, and the reloaded page refetches the session
  // (re-setting its cookie). Wait for both, or the reload can abort the
  // caller's next goto() and the refetch can undo its clearCookies().
  const reloaded = page.waitForEvent("load");
  await addPasskey.click();
  await expect
    .poll(async () => {
      const { credentials } = await cdp.send("WebAuthn.getCredentials", { authenticatorId });
      return credentials.length;
    })
    .toBe(1);
  await reloaded;
  await page.waitForLoadState("networkidle");

  return username;
}

test("does not auto-trigger the passkey prompt in a regular browser tab", async ({
  page,
  context,
}) => {
  await setUpUserWithPasskey(page, context);
  await context.clearCookies();
  await spyOnCredentialsGet(page);

  await page.goto("/auth/signin");
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/\/auth\/signin/);
  expect(await credentialsGetCallCount(page)).toBe(0);
});

test("auto-triggers and signs in when launched in standalone/PWA mode", async ({
  page,
  context,
}) => {
  await setUpUserWithPasskey(page, context);
  await context.clearCookies();
  await mockStandaloneMode(page);

  await page.goto("/auth/signin");
  await expect(page).toHaveURL("/", { timeout: 5000 });
});

test("does not auto-trigger right after clicking sign out, even in standalone mode", async ({
  page,
  context,
}) => {
  const username = await setUpUserWithPasskey(page, context);
  await mockStandaloneMode(page);
  await spyOnCredentialsGet(page);

  // Sign out through the real user menu so its `signedOut` redirect is covered too
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(username) }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();

  await expect(page).toHaveURL(/\/auth\/signin\?signedOut=1/);
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/\/auth\/signin\?signedOut=1/);
  expect(await credentialsGetCallCount(page)).toBe(0);
});
