'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Customer, VipLevel, CustomerSource } from '@/types/customer.types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface CustomerFormProps {
  open: boolean
  onClose: () => void
  customer?: Customer
  onSubmit: (data: Partial<Customer>) => Promise<void>
}

export function CustomerForm({ open, onClose, customer, onSubmit }: CustomerFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    english_name: '',
    phone: '',
    alternative_phone: '',
    email: '',
    address: '',
    national_id: '',
    passport_number: '',
    passport_romanization: '',
    passport_expiry_date: '',
    date_of_birth: '',
    gender: 'male',
    company: '',
    tax_id: '',
    is_vip: false,
    vip_level: undefined,
    source: 'website',
    referred_by: '',
    notes: '',
    is_active: true,
    verification_status: 'unverified',
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData(customer)
    }
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? '編輯客戶' : '新增客戶'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資料 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-morandi-primary">基本資料</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="english_name">英文姓名</Label>
                <Input
                  id="english_name"
                  value={formData.english_name}
                  onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">電話 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="alternative_phone">備用電話</Label>
                <Input
                  id="alternative_phone"
                  value={formData.alternative_phone}
                  onChange={(e) => setFormData({ ...formData, alternative_phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gender">性別</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">出生日期</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth?.split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="national_id">身分證字號</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 護照資料 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-morandi-primary">護照資料</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passport_number">護照號碼</Label>
                <Input
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="passport_romanization">護照拼音</Label>
                <Input
                  id="passport_romanization"
                  placeholder="例如：WANG/XIAOMING"
                  value={formData.passport_romanization}
                  onChange={(e) => setFormData({ ...formData, passport_romanization: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="passport_expiry_date">護照效期</Label>
                <Input
                  id="passport_expiry_date"
                  type="date"
                  value={formData.passport_expiry_date?.split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, passport_expiry_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 公司資料 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-morandi-primary">公司資料</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">公司名稱</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tax_id">統編</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* VIP 狀態 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-morandi-primary">VIP 狀態</h3>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_vip}
                onCheckedChange={(checked) => setFormData({ ...formData, is_vip: checked })}
              />
              <Label>VIP 客戶</Label>
            </div>
            {formData.is_vip && (
              <div>
                <Label htmlFor="vip_level">VIP 等級</Label>
                <Select
                  value={formData.vip_level}
                  onValueChange={(value: VipLevel) => setFormData({ ...formData, vip_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">銅卡</SelectItem>
                    <SelectItem value="silver">銀卡</SelectItem>
                    <SelectItem value="gold">金卡</SelectItem>
                    <SelectItem value="platinum">白金卡</SelectItem>
                    <SelectItem value="diamond">鑽石卡</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 其他資訊 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-morandi-primary">其他資訊</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source">客戶來源</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: CustomerSource) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              <div>
                <Label htmlFor="referred_by">推薦人</Label>
                <Input
                  id="referred_by"
                  value={formData.referred_by}
                  onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '儲存中...' : customer ? '更新' : '新增'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
