'use client'

/**
 * 開立代轉發票頁面
 */

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Plus, Trash2, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTravelInvoiceStore, TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'

export default function CreateInvoicePage() {
  const router = useRouter()
  const { issueInvoice, isLoading } = useTravelInvoiceStore()
  const [error, setError] = useState<string | null>(null)

  // 基本資訊
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [taxType, setTaxType] = useState<'dutiable' | 'zero' | 'free'>('dutiable')

  // 買受人資訊
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    buyerName: '',
    buyerUBN: '',
    buyerAddress: '',
    buyerEmail: '',
    buyerMobileCode: '+886',
    buyerMobile: '',
    carrierType: '',
    carrierNum: '',
    loveCode: '',
    printFlag: 'Y',
  })

  // 商品明細
  const [items, setItems] = useState<TravelInvoiceItem[]>([
    {
      itemName: '',
      item_count: 1,
      itemUnit: '式',
      itemPrice: 0,
      itemAmt: 0,
      itemWord: '',
    },
  ])

  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: '',
        item_count: 1,
        itemUnit: '式',
        itemPrice: 0,
        itemAmt: 0,
        itemWord: '',
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof TravelInvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // 自動計算金額
    if (field === 'itemPrice' || field === 'itemCount') {
      const price = field === 'itemPrice' ? value : newItems[index].itemPrice
      const count = field === 'itemCount' ? value : newItems[index].item_count
      newItems[index].itemAmt = price * count
    }

    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.itemAmt, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 驗證
    if (!buyerInfo.buyerName) {
      setError('請輸入買受人名稱')
      return
    }

    if (items.some(item => !item.itemName || item.itemPrice <= 0)) {
      setError('請完整填寫商品資訊')
      return
    }

    try {
      await issueInvoice({
        invoiceDate,
        totalAmount,
        taxType,
        buyerInfo,
        items,
        created_by: 'current_user', // TODO: 從登入狀態取得
      })

      router.push('/finance/travel-invoice')
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 標題列 */}
      <div className="flex items-center gap-4">
        <Link href="/finance/travel-invoice">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">開立新發票</h1>
          <p className="text-muted-foreground mt-1">填寫發票資訊並送出開立</p>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceDate">開立日期</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="taxType">課稅別</Label>
                <select
                  id="taxType"
                  value={taxType}
                  onChange={e => setTaxType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="dutiable">應稅</option>
                  <option value="zero">零稅率</option>
                  <option value="free">免稅</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 買受人資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>買受人資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerName">買受人名稱 *</Label>
                <Input
                  id="buyerName"
                  value={buyerInfo.buyerName}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="buyerUBN">統一編號</Label>
                <Input
                  id="buyerUBN"
                  value={buyerInfo.buyerUBN}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerUBN: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="buyerEmail">Email</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={buyerInfo.buyerEmail}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="buyerMobile">手機號碼</Label>
                <Input
                  id="buyerMobile"
                  value={buyerInfo.buyerMobile}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerMobile: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品明細 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>商品明細</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                新增項目
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">項目 {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label>商品名稱 *</Label>
                    <Input
                      value={item.itemName}
                      onChange={e => updateItem(index, 'itemName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>數量</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.item_count}
                      onChange={e => updateItem(index, 'itemCount', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>單位</Label>
                    <Input
                      value={item.itemUnit}
                      onChange={e => updateItem(index, 'itemUnit', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>單價</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.itemPrice}
                      onChange={e => updateItem(index, 'itemPrice', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>金額</Label>
                    <Input value={item.itemAmt} readOnly className="bg-muted" />
                  </div>
                  <div className="col-span-2">
                    <Label>備註</Label>
                    <Input
                      value={item.itemWord}
                      onChange={e => updateItem(index, 'itemWord', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end items-center pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">總金額</p>
                <p className="text-2xl font-bold">NT$ {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 送出按鈕 */}
        <div className="flex justify-end gap-4">
          <Link href="/finance/travel-invoice">
            <Button type="button" variant="outline">
              取消
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '開立中...' : '開立發票'}
          </Button>
        </div>
      </form>
    </div>
  )
}
