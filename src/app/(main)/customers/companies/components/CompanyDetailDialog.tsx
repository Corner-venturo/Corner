'use client'

/**
 * 企業客戶詳情 Dialog
 */

import { useState } from 'react'
import { Building2, Edit2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import type { Company } from '@/types/company.types'
import {
  PAYMENT_METHOD_LABELS,
  VIP_LEVEL_LABELS,
} from '@/types/company.types'
import { CompanyFormDialog } from './CompanyFormDialog'
import type { CreateCompanyData } from '@/types/company.types'

interface CompanyDetailDialogProps {
  company: Company | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (data: CreateCompanyData) => Promise<void>
}

export function CompanyDetailDialog({
  company,
  open,
  onOpenChange,
  onUpdate,
}: CompanyDetailDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  if (!company) return null

  const getVipBadge = (level: number) => {
    if (level === 0) {
      return <Badge variant="secondary">普通客戶</Badge>
    }
    return (
      <Badge className="bg-morandi-gold text-white">
        {VIP_LEVEL_LABELS[level] || `VIP ${level}`}
      </Badge>
    )
  }

  const handleEdit = async (data: CreateCompanyData) => {
    if (onUpdate) {
      await onUpdate(data)
    }
    setIsEditDialogOpen(false)
  }

  return (
    <>
      <Dialog open={open && !isEditDialogOpen} onOpenChange={(v) => !isEditDialogOpen && onOpenChange(v)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-morandi-gold" />
              {company.company_name}
              <span className="ml-2">{getVipBadge(company.vip_level)}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本資訊 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-morandi-secondary">企業名稱</p>
                  <p className="font-medium text-morandi-primary">
                    {company.company_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">統一編號</p>
                  <p className="font-medium text-morandi-primary font-mono">
                    {company.tax_id || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">聯絡電話</p>
                  <p className="font-medium text-morandi-primary">
                    {company.phone || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">Email</p>
                  <p className="font-medium text-morandi-primary">
                    {company.email || '-'}
                  </p>
                </div>
                {company.website && (
                  <div className="col-span-2">
                    <p className="text-sm text-morandi-secondary">網站</p>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-morandi-gold hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm text-morandi-secondary">建立日期</p>
                  <DateCell date={company.created_at} showIcon={false} className="font-medium text-morandi-primary" />
                </div>
              </CardContent>
            </Card>

            {/* 付款資訊 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">付款資訊</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-morandi-secondary">付款方式</p>
                  <p className="font-medium text-morandi-primary">
                    {PAYMENT_METHOD_LABELS[company.payment_method]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">付款期限</p>
                  <p className="font-medium text-morandi-primary">
                    {company.payment_terms === 0 ? '即付' : `${company.payment_terms} 天`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">信用額度</p>
                  <CurrencyCell
                    amount={company.credit_limit}
                    className="font-medium text-morandi-gold"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 發票資訊 */}
            {(company.invoice_title || company.invoice_address || company.invoice_email) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">發票資訊</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.invoice_title && (
                    <div className="col-span-2">
                      <p className="text-sm text-morandi-secondary">發票抬頭</p>
                      <p className="font-medium text-morandi-primary">
                        {company.invoice_title}
                      </p>
                    </div>
                  )}
                  {company.invoice_address && (
                    <div className="col-span-2">
                      <p className="text-sm text-morandi-secondary">發票地址</p>
                      <p className="font-medium text-morandi-primary">
                        {company.invoice_address}
                      </p>
                    </div>
                  )}
                  {company.invoice_email && (
                    <div>
                      <p className="text-sm text-morandi-secondary">發票 Email</p>
                      <p className="font-medium text-morandi-primary">
                        {company.invoice_email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 銀行資訊 */}
            {(company.bank_name || company.bank_account || company.bank_branch) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">銀行資訊</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {company.bank_name && (
                    <div>
                      <p className="text-sm text-morandi-secondary">銀行名稱</p>
                      <p className="font-medium text-morandi-primary">
                        {company.bank_name}
                      </p>
                    </div>
                  )}
                  {company.bank_branch && (
                    <div>
                      <p className="text-sm text-morandi-secondary">分行</p>
                      <p className="font-medium text-morandi-primary">
                        {company.bank_branch}
                      </p>
                    </div>
                  )}
                  {company.bank_account && (
                    <div>
                      <p className="text-sm text-morandi-secondary">帳號</p>
                      <p className="font-medium text-morandi-primary font-mono">
                        {company.bank_account}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 地址資訊 */}
            {(company.registered_address || company.mailing_address) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">地址資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {company.registered_address && (
                    <div>
                      <p className="text-sm text-morandi-secondary">登記地址</p>
                      <p className="font-medium text-morandi-primary">
                        {company.registered_address}
                      </p>
                    </div>
                  )}
                  {company.mailing_address && (
                    <div>
                      <p className="text-sm text-morandi-secondary">通訊地址</p>
                      <p className="font-medium text-morandi-primary">
                        {company.mailing_address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 備註 */}
            {company.note && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">備註</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-morandi-primary whitespace-pre-wrap">
                    {company.note}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
              <X size={16} />
              關閉
            </Button>
            {onUpdate && (
              <Button
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Edit2 size={16} />
                編輯
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯對話框 */}
      {onUpdate && (
        <CompanyFormDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSubmit={handleEdit}
          workspaceId={company.workspace_id}
          company={company}
        />
      )}
    </>
  )
}
