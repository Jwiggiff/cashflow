"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function UserSection() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-[50px] w-full bg-muted animate-pulse rounded-md">
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const getInitials = (name: string | null, username: string) => {
    if (name) {
      return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    signOut({ redirectTo: "/auth/signin" });
  };

  return (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
              {getInitials(user.name, user.username)}
            </div>
            <div className="flex flex-col items-start text-left min-w-0 flex-1">
              <span className="text-sm font-medium truncate w-full">
                {user.name || user.username}
              </span>
              {user.name && (
                <span className="text-xs text-muted-foreground truncate w-full">
                  @{user.username}
                </span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
