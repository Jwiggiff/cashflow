import * as React from "react";

const MOBILE_BREAKPOINT = 768;
/** Use compact filter chrome (search + Filters sheet) below this viewport width. */
const COMPACT_FILTERS_BREAKPOINT = 1536;

function useMediaQuery(query: string, serverValue: boolean) {
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}

/** Viewport phone/tablet check — for sheet sides, dialogs, etc. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`, false);
}

/**
 * True when the viewport is too narrow for the full inline transactions
 * filter toolbar (date + account + category + type). Independent of the
 * `@3xl` content-width layout used for list vs table.
 */
export function useCompactFilters() {
  return useMediaQuery(
    `(max-width: ${COMPACT_FILTERS_BREAKPOINT - 1}px)`,
    true
  );
}
