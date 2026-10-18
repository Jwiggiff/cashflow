/**
 * Notification preferences persisted in localStorage, shaped for
 * useSyncExternalStore: subscribe/getSnapshot/getServerSnapshot plus a setter
 * that notifies subscribers. Whether notifications are enabled isn't stored
 * here - that is derived from the push subscription.
 */

export interface StoredNotificationPreferences {
  newTransactions: boolean;
}

export const NOTIFICATION_PREFERENCES_KEY = "cashflow-notification-preferences";

export const DEFAULT_NOTIFICATION_PREFERENCES: StoredNotificationPreferences = {
  newTransactions: true,
};

const listeners = new Set<() => void>();

// getSnapshot must return the same object until the stored value changes.
let cachedRaw: string | null = null;
let cachedPreferences = DEFAULT_NOTIFICATION_PREFERENCES;

function parse(raw: string | null): StoredNotificationPreferences {
  if (raw === null) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const parsed = JSON.parse(raw);
    return {
      newTransactions:
        typeof parsed?.newTransactions === "boolean"
          ? parsed.newTransactions
          : DEFAULT_NOTIFICATION_PREFERENCES.newTransactions,
    };
  } catch (error) {
    console.error("Error parsing saved notification preferences:", error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function getNotificationPreferences(): StoredNotificationPreferences {
  const raw = localStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPreferences = parse(raw);
  }
  return cachedPreferences;
}

export function getServerNotificationPreferences(): StoredNotificationPreferences {
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

export function setNotificationPreferences(
  updates: Partial<StoredNotificationPreferences>
) {
  localStorage.setItem(
    NOTIFICATION_PREFERENCES_KEY,
    JSON.stringify({ ...getNotificationPreferences(), ...updates })
  );
  listeners.forEach((listener) => listener());
}

/** Also picks up changes made in other tabs via the `storage` event. */
export function subscribeToNotificationPreferences(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === NOTIFICATION_PREFERENCES_KEY || event.key === null) {
      listener();
    }
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
