'use client'

/**
 * CostSummary - 費用總計卡片
 *
 * 顯示各分類的預計/實際費用統計
 */

import { Bus, Utensils, Hotel, Ticket, FileText, Calculator } from 'lucide-react'
import type { CostSummary as CostSummaryType } from '@/types/tour-confirmation-sheet.types'

interface CostSummaryCardProps {
  summary: CostSummaryType
}

export function CostSummaryCard({ summary }: CostSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const categories = [
    { key: 'transport', label: '交通', icon: Bus, color: 'text-blue-500' },
    { key: 'meal', label: '餐食', icon: Utensils, color: 'text-orange-500' },
    { key: 'accommodation', label: '住宿', icon: Hotel, color: 'text-purple-500' },
    { key: 'activity', label: '活動', icon: Ticket, color: 'text-green-500' },
    { key: 'other', label: '其他', icon: FileText, color: 'text-morandi-secondary' },
  ] as const

  const difference = summary.total.actual - summary.total.expected
  const diffPercent = summary.total.expected > 0
    ? ((difference / summary.total.expected) * 100).toFixed(1)
    : '0'

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* 標題 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-morandi-container/30">
        <div className="w-8 h-8 rounded-lg bg-morandi-gold flex items-center justify-center">
          <Calculator size={16} className="text-white" />
        </div>
        <h3 className="font-medium text-morandi-primary">費用總計</h3>
      </div>

      {/* 分類統計 */}
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-morandi-secondary">
              <th className="text-left pb-2 font-medium">分類</th>
              <th className="text-right pb-2 font-medium">預計支出</th>
              <th className="text-right pb-2 font-medium">實際支出</th>
              <th className="text-right pb-2 font-medium">差額</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(({ key, label, icon: Icon, color }) => {
              const categoryData = summary[key]
              const diff = categoryData.actual - categoryData.expected
              return (
                <tr key={key} className="border-t border-border/40">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={color} />
                      <span className="text-sm text-morandi-primary">{label}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-sm font-mono">
                    {formatCurrency(categoryData.expected)}
                  </td>
                  <td className="py-2 text-right text-sm font-mono">
                    {formatCurrency(categoryData.actual)}
                  </td>
                  <td className={`py-2 text-right text-sm font-mono ${
                    diff > 0 ? 'text-morandi-red' : diff < 0 ? 'text-morandi-green' : ''
                  }`}>
                    {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-medium">
              <td className="pt-3 text-morandi-primary">總計</td>
              <td className="pt-3 text-right font-mono text-base">
                {formatCurrency(summary.total.expected)}
              </td>
              <td className="pt-3 text-right font-mono text-base">
                {formatCurrency(summary.total.actual)}
              </td>
              <td className={`pt-3 text-right font-mono text-base ${
                difference > 0 ? 'text-morandi-red' : difference < 0 ? 'text-morandi-green' : ''
              }`}>
                {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                <span className="text-xs ml-1">
                  ({diffPercent}%)
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 底部提示 */}
      {difference !== 0 && (
        <div className={`px-4 py-2 text-xs border-t border-border ${
          difference > 0 ? 'bg-red-50 text-morandi-red' : 'bg-green-50 text-morandi-green'
        }`}>
          {difference > 0
            ? `實際支出超出預計 ${formatCurrency(difference)} 元 (${diffPercent}%)`
            : `實際支出低於預計 ${formatCurrency(Math.abs(difference))} 元 (${Math.abs(Number(diffPercent))}%)`
          }
        </div>
      )}
    </div>
  )
}
