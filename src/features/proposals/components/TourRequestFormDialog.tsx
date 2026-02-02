/**
 * TourRequestFormDialog - 正式需求單
 *
 * 功能：
 * 1. 顯示單一供應商的需求明細
 * 2. 可編輯項目
 * 3. 開新視窗列印（避免 Dialog z-index 問題）
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DIALOG_SIZES,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  X,
  Printer,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Receipt,
} from 'lucide-react'
import { SupplierSearchInput, type Supplier as SupplierData } from './SupplierSearchInput'
import { usePrintLogo } from '@/features/quotes/components/printable/shared/usePrintLogo'
import { COMPANY } from '@/lib/constants/company'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { useAuthStore, useEmployeeStore } from '@/stores'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'
import type { Tour } from '@/stores/types'

// 分類對應表（TourRequest category → supplier_type_code）
const CATEGORY_TO_SUPPLIER_TYPE: Record<string, string> = {
  hotel: 'hotel',
  restaurant: 'restaurant',
  transport: 'transport',
  activity: 'attraction',  // 注意：不同名稱
  other: 'other',
}

// 需求項目類型
interface RequestItem {
  id: string
  date: string
  title: string      // 餐別/房型/項目
  quantity: number
  unitPrice: number
  note: string
}

// 分類對應的欄位標題
const CATEGORY_COLUMNS: Record<string, { dateLabel: string; titleLabel: string; qtyLabel: string }> = {
  hotel: { dateLabel: '日期', titleLabel: '房型', qtyLabel: '間數' },
  restaurant: { dateLabel: '日期', titleLabel: '餐別', qtyLabel: '人數' },
  transport: { dateLabel: '日期', titleLabel: '路線/車型', qtyLabel: '台數' },
  activity: { dateLabel: '日期', titleLabel: '項目', qtyLabel: '人數' },
  other: { dateLabel: '日期', titleLabel: '項目', qtyLabel: '數量' },
}

// 分類中文名
const CATEGORY_NAMES: Record<string, string> = {
  hotel: '住宿',
  restaurant: '餐飲',
  transport: '交通',
  activity: '門票/活動',
  other: '其他',
}

interface TourRequestFormDialogProps {
  isOpen: boolean
  onClose: () => void
  // 提案套件模式
  pkg?: ProposalPackage | null
  proposal?: Proposal | null
  // 旅遊團模式
  tour?: Tour | null
  // 從需求確認單傳入的資料
  category: string
  supplierName: string
  items: {
    id?: string
    serviceDate: string | null
    title: string
    quantity: number
    note?: string
  }[]
  tourCode?: string
  tourName?: string
  departureDate?: string
  pax?: number
}

export function TourRequestFormDialog({
  isOpen,
  onClose,
  pkg,
  proposal,
  tour,
  category,
  supplierName,
  items: initialItems,
  tourCode,
  tourName,
  departureDate,
  pax,
}: TourRequestFormDialogProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { items: employees, fetchAll: fetchEmployees } = useEmployeeStore()

  // 編輯狀態的項目
  const [items, setItems] = useState<RequestItem[]>(() =>
    initialItems.map((item, idx) => ({
      id: item.id || `new-${idx}`,
      date: item.serviceDate || '',
      title: item.title,
      quantity: item.quantity,
      unitPrice: 0,
      note: item.note || '',
    }))
  )

  // 供應商資訊（可編輯）
  const [supplierInfo, setSupplierInfo] = useState({
    id: '',  // 如果是已存在的供應商，記錄 ID
    name: supplierName,
    contactPerson: '',
    phone: '',
    fax: '',
  })

  // 城市資訊
  const [cityInfo, setCityInfo] = useState({
    countryCode: '',
    cityCode: '',
    cityName: '',
    countryName: '',
    customCity: '',  // 不在列表時手動輸入
  })

  // 列印/儲存狀態
  const [saving, setSaving] = useState(false)

  // 載入公司 Logo（用於新視窗列印）
  const logoUrl = usePrintLogo(isOpen)

  // 判斷是否有足夠資料（支援 pkg 模式或 tour 模式）
  const hasValidData = pkg || tour

  // 選擇供應商時自動帶入資訊
  const handleSupplierSelect = (supplier: SupplierData) => {
    setSupplierInfo({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person || '',
      phone: supplier.phone || '',
      fax: '',  // 供應商表沒有 fax 欄位
    })

    // 如果供應商有國家資訊，帶入
    if (supplier.country) {
      setCityInfo(prev => ({
        ...prev,
        countryName: supplier.country || '',
      }))
    }
  }

  // [Planned] 我方資訊 - 待整合 workspace settings
  const [companyInfo, setCompanyInfo] = useState({
    name: '角落旅行社',
    phone: '',
    fax: '',
    sales: '',
    assistant: '',
  })

  // 載入員工清單並預設助理為當前登入者
  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
      // 預設助理為當前登入者
      const userName = user?.chinese_name || user?.display_name || user?.name || ''
      if (userName && !companyInfo.assistant) {
        setCompanyInfo(prev => ({ ...prev, assistant: userName }))
      }
    }
  }, [isOpen, fetchEmployees, user?.chinese_name, user?.display_name, user?.name])

  // 員工選單：自己排最前面，其他依員工編號排序
  const sortedEmployees = React.useMemo(() => {
    const filtered = employees.filter(emp => emp.employee_type !== 'bot' && emp.workspace_id === user?.workspace_id)
    const currentUserName = user?.chinese_name || user?.display_name || user?.name || ''
    return filtered.sort((a, b) => {
      const aIsMe = a.chinese_name === currentUserName || a.display_name === currentUserName
      const bIsMe = b.chinese_name === currentUserName || b.display_name === currentUserName
      if (aIsMe && !bIsMe) return -1
      if (!aIsMe && bIsMe) return 1
      // 依員工編號排序
      return (a.employee_number || '').localeCompare(b.employee_number || '')
    })
  }, [employees, user?.workspace_id, user?.chinese_name, user?.display_name, user?.name])

  // 取得欄位設定
  const columns = CATEGORY_COLUMNS[category] || CATEGORY_COLUMNS.other
  const categoryName = CATEGORY_NAMES[category] || '需求'

  // 更新項目
  const updateItem = (id: string, field: keyof RequestItem, value: string | number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // 新增項目
  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        date: '',
        title: '',
        quantity: 1,
        unitPrice: 0,
        note: '',
      },
    ])
  }

  // 刪除項目
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 沒有足夠資料時不渲染
  if (!hasValidData) return null

  // 生成 HTML 內容（用於列印和儲存）
  const generatePrintHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${categoryName}需求單</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 40px;
            max-width: 794px;
            margin: 0 auto;
          }
          .header {
            position: relative;
            padding-bottom: 16px;
            margin-bottom: 24px;
            border-bottom: 1px solid #B8A99A;
          }
          .logo { position: absolute; left: 0; top: 0; width: 120px; height: 40px; object-fit: contain; }
          .title-area { text-align: center; padding: 8px 0; }
          .subtitle { font-size: 14px; letter-spacing: 2px; color: #B8A99A; margin-bottom: 4px; }
          .title { font-size: 20px; font-weight: bold; color: #333; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px; }
          .info-section { }
          .info-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
          .info-row { font-size: 14px; margin-bottom: 4px; }
          .tour-info { background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .tour-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background: #f5f5f5; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #B8B2AA; font-style: italic; }
          .print-controls { padding: 16px; border-bottom: 1px solid #eee; text-align: right; }
          .print-controls button { padding: 8px 16px; margin-left: 8px; cursor: pointer; border-radius: 6px; }
          .btn-outline { background: white; border: 1px solid #ddd; }
          .btn-primary { background: #c9aa7c; color: white; border: none; }
          @media print { .print-controls { display: none; } }
        </style>
      </head>
      <body>
        <div class="print-controls">
          <button class="btn-outline" onclick="window.close()">關閉</button>
          <button class="btn-primary" onclick="window.print()">列印</button>
        </div>

        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : '<div style="position:absolute;left:0;top:0;font-size:12px;color:#999;">角落旅行社</div>'}
          <div class="title-area">
            <div class="subtitle">REQUEST FORM</div>
            <div class="title">${categoryName}需求單</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-section">
            <div class="info-title">我方資訊</div>
            <div class="info-row">公司：${companyInfo.name}</div>
            ${companyInfo.phone || companyInfo.fax ? `<div class="info-row">${companyInfo.phone ? `電話：${companyInfo.phone}` : ''}${companyInfo.phone && companyInfo.fax ? '　' : ''}${companyInfo.fax ? `傳真：${companyInfo.fax}` : ''}</div>` : ''}
            ${companyInfo.sales || companyInfo.assistant ? `<div class="info-row">${companyInfo.sales ? `業務：${companyInfo.sales}` : ''}${companyInfo.sales && companyInfo.assistant ? '　' : ''}${companyInfo.assistant ? `助理：${companyInfo.assistant}` : ''}</div>` : ''}
          </div>
          <div class="info-section">
            <div class="info-title">廠商資訊</div>
            <div class="info-row">廠商：${supplierInfo.name}</div>
            ${cityInfo.customCity || supplierInfo.contactPerson ? `<div class="info-row">${cityInfo.customCity ? `城市：${cityInfo.customCity}` : ''}${cityInfo.customCity && supplierInfo.contactPerson ? '　' : ''}${supplierInfo.contactPerson ? `聯絡人：${supplierInfo.contactPerson}` : ''}</div>` : ''}
            ${supplierInfo.phone || supplierInfo.fax ? `<div class="info-row">${supplierInfo.phone ? `電話：${supplierInfo.phone}` : ''}${supplierInfo.phone && supplierInfo.fax ? '　' : ''}${supplierInfo.fax ? `傳真：${supplierInfo.fax}` : ''}</div>` : ''}
          </div>
        </div>

        <div class="tour-info">
          <div class="tour-grid">
            <div>團號：${tourCode || '-'}</div>
            <div>團名：${tourName || proposal?.title || '-'}</div>
            <div>出發日期：${formatDate(departureDate || pkg?.start_date)}</div>
            <div>人數：${pax || proposal?.group_size || '-'} 人</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${columns.dateLabel}</th>
              <th>${columns.titleLabel}</th>
              <th class="text-center">${columns.qtyLabel}</th>
              <th class="text-right">單價</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${formatDate(item.date)}</td>
                <td>${item.title}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.unitPrice > 0 ? '$' + item.unitPrice.toLocaleString() : '-'}</td>
                <td>${item.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">${COMPANY.subtitle}</div>
      </body>
      </html>
    `
  }

  // 儲存文件到 tour_documents
  const saveToTourDocuments = async (htmlContent: string) => {
    // 需要有團號才能存（支援 proposal 模式和 tour 模式）
    const tourId = tour?.id || proposal?.converted_tour_id
    if (!tourId) {
      logger.warn('無法存檔：缺少 tourId', { tourId: tour?.id, proposalConvertedId: proposal?.converted_tour_id })
      toast({ title: '存檔跳過', description: '尚未轉團，無法存檔到旅遊團文件', variant: 'default' })
      return
    }
    if (!user?.workspace_id) {
      logger.warn('無法存檔：缺少 workspace_id')
      return
    }

    try {
      // 生成檔案名稱
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const fileName = `需求單_${categoryName}_${supplierInfo.name}_${timestamp}.html`
      const filePath = `${tourId}/${fileName}`

      // 將 HTML 轉成 Blob
      const blob = new Blob([htmlContent], { type: 'text/html' })

      // 上傳到 Storage
      logger.info('開始上傳需求單:', { tourId, fileName, filePath })
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('tour-documents')
        .upload(filePath, blob, {
          contentType: 'text/html',
          upsert: true,  // 改為 upsert 允許覆蓋
        })

      if (uploadError) {
        logger.error('上傳文件失敗:', uploadError)
        toast({ title: '存檔失敗', description: uploadError.message, variant: 'destructive' })
        return
      }
      
      logger.info('上傳成功:', uploadData)

      // 取得公開 URL
      const { data: urlData } = supabase.storage
        .from('tour-documents')
        .getPublicUrl(filePath)

      // 記錄到 tour_documents 表
       
      const { error: insertError } = await dynamicFrom('tour_documents')
        .insert({
          tour_id: tourId,
          workspace_id: user.workspace_id,
          name: `${categoryName}需求單 - ${supplierInfo.name}`,
          description: `團號: ${tourCode || '-'}, 出發日期: ${formatDate(departureDate || pkg?.start_date)}`,
          file_path: filePath,
          public_url: urlData?.publicUrl || '',
          file_name: fileName,
          file_size: blob.size,
          mime_type: 'text/html',
          // uploaded_by 需要 auth.users UUID，暫時留空
          uploaded_by: null,
        })

      if (insertError) {
        logger.warn('記錄文件失敗:', insertError)
      } else {
        toast({ title: '需求單已存檔' })
      }
    } catch (err) {
      logger.error('存檔失敗:', err)
    }
  }

  // 儲存/更新供應商資訊
  const saveSupplierInfo = async () => {
    // 沒有供應商名稱或沒有 workspace_id 就不儲存
    if (!supplierInfo.name || !user?.workspace_id) {
      return
    }

    try {
      const supplierTypeCode = CATEGORY_TO_SUPPLIER_TYPE[category] || 'other'
      const cityName = cityInfo.customCity || cityInfo.cityName

      // 如果有 ID，表示是選擇的既有供應商，更新聯絡資訊
      if (supplierInfo.id) {
         
        const { error } = await dynamicFrom('suppliers')
          .update({
            contact_person: supplierInfo.contactPerson || null,
            phone: supplierInfo.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supplierInfo.id)

        if (error) {
          logger.warn('更新供應商失敗:', error)
        }
        return
      }

      // 檢查是否已存在同名同類別的供應商
       
      const { data: existing } = await dynamicFrom('suppliers')
        .select('id')
        .eq('name', supplierInfo.name)
        .eq('type', supplierTypeCode)
        .eq('workspace_id', user.workspace_id)
        .maybeSingle()

      if (existing) {
        // 已存在，更新聯絡資訊
         
        const { error } = await dynamicFrom('suppliers')
          .update({
            contact_person: supplierInfo.contactPerson || null,
            phone: supplierInfo.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) {
          logger.warn('更新供應商失敗:', error)
        }
      } else {
        // 不存在，建立新供應商
        // 生成供應商代碼
         
        const { data: maxCodeData } = await dynamicFrom('suppliers')
          .select('code')
          .like('code', 'S%')
          .order('code', { ascending: false })
          .limit(1)

        let newCode = 'S000001'
        if (maxCodeData && maxCodeData.length > 0) {
          const maxNum = parseInt(maxCodeData[0].code.replace('S', ''), 10) || 0
          newCode = `S${String(maxNum + 1).padStart(6, '0')}`
        }

         
        const { error } = await dynamicFrom('suppliers')
          .insert({
            code: newCode,
            name: supplierInfo.name,
            type: supplierTypeCode,
            contact_person: supplierInfo.contactPerson || null,
            phone: supplierInfo.phone || null,
            workspace_id: user.workspace_id,
            is_active: true,
          })

        if (error) {
          logger.warn('建立供應商失敗:', error)
        } else {
          logger.log('已建立新供應商:', supplierInfo.name)
        }
      }
    } catch (err) {
      logger.error('儲存供應商失敗:', err)
    }
  }

  // 更新需求單狀態為「已發送」
  const updateRequestsStatus = async () => {
    // 收集有 ID 的項目（已存在的需求單）
    const requestIds = items
      .map((item: RequestItem) => item.id)
      .filter((id: string): id is string => !!id && !id.startsWith('new-'))

    if (requestIds.length === 0) return

    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('tour_requests')
        .update({
          status: 'sent',
          sent_at: now,
          updated_at: now,
        })
        .in('id', requestIds)

      if (error) {
        logger.warn('更新需求單狀態失敗:', error)
      } else {
        logger.info(`已更新 ${requestIds.length} 筆需求單狀態為「已發送」`)
      }
    } catch (err) {
      logger.error('更新需求單狀態錯誤:', err)
    }
  }

  // 開啟新視窗列印（避免 Dialog z-index 問題）
  const handlePrintInNewWindow = async () => {
    setSaving(true)

    try {
      // 生成 HTML 內容
      const printContent = generatePrintHtml()

      // 儲存到文件管理（背景執行，不阻塞列印）
      saveToTourDocuments(printContent)

      // 儲存供應商資訊（背景執行）
      saveSupplierInfo()

      // 更新需求單狀態為「已發送」
      updateRequestsStatus()

      // 開啟新視窗列印
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        toast({ title: '請允許彈出視窗以進行列印', variant: 'destructive' })
        return
      }

      printWindow.document.write(printContent)
      printWindow.document.close()

      toast({ title: '需求單已發送', description: '狀態已更新為「已發送」' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent level={2} className={`${DIALOG_SIZES['4xl']} max-h-[85vh] overflow-hidden flex flex-col`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} className="text-morandi-gold" />
              {categoryName}需求單 - {supplierInfo.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* 雙欄資訊區 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 我方資訊 */}
              <div className="space-y-2">
                <h3 className="font-medium text-morandi-primary border-b border-border pb-1">
                  我方資訊
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-baseline gap-1">
                    <span className="text-morandi-secondary whitespace-nowrap">公司：</span>
                    <span className="text-morandi-primary">{companyInfo.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">電話：</span>
                      <input
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold"
                      />
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">傳真：</span>
                      <input
                        value={companyInfo.fax}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, fax: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">業務：</span>
                      <select
                        value={companyInfo.sales}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, sales: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold cursor-pointer"
                      >
                        <option value=""></option>
                        {sortedEmployees.map(emp => {
                          const label = [emp.chinese_name, emp.display_name].filter(Boolean).join(' / ') || ''
                          return <option key={emp.id} value={emp.chinese_name || emp.display_name || ''}>{label}</option>
                        })}
                      </select>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">助理：</span>
                      <select
                        value={companyInfo.assistant}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, assistant: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold cursor-pointer"
                      >
                        <option value=""></option>
                        {sortedEmployees.map(emp => {
                          const label = [emp.chinese_name, emp.display_name].filter(Boolean).join(' / ') || ''
                          return <option key={emp.id} value={emp.chinese_name || emp.display_name || ''}>{label}</option>
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 廠商資訊 */}
              <div className="space-y-2">
                <h3 className="font-medium text-morandi-primary border-b border-border pb-1">
                  廠商資訊
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-baseline gap-1">
                    <span className="text-morandi-secondary whitespace-nowrap">廠商：</span>
                    <SupplierSearchInput
                      value={supplierInfo.name}
                      onChange={(val) => setSupplierInfo(prev => ({ ...prev, name: val, id: '' }))}
                      onSupplierSelect={handleSupplierSelect}
                      category={category}
                      className="flex-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">城市：</span>
                      <input
                        value={cityInfo.customCity}
                        onChange={(e) => setCityInfo(prev => ({ ...prev, customCity: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold"
                      />
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">聯絡人：</span>
                      <input
                        value={supplierInfo.contactPerson}
                        onChange={(e) => setSupplierInfo(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">電話：</span>
                      <input
                        value={supplierInfo.phone}
                        onChange={(e) => setSupplierInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold"
                      />
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-morandi-secondary whitespace-nowrap">傳真：</span>
                      <input
                        value={supplierInfo.fax}
                        onChange={(e) => setSupplierInfo(prev => ({ ...prev, fax: e.target.value }))}
                        className="flex-1 min-w-0 h-7 px-1 text-sm bg-transparent border-b border-border/50 focus:outline-none focus:border-morandi-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 團體資訊 */}
            <div className="bg-morandi-container/30 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-morandi-secondary">團號：</span>
                  <span className="font-medium ml-1">{tourCode || '-'}</span>
                </div>
                <div>
                  <span className="text-morandi-secondary">團名：</span>
                  <span className="font-medium ml-1">{tourName || proposal?.title || '-'}</span>
                </div>
                <div>
                  <span className="text-morandi-secondary">出發日期：</span>
                  <span className="font-medium ml-1">{formatDate(departureDate || pkg?.start_date)}</span>
                </div>
                <div>
                  <span className="text-morandi-secondary">人數：</span>
                  <span className="font-medium ml-1">{pax || proposal?.group_size || '-'} 人</span>
                </div>
              </div>
            </div>

            {/* 需求明細表格 */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-morandi-container/50 border-b border-border">
                    <th className="px-3 py-2 text-left font-medium w-[100px]">{columns.dateLabel}</th>
                    <th className="px-3 py-2 text-left font-medium">{columns.titleLabel}</th>
                    <th className="px-3 py-2 text-center font-medium w-[80px]">{columns.qtyLabel}</th>
                    <th className="px-3 py-2 text-center font-medium w-[100px]">單價</th>
                    <th className="px-3 py-2 text-left font-medium w-[150px]">備註</th>
                    <th className="px-3 py-2 text-center font-medium w-[60px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border/50 hover:bg-morandi-container/10">
                      <td className="p-0">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                          className="w-full h-9 px-3 text-sm bg-transparent border-0 focus:outline-none focus:bg-morandi-container/20"
                        />
                      </td>
                      <td className="p-0">
                        <input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                          className="w-full h-9 px-3 text-sm bg-transparent border-0 focus:outline-none focus:bg-morandi-container/20"
                        />
                      </td>
                      <td className="p-0">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full h-9 px-3 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-morandi-container/20"
                        />
                      </td>
                      <td className="p-0">
                        <input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          className="w-full h-9 px-3 text-sm text-right bg-transparent border-0 focus:outline-none focus:bg-morandi-container/20"
                        />
                      </td>
                      <td className="p-0">
                        <input
                          value={item.note}
                          onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                          className="w-full h-9 px-3 text-sm bg-transparent border-0 focus:outline-none focus:bg-morandi-container/20"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 p-0 text-morandi-red hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 新增按鈕 */}
              <div className="p-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  className="gap-1 text-morandi-gold hover:text-morandi-gold-hover"
                >
                  <Plus size={14} />
                  新增項目
                </Button>
              </div>
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="gap-2">
              <X size={16} />
              關閉
            </Button>
            {tour?.id && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose()
                  router.push(`/finance/requests?tour_id=${tour.id}`)
                }}
                className="gap-2 text-morandi-gold border-morandi-gold hover:bg-morandi-gold hover:text-white"
              >
                <Receipt size={16} />
                建立請款單
              </Button>
            )}
            <Button
              onClick={handlePrintInNewWindow}
              disabled={saving}
              className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              列印
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}
