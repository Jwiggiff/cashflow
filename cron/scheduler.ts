import cron from "node-cron";
import { processRecurringItems } from "./recurring";

let initialized = false;

declare global {
  var __schedulerInitialized: boolean | undefined;
}

export function initializeScheduler() {
  if (initialized || global.__schedulerInitialized) {
    return;
  }

  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Processing recurring items...");
    try {
      await processRecurringItems();
      console.log("[Scheduler] Successfully processed recurring items");
    } catch (error) {
      console.error("[Scheduler] Failed to process recurring items:", error);
    }
  });

  initialized = true;
  global.__schedulerInitialized = true;
  console.log("[Scheduler] Initialized recurring items processor");
}
