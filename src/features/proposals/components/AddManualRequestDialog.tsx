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
import { X, Save, Loader2, Search } from 'lucide-react'
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
import { addManualRequestSchema } from '@/lib/validations/schemas'
import { RestaurantSelector, type CombinedRestaurant } from '@/components/editor/RestaurantSelector'
import { HotelSelector } from '@/components/editor/hotel-selector'
import { AttractionSelector } from '@/components/editor/attraction-selector'

// 需求類別（統一使用 accommodation/meal）
const CATEGORIES = [
  { key: 'transport', label: '交通（派車）' },
  { key: 'guide', label: '領隊' },
  { key: 'accommodation', label: '住宿' },
  { key: 'meal', label: '餐食' },
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
  defaultCategory?: string
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
  defaultCategory = 'transport',
  onSuccess,
}: AddManualRequestDialogProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // 表單狀態
  const [formData, setFormData] = useState({
    category: defaultCategory,
    supplierName: '',
    title: '',
    serviceDate: startDate || '',
    serviceDateEnd: '',
    quantity: 1,
    description: '',
    recipientWorkspaceId: '', // 跨公司需求單：指定供應商 workspace
    // 資源關聯欄位
    resourceType: '' as '' | 'restaurant' | 'hotel' | 'attraction',
    resourceId: '',
    resourceName: '', // 用於顯示
    latitude: null as number | null,
    longitude: null as number | null,
    googleMapsUrl: '',
    // 交通專用欄位
    driverName: '',
    plateNumber: '',
    driverPhone: '',
  })

  // 資源選擇器狀態
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false)
  const [showHotelSelector, setShowHotelSelector] = useState(false)
  const [showAttractionSelector, setShowAttractionSelector] = useState(false)

  // 取得對應類別的供應商 workspace
  const supplierType = getCategorySupplierType(formData.category)
  const { workspaces: supplierWorkspaces, isLoading: loadingWorkspaces } = useSupplierWorkspaces({
    types: supplierType ? [supplierType] : ['vehicle_supplier', 'guide_supplier'],
  })

  // 當對話框打開時，更新預設分類
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, category: defaultCategory }))
    }
  }, [isOpen, defaultCategory])

  // 重設表單
  const resetForm = useCallback(() => {
    setFormData({
      category: defaultCategory,
      supplierName: '',
      title: '',
      serviceDate: startDate || '',
      serviceDateEnd: '',
      quantity: 1,
      description: '',
      recipientWorkspaceId: '',
      resourceType: '',
      resourceId: '',
      resourceName: '',
      latitude: null,
      longitude: null,
      googleMapsUrl: '',
      driverName: '',
      plateNumber: '',
      driverPhone: '',
    })
    setShowRestaurantSelector(false)
    setShowHotelSelector(false)
    setShowAttractionSelector(false)
  }, [startDate, defaultCategory])

  // 處理餐廳選擇
  const handleRestaurantSelect = useCallback((restaurants: CombinedRestaurant[]) => {
    if (restaurants.length === 0) return
    const restaurant = restaurants[0]
    setFormData(prev => ({
      ...prev,
      resourceType: 'restaurant',
      resourceId: restaurant.id,
      resourceName: restaurant.name,
      title: prev.title || restaurant.name,
      supplierName: prev.supplierName || restaurant.name,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      googleMapsUrl: restaurant.google_maps_url || '',
    }))
    setShowRestaurantSelector(false)
  }, [])

  // 處理飯店選擇
  const handleHotelSelect = useCallback((hotels: Array<{
    id: string
    name: string
    latitude?: number | null
    longitude?: number | null
    address?: string | null
    google_maps_url?: string | null
  }>) => {
    if (hotels.length === 0) return
    const hotel = hotels[0]
    setFormData(prev => ({
      ...prev,
      resourceType: 'hotel',
      resourceId: hotel.id,
      resourceName: hotel.name,
      title: prev.title || hotel.name,
      supplierName: prev.supplierName || hotel.name,
      latitude: hotel.latitude ?? null,
      longitude: hotel.longitude ?? null,
      googleMapsUrl: hotel.google_maps_url || '',
    }))
    setShowHotelSelector(false)
  }, [])

  // 處理景點選擇
  const handleAttractionSelect = useCallback((attractions: Array<{
    id: string
    name: string
    latitude?: number | null
    longitude?: number | null
    address?: string | null
    google_maps_url?: string | null
  }>) => {
    if (attractions.length === 0) return
    const attraction = attractions[0]
    setFormData(prev => ({
      ...prev,
      resourceType: 'attraction',
      resourceId: attraction.id,
      resourceName: attraction.name,
      title: prev.title || attraction.name,
      supplierName: prev.supplierName || attraction.name,
      latitude: attraction.latitude ?? null,
      longitude: attraction.longitude ?? null,
      googleMapsUrl: attraction.google_maps_url || '',
    }))
    setShowAttractionSelector(false)
  }, [])

  // 儲存需求
  const handleSave = useCallback(async () => {
    if (!user?.workspace_id) {
      toast({ title: '請先登入', variant: 'destructive' })
      return
    }

    const validation = addManualRequestSchema.safeParse({
      title: formData.title.trim(),
      category: formData.category,
    })
    if (!validation.success) {
      toast({ title: validation.error.issues[0].message, variant: 'destructive' })
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
        // 資源關聯（餐廳/飯店/景點）
        resource_type: formData.resourceType || null,
        resource_id: formData.resourceId || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        google_maps_url: formData.googleMapsUrl || null,
        // 交通專用欄位
        driver_name: formData.category === 'transport' ? (formData.driverName || null) : null,
        plate_number: formData.category === 'transport' ? (formData.plateNumber || null) : null,
        driver_phone: formData.category === 'transport' ? (formData.driverPhone || null) : null,
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
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent level={3} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>手動新增需求</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
          {/* 左欄 */}
          <div className="space-y-4">
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

            {/* 項目說明 */}
            <div className="space-y-2">
              <Label required>項目說明</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例如：機場接送、全程領隊"
              />
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
                <Label>發送給供應商</Label>
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
              </div>
            )}

            {/* 交通專用欄位：司機、車號、手機 */}
            {formData.category === 'transport' && (
              <div className="space-y-3 p-3 bg-morandi-container/20 rounded-lg">
                <p className="text-xs text-morandi-secondary font-medium">車輛資訊（供應商回覆後填寫）</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">司機</Label>
                    <Input
                      value={formData.driverName}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                      placeholder="司機姓名"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">車號</Label>
                    <Input
                      value={formData.plateNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value }))}
                      placeholder="車牌號碼"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">手機</Label>
                    <Input
                      value={formData.driverPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverPhone: e.target.value }))}
                      placeholder="司機電話"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 資源選擇（餐廳/飯店/景點）*/}
            {(formData.category === 'meal' || formData.category === 'accommodation' || formData.category === 'activity') && (
              <div className="space-y-2">
                <Label>從資料庫選擇</Label>
                <div className="flex items-center gap-2">
                  {formData.resourceName ? (
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-morandi-container/30 rounded-lg">
                      <span className="text-sm">{formData.resourceName}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          resourceType: '',
                          resourceId: '',
                          resourceName: '',
                          latitude: null,
                          longitude: null,
                          googleMapsUrl: '',
                        }))}
                        className="ml-auto text-morandi-secondary hover:text-morandi-red"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (formData.category === 'meal') setShowRestaurantSelector(true)
                        else if (formData.category === 'accommodation') setShowHotelSelector(true)
                        else if (formData.category === 'activity') setShowAttractionSelector(true)
                      }}
                      className="gap-2"
                    >
                      <Search size={16} />
                      {formData.category === 'meal' && '選擇餐廳'}
                      {formData.category === 'accommodation' && '選擇飯店'}
                      {formData.category === 'activity' && '選擇景點'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 右欄 */}
          <div className="space-y-4">
            {/* 日期範圍 */}
            <div className="grid grid-cols-2 gap-3">
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
                {formData.category === 'transport' && '台數'}
                {formData.category === 'guide' && '人數'}
                {formData.category === 'accommodation' && '間數'}
                {formData.category === 'meal' && '人數'}
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
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            取消
          </Button>
          {/* eslint-disable-next-line venturo/button-requires-icon -- 三元運算式中有圖標 */}
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

    {/* 餐廳選擇器 */}
    <RestaurantSelector
      isOpen={showRestaurantSelector}
      onClose={() => setShowRestaurantSelector(false)}
      onSelect={handleRestaurantSelect}
    />

    {/* 飯店選擇器 */}
    <HotelSelector
      isOpen={showHotelSelector}
      onClose={() => setShowHotelSelector(false)}
      onSelect={handleHotelSelect}
    />

    {/* 景點選擇器 */}
    <AttractionSelector
      isOpen={showAttractionSelector}
      onClose={() => setShowAttractionSelector(false)}
      onSelect={handleAttractionSelect}
    />
    </>
  )
}
