import type { Metadata } from "next";
import { DM_Mono, Inter, Syne } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartReach AI — AI-Native Marketing Intelligence",
  description:
    "AI-powered marketing intelligence platform for shopper engagement. Segment customers, generate personalized campaigns, and optimize performance with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${dmMono.variable} h-full antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=Inter:wght@400;500;600&family=DM+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
        <QueryProvider>
          <TooltipProvider>
            <div className="flex h-screen">
              <SidebarNav />
              <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)]">
                {children}
              </main>
            </div>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
