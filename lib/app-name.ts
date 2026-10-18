// PREVIEW_LABEL is set on PR preview deploys (e.g. "PR-55") so an installed
// preview PWA is distinguishable from the real one on the home screen.
export const appName = process.env.PREVIEW_LABEL
  ? `CashFlow ${process.env.PREVIEW_LABEL}`
  : "CashFlow";
