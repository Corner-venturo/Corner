'use client'

/**
 * TourRequestDialog - 需求單新增/編輯對話框
 */

import { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkspaceChannels } from '@/stores/workspace'
import { useTourRequests } from '@/stores/tour-request-store'
import { logger } from '@/lib/utils/logger'
import type { Database } from '@/lib/supabase/types'

type TourRequest = Database['public']['Tables']['tour_requests']['Row']

// 需求類別選項
const CATEGORY_OPTIONS = [
  { value: 'flight', label: '機票' },
  { value: 'hotel', label: '住宿' },
  { value: 'transport', label: '交通' },
  { value: 'restaurant', label: '餐廳' },
  { value: 'ticket', label: '門票' },
  { value: 'guide', label: '導遊' },
  { value: 'itinerary', label: '行程' },
  { value: 'other', label: '其他' },
]

// 優先級選項
const PRIORITY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '一般' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '緊急' },
]

// 處理方類型選項
const HANDLER_TYPE_OPTIONS = [
  { value: 'internal', label: '內部處理' },
  { value: 'external', label: '外部供應商' },
]

interface TourRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  request?: TourRequest | null
  defaultTourId?: string | null
}

interface FormData {
  title: string
  description: string
  category: string
  priority: string
  handler_type: string
  service_date: string
  service_date_end: string
  quantity: number
  assignee_name: string
  supplier_name: string
  estimated_cost: string
}

const initialFormData: FormData = {
  title: '',
  description: '',
  category: 'other',
  priority: 'normal',
  handler_type: 'internal',
  service_date: '',
  service_date_end: '',
  quantity: 1,
  assignee_name: '',
  supplier_name: '',
  estimated_cost: '',
}

export function TourRequestDialog({
  isOpen,
  onClose,
  request,
  defaultTourId,
}: TourRequestDialogProps) {
  const { currentWorkspaceId } = useWorkspaceChannels()
  const { update, fetchAll } = useTourRequests()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const isEditMode = !!request

  // 編輯模式時載入資料
  useEffect(() => {
    if (isOpen && request) {
      setFormData({
        title: request.title || '',
        description: request.description || '',
        category: request.category || 'other',
        priority: request.priority || 'normal',
        handler_type: request.handler_type || 'internal',
        service_date: request.service_date || '',
        service_date_end: request.service_date_end || '',
        quantity: request.quantity || 1,
        assignee_name: request.assignee_name || '',
        supplier_name: request.supplier_name || '',
        estimated_cost: request.estimated_cost?.toString() || '',
      })
    } else if (isOpen) {
      setFormData(initialFormData)
    }
  }, [isOpen, request])

  const handleFieldChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      logger.warn('需求名稱為必填')
      return
    }

    if (!currentWorkspaceId) {
      logger.error('找不到工作區 ID')
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        priority: formData.priority,
        handler_type: formData.handler_type,
        service_date: formData.service_date || null,
        service_date_end: formData.service_date_end || null,
        quantity: formData.quantity || 1,
        assignee_name: formData.handler_type === 'internal' ? formData.assignee_name || null : null,
        supplier_name: formData.handler_type === 'external' ? formData.supplier_name || null : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        workspace_id: currentWorkspaceId,
        // 使用傳入的 defaultTourId，或沿用現有 request 的 tour_id，或預設空值
        tour_id: request?.tour_id || defaultTourId || '00000000-0000-0000-0000-000000000000',
      }

      if (isEditMode && request) {
        // 編輯模式使用 store 的 update
        await update(request.id, payload)
        logger.log('需求單已更新')
      } else {
        // 新增模式使用 API（會自動生成 code）
        const response = await fetch('/api/tour-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '建立失敗')
        }

        // 重新載入列表
        fetchAll()
        logger.log('需求單已建立')
      }

      onClose()
    } catch (error) {
      logger.error('儲存需求單失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? '編輯需求' : '新增需求'}
      subtitle={isEditMode ? '修改需求單資訊' : '填寫需求單資訊'}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? '更新' : '新增'}
      submitDisabled={!formData.title.trim()}
      loading={loading}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* 需求名稱 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            需求名稱 <span className="text-morandi-red">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={e => handleFieldChange('title', e.target.value)}
            placeholder="輸入需求名稱"
            className="mt-1"
          />
        </div>

        {/* 類別 + 優先級 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">類別</label>
            <Select
              value={formData.category}
              onValueChange={value => handleFieldChange('category', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="選擇類別" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">優先級</label>
            <Select
              value={formData.priority}
              onValueChange={value => handleFieldChange('priority', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="選擇優先級" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 處理方類型 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">處理方</label>
          <Select
            value={formData.handler_type}
            onValueChange={value => handleFieldChange('handler_type', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="選擇處理方" />
            </SelectTrigger>
            <SelectContent>
              {HANDLER_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 根據處理方類型顯示不同欄位 */}
        {formData.handler_type === 'internal' && (
          <div>
            <label className="text-sm font-medium text-morandi-primary">負責人</label>
            <Input
              value={formData.assignee_name}
              onChange={e => handleFieldChange('assignee_name', e.target.value)}
              placeholder="輸入負責人名稱"
              className="mt-1"
            />
          </div>
        )}

        {formData.handler_type === 'external' && (
          <div>
            <label className="text-sm font-medium text-morandi-primary">供應商</label>
            <Input
              value={formData.supplier_name}
              onChange={e => handleFieldChange('supplier_name', e.target.value)}
              placeholder="輸入供應商名稱"
              className="mt-1"
            />
          </div>
        )}

        {/* 服務日期 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">服務日期（開始）</label>
            <Input
              type="date"
              value={formData.service_date}
              onChange={e => handleFieldChange('service_date', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">服務日期（結束）</label>
            <Input
              type="date"
              value={formData.service_date_end}
              onChange={e => handleFieldChange('service_date_end', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* 數量 + 預估費用 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">數量</label>
            <Input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={e => handleFieldChange('quantity', parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">預估費用</label>
            <Input
              type="number"
              min={0}
              step={1}
              value={formData.estimated_cost}
              onChange={e => handleFieldChange('estimated_cost', e.target.value)}
              placeholder="輸入預估費用"
              className="mt-1"
            />
          </div>
        </div>

        {/* 詳細描述 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">詳細描述</label>
          <Textarea
            value={formData.description}
            onChange={e => handleFieldChange('description', e.target.value)}
            placeholder="輸入需求的詳細描述（選填）"
            rows={4}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
