"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeForm() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose how CashFlow looks on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={mounted ? theme ?? "system" : "system"}
          onValueChange={setTheme}
          disabled={!mounted}
        >
          <SelectTrigger id="theme" className="w-full max-w-xs">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">
              <span className="flex items-center gap-2">
                <Monitor className="size-4" />
                System
              </span>
            </SelectItem>
            <SelectItem value="light">
              <span className="flex items-center gap-2">
                <Sun className="size-4" />
                Light
              </span>
            </SelectItem>
            <SelectItem value="dark">
              <span className="flex items-center gap-2">
                <Moon className="size-4" />
                Dark
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
