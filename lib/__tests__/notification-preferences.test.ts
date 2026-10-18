import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCES_KEY,
  getNotificationPreferences,
  getServerNotificationPreferences,
  setNotificationPreferences,
  subscribeToNotificationPreferences,
} from "@/lib/notification-preferences";

function createStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

describe("notification preferences store", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("window", new EventTarget());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the defaults when nothing is stored", () => {
    expect(getNotificationPreferences()).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES
    );
    expect(getServerNotificationPreferences()).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES
    );
  });

  it("reads a stored value", () => {
    localStorage.setItem(
      NOTIFICATION_PREFERENCES_KEY,
      JSON.stringify({ newTransactions: false })
    );
    expect(getNotificationPreferences()).toEqual({ newTransactions: false });
  });

  it("ignores the legacy stored `enabled` flag", () => {
    localStorage.setItem(
      NOTIFICATION_PREFERENCES_KEY,
      JSON.stringify({ enabled: true, newTransactions: false })
    );
    expect(getNotificationPreferences()).toEqual({ newTransactions: false });
  });

  it("falls back to the defaults for malformed JSON", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, "{not json");
    expect(getNotificationPreferences()).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES
    );
  });

  it("returns the same object until the stored value changes", () => {
    localStorage.setItem(
      NOTIFICATION_PREFERENCES_KEY,
      JSON.stringify({ newTransactions: false })
    );
    const first = getNotificationPreferences();
    expect(getNotificationPreferences()).toBe(first);

    setNotificationPreferences({ newTransactions: true });
    expect(getNotificationPreferences()).not.toBe(first);
  });

  it("persists updates and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNotificationPreferences(listener);

    setNotificationPreferences({ newTransactions: false });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(localStorage.getItem(NOTIFICATION_PREFERENCES_KEY)!)
    ).toEqual({ newTransactions: false });
    expect(getNotificationPreferences()).toEqual({ newTransactions: false });

    unsubscribe();
    setNotificationPreferences({ newTransactions: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies subscribers of changes from other tabs", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNotificationPreferences(listener);

    const storageEvent = (key: string | null) =>
      Object.assign(new Event("storage"), { key });
    window.dispatchEvent(storageEvent("some-other-key"));
    expect(listener).not.toHaveBeenCalled();
    window.dispatchEvent(storageEvent(NOTIFICATION_PREFERENCES_KEY));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    window.dispatchEvent(storageEvent(NOTIFICATION_PREFERENCES_KEY));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
