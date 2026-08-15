import * as React from "react";

const MOBILE_BREAKPOINT = 768;
/** Use compact filter chrome (search + Filters sheet) below this viewport width. */
const COMPACT_FILTERS_BREAKPOINT = 1536;

/** Viewport phone/tablet check — for sheet sides, dialogs, etc. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * True when the viewport is too narrow for the full inline transactions
 * filter toolbar (date + account + category + type). Independent of the
 * `@3xl` content-width layout used for list vs table.
 */
export function useCompactFilters() {
  const [useCompact, setUseCompact] = React.useState(true);

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${COMPACT_FILTERS_BREAKPOINT - 1}px)`
    );
    const onChange = () => {
      setUseCompact(window.innerWidth < COMPACT_FILTERS_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setUseCompact(window.innerWidth < COMPACT_FILTERS_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return useCompact;
}
