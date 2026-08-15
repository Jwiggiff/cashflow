import { PrivacyToggle } from "@/components/privacy-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppPageHeaderProps = {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AppPageHeader({
  title,
  actions,
  className,
}: AppPageHeaderProps) {
  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 border-b bg-background/95 pb-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80",
          "@3xl:static @3xl:mx-0 @3xl:border-b-0 @3xl:bg-transparent @3xl:p-8 @3xl:backdrop-blur-none",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-0.5" />
          <h1 className="truncate text-xl font-bold @3xl:text-3xl">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <PrivacyToggle />
        </div>
      </header>
      <Separator className="hidden @3xl:block" />
    </>
  );
}
