"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { User } from "next-auth";
import Link from "next/link";

function UserInfo({ user }: { user: User }) {
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

  return (
    <>
      <div className="size-8 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center shrink-0">
        {getInitials(user.name, user.username)}
      </div>
      <div className="grid flex-1 text-left leading-tight">
        <span className="text-sm font-medium truncate w-full">
          {user.name || user.username}
        </span>
        {user.name && (
          <span className="text-xs text-muted-foreground truncate w-full">
            @{user.username}
          </span>
        )}
      </div>
    </>
  );
}

export function UserSection() {
  const { data: session, status } = useSession();
  const { isMobile } = useSidebar();

  if (status === "loading") {
    return (
      <div className="h-[50px] w-full bg-muted animate-pulse rounded-md"></div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const handleSignOut = () => {
    signOut({ redirectTo: "/auth/signin" });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserInfo user={user} />
              <ChevronsUpDown className="size-4 ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="flex items-center gap-2 px-1 py-1.5">
              <UserInfo user={user} />
            </DropdownMenuLabel>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
