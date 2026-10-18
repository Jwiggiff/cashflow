import { expect, test } from "@playwright/test";
import { mockStandaloneMode } from "./helpers";

test.use({ hasTouch: true });

test("pulling down in PWA mode refreshes the page", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("pageerror", (err) => {
    // #418/#423/#425 are production React's hydration mismatch errors.
    if (/hydrat|#41[89]|#42[35]/i.test(err.message)) {
      hydrationErrors.push(err.message);
    }
  });
  await mockStandaloneMode(page);

  await page.goto("/auth/signup");
  await page.getByLabel("Username").fill(`pulltorefresh${Date.now()}`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm Password").fill("password123");
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await expect(page).toHaveURL("/");
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(hydrationErrors).toEqual([]);

  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", y: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x: 640, y }],
    });
  const indicator = page.locator("main > div").first();

  await touch("touchStart", 100);
  for (let y = 120; y <= 400; y += 20) await touch("touchMove", y);
  await expect(indicator).toHaveCSS("height", "110px");

  const refresh = page.waitForRequest(
    (req) =>
      req.headers()["rsc"] === "1" &&
      !req.headers()["next-router-prefetch"] &&
      new URL(req.url()).pathname === "/"
  );
  await touch("touchEnd", 400);
  await refresh;
  await expect(indicator).toHaveCSS("height", "0px");
});
