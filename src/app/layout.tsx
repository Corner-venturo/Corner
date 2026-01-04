import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { ErrorLogger } from '@/components/ErrorLogger'
import { ErrorBoundary } from '@/components/error-boundary'
import { AppInitializer } from '@/components/AppInitializer'
import { GlobalDialogs } from '@/lib/ui/alert-dialog'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

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
      <body className="antialiased">
        <ErrorLogger />
        <GlobalDialogs />
        <AppInitializer>
          <ErrorBoundary>
            <ThemeProvider>
                {children}
            </ThemeProvider>
          </ErrorBoundary>
        </AppInitializer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
