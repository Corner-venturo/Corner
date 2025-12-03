/**
 * 收款單詳情頁面
 *
 * 功能：
 * 1. 查看收款單完整資訊
 * 2. 會計確認實收金額（待確認 → 已確認）
 * 3. LinkPay 付款記錄管理
 * 4. 編輯收款單資訊
 * 5. 刪除收款單
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Check, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Stores
import { useReceiptStore, useOrderStore, useLinkPayLogStore } from '@/stores'

// Components
import { LinkPayLogsTable } from '../components/LinkPayLogsTable'
import { EditReceiptDialog } from '../components/EditReceiptDialog'
import { CreateLinkPayDialog } from '../components/CreateLinkPayDialog'

// Utils
import { formatDate } from '@/lib/utils'
import { getReceiptTypeName, getReceiptStatusName, getReceiptStatusColor } from '@/types/receipt.types'
import { generateReceiptPDF } from '@/lib/pdf/receipt-pdf'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReceiptDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  // Stores
  const { items: receipts, update: updateReceipt, delete: deleteReceipt } = useReceiptStore()
  const { items: orders } = useOrderStore()
  const { items: linkPayLogs } = useLinkPayLogStore()

  // State
  const [receipt, setReceipt] = useState(receipts.find(r => r.id === id))
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLinkPayDialogOpen, setIsLinkPayDialogOpen] = useState(false)
  const [actualAmount, setActualAmount] = useState(receipt?.actual_amount?.toString() || '')
  const [confirmNote, setConfirmNote] = useState('')

  // 更新 receipt 當 store 變化時
  useEffect(() => {
    const updated = receipts.find(r => r.id === id)
    if (updated) {
      setReceipt(updated)
      setActualAmount(updated.actual_amount?.toString() || '')
    }
  }, [receipts, id])

  if (!receipt) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-morandi-muted">找不到收款單</p>
          <Button onClick={() => router.back()} className="mt-4">
            返回列表
          </Button>
        </div>
      </div>
    )
  }

  // 找到關聯訂單
  const order = orders.find(o => o.id === receipt.order_id)

  // 找到關聯的 LinkPay 記錄
  const relatedLinkPayLogs = linkPayLogs.filter(log => log.receipt_id === receipt.id)

  // 會計確認收款
  const handleConfirm = async () => {
    if (!actualAmount || parseFloat(actualAmount) <= 0) {
      alert('請填入正確的實收金額')
      return
    }

    try {
      await updateReceipt(receipt.id, {
        actual_amount: parseFloat(actualAmount),
        status: 1, // 已確認
        note: confirmNote ? `${receipt.note ?? ''}\n[會計確認] ${confirmNote}` : receipt.note,
      })
      setIsConfirming(false)
      alert('✅ 收款已確認')
    } catch (error) {
      logger.error('確認收款失敗:', error)
      alert('❌ 確認收款失敗')
    }
  }

  // 取消確認
  const handleCancelConfirm = () => {
    setIsConfirming(false)
    setActualAmount(receipt.actual_amount?.toString() || '')
    setConfirmNote('')
  }

  // 刪除收款單
  const handleDelete = async () => {
    if (!confirm('確定要刪除此收款單嗎？此操作無法復原。')) {
      return
    }

    try {
      await deleteReceipt(receipt.id)
      alert('✅ 收款單已刪除')
      router.push('/finance/payments')
    } catch (error) {
      logger.error('刪除收款單失敗:', error)
      alert('❌ 刪除收款單失敗')
    }
  }

  // 編輯收款單
  const handleEdit = async (data: any) => {
    try {
      await updateReceipt(receipt.id, data)
      setIsEditDialogOpen(false)
      alert('✅ 收款單已更新')
    } catch (error) {
      logger.error('更新收款單失敗:', error)
      alert('❌ 更新收款單失敗')
    }
  }

  // 列印 PDF
  const handlePrintPDF = async () => {
    try {
      await generateReceiptPDF({
        receipt,
        order,
      })
    } catch (error) {
      logger.error('生成 PDF 失敗:', error)
      alert('❌ 生成 PDF 失敗')
    }
  }

  return (
    <div className="h-full flex flex-col bg-morandi-background">
      {/* Header */}
      <div className="bg-white border-b border-morandi-container/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-morandi-secondary hover:text-morandi-primary"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-morandi-primary">
                收款單 {receipt.receipt_number}
              </h1>
              <p className="text-sm text-morandi-muted">
                {order?.order_number ? `訂單編號：${order.order_number}` : '無關聯訂單'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getReceiptStatusColor(receipt.status)}>
              {getReceiptStatusName(receipt.status)}
            </Badge>
            {receipt.status === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirming(true)}
                className="text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
              >
                <Check size={16} className="mr-2" />
                確認收款
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPDF}
              className="text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
            >
              <FileText size={16} className="mr-2" />
              列印 PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit size={16} className="mr-2" />
              編輯
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-morandi-red border-morandi-red hover:bg-morandi-red/10"
            >
              <Trash2 size={16} className="mr-2" />
              刪除
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* 會計確認區塊 */}
        {isConfirming && (
          <Card className="p-6 border-morandi-gold bg-morandi-gold/5">
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">會計確認收款</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">
                  實收金額 <span className="text-morandi-red">*</span>
                </label>
                <Input
                  type="number"
                  value={actualAmount}
                  onChange={e => setActualAmount(e.target.value)}
                  placeholder="請輸入實際收到的金額"
                  className="mt-1"
                  autoFocus
                />
                <p className="text-xs text-morandi-muted mt-1">
                  應收金額：NT$ {receipt.receipt_amount.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">確認備註</label>
                <Textarea
                  value={confirmNote}
                  onChange={e => setConfirmNote(e.target.value)}
                  placeholder="選填：記錄實收金額與應收金額的差異原因"
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleConfirm}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                  disabled={!actualAmount || parseFloat(actualAmount) <= 0}
                >
                  <Check size={16} className="mr-2" />
                  確認收款
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelConfirm}
                >
                  <X size={16} className="mr-2" />
                  取消
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 基本資訊 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">基本資訊</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="收款單號" value={receipt.receipt_number} />
            <InfoItem label="收款日期" value={formatDate(receipt.receipt_date)} />
            <InfoItem label="收款方式" value={getReceiptTypeName(receipt.receipt_type)} />
            <InfoItem
              label="應收金額"
              value={`NT$ ${receipt.receipt_amount.toLocaleString()}`}
              highlight
            />
            <InfoItem
              label="實收金額"
              value={
                receipt.actual_amount
                  ? `NT$ ${receipt.actual_amount.toLocaleString()}`
                  : '尚未確認'
              }
              highlight={receipt.status === 1}
            />
            <InfoItem label="狀態" value={getReceiptStatusName(receipt.status)} />
          </div>
        </Card>

        {/* 收款方式詳細資訊 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">收款詳細資訊</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {receipt.handler_name && (
              <InfoItem label="經手人" value={receipt.handler_name} />
            )}
            {receipt.account_info && (
              <InfoItem label="帳戶資訊" value={receipt.account_info} />
            )}
            {receipt.fees !== null && receipt.fees !== undefined && (
              <InfoItem label="手續費" value={`NT$ ${receipt.fees.toLocaleString()}`} />
            )}
            {receipt.card_last_four && (
              <InfoItem label="卡號後四碼" value={receipt.card_last_four} />
            )}
            {receipt.check_number && (
              <InfoItem label="支票號碼" value={receipt.check_number} />
            )}
            {receipt.check_date && (
              <InfoItem label="支票日期" value={formatDate(receipt.check_date)} />
            )}
          </div>
        </Card>

        {/* 備註 */}
        {receipt.note && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">備註</h3>
            <p className="text-morandi-secondary whitespace-pre-wrap">{receipt.note}</p>
          </Card>
        )}

        {/* LinkPay 付款記錄 */}
        {receipt.receipt_type === 4 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-morandi-primary">LinkPay 付款記錄</h3>
              <Button
                size="sm"
                onClick={() => setIsLinkPayDialogOpen(true)}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                建立付款連結
              </Button>
            </div>
            <LinkPayLogsTable logs={relatedLinkPayLogs} />
          </Card>
        )}

        {/* 訂單資訊 */}
        {order && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">關聯訂單</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem label="訂單編號" value={order.order_number ?? '-'} />
              <InfoItem label="聯絡人" value={order.contact_person || '-'} />
              <InfoItem label="聯絡電話" value={order.contact_phone || '-'} />
            </div>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <EditReceiptDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        receipt={receipt}
        onSubmit={handleEdit}
      />

      <CreateLinkPayDialog
        isOpen={isLinkPayDialogOpen}
        onClose={() => setIsLinkPayDialogOpen(false)}
        receipt={receipt}
      />
    </div>
  )
}

// 資訊項目組件
function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-morandi-muted mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-semibold text-morandi-gold' : 'text-morandi-primary'}`}>
        {value}
      </p>
    </div>
  )
}
