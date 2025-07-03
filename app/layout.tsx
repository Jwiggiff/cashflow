import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { FloatingActionButton } from "@/components/floating-action-button";
import { CSVDropzoneWrapper } from "@/components/csv-dropzone-wrapper";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CashFlow",
  description: "Track your cash flow",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    // TODO: show onboarding page
    return <div>Unauthorized</div>;
  }

  const accounts = await prisma.bankAccount.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const categories = await prisma.category.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const canAutoCategorize = process.env.OPENAI_API_KEY !== undefined;

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
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 p-4">
              <SidebarTrigger />
              {children}
            </main>
          </SidebarProvider>
          <FloatingActionButton accounts={accounts} categories={categories} />
          <CSVDropzoneWrapper
            accounts={accounts}
            canAutoCategorize={canAutoCategorize}
          />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
