import type { Page } from "@playwright/test";

// Makes the app think it was launched as an installed PWA.
export async function mockStandaloneMode(page: Page) {
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
