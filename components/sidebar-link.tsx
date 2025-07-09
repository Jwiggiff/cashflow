"use client";

import Link from "next/link";
import { SidebarMenuButton, useSidebar } from "./ui/sidebar";

export interface SidebarLinkProps {
  tooltip?: string;
  href: string;
  children: React.ReactNode;
}

export function SidebarLink({ tooltip, href, children }: SidebarLinkProps) {
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <SidebarMenuButton tooltip={tooltip} asChild>
      <Link href={href} onClick={handleLinkClick}>
        {children}
      </Link>
    </SidebarMenuButton>
  );
}
