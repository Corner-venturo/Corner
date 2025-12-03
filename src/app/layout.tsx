import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_TC } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { ErrorLogger } from '@/components/ErrorLogger'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppInitializer } from '@/components/AppInitializer'
// import { GlobalDialogs } from '@/lib/ui/alert-dialog' // Removed
// import { GlobalDialogOverride } = '@/lib/ui/global-dialog-override' // Removed
// import { LayoutRouter } = '@/components/layout/layout-router' // Removed

export const dynamic = 'force-dynamic'
export const dynamicParams = true

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoSansTC = Noto_Sans_TC({
  variable: '--font-noto-sans-tc',
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'], // The 'chinese-traditional' subset is automatically included for Noto Sans TC
  display: 'swap',
})

export const metadata: Metadata = {
  title: '旅遊團管理系統',
  description: '專業的旅遊團管理系統',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansTC.variable} antialiased`}
      >
        <ErrorLogger />
        {/* <GlobalDialogs /> */}
        {/* <GlobalDialogOverride /> */}
        <AppInitializer>
          <ErrorBoundary>
            <ThemeProvider>
                {children}
            </ThemeProvider>
          </ErrorBoundary>
        </AppInitializer>
      </body>
    </html>
  )
}
