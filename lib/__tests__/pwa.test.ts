import { afterEach, describe, expect, it, vi } from "vitest";
import { isStandalonePwa } from "@/lib/pwa";

// The display-mode branch is covered by e2e/passkey-auto-signin.spec.ts.
describe("isStandalonePwa", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is false on the server", () => {
    expect(isStandalonePwa()).toBe(false);
  });

  it("detects iOS's navigator.standalone", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
      navigator: { standalone: true },
    });
    expect(isStandalonePwa()).toBe(true);
  });
});
