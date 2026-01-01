'use client'

/**
 * 開立代轉發票頁面
 * 仿藍新金流介面風格
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileText } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { useTravelInvoiceStore, TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CreateInvoicePage() {
  const router = useRouter()
  const { issueInvoice, isLoading } = useTravelInvoiceStore()
  const [error, setError] = useState<string | null>(null)

  // 基本資訊
  const [invoice_date, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [tax_type, setTaxType] = useState<'dutiable' | 'zero' | 'free'>('dutiable')
  const [reportStatus, setReportStatus] = useState<'unreported' | 'reported'>('unreported')
  const [remark, setRemark] = useState('')

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
      item_name: '',
      item_count: 1,
      item_unit: '式',
      item_price: 0,
      itemAmt: 0,
      itemWord: '',
    },
  ])

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        item_count: 1,
        item_unit: '式',
        item_price: 0,
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

  const updateItem = (index: number, field: keyof TravelInvoiceItem, value: unknown) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // 自動計算金額
    if (field === 'item_price' || field === 'item_count') {
      const price = Number(field === 'item_price' ? value : newItems[index].item_price)
      const count = Number(field === 'item_count' ? value : newItems[index].item_count)
      newItems[index].itemAmt = price * count
    }

    setItems(newItems)
  }

  const total_amount = items.reduce((sum, item) => sum + item.itemAmt, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 驗證
    if (!buyerInfo.buyerName) {
      setError('請輸入買受人名稱')
      return
    }

    if (items.some(item => !item.item_name || item.item_price <= 0)) {
      setError('請完整填寫商品資訊')
      return
    }

    try {
      await issueInvoice({
        invoice_date,
        total_amount,
        tax_type,
        buyerInfo,
        items,
        created_by: 'current_user',
      })

      router.push('/finance/travel-invoice')
    } catch (error) {
      setError(error instanceof Error ? error.message : '發生未知錯誤')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="開立新發票"
        icon={FileText}
        showBackButton={true}
        onBack={() => router.push('/finance/travel-invoice')}
      />

      <ContentContainer className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6 pb-6 max-w-4xl mx-auto">
          {/* 錯誤訊息 */}
          {error && (
            <div className="p-3 bg-status-danger-bg border border-status-danger/30 rounded-md">
              <p className="text-status-danger text-sm">{error}</p>
            </div>
          )}

          {/* 基本資訊 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoice_date">開立日期</Label>
                  <DatePicker
                    value={invoice_date}
                    onChange={(date) => setInvoiceDate(date)}
                    placeholder="選擇日期"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_type">課稅別</Label>
                  <Select value={tax_type} onValueChange={(value) => setTaxType(value as 'dutiable' | 'zero' | 'free')}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="選擇課稅別" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dutiable">應稅</SelectItem>
                      <SelectItem value="zero">零稅率</SelectItem>
                      <SelectItem value="free">免稅</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>申報註記</Label>
                  <div className="flex items-center gap-4 h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reportStatus"
                        value="unreported"
                        checked={reportStatus === 'unreported'}
                        onChange={() => setReportStatus('unreported')}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm">未申報</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reportStatus"
                        value="reported"
                        checked={reportStatus === 'reported'}
                        onChange={() => setReportStatus('reported')}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm">已申報</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 買受人資訊 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">買受人資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyerName">買受人名稱 *</Label>
                  <Input
                    id="buyerName"
                    value={buyerInfo.buyerName}
                    onChange={e => setBuyerInfo({ ...buyerInfo, buyerName: e.target.value })}
                    placeholder="請輸入買受人名稱"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="buyerUBN">統一編號</Label>
                  <Input
                    id="buyerUBN"
                    value={buyerInfo.buyerUBN}
                    onChange={e => setBuyerInfo({ ...buyerInfo, buyerUBN: e.target.value })}
                    placeholder="8 碼數字"
                  />
                </div>
                <div>
                  <Label htmlFor="buyerEmail">Email</Label>
                  <Input
                    id="buyerEmail"
                    type="email"
                    value={buyerInfo.buyerEmail}
                    onChange={e => setBuyerInfo({ ...buyerInfo, buyerEmail: e.target.value })}
                    placeholder="用於寄送電子收據"
                  />
                </div>
                <div>
                  <Label htmlFor="buyerMobile">手機號碼</Label>
                  <Input
                    id="buyerMobile"
                    value={buyerInfo.buyerMobile}
                    onChange={e => setBuyerInfo({ ...buyerInfo, buyerMobile: e.target.value })}
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 商品明細 - 表格式 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">商品明細</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* 表格標題 */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 border-y text-sm font-medium text-muted-foreground">
                <div className="col-span-4">摘要</div>
                <div className="col-span-1 text-center">數量</div>
                <div className="col-span-2 text-right">單價</div>
                <div className="col-span-2 text-center">單位</div>
                <div className="col-span-2 text-right">金額</div>
                <div className="col-span-1 text-center">處理</div>
              </div>

              {/* 項目列表 */}
              <div className="divide-y">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-4">
                      <Input
                        value={item.item_name}
                        onChange={e => updateItem(index, 'item_name', e.target.value)}
                        placeholder="商品名稱"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="1"
                        value={item.item_count}
                        onChange={e => updateItem(index, 'item_count', parseInt(e.target.value) || 1)}
                        className="h-9 text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.item_price || ''}
                        onChange={e => updateItem(index, 'item_price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-9 text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={item.item_unit}
                        onChange={e => updateItem(index, 'item_unit', e.target.value)}
                        className="h-9 text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="h-9 flex items-center justify-end px-3 bg-muted/30 rounded-md text-sm font-medium">
                        {item.itemAmt.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 新增一列按鈕 */}
              <div className="px-4 py-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="text-primary"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  新增一列
                </Button>
              </div>

              {/* 備註欄位 */}
              <div className="px-4 py-3 border-t">
                <div className="flex items-start gap-4">
                  <Label className="pt-2 shrink-0">備註</Label>
                  <div className="flex-1">
                    <Input
                      value={remark}
                      onChange={e => setRemark(e.target.value.slice(0, 50))}
                      placeholder="請輸入備註（限 50 字）"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      可輸入大小寫英文、中文（限 50 字，不可輸入符號，例如：/ , - = 等）
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground pt-2">
                    {remark.length}/50
                  </span>
                </div>
              </div>

              {/* 總計 */}
              <div className="px-4 py-4 border-t bg-muted/30">
                <div className="flex justify-end items-center gap-4">
                  <span className="text-sm font-medium">總計</span>
                  <span className="text-xl font-bold text-primary min-w-[120px] text-right">
                    NT$ {total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 送出按鈕 */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push('/finance/travel-invoice')}
              className="min-w-[120px]"
            >
              取消
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? '開立中...' : '開立發票'}
            </Button>
          </div>
        </form>
      </ContentContainer>
    </div>
  )
}
