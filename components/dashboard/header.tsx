import { PrivacyToggle } from "@/components/privacy-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Greeting } from "./greeting";

export function Header() {
  return (
    <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 border-b bg-background/95 pb-3 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80 @3xl:static @3xl:mx-0 @3xl:border-b-0 @3xl:bg-transparent @3xl:p-8 @3xl:backdrop-blur-none">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-0.5" />
        <Greeting />
      </div>
      <PrivacyToggle />
    </header>
  );
}
