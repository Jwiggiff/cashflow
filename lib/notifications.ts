"use server";

import webpush, { PushSubscription } from "web-push";
import { prisma } from "./prisma";
import { auth } from "./auth";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "https://github.com/Jwiggiff/cashflow/issues",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
} else {
  console.warn("VAPID keys not set, push notifications will not work");
}

export async function subscribeUser(sub: PushSubscription) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  await prisma.pushSubscription.create({
    data: {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      expirationTime: sub.expirationTime ? new Date(sub.expirationTime) : null,
      userId: session.user.id,
    },
  });
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  await prisma.pushSubscription.delete({
    where: {
      endpoint: endpoint,
      userId: session.user.id,
    },
  });
  return { success: true };
}

export async function sendNotificationToUser(
  title: string,
  body: string,
  url: string = "/",
  userId?: string
) {
  if (!userId) {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }
    userId = session.user.id;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { success: false, error: "No subscriptions found for user" };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(
        subscription,
        JSON.stringify({
          title,
          body,
          url,
          icon: "/icon.svg",
        })
      );
    })
  );

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  ).length;
  const failed = results.filter(
    (result) => result.status === "rejected"
  ).length;

  return {
    success: successful > 0,
    results: { successful, failed, total: subscriptions.length },
  };
}
