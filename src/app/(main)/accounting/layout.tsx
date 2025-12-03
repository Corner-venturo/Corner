'use client'

import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAuthStore()

  return (
    <div
      className={cn('fixed inset-0 overflow-auto z-10', sidebarCollapsed ? 'ml-16' : 'ml-[190px]')}
    >
      {children}
    </div>
  )
}
