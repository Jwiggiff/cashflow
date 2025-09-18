export async function register() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_RUNTIME &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    const { initializeScheduler } = await import("./cron/scheduler");
    initializeScheduler();
  }
}
