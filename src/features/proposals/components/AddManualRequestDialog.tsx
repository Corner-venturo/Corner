/**
 * AddManualRequestDialog - 手動新增需求
 *
 * 用於在需求確認單中手動追加需求項目
 */

'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DIALOG_SIZES,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Save, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import {
  useSupplierWorkspaces,
  getCategorySupplierType,
  WORKSPACE_TYPE_CONFIG,
  type WorkspaceType,
} from '@/hooks/useSupplierWorkspaces'

// 需求類別
const CATEGORIES = [
  { key: 'transport', label: '交通（派車）' },
  { key: 'guide', label: '領隊' },
  { key: 'hotel', label: '住宿' },
  { key: 'restaurant', label: '餐食' },
  { key: 'activity', label: '門票/活動' },
  { key: 'other', label: '其他' },
]

interface AddManualRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  // 來源資訊
  tourId?: string
  proposalPackageId?: string
  tourCode?: string
  tourName?: string
  startDate?: string | null
  onSuccess?: () => void
}

export function AddManualRequestDialog({
  isOpen,
  onClose,
  tourId,
  proposalPackageId,
  tourCode,
  tourName,
  startDate,
  onSuccess,
}: AddManualRequestDialogProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // 表單狀態
  const [formData, setFormData] = useState({
    category: 'transport',
    supplierName: '',
    title: '',
    serviceDate: startDate || '',
    serviceDateEnd: '',
    quantity: 1,
    description: '',
    recipientWorkspaceId: '', // 跨公司需求單：指定供應商 workspace
  })

  // 取得對應類別的供應商 workspace
  const supplierType = getCategorySupplierType(formData.category)
  const { workspaces: supplierWorkspaces, isLoading: loadingWorkspaces } = useSupplierWorkspaces({
    types: supplierType ? [supplierType] : ['vehicle_supplier', 'guide_supplier'],
  })

  // 重設表單
  const resetForm = useCallback(() => {
    setFormData({
      category: 'transport',
      supplierName: '',
      title: '',
      serviceDate: startDate || '',
      serviceDateEnd: '',
      quantity: 1,
      description: '',
      recipientWorkspaceId: '',
    })
  }, [startDate])

  // 儲存需求
  const handleSave = useCallback(async () => {
    if (!user?.workspace_id) {
      toast({ title: '請先登入', variant: 'destructive' })
      return
    }

    if (!formData.title.trim()) {
      toast({ title: '請填寫項目說明', variant: 'destructive' })
      return
    }

    setSaving(true)

    try {
      const code = `RQ${Date.now().toString().slice(-8)}`

      const insertData = {
        code,
        workspace_id: user.workspace_id,
        // 根據模式設定關聯欄位
        tour_id: tourId || null,
        proposal_package_id: proposalPackageId || null,
        tour_code: tourCode || null,
        tour_name: tourName || null,
        // 需求內容
        category: formData.category,
        supplier_name: formData.supplierName || null,
        title: formData.title,
        service_date: formData.serviceDate || null,
        service_date_end: formData.serviceDateEnd || null,
        quantity: formData.quantity,
        description: formData.description || null,
        // 跨公司需求：指定供應商 workspace
        recipient_workspace_id: formData.recipientWorkspaceId || null,
        response_status: formData.recipientWorkspaceId ? 'pending' : null,
        // 狀態
        status: 'draft',
        handler_type: formData.recipientWorkspaceId ? 'external' : 'internal',
        // 審計
        created_by: user.id,
        created_by_name: user.display_name || user.chinese_name || '',
      }

      const { error } = await supabase.from('tour_requests').insert(insertData)

      if (error) throw error

      toast({ title: '需求已新增' })
      resetForm()
      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error('新增需求失敗:', error)
      toast({ title: '新增失敗', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [formData, user, tourId, proposalPackageId, tourCode, tourName, toast, resetForm, onSuccess, onClose])

  // 處理關閉
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={DIALOG_SIZES.md}>
        <DialogHeader>
          <DialogTitle>手動新增需求</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 需求類別 */}
          <div className="space-y-2">
            <Label required>需求類別</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇類別" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 供應商 */}
          <div className="space-y-2">
            <Label>供應商/廠商名稱</Label>
            <Input
              value={formData.supplierName}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
              placeholder="例如：車行名稱、領隊姓名"
            />
          </div>

          {/* 跨公司需求：指定供應商 Workspace */}
          {(formData.category === 'transport' || formData.category === 'guide') && (
            <div className="space-y-2">
              <Label>發送給供應商（跨公司需求）</Label>
              <Select
                value={formData.recipientWorkspaceId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, recipientWorkspaceId: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingWorkspaces ? '載入中...' : '選擇供應商（選填）'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不發送（內部處理）</SelectItem>
                  {supplierWorkspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                      {ws.type && (
                        <span className="ml-2 text-xs text-morandi-secondary">
                          ({WORKSPACE_TYPE_CONFIG[ws.type as WorkspaceType]?.label || ws.type})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-morandi-secondary">
                選擇後，需求單將發送給該供應商，供應商可在系統中回覆派車/派人
              </p>
            </div>
          )}

          {/* 項目說明 */}
          <div className="space-y-2">
            <Label required>項目說明</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="例如：機場接送、全程領隊"
            />
          </div>

          {/* 日期範圍 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>開始日期</Label>
              <Input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>結束日期</Label>
              <Input
                type="date"
                value={formData.serviceDateEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceDateEnd: e.target.value }))}
              />
            </div>
          </div>

          {/* 數量 */}
          <div className="space-y-2">
            <Label>數量</Label>
            <Input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="w-24"
            />
            <p className="text-xs text-morandi-secondary">
              {formData.category === 'transport' && '台數（如需 3 台車則填 3）'}
              {formData.category === 'guide' && '人數（如需 2 位領隊則填 2）'}
              {formData.category === 'hotel' && '間數'}
              {formData.category === 'restaurant' && '人數'}
              {formData.category === 'activity' && '人數'}
              {formData.category === 'other' && '數量'}
            </p>
          </div>

          {/* 備註 */}
          <div className="space-y-2">
            <Label>備註說明</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="其他需求說明..."
              rows={3}
            />
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
            className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            儲存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
