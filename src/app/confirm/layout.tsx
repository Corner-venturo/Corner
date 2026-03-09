/**
 * 報價確認公開頁面 Layout
 * 此頁面不需要登入驗證
 */

import type { Metadata } from 'next'
import { QUOTE_CONFIRM_PAGE_LABELS } from './[token]/constants/labels'

export const metadata: Metadata = {
  title: QUOTE_CONFIRM_PAGE_LABELS.METADATA_TITLE,
  description: QUOTE_CONFIRM_PAGE_LABELS.METADATA_DESCRIPTION,
}

export default function ConfirmLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>
}
