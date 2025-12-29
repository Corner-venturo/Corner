/**
 * 報價確認公開頁面 Layout
 * 此頁面不需要登入驗證
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '報價確認 | Venturo Travel',
  description: '確認您的旅遊報價單',
}

export default function ConfirmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
