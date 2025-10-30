import { AuthProvider } from '@/lib/auth/auth-provider';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { NetworkMonitorInitializer } from "@/components/network-monitor-initializer";
import { ErrorLogger } from '@/components/ErrorLogger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppInitializer } from '@/components/AppInitializer';
import { GlobalDialogs } from '@/lib/ui/alert-dialog';
import { GlobalDialogOverride } from '@/lib/ui/global-dialog-override';
// import { DevAutoLogin } from '@/components/dev-auto-login'; // 停用自動登入

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
        <ErrorLogger />
        <NetworkMonitorInitializer />
        <GlobalDialogs />
        <GlobalDialogOverride />
        <AppInitializer>
          <ErrorBoundary>
            <ThemeProvider>
              <MainLayout>
                <AuthProvider>
                  {/* <DevAutoLogin /> 停用自動登入 */}
                  {children}
                </AuthProvider>
              </MainLayout>
            </ThemeProvider>
          </ErrorBoundary>
        </AppInitializer>
      </body>
    </html>
  );
}
