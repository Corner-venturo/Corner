'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, BookOpen, Scale, TrendingUp, Wallet, Banknote } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'

const reports = [
  {
    title: '總帳報表',
    description: '顯示每個會計科目的所有交易明細',
    href: '/erp-accounting/reports/general-ledger',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: '試算表',
    description: '驗證借貸平衡，列出所有科目餘額',
    href: '/erp-accounting/reports/trial-balance',
    icon: Scale,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: '損益表',
    description: '顯示收入與費用，計算本期損益',
    href: '/erp-accounting/reports/income-statement',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: '資產負債表',
    description: '顯示特定時點的財務狀況',
    href: '/erp-accounting/reports/balance-sheet',
    icon: Wallet,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    title: '現金流量表',
    description: '顯示現金流入流出情況',
    href: '/erp-accounting/reports/cash-flow',
    icon: Banknote,
    color: 'bg-teal-100 text-teal-600',
  },
]

export default function AccountingReportsPage() {
  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="會計報表"
        icon={FileText}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '會計', href: '/erp-accounting' },
          { label: '報表' },
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <Link
                key={report.href}
                href={report.href}
                className="group bg-card rounded-lg border border-border p-6 hover:border-morandi-gold/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <report.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-morandi-primary group-hover:text-morandi-gold transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-morandi-secondary mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
