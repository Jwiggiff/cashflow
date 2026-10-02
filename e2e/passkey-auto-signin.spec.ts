import { expect, test, type Page } from "@playwright/test";

// Covers the PWA-only auto-passkey-prompt behavior added to the sign-in
// page (see app/auth/signin/page.tsx) - self-contained (own user/
// authenticator) rather than reusing e2e/app.spec.ts's shared serial-mode
// state, since each case needs a virtual authenticator already holding a
// registered passkey before the sign-in page ever loads.
const password = "password123";
let userCount = 0;

async function mockStandaloneMode(page: Page) {
  await page.addInitScript(() => {
    const realMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query.includes("display-mode: standalone")) {
        return {
          matches: true,
          media: query,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        } as unknown as MediaQueryList;
      }
      return realMatchMedia(query);
    };
  });
}

async function setUpUserWithPasskey(page: Page, context: import("@playwright/test").BrowserContext) {
  userCount++;
  const username = `pwaautouser${userCount}`;
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
  await addPasskey.click();
  await expect
    .poll(async () => {
      const { credentials } = await cdp.send("WebAuthn.getCredentials", { authenticatorId });
      return credentials.length;
    })
    .toBe(1);
}

test("does not auto-trigger the passkey prompt in a regular browser tab", async ({
  page,
  context,
}) => {
  await setUpUserWithPasskey(page, context);
  await context.clearCookies();

  await page.goto("/auth/signin");
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/\/auth\/signin/);
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

test("does not auto-trigger right after an explicit sign-out, even in standalone mode", async ({
  page,
  context,
}) => {
  await setUpUserWithPasskey(page, context);
  await mockStandaloneMode(page);

  // Already signed in from setUpUserWithPasskey - simulate the sign-out
  // redirect's `signedOut` flag directly rather than clicking through the
  // UI, since the point here is the flag's effect on the signin page.
  await page.goto("/auth/signin?signedOut=1");
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/\/auth\/signin\?signedOut=1/);
});
