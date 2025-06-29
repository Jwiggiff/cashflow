import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { CreditCardIcon, HomeIcon, LandmarkIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const sidebarItems = [
  {
    label: "Home",
    icon: HomeIcon,
    href: "/",
  },
  {
    label: "Accounts",
    icon: LandmarkIcon,
    href: "/accounts",
  },
  {
    label: "Transactions",
    icon: CreditCardIcon,
    href: "/transactions",
  },
  {
    label: "Categories",
    icon: TagIcon,
    href: "/categories",
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* <Image src="/logo.png" alt="CashFlow" width={32} height={32} /> */}
        CashFlow
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
