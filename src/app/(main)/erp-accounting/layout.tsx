'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FileText, Search, BarChart3, Settings, Lock } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { ERP_ACCOUNTING_LABELS } from './constants/labels'

const accountingTabs = [
  { href: '/erp-accounting/vouchers', label: ERP_ACCOUNTING_LABELS.TAB_VOUCHERS, icon: FileText },
  { href: '/erp-accounting/reports', label: ERP_ACCOUNTING_LABELS.TAB_REPORTS, icon: BarChart3 },
  { href: '/erp-accounting/settings/accounts', label: ERP_ACCOUNTING_LABELS.TAB_ACCOUNT_SETTINGS, icon: Settings },
  { href: '/erp-accounting/period-closing', label: ERP_ACCOUNTING_LABELS.TAB_PERIOD_CLOSING, icon: Lock },
]

export default function ERPAccountingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 判斷當前 Tab
  const getCurrentTab = () => {
    if (pathname.startsWith('/erp-accounting/reports')) return '/erp-accounting/reports'
    if (pathname.startsWith('/erp-accounting/settings')) return '/erp-accounting/settings/accounts'
    if (pathname.startsWith('/erp-accounting/period-closing')) return '/erp-accounting/period-closing'
    return '/erp-accounting/vouchers'
  }
  const currentTab = getCurrentTab()

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={ERP_ACCOUNTING_LABELS.PAGE_TITLE}
        icon={FileText}
        breadcrumb={[
          { label: ERP_ACCOUNTING_LABELS.BREADCRUMB_HOME, href: '/' },
          { label: ERP_ACCOUNTING_LABELS.BREADCRUMB_FINANCE, href: '/finance' },
          { label: ERP_ACCOUNTING_LABELS.BREADCRUMB_ACCOUNTING, href: '/erp-accounting' },
        ]}
      >
        {/* 搜尋按鈕 */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative">
              <Input
                placeholder={ERP_ACCOUNTING_LABELS.SEARCH_PLACEHOLDER}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => {
                  if (!searchTerm) setSearchOpen(false)
                }}
                autoFocus
                className="w-48 h-8 text-sm"
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-morandi-container rounded-lg transition-colors"
              title={ERP_ACCOUNTING_LABELS.SEARCH_TITLE}
            >
              <Search size={18} className="text-morandi-secondary" />
            </button>
          )}
        </div>
      </ResponsiveHeader>

      {/* Tab 導覽 */}
      <div className="pt-[72px] border-b border-border bg-card shrink-0">
        <div className="flex gap-1 px-4">
          {accountingTabs.map((tab) => {
            const isActive = currentTab === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-morandi-gold text-morandi-gold'
                    : 'border-transparent text-morandi-secondary hover:text-morandi-primary hover:border-morandi-container'
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
