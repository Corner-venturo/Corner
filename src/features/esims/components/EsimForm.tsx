'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, Search, RefreshCw } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusCell } from '@/components/table-cells'
import { STATUS_CONFIG } from '@/lib/status-config'
import { useEsimStore } from '@/stores/esim-store'
import { useTours } from '@/features/tours/hooks/useTours'
import type { EsimFormData, Esim } from '@/types/esim.types'

interface EsimFormProps {
  mode: 'create' | 'edit'
  esimNumber?: string
}

export function EsimForm({ mode, esimNumber }: EsimFormProps) {
  const router = useRouter()
  const { items: esims, create, fetchById } = useEsimStore()
  const { tours } = useTours()
  const orders: any[] = [] // TODO: 實作 orders hook

  const [loading, setLoading] = useState(false)
  const [esim, setEsim] = useState<Esim | null>(null)
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('')
  const [productRegion, setProductRegion] = useState<string>('')
  const [products, setProducts] = useState<any[]>([]) // TODO: FastMove API

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EsimFormData>({
    defaultValues: {
      quantity: 1,
    },
  })

  // 載入現有網卡資料（編輯模式）
  useEffect(() => {
    if (mode === 'edit' && esimNumber) {
      const foundEsim = esims.find(e => e.esim_number === esimNumber)
      if (foundEsim) {
        setEsim(foundEsim)
        setValue('group_code', foundEsim.group_code)
        setValue('order_number', foundEsim.order_number || '')
        setValue('product_id', foundEsim.product_id || '')
        setValue('quantity', foundEsim.quantity)
        setValue('email', foundEsim.email || '')
        setValue('note', foundEsim.note || '')
        setSelectedGroupCode(foundEsim.group_code)
      }
    }
  }, [mode, esimNumber, esims, setValue])

  // 監聽團號變化，過濾訂單
  const groupCode = watch('group_code')
  useEffect(() => {
    setSelectedGroupCode(groupCode)
  }, [groupCode])

  // 過濾該團號的訂單
  const filteredOrders = orders.filter((order: any) => order.tour_id === selectedGroupCode)

  // 儲存表單
  const onSubmit = async (data: EsimFormData) => {
    setLoading(true)
    try {
      if (mode === 'create') {
        // 生成網卡單號：E{團號}XX
        const prefix = `E${data.group_code}`
        const existingNumbers = esims
          .filter(e => e.esim_number.startsWith(prefix))
          .map(e => {
            const num = e.esim_number.slice(prefix.length)
            return parseInt(num, 10)
          })
          .filter(n => !isNaN(n))

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
        const esimNumber = `${prefix}${String(nextNumber).padStart(2, '0')}`

        await create({
          ...data,
          esim_number: esimNumber,
          status: 0, // 待確認
        })

        // TODO: 調用 FastMove API 下單

        router.push(`/esims/${esimNumber}`)
      } else {
        // 編輯模式下不允許修改（參考 CornerERP）
        router.push('/esims')
      }
    } catch (error) {
      logger.error('儲存失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const isReadOnly = mode === 'edit'

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-morandi-text-primary">
              {mode === 'create' ? '新增網卡' : `網卡詳情 - ${esimNumber}`}
            </h1>
            <p className="text-sm text-morandi-text-secondary">
              {mode === 'create' ? '填寫網卡資訊並下單' : '查看網卡詳情和供應商訂單'}
            </p>
          </div>
        </div>
        {mode === 'create' && (
          <Button onClick={handleSubmit(onSubmit)} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            儲存
          </Button>
        )}
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-6">
            {/* 團號 */}
            <div className="space-y-2">
              <Label htmlFor="group_code">
                團號 <span className="text-red-500">*</span>
              </Label>
              {isReadOnly ? (
                <Input value={esim?.group_code || ''} disabled />
              ) : (
                <Select
                  value={watch('group_code')}
                  onValueChange={value => setValue('group_code', value)}
                >
                  <SelectTrigger id="group_code">
                    <SelectValue placeholder="選擇團號" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours?.map((tour: any) => (
                      <SelectItem key={tour.id} value={tour.code}>
                        {tour.code} - {tour.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.group_code && (
                <p className="text-sm text-red-500">{errors.group_code.message}</p>
              )}
            </div>

            {/* 訂單編號 */}
            <div className="space-y-2">
              <Label htmlFor="order_number">訂單編號</Label>
              {isReadOnly ? (
                <Input value={esim?.order_number || '-'} disabled />
              ) : (
                <Select
                  value={watch('order_number')}
                  onValueChange={value => setValue('order_number', value)}
                  disabled={!selectedGroupCode}
                >
                  <SelectTrigger id="order_number">
                    <SelectValue placeholder="選擇訂單編號" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOrders.map((order: any) => (
                      <SelectItem key={order.id} value={order.code}>
                        {order.code} - {order.customer_name || '未命名'}
                      </SelectItem>
                    ))}
                    {/* TODO: 新增訂單快速入口 */}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 產品地區 */}
            <div className="space-y-2">
              <Label htmlFor="product_region">
                產品地區
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 w-6 p-0"
                    onClick={() => {
                      /* TODO: 刷新產品清單 */
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </Label>
              {isReadOnly ? (
                <Input value="-" disabled />
              ) : (
                <Select value={productRegion} onValueChange={setProductRegion}>
                  <SelectTrigger id="product_region">
                    <SelectValue placeholder="選擇產品地區" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: 從 FastMove API 載入 */}
                    <SelectItem value="JP">日本</SelectItem>
                    <SelectItem value="KR">韓國</SelectItem>
                    <SelectItem value="TH">泰國</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 產品 */}
            <div className="space-y-2">
              <Label htmlFor="product_id">
                產品 <span className="text-red-500">*</span>
              </Label>
              {isReadOnly ? (
                <Input value={esim?.product_id || '-'} disabled />
              ) : (
                <Select
                  value={watch('product_id')}
                  onValueChange={value => setValue('product_id', value)}
                  disabled={!productRegion}
                >
                  <SelectTrigger id="product_id">
                    <SelectValue placeholder="選擇產品" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: 根據 productRegion 過濾產品 */}
                    <SelectItem value="PROD001">日本 7天 無限流量 - $500</SelectItem>
                    <SelectItem value="PROD002">日本 14天 無限流量 - $800</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {errors.product_id && (
                <p className="text-sm text-red-500">{errors.product_id.message}</p>
              )}
            </div>

            {/* 數量 */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                數量 <span className="text-red-500">*</span>
              </Label>
              {isReadOnly ? (
                <Input value={`${esim?.quantity} 張`} disabled />
              ) : (
                <Select
                  value={watch('quantity')?.toString()}
                  onValueChange={value => setValue('quantity', Number(value))}
                >
                  <SelectTrigger id="quantity">
                    <SelectValue placeholder="選擇數量" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} 張
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 信箱 */}
            <div className="space-y-2">
              <Label htmlFor="email">
                信箱 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: '請輸入信箱' })}
                disabled={isReadOnly}
                placeholder="接收 eSIM 的信箱"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            {/* 供應商訂單編號（僅編輯模式） */}
            {isReadOnly && esim && (
              <div className="space-y-2">
                <Label htmlFor="supplier_order_number">供應商訂單編號</Label>
                <div className="flex gap-2">
                  <Input
                    id="supplier_order_number"
                    value={esim.supplier_order_number || '-'}
                    disabled
                    className="font-mono text-xs"
                  />
                  {esim.supplier_order_number && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        /* TODO: 查詢供應商訂單詳情 */
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 狀態（僅編輯模式） */}
            {isReadOnly && esim && (
              <div className="space-y-2">
                <Label>狀態</Label>
                <div>
                  <StatusCell status={esim.status} config={STATUS_CONFIG.esim} />
                </div>
              </div>
            )}

            {/* 備註 */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="note">備註</Label>
              <Textarea
                id="note"
                {...register('note')}
                disabled={isReadOnly}
                placeholder="輸入備註資訊"
                rows={4}
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
