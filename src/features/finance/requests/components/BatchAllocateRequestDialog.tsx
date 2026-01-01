'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTourStore, useSupplierStore } from '@/stores'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { Plus, Trash2, Receipt, AlertCircle, Search, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'
import { PaymentItemCategory } from '@/stores/types'

interface BatchAllocateRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TourAllocation {
  tour_id: string
  tour_code: string
  tour_name: string
  allocated_amount: number
}

// 請款類別選項（與 PaymentItemCategory 對應）
const requestCategories: { value: PaymentItemCategory; label: string }[] = [
  { value: '住宿', label: '住宿' },
  { value: '交通', label: '交通' },
  { value: '餐食', label: '餐食' },
  { value: '門票', label: '門票' },
  { value: '導遊', label: '導遊' },
  { value: '保險', label: '保險' },
  { value: '出團款', label: '出團款' },
  { value: '回團款', label: '回團款' },
  { value: '員工代墊', label: '員工代墊' },
  { value: 'ESIM', label: 'ESIM' },
  { value: '同業', label: '同業' },
  { value: '其他', label: '其他' },
]

export function BatchAllocateRequestDialog({ open, onOpenChange }: BatchAllocateRequestDialogProps) {
  const { items: tours } = useTourStore()
  const { items: suppliers } = useSupplierStore()
  const { payment_requests, createPaymentRequest, addPaymentItem } = usePayments()

  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<PaymentItemCategory>('住宿')
  const [supplierId, setSupplierId] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [note, setNote] = useState('')

  // 旅遊團分配列表
  const [tourAllocations, setTourAllocations] = useState<TourAllocation[]>([])

  // 搜尋篩選
  const [tourSearch, setTourSearch] = useState('')

  // 可選擇的旅遊團（排除已選的）
  const availableTours = useMemo(() => {
    const selectedIds = new Set(tourAllocations.map(a => a.tour_id))
    return tours
      .filter(tour => !selectedIds.has(tour.id))
      .filter(tour => {
        if (!tourSearch) return true
        const search = tourSearch.toLowerCase()
        return (
          tour.code?.toLowerCase().includes(search) ||
          tour.name?.toLowerCase().includes(search)
        )
      })
      .slice(0, 20) // 限制顯示數量
  }, [tours, tourAllocations, tourSearch])

  // 計算已分配金額
  const totalAllocatedAmount = useMemo(() => {
    return tourAllocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0)
  }, [tourAllocations])

  // 未分配金額
  const unallocatedAmount = totalAmount - totalAllocatedAmount

  // 供應商名稱
  const selectedSupplierName = useMemo(() => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.name || ''
  }, [suppliers, supplierId])

  // 生成請款單編號
  const generateRequestCode = (tourCode: string) => {
    const existingCount = payment_requests.filter(r =>
      r.tour_code === tourCode || r.code?.startsWith(`${tourCode}-I`)
    ).length
    const nextNumber = existingCount + 1
    return `${tourCode}-I${nextNumber.toString().padStart(2, '0')}`
  }

  // 新增旅遊團分配
  const addTourAllocation = () => {
    if (availableTours.length === 0) {
      void alert('沒有可用的旅遊團', 'warning')
      return
    }

    const firstAvailableTour = availableTours[0]
    setTourAllocations(prev => [
      ...prev,
      {
        tour_id: firstAvailableTour.id,
        tour_code: firstAvailableTour.code || '',
        tour_name: firstAvailableTour.name || '',
        allocated_amount: 0,
      },
    ])
  }

  // 移除旅遊團分配
  const removeTourAllocation = (index: number) => {
    setTourAllocations(prev => prev.filter((_, i) => i !== index))
  }

  // 更新旅遊團分配
  const updateTourAllocation = (index: number, updates: Partial<TourAllocation>) => {
    setTourAllocations(prev =>
      prev.map((allocation, i) => (i === index ? { ...allocation, ...updates } : allocation))
    )
  }

  // 選擇旅遊團
  const selectTour = (index: number, tourId: string) => {
    const tour = tours.find(t => t.id === tourId)
    if (!tour) return

    updateTourAllocation(index, {
      tour_id: tour.id,
      tour_code: tour.code || '',
      tour_name: tour.name || '',
    })
  }

  // 平均分配未分配金額
  const distributeEvenly = () => {
    if (tourAllocations.length === 0 || totalAmount <= 0) return

    const amountPerTour = Math.floor(totalAmount / tourAllocations.length)
    const remainder = totalAmount - amountPerTour * tourAllocations.length

    setTourAllocations(prev =>
      prev.map((allocation, index) => ({
        ...allocation,
        allocated_amount: amountPerTour + (index === 0 ? remainder : 0),
      }))
    )
  }

  // 重置表單
  const resetForm = () => {
    setRequestDate(new Date().toISOString().split('T')[0])
    setCategory('住宿')
    setSupplierId('')
    setDescription('')
    setTotalAmount(0)
    setNote('')
    setTourAllocations([])
    setTourSearch('')
  }

  // 儲存
  const handleSave = async () => {
    if (tourAllocations.length === 0) {
      void alert('請至少新增一個旅遊團分配', 'warning')
      return
    }

    if (totalAmount === 0) {
      void alert('請款金額不能為 0', 'warning')
      return
    }

    if (unallocatedAmount !== 0) {
      void alert(`還有 NT$ ${unallocatedAmount.toLocaleString()} 未分配，請確認分配金額`, 'warning')
      return
    }

    try {
      // 為每個旅遊團建立請款單
      for (const allocation of tourAllocations) {
        const requestCode = generateRequestCode(allocation.tour_code)

        // 建立請款單
        const request = await createPaymentRequest({
          tour_id: allocation.tour_id,
          code: requestCode,
          tour_code: allocation.tour_code,
          tour_name: allocation.tour_name,
          request_date: requestDate,
          amount: 0, // 會由 item 計算
          status: 'pending',
          note,
          request_type: '供應商支出',
        })

        // 新增請款項目
        await addPaymentItem(request.id, {
          category,
          supplier_id: supplierId || '',
          supplier_name: selectedSupplierName || null,
          description: description || category,
          unit_price: allocation.allocated_amount,
          quantity: 1,
          note: '',
          sort_order: 1,
        })
      }

      await alert(`成功建立 ${tourAllocations.length} 筆請款單`, 'success')
      onOpenChange(false)
      resetForm()
    } catch (error) {
      void alert('建立失敗，請稍後再試', 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-morandi-gold" />
            批次請款
          </DialogTitle>
          <p className="text-sm text-morandi-secondary">
            輸入總金額後分配到多個旅遊團，適用於月結或統一請款的場景
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 請款日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>請款日期</Label>
              <DatePicker value={requestDate} onChange={(date) => setRequestDate(date)} placeholder="選擇日期" />
            </div>
            <div>
              <Label>總金額</Label>
              <Input
                type="number"
                placeholder="輸入總金額"
                value={totalAmount || ''}
                onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* 請款項目資訊 */}
          <div className="space-y-4 pt-4 border-t border-morandi-container/30">
            <h3 className="text-sm font-medium text-morandi-primary">請款項目資訊</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>類別</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as PaymentItemCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {requestCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>供應商</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇供應商（選填）" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>說明</Label>
              <Input
                placeholder="請款說明（選填）"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* 旅遊團分配 */}
          <div className="space-y-3 pt-4 border-t border-morandi-container/30">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">旅遊團分配</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={distributeEvenly}
                  disabled={tourAllocations.length === 0 || totalAmount === 0}
                >
                  平均分配
                </Button>
                <Button size="sm" variant="outline" onClick={addTourAllocation}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增旅遊團
                </Button>
              </div>
            </div>

            {/* 搜尋框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-morandi-secondary" />
              <Input
                placeholder="搜尋旅遊團..."
                value={tourSearch}
                onChange={e => setTourSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {tourAllocations.length === 0 ? (
              <div className="text-center py-6 text-morandi-secondary text-sm">
                請新增旅遊團分配
              </div>
            ) : (
              <div className="border-t border-morandi-container/30">
                {tourAllocations.map((allocation, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-2 py-2 border-b border-morandi-container/30 last:border-b-0 hover:bg-morandi-container/10"
                  >
                    <Select
                      value={allocation.tour_id}
                      onValueChange={value => selectTour(index, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="選擇旅遊團" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* 已選的顯示在最上面 */}
                        <SelectItem value={allocation.tour_id}>
                          {allocation.tour_code} - {allocation.tour_name}
                        </SelectItem>
                        {availableTours.map(tour => (
                          <SelectItem key={tour.id} value={tour.id}>
                            {tour.code} - {tour.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="分配金額"
                      value={allocation.allocated_amount || ''}
                      onChange={e =>
                        updateTourAllocation(index, {
                          allocated_amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-40"
                    />

                    <Button size="sm" variant="ghost" onClick={() => removeTourAllocation(index)}>
                      <Trash2 className="h-4 w-4 text-morandi-red" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-morandi-container/50">
              <div className="text-sm">
                <span className="text-morandi-secondary">已分配</span>
                <span className="font-medium ml-2">
                  NT$ {totalAllocatedAmount.toLocaleString()}
                </span>
              </div>
              <div
                className={cn(
                  'text-sm',
                  unallocatedAmount > 0 && 'text-morandi-gold',
                  unallocatedAmount < 0 && 'text-morandi-red'
                )}
              >
                <span>未分配</span>
                <span className="font-medium ml-2">NT$ {unallocatedAmount.toLocaleString()}</span>
              </div>
            </div>

            {unallocatedAmount !== 0 && (
              <div className="flex items-center gap-2 py-2 text-sm">
                <AlertCircle className="h-4 w-4 text-morandi-gold shrink-0" />
                <span className="text-morandi-gold">
                  {unallocatedAmount > 0 ? '還有金額未分配' : '分配金額超過總金額'}
                  ，請調整分配金額
                </span>
              </div>
            )}
          </div>

          {/* 備註 */}
          <div>
            <Label>備註</Label>
            <Input
              placeholder="請款備註（選填）"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="gap-1" onClick={() => onOpenChange(false)}>
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="bg-morandi-gold hover:bg-morandi-gold-hover gap-1"
            disabled={unallocatedAmount !== 0 || tourAllocations.length === 0}
          >
            <Check size={16} />
            建立批次請款（{tourAllocations.length} 筆）
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
