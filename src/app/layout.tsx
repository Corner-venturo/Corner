import type { Metadata } from 'next'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { ErrorLogger } from '@/components/ErrorLogger'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppInitializer } from '@/components/AppInitializer'
import { GlobalDialogs } from '@/lib/ui/alert-dialog'
import { SWRProvider } from '@/lib/swr'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { IntlProvider } from '@/components/providers/IntlProvider'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export const metadata: Metadata = {
  title: '旅遊團管理系統',
  description: '專業的旅遊團管理系統',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="antialiased">
        <ErrorLogger />
        <GlobalDialogs />
        <IntlProvider locale={locale} messages={messages}>
          <AppInitializer>
            <ErrorBoundary>
              <SWRProvider>
                <ThemeProvider>
                  {children}
                </ThemeProvider>
              </SWRProvider>
            </ErrorBoundary>
          </AppInitializer>
        </IntlProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
