/**
 * 企業客戶表格欄位配置
 */

import { useMemo } from 'react'
import { Building2, Phone, Mail, CreditCard } from 'lucide-react'
import type { TableColumn } from '@/components/ui/enhanced-table'
import type { Company } from '@/stores'
import { PAYMENT_METHOD_LABELS, VIP_LEVEL_LABELS } from '@/types/company.types'
import { Badge } from '@/components/ui/badge'
import { DateCell, CurrencyCell } from '@/components/table-cells'

interface UseCompanyColumnsProps {
  onView: (company: Company) => void
}

export function useCompanyColumns({ onView }: UseCompanyColumnsProps) {
  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'company_name',
        label: '企業名稱',
        width: '200px',
        render: (value, row) => {
          const company = row as Company
          return (
            <button
              onClick={() => onView(company)}
              className="text-left hover:text-morandi-gold transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-morandi-muted" />
                <div>
                  <div className="font-medium">{company.company_name}</div>
                  {company.tax_id && (
                    <div className="text-xs text-morandi-muted">統編：{company.tax_id}</div>
                  )}
                </div>
              </div>
            </button>
          )
        },
      },
      {
        key: 'vip_level',
        label: 'VIP 等級',
        width: '100px',
        render: (value) => {
          const level = value as number
          const colors: Record<number, string> = {
            0: 'bg-morandi-container/20 text-morandi-muted',
            1: 'bg-status-info-bg text-status-info',
            2: 'bg-status-success-bg text-status-success',
            3: 'bg-status-warning-bg text-status-warning',
            4: 'bg-status-warning-bg text-status-warning',
            5: 'bg-status-danger-bg text-status-danger',
          }
          return (
            <Badge variant="outline" className={colors[level] || colors[0]}>
              {VIP_LEVEL_LABELS[level]}
            </Badge>
          )
        },
      },
      {
        key: 'phone',
        label: '聯絡電話',
        width: '150px',
        render: (value, row) => {
          const company = row as Company
          return company.phone ? (
            <div className="flex items-center gap-2 text-sm text-morandi-secondary">
              <Phone size={14} className="text-morandi-muted" />
              {company.phone}
            </div>
          ) : (
            <span className="text-morandi-muted text-sm">-</span>
          )
        },
      },
      {
        key: 'email',
        label: 'Email',
        width: '200px',
        render: (value, row) => {
          const company = row as Company
          return company.email ? (
            <div className="flex items-center gap-2 text-sm text-morandi-secondary">
              <Mail size={14} className="text-morandi-muted" />
              <a
                href={`mailto:${company.email}`}
                className="hover:text-morandi-gold transition-colors"
              >
                {company.email}
              </a>
            </div>
          ) : (
            <span className="text-morandi-muted text-sm">-</span>
          )
        },
      },
      {
        key: 'payment_terms',
        label: '付款條件',
        width: '120px',
        render: (value, row) => {
          const company = row as Company
          return (
            <div className="text-sm">
              <div className="flex items-center gap-1">
                <CreditCard size={14} className="text-morandi-muted" />
                <span className="text-morandi-secondary">
                  {PAYMENT_METHOD_LABELS[company.payment_method]}
                </span>
              </div>
              <div className="text-xs text-morandi-muted mt-1">
                {company.payment_terms === 0 ? '即付' : `${company.payment_terms} 天`}
              </div>
            </div>
          )
        },
      },
      {
        key: 'credit_limit',
        label: '信用額度',
        width: '120px',
        render: (value) => {
          const limit = value as number
          return (
            <div className="text-right text-sm">
              <CurrencyCell
                amount={limit}
                className="text-morandi-secondary"
              />
            </div>
          )
        },
      },
      {
        key: 'created_at',
        label: '建立日期',
        width: '120px',
        render: (value) => (
          <DateCell
            date={value as string}
            showIcon={false}
            className="text-sm text-morandi-muted"
          />
        ),
      },
    ],
    [onView]
  )
}
