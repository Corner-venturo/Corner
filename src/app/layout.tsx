import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AutoSyncProvider } from "@/lib/offline/auto-sync-provider";

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "旅遊團管理系統",
  description: "專業的旅遊團管理系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AutoSyncProvider enabled={true} interval={30000}>
            <MainLayout>
              {children}
            </MainLayout>
          </AutoSyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
