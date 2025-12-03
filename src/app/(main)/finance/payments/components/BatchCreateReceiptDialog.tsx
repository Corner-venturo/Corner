/**
 * 批量創建收款單對話框
 *
 * 功能：
 * 1. 從 Excel 匯入收款單資料
 * 2. 驗證資料格式
 * 3. 批量創建收款單
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useState } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { CreateReceiptData } from '@/types/receipt.types'
import { RECEIPT_TYPE_LABELS, ReceiptType } from '@/types/receipt.types'

interface BatchCreateReceiptDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (receipts: CreateReceiptData[]) => Promise<void>
  workspaceId: string
}

export function BatchCreateReceiptDialog({
  isOpen,
  onClose,
  onSubmit,
  workspaceId,
}: BatchCreateReceiptDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [receipts, setReceipts] = useState<CreateReceiptData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)

      const parsedReceipts: CreateReceiptData[] = jsonData.map(row => ({
        workspace_id: workspaceId,
        order_id: row['訂單ID'] || '',
        order_number: row['訂單編號'] || '',
        tour_name: row['團名'],
        receipt_date: row['收款日期'],
        receipt_type: parseReceiptType(row['收款方式']),
        receipt_amount: Number(row['應收金額']),
        actual_amount: row['實收金額'] ? Number(row['實收金額']) : undefined,
        status: row['實收金額'] ? 1 : 0,
        receipt_account: row['付款人'],
        handler_name: row['經手人'],
        account_info: row['帳戶資訊'],
        note: row['備註'],
      }))

      setReceipts(parsedReceipts)
    } catch (error) {
      logger.error('解析 Excel 失敗:', error)
      alert('❌ 解析 Excel 失敗，請檢查檔案格式')
    } finally {
      setIsProcessing(false)
    }
  }

  const parseReceiptType = (typeStr: string): ReceiptType => {
    const typeMap: Record<string, ReceiptType> = {
      '匯款': ReceiptType.BANK_TRANSFER,
      '現金': ReceiptType.CASH,
      '刷卡': ReceiptType.CREDIT_CARD,
      '支票': ReceiptType.CHECK,
      'LinkPay': ReceiptType.LINK_PAY,
    }
    return typeMap[typeStr] || ReceiptType.BANK_TRANSFER
  }

  const handleSubmit = async () => {
    if (receipts.length === 0) {
      alert('⚠️ 請先上傳檔案')
      return
    }

    try {
      await onSubmit(receipts)
      setFile(null)
      setReceipts([])
      onClose()
      alert(`✅ 成功建立 ${receipts.length} 筆收款單`)
    } catch (error) {
      logger.error('批量創建收款單失敗:', error)
      alert('❌ 批量創建收款單失敗')
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        '訂單ID': '範例ID',
        '訂單編號': 'O202401001',
        '團名': '範例團名',
        '收款日期': '2024-01-15',
        '收款方式': '匯款',
        '應收金額': 10000,
        '實收金額': 10000,
        '付款人': '王小明',
        '經手人': '張業務',
        '帳戶資訊': '台灣銀行 123-456-789',
        '備註': '備註內容',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '收款單範本')
    XLSX.writeFile(workbook, '收款單批量匯入範本.xlsx')
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="批量創建收款單"
      subtitle="從 Excel 匯入多筆收款單"
      onSubmit={handleSubmit}
      submitLabel={receipts.length > 0 ? `創建 ${receipts.length} 筆收款單` : '請上傳檔案'}
      submitDisabled={receipts.length === 0 || isProcessing}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* 下載範本 */}
        <div className="bg-morandi-gold/10 border border-morandi-gold/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-morandi-primary">Excel 範本</h4>
              <p className="text-xs text-morandi-muted mt-1">下載範本檔案，填寫資料後上傳</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-morandi-gold border-morandi-gold"
            >
              <FileSpreadsheet size={16} className="mr-2" />
              下載範本
            </Button>
          </div>
        </div>

        {/* 檔案上傳 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary block mb-2">
            上傳 Excel 檔案 <span className="text-morandi-red">*</span>
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="flex-1"
              disabled={isProcessing}
            />
            {file && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setReceipts([])
                }}
              >
                清除
              </Button>
            )}
          </div>
          {file && (
            <p className="text-xs text-morandi-secondary mt-2">
              已選擇：{file.name} • {receipts.length} 筆資料
            </p>
          )}
        </div>

        {/* 預覽 */}
        {receipts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-morandi-primary mb-2">資料預覽</h4>
            <div className="border border-morandi-container/20 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-morandi-container/10 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">訂單編號</th>
                      <th className="px-2 py-1 text-left">團名</th>
                      <th className="px-2 py-1 text-left">收款日期</th>
                      <th className="px-2 py-1 text-left">方式</th>
                      <th className="px-2 py-1 text-right">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r, index) => (
                      <tr key={index} className="border-t border-morandi-container/10">
                        <td className="px-2 py-1">{index + 1}</td>
                        <td className="px-2 py-1">{r.order_number}</td>
                        <td className="px-2 py-1">{r.tour_name}</td>
                        <td className="px-2 py-1">{r.receipt_date}</td>
                        <td className="px-2 py-1">{RECEIPT_TYPE_LABELS[r.receipt_type]}</td>
                        <td className="px-2 py-1 text-right">
                          NT$ {r.receipt_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  )
}
