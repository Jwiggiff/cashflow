"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotificationToUser,
} from "@/lib/notifications";
import { urlBase64ToUint8Array } from "@/lib/utils";
import { getVapidPublicKey } from "@/lib/config";
import {
  getNotificationPreferences,
  getServerNotificationPreferences,
  setNotificationPreferences,
  subscribeToNotificationPreferences,
  type StoredNotificationPreferences,
} from "@/lib/notification-preferences";

interface NotificationPreferences extends StoredNotificationPreferences {
  enabled: boolean;
}

interface NotificationContextType {
  preferences: NotificationPreferences;
  subscription: PushSubscription | null;
  isSupported: boolean;
  updatePreferences: (updates: Partial<StoredNotificationPreferences>) => void;
  toggleNotifications: () => Promise<void>;
  sendTestNotification: (message: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Browser support never changes after load, so there is nothing to subscribe to.
const subscribeToNothing = () => () => {};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const isSupported = useSyncExternalStore(
    subscribeToNothing,
    () => "serviceWorker" in navigator && "PushManager" in window,
    () => false
  );
  const storedPreferences = useSyncExternalStore(
    subscribeToNotificationPreferences,
    getNotificationPreferences,
    getServerNotificationPreferences
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  const preferences: NotificationPreferences = {
    ...storedPreferences,
    enabled: !!subscription,
  };

  // Register the service worker and pick up any existing push subscription
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => registration.pushManager.getSubscription())
      .then(setSubscription)
      .catch((error) =>
        console.error("Error registering service worker:", error)
      );
  }, [isSupported]);

  useEffect(() => {
    getVapidPublicKey()
      .then(setVapidPublicKey)
      .catch((error) =>
        console.log(
          "Error loading VAPID public key, notifications will not work",
          error
        )
      );
  }, []);

  async function subscribeToPush() {
    if (!vapidPublicKey) {
      toast.error("VAPID public key not available");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub);
      toast.success("Successfully subscribed to push notifications");
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to subscribe to push notifications");
    }
  }

  async function unsubscribeFromPush() {
    if (!subscription) {
      return;
    }

    try {
      await subscription.unsubscribe();
      await unsubscribeUser(subscription.endpoint);
      setSubscription(null);
      toast.success("Successfully unsubscribed from push notifications");
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to unsubscribe from push notifications");
    }
  }

  const toggleNotifications = async () => {
    if (preferences.enabled) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  const sendTestNotification = async (message: string) => {
    if (!subscription || !message.trim()) return;

    try {
      await sendNotificationToUser("Test notification", message);
      toast.success("Test notification sent successfully");
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    }
  };

  const value = {
    preferences,
    subscription,
    isSupported,
    updatePreferences: setNotificationPreferences,
    toggleNotifications,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
