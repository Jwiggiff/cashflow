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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, AlertCircle } from "lucide-react";
import { useNotifications } from "@/components/notification-provider";

export function NotificationForm() {
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const {
    enabled,
    isSupported,
    toggleNotifications,
    sendTestNotification: sendTest,
  } = useNotifications();

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
            checked={enabled}
            onCheckedChange={toggleNotifications}
            aria-label="Enable push notifications"
          />
        </CardAction>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-2">
          <Label htmlFor="test-notification">Test Notifications</Label>
          <div className="flex gap-2">
            <Input
              id="test-notification"
              type="text"
              placeholder="Enter test message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="flex-1"
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
        </CardContent>
      )}
    </Card>
  );
}
