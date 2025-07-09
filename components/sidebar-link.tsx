"use client";

import Link from "next/link";
import { SidebarMenuButton, useSidebar } from "./ui/sidebar";

export interface SidebarLinkProps
  extends React.ComponentProps<typeof SidebarMenuButton> {
  href: string;
}

export function SidebarLink({ href, children, ...props }: SidebarLinkProps) {
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <SidebarMenuButton asChild {...props}>
      <Link href={href} onClick={handleLinkClick}>
        {children}
      </Link>
    </SidebarMenuButton>
  );
}
