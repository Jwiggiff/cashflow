"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotificationToUser,
} from "@/lib/notifications";
import { urlBase64ToUint8Array } from "@/lib/utils";
import { getVapidPublicKey } from "@/lib/config";

interface NotificationPreferences {
  enabled: boolean;
  newTransactions: boolean;
}

interface NotificationContextType {
  preferences: NotificationPreferences;
  subscription: PushSubscription | null;
  isSupported: boolean;
  isLoading: boolean;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
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

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    newTransactions: true,
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  // Check browser support and register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem(
      "cashflow-notification-preferences"
    );
    if (savedPreferences !== null) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error("Error parsing saved notification preferences:", error);
      }
    }

    const loadVapidKey = async () => {
      try {
        const vapidKey = await getVapidPublicKey();
        setVapidPublicKey(vapidKey);
      } catch (error) {
        console.error("Error loading VAPID public key:", error);
      }
    };
    loadVapidKey();

    setIsLoading(false);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(
        "cashflow-notification-preferences",
        JSON.stringify(preferences)
      );
    }
  }, [preferences, isLoading]);

  // Update preferences when subscription status changes
  useEffect(() => {
    if (!isLoading) {
      setPreferences((prev) => ({
        ...prev,
        enabled: !!subscription,
      }));
    }
  }, [subscription, isLoading]);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Error registering service worker:", error);
    } finally {
      setIsLoading(false);
    }
  }

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
      // Revert the preference change if subscription failed
      setPreferences((prev) => ({
        ...prev,
        enabled: false,
      }));
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
      // Revert the preference change if unsubscription failed
      setPreferences((prev) => ({
        ...prev,
        enabled: true,
      }));
    }
  }

  const toggleNotifications = async () => {
    const newEnabledState = !preferences.enabled;

    if (newEnabledState) {
      await subscribeToPush();
    } else {
      await unsubscribeFromPush();
    }
  };

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updates,
    }));
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
    isLoading,
    updatePreferences,
    toggleNotifications,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
