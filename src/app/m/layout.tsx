'use client'

import { MobileLayout } from '@/components/mobile/MobileLayout'

export default function MobileRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MobileLayout>{children}</MobileLayout>
}
