const THEME_COLORS = 5;
const GOLDEN_ANGLE = 137.508;

// The first five use the theme's chart colours; after that, hues are spread
// out so any number of slices stay distinct. Lightness and chroma come from
// the theme so they match light and dark mode.
export function chartColor(index: number) {
  if (index < THEME_COLORS) {
    return `var(--chart-${index + 1})`;
  }

  const hue = (20 + (index - THEME_COLORS) * GOLDEN_ANGLE) % 360;
  return `oklch(var(--chart-extra-l) var(--chart-extra-c) ${hue.toFixed(1)})`;
}
