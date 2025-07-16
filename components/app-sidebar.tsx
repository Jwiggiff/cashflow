import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserSection } from "@/components/user-section";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditCardIcon,
  HomeIcon,
  LandmarkIcon,
  TagIcon,
} from "lucide-react";
import { AddButton } from "./add-button";
import { SidebarLink } from "./sidebar-link";
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

export async function AppSidebar() {
  const session = await auth();

  const accounts = await prisma.bankAccount.findMany({
    where: {
      userId: session?.user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const categories = await prisma.category.findMany({
    where: {
      userId: session?.user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#" className="flex items-center justify-center">
                <Image
                  src="/wordmark.svg"
                  alt="CashFlow"
                  width={150}
                  height={100}
                  className="block group-data-[collapsible=icon]:hidden"
                />
                <Image
                  src="/icon.svg"
                  alt="CashFlow"
                  width={24}
                  height={24}
                  className="hidden group-data-[collapsible=icon]:block !size-6 object-contain"
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <AddButton accounts={accounts} categories={categories} />
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarLink tooltip={item.label} href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserSection />
      </SidebarFooter>
    </Sidebar>
  );
}
