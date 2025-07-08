import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { CSVDropzoneWrapper } from "@/components/csv-dropzone-wrapper";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BankAccount } from "@prisma/client";
import { SessionProvider } from "next-auth/react";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {loggedIn ? (
            <SessionProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <main className="flex-1 p-4">
                    <SidebarTrigger />
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
              <Toaster position="top-right" />
              <CSVDropzoneWrapper
                accounts={accounts}
                canAutoCategorize={canAutoCategorize}
              />
            </SessionProvider>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
