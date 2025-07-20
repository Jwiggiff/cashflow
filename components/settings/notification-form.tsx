"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, BellOff, AlertCircle } from "lucide-react";
import { useNotifications } from "@/components/notification-provider";
import { cn } from "@/lib/utils";

export function NotificationForm() {
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const {
    preferences,
    isSupported,
    toggleNotifications,
    updatePreferences,
    sendTestNotification: sendTest,
  } = useNotifications();

  const handlePreferenceChange = async (key: keyof typeof preferences) => {
    if (key === "enabled") {
      await toggleNotifications();
    } else {
      updatePreferences({ [key]: !preferences[key] });
    }
  };

  const handleSendTestNotification = async () => {
    if (!testMessage.trim()) return;

    setIsSendingTest(true);
    try {
      await sendTest(testMessage);
      setTestMessage("");
    } catch (error) {
      console.error("Error sending test notification:", error);
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Push notifications are not supported in this browser.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Manage your notification preferences and test push notifications
        </CardDescription>
        <CardAction>
          <Switch
            id="enable-notifications"
            checked={preferences.enabled}
            onCheckedChange={() => handlePreferenceChange("enabled")}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Preferences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "space-y-0.5",
                !preferences.enabled && "opacity-50"
              )}
            >
              <Label
                htmlFor="new-transactions"
                className={!preferences.enabled ? "text-muted-foreground" : ""}
              >
                New Transaction Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a new transaction is added to your account
              </p>
            </div>
            <Switch
              id="new-transactions"
              checked={preferences.newTransactions}
              onCheckedChange={() => handlePreferenceChange("newTransactions")}
              disabled={!preferences.enabled}
            />
          </div>
        </div>

        {/* Test Notification */}
        {preferences.enabled && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Test Notifications</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter test message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                  disabled={isSendingTest}
                />
                <Button
                  onClick={handleSendTestNotification}
                  disabled={!testMessage.trim() || isSendingTest}
                  size="sm"
                >
                  {isSendingTest ? "Sending..." : "Send Test"}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
