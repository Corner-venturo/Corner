import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '時間箱管理',
  description: '智能時間管理系統',
}

export default function TimeboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}