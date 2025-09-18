import { AppSidebar } from "@/components/app-sidebar";
import { CSVDropzoneWrapper } from "@/components/csv-dropzone-wrapper";
import { NotificationProvider } from "@/components/notification-provider";
import { PrivacyProvider } from "@/components/privacy-provider";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BankAccount } from "@prisma/client";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NODE_ENV === "development" ? "CashFlow (Dev)" : "CashFlow",
  description: "Track your cash flow",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const loggedIn = !!session?.user;

  const canAutoCategorize = process.env.OPENAI_API_KEY !== undefined;

  let accounts: BankAccount[] = [];
  if (loggedIn) {
    accounts = await prisma.bankAccount.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-title" content="CashFlow" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {loggedIn ? (
            <SessionProvider>
              <PrivacyProvider>
                <NotificationProvider>
                  <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="flex-1 p-4 !ml-0">
                      <SidebarTrigger />
                      {children}
                    </SidebarInset>
                  </SidebarProvider>
                  <Toaster position="top-right" />
                  <CSVDropzoneWrapper
                    accounts={accounts}
                    canAutoCategorize={canAutoCategorize}
                  />
                </NotificationProvider>
              </PrivacyProvider>
            </SessionProvider>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
