'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { useEsimStore } from '@/stores/esim-store'
import { useOrderStore, useTourStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { useTours } from '@/features/tours/hooks/useTours'
import { tourService } from '@/features/tours/services/tour.service'
import { fastMoveService } from '@/services/fastmove.service'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { FastMoveProduct } from '@/types/esim.types'

// 產品地區選項
const PRODUCT_REGIONS = [
  { value: 'JPN', label: '日本' },
  { value: 'KOR', label: '韓國' },
  { value: 'THI', label: '泰國' },
  { value: 'VNM', label: '越南' },
  { value: 'SGP', label: '新加坡' },
  { value: 'MYS', label: '馬來西亞' },
]

interface EsimItem {
  id: string
  product_region: string
  product_id: string
  quantity: number
  email: string
  note: string
}

interface EsimCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EsimCreateDialog({ open, onOpenChange }: EsimCreateDialogProps) {
  const router = useRouter()
  const { items: esims, create } = useEsimStore()
  const { create: createOrder } = useOrderStore()
  const { user } = useAuthStore()
  const { tours } = useTours()

  const [selectedTourId, setSelectedTourId] = useState<string>('')
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [contactPerson, setContactPerson] = useState<string>('')
  const [contactPhone, setContactPhone] = useState<string>('')
  const [products, setProducts] = useState<FastMoveProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [tourOrders, setTourOrders] = useState<any[]>([])

  const [esimItems, setEsimItems] = useState<EsimItem[]>([
    {
      id: '1',
      product_region: '',
      product_id: '',
      quantity: 1,
      email: '',
      note: '',
    },
  ])

  const tourOptions = useMemo(() => {
    console.log('Tours data:', tours?.length)
    return (tours || []).map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }))
  }, [tours])

  // 訂單選項（使用當前團號的訂單 + 新增選項）
  const orderOptions = useMemo(() => {
    const options = tourOrders.map(order => ({
      value: order.order_number,
      label: `${order.order_number} - ${order.contact_person || ''}`,
    }))
    // 加入「新增訂單」選項
    if (selectedTourId) {
      options.push({
        value: '__create_new__',
        label: '+ 新增訂單',
      })
    }
    return options
  }, [tourOrders, selectedTourId])

  // ✅ 當對話框打開時，載入團號資料並自動選擇網卡專用團
  useEffect(() => {
    if (open && !hasInitialized) {
      const init = async () => {
        try {
          // 1. 先載入團號資料
          const tourStore = useTourStore.getState()
          if (tourStore.items.length === 0) {
            await tourStore.fetchAll()
          }

          // 2. 取得或建立網卡專用團
          const esimTour = await tourService.getOrCreateEsimTour()
          if (esimTour) {
            setSelectedTourId(esimTour.id)
            setHasInitialized(true)
          }
        } catch (error) {
          console.error('Failed to initialize esim dialog:', error)
        }
      }
      void init()
    }

    // 對話框關閉時重置初始化狀態
    if (!open) {
      setHasInitialized(false)
    }
  }, [open, hasInitialized])

  // ✅ 當團號改變時，載入該團的訂單
  useEffect(() => {
    if (selectedTourId) {
      const fetchTourOrders = async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('tour_id', selectedTourId)
            .order('created_at', { ascending: false })

          if (!error && data) {
            setTourOrders(data)
          } else {
            setTourOrders([])
          }
        } catch (error) {
          console.error('Failed to fetch tour orders:', error)
          setTourOrders([])
        }
      }
      fetchTourOrders()
    } else {
      setTourOrders([])
    }
  }, [selectedTourId])

  // 當選擇團號時的處理
  const handleTourChange = (tourId: string) => {
    setSelectedTourId(tourId)
    // 清空訂單選擇，因為團號改變了
    setOrderNumber('')
  }

  // 從 selectedTourId 取得 groupCode
  const groupCode = tours?.find(t => t.id === selectedTourId)?.code || ''

  // 載入 FastMove 產品列表
  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const productList = await fastMoveService.getProducts()
      setProducts(productList)
      toast.success(`已更新 ${productList.length} 個產品`)
    } catch (error) {
      toast.error('無法載入產品列表，請稍後再試')
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // 將 FastMove 產品轉換為選項格式（記憶化避免無限循環）
  const productOptions = useMemo(
    () =>
      products.map(p => ({
        value: p.product_id,
        label: `${p.product_name} - $${p.product_price}`,
      })),
    [products]
  )

  const addEsimItem = () => {
    setEsimItems([
      ...esimItems,
      {
        id: Date.now().toString(),
        product_region: '',
        product_id: '',
        quantity: 1,
        email: '',
        note: '',
      },
    ])
  }

  const removeEsimItem = (id: string) => {
    setEsimItems(esimItems.filter(item => item.id !== id))
  }

  const updateEsimItem = (id: string, field: keyof EsimItem, value: unknown) => {
    setEsimItems(esimItems.map(item => (item.id === id ? { ...item, [field]: value } : item)))
  }

  // 不強制要求選擇團號（可以使用預設網卡團）
  const canSubmit = esimItems.every(item => item.product_region && item.product_id && item.email)

  const handleSubmit = async () => {
    if (!canSubmit || !user) return

    try {
      // 決定使用哪個團號
      let finalGroupCode = groupCode
      let selectedTour = tours?.find(t => t.id === selectedTourId)

      // 如果沒選團號，使用預設網卡團 ESIM-{year}
      if (!selectedTour) {
        const currentYear = new Date().getFullYear()
        const defaultEsimCode = `ESIM-${currentYear}`
        const defaultEsimTour = tours?.find(t => t.code === defaultEsimCode)

        if (defaultEsimTour) {
          finalGroupCode = defaultEsimTour.code
          selectedTour = defaultEsimTour
        } else {
          // 提示需要先建立預設網卡團
          alert(`請先建立 ${defaultEsimCode} 網卡團，或在表單中選擇團號`)
          return
        }
      }

      // 取得或建立訂單
      let targetOrderNumber = orderNumber

      // 如果選擇「+ 新增訂單」或沒有選訂單，則自動建立
      if ((!orderNumber || orderNumber === '__create_new__') && selectedTour) {
        // 重新查詢該團的訂單數量（確保最新）
        const { supabase } = await import('@/lib/supabase/client')
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('tour_id', selectedTour.id)

        const nextNumber = ((count || 0) + 1).toString().padStart(3, '0')
        const newOrderNumber = `${selectedTour.code}-${nextNumber}`

        await createOrder({
          order_number: newOrderNumber,
          tour_id: selectedTour.id,
          code: newOrderNumber,
          tour_name: selectedTour.name,
          contact_person: contactPerson || user.display_name || '系統',
          sales_person: user.display_name || '系統',
          assistant: user.display_name || '系統',
          member_count: esimItems.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: 0, // 網卡費用待計算
          paid_amount: 0,
          remaining_amount: 0,
          payment_status: 'unpaid' as const,
        } as any)

        targetOrderNumber = newOrderNumber
        toast.success(`已建立訂單：${newOrderNumber}`)
      }

      // 為每個網卡項目生成單號並建立
      for (const item of esimItems) {
        const prefix = `E${finalGroupCode}`
        const existingNumbers = (esims || [])
          .filter((e: any) => e.esim_number?.startsWith(prefix))
          .map((e: any) => {
            const num = e.esim_number.slice(prefix.length)
            return parseInt(num, 10)
          })
          .filter((n: number) => !isNaN(n))

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
        const esimNumber = `${prefix}${String(nextNumber).padStart(2, '0')}`

        await create({
          esim_number: esimNumber,
          group_code: finalGroupCode,
          order_number: targetOrderNumber || undefined,
          product_id: item.product_id,
          quantity: item.quantity,
          email: item.email,
          note: item.note || '',
          status: 0, // 待確認
        } as any)

        // TODO: 調用 FastMove API 下單
      }

      // 重置表單，重新自動選擇預設團號
      setSelectedTourId('')
      setOrderNumber('')
      setEsimItems([
        {
          id: '1',
          product_id: '',
          quantity: 1,
          email: '',
          note: '',
        },
      ])
      router.refresh()
    } catch (error) {
      console.error('建立失敗:', error)
      throw error
    }
  }

  const handleClose = () => {
    setSelectedTourId('')
    setOrderNumber('')
    setContactPerson('')
    setContactPhone('')
    setEsimItems([
      {
        id: '1',
        product_region: '',
        product_id: '',
        quantity: 1,
        email: '',
        note: '',
      },
    ])
    onOpenChange(false)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && handleClose()}
      title="批次新增網卡"
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel="批次新增網卡"
      submitDisabled={!canSubmit}
      maxWidth="5xl"
      contentClassName="max-h-[75vh] overflow-y-auto"
    >
      {/* 上半部：聯絡人資訊 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">
              選擇團號 <span className="text-xs text-morandi-secondary">(自動選擇網卡專用團)</span>
            </label>
            <Combobox
              value={selectedTourId}
              onChange={handleTourChange}
              options={tourOptions}
              placeholder="選擇團號..."
              className="mt-1"
              showSearchIcon
              showClearButton
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">
              訂單編號{' '}
              <span className="text-xs text-morandi-secondary">(選填，未選擇將自動建立)</span>
            </label>
            <Combobox
              value={orderNumber}
              onChange={setOrderNumber}
              options={orderOptions}
              placeholder={selectedTourId ? '請選擇訂單或留空自動建立' : '請先選擇團號'}
              disabled={!selectedTourId}
              className="mt-1"
              showSearchIcon
              showClearButton
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
            <Input
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              placeholder="請輸入聯絡人"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
            <Input
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="請輸入聯絡電話"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* 分割線 */}
      <div className="border-t border-border"></div>

      {/* 下半部：批次網卡列表 */}
      <div className="space-y-2">
        {esimItems.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[140px_180px_70px_1fr_120px_40px] gap-2 items-center"
          >
            <div className="relative">
              <select
                value={item.product_region}
                onChange={e => updateEsimItem(item.id, 'product_region', e.target.value)}
                className="w-full p-2 pr-9 border border-border rounded-md bg-background h-10 appearance-none"
              >
                <option value="">產品地區</option>
                {PRODUCT_REGIONS.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchProducts}
                disabled={isLoadingProducts}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-morandi-gray/10"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <Input
              value={item.product_id}
              onChange={e => updateEsimItem(item.id, 'product_id', e.target.value)}
              placeholder="產品"
            />

            <select
              value={item.quantity}
              onChange={e => updateEsimItem(item.id, 'quantity', Number(e.target.value))}
              className="w-full p-2 border border-border rounded-md bg-background h-10"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>

            <Input
              type="email"
              value={item.email}
              onChange={e => updateEsimItem(item.id, 'email', e.target.value)}
              placeholder="接收信箱"
            />

            <Input
              value={item.note}
              onChange={e => updateEsimItem(item.id, 'note', e.target.value)}
              placeholder="備註"
            />

            <Button
              type="button"
              onClick={index === esimItems.length - 1 ? addEsimItem : () => removeEsimItem(item.id)}
              size="sm"
              className={
                index === esimItems.length - 1
                  ? 'h-8 w-8 p-0 flex-shrink-0 bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                  : 'h-8 w-8 p-0 flex-shrink-0 text-morandi-red hover:bg-red-50'
              }
              variant={index === esimItems.length - 1 ? 'default' : 'ghost'}
            >
              {index === esimItems.length - 1 ? '+' : '✕'}
            </Button>
          </div>
        ))}
      </div>
    </FormDialog>
  )
}
