/**
 * 顧客進階搜尋對話框
 * 整合舊專案 cornerERP 的進階搜尋功能 + Venturo 的 VIP 篩選
 */

'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'

export interface CustomerSearchParams {
  query?: string // 姓名/身份證號/護照號碼
  phone?: string // 電話
  email?: string // Email
  passport_romanization?: string // 護照拼音
  is_vip?: boolean // 是否為 VIP
  vip_level?: string // VIP 等級
  source?: string // 客戶來源
  city?: string // 城市
  passport_expiry_start?: string // 護照效期起始日
  passport_expiry_end?: string // 護照效期結束日
}

interface CustomerSearchDialogProps {
  open: boolean
  onClose: () => void
  onSearch: (params: CustomerSearchParams) => void
  initialValues?: CustomerSearchParams
}

export function CustomerSearchDialog({
  open,
  onClose,
  onSearch,
  initialValues = {},
}: CustomerSearchDialogProps) {
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>(initialValues)

  const handleReset = () => {
    setSearchParams({})
  }

  const handleSearch = () => {
    // 過濾掉空值
    const filteredParams = Object.entries(searchParams).reduce<CustomerSearchParams>(
      (acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          acc[key as keyof CustomerSearchParams] = value
        }
        return acc
      },
      {}
    )

    onSearch(filteredParams)
    onClose()
  }

  const updateParam = (key: keyof CustomerSearchParams, value: CustomerSearchParams[keyof CustomerSearchParams]) => {
    setSearchParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Search size={20} className="text-morandi-gold" />
            進階搜尋
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-morandi-primary mb-2 block">
                  姓名 / 身份證號 / 護照號碼
                </label>
                <Input
                  value={searchParams.query || ''}
                  onChange={e => updateParam('query', e.target.value)}
                  placeholder="輸入姓名、身份證號或護照號碼"
                />
              </div>

              <div>
                <label className="text-sm text-morandi-primary mb-2 block">電話</label>
                <Input
                  value={searchParams.phone || ''}
                  onChange={e => updateParam('phone', e.target.value)}
                  placeholder="輸入電話號碼"
                />
              </div>

              <div>
                <label className="text-sm text-morandi-primary mb-2 block">Email</label>
                <Input
                  type="email"
                  value={searchParams.email || ''}
                  onChange={e => updateParam('email', e.target.value)}
                  placeholder="輸入 Email"
                />
              </div>

              <div>
                <label className="text-sm text-morandi-primary mb-2 block">城市</label>
                <Input
                  value={searchParams.city || ''}
                  onChange={e => updateParam('city', e.target.value)}
                  placeholder="輸入城市"
                />
              </div>
            </div>
          </div>

          {/* 護照資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">護照資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-morandi-primary mb-2 block">
                  護照拼音（姓氏/名字）
                </label>
                <Input
                  value={searchParams.passport_romanization || ''}
                  onChange={e => updateParam('passport_romanization', e.target.value)}
                  placeholder="例如：WANG/XIAOMING"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-sm text-morandi-primary mb-2 block">護照效期範圍</label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    value={searchParams.passport_expiry_start || ''}
                    onChange={(date) => updateParam('passport_expiry_start', date)}
                    placeholder="起始日"
                  />
                  <DatePicker
                    value={searchParams.passport_expiry_end || ''}
                    onChange={(date) => updateParam('passport_expiry_end', date)}
                    placeholder="結束日"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* VIP 與來源 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">VIP 與來源</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-morandi-primary mb-2 block">VIP 狀態</label>
                <Select
                  value={searchParams.is_vip?.toString() || 'all'}
                  onValueChange={value =>
                    updateParam('is_vip', value === 'all' ? undefined : value === 'true')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="true">VIP</SelectItem>
                    <SelectItem value="false">非 VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-morandi-primary mb-2 block">VIP 等級</label>
                <Select
                  value={searchParams.vip_level || 'all'}
                  onValueChange={value =>
                    updateParam('vip_level', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="bronze">銅卡</SelectItem>
                    <SelectItem value="silver">銀卡</SelectItem>
                    <SelectItem value="gold">金卡</SelectItem>
                    <SelectItem value="platinum">白金卡</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-morandi-primary mb-2 block">客戶來源</label>
                <Select
                  value={searchParams.source || 'all'}
                  onValueChange={value =>
                    updateParam('source', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="website">官網</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="line">LINE</SelectItem>
                    <SelectItem value="referral">推薦</SelectItem>
                    <SelectItem value="phone">電話</SelectItem>
                    <SelectItem value="walk_in">現場</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <X size={16} />
            重置
          </Button>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleSearch}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Search size={16} />
            搜尋
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
