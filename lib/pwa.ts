// True only when launched from the home-screen icon (installed PWA), not a
// regular browser tab on phone or desktop - `display-mode: standalone` is
// the standard way to detect this; `navigator.standalone` is Safari's older,
// non-standard equivalent, still needed for some iOS versions.
export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}
