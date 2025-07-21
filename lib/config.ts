"use server";

export async function getVapidPublicKey(): Promise<string> {
  const vapidKey = process.env.VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    throw new Error("VAPID_PUBLIC_KEY environment variable is not set");
  }
  return vapidKey;
}
