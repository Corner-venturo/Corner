import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Corner Fitness - 健身記錄',
  description: '簡潔優雅的健身記錄工具',
  manifest: '/fitness-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Corner Fitness',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#B8A99A',
}

export default function FitnessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 這層只負責 metadata，實際 HTML 結構由父層 (fitness) layout 提供
  return <>{children}</>
}
