// True when launched from the home-screen icon. `navigator.standalone` is
// the older iOS Safari equivalent of `display-mode: standalone`.
export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}
