'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Customer } from '@/types/customer.types'

interface BasicInfoTabProps {
  customer: Customer
  formData: Partial<Customer>
  setFormData: (data: Partial<Customer>) => void
  isEditing: boolean
}

export function BasicInfoTab({ customer, formData, setFormData, isEditing }: BasicInfoTabProps) {
  const handleChange = (field: keyof Customer, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-8">
      {/* 基本資訊 */}
      <div>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">基本資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-morandi-text-primary">
              姓名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="english_name" className="text-morandi-text-primary">
              英文名
            </Label>
            <Input
              id="english_name"
              value={formData.english_name || ''}
              onChange={e => handleChange('english_name', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-morandi-text-primary">
              電話
            </Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-morandi-text-primary">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="date_of_birth" className="text-morandi-text-primary">
              出生日期
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={e => handleChange('date_of_birth', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="national_id" className="text-morandi-text-primary">
              身份證字號
            </Label>
            <Input
              id="national_id"
              value={formData.national_id || ''}
              onChange={e => handleChange('national_id', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address" className="text-morandi-text-primary">
              地址
            </Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={e => handleChange('address', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="city" className="text-morandi-text-primary">
              城市
            </Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={e => handleChange('city', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="country" className="text-morandi-text-primary">
              國家
            </Label>
            <Input
              id="country"
              value={formData.country || ''}
              onChange={e => handleChange('country', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* 護照資訊 */}
      <div>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">護照資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="passport_romanization" className="text-morandi-text-primary">
              護照拼音（姓氏/名字）
            </Label>
            <Input
              id="passport_romanization"
              value={formData.passport_romanization || ''}
              onChange={e => handleChange('passport_romanization', e.target.value.toUpperCase())}
              disabled={!isEditing}
              placeholder="例如：WANG/XIAOMING"
              className="mt-1.5 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="passport_number" className="text-morandi-text-primary">
              護照號碼
            </Label>
            <Input
              id="passport_number"
              value={formData.passport_number || ''}
              onChange={e => handleChange('passport_number', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="passport_expiry_date" className="text-morandi-text-primary">
              護照效期
            </Label>
            <Input
              id="passport_expiry_date"
              type="date"
              value={formData.passport_expiry_date || ''}
              onChange={e => handleChange('passport_expiry_date', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* VIP 資訊 */}
      <div>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">VIP 資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="vip_level" className="text-morandi-text-primary">
              VIP 等級
            </Label>
            <select
              id="vip_level"
              value={formData.vip_level || ''}
              onChange={e => handleChange('vip_level', e.target.value)}
              disabled={!isEditing}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">非 VIP</option>
              <option value="bronze">銅卡</option>
              <option value="silver">銀卡</option>
              <option value="gold">金卡</option>
              <option value="platinum">白金卡</option>
            </select>
          </div>

          <div>
            <Label htmlFor="source" className="text-morandi-text-primary">
              客戶來源
            </Label>
            <Input
              id="source"
              value={formData.source || ''}
              onChange={e => handleChange('source', e.target.value)}
              disabled={!isEditing}
              placeholder="例如：網路廣告、朋友介紹"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-morandi-text-primary">總消費金額</Label>
            <div className="mt-1.5 h-10 flex items-center px-3 rounded-md bg-muted text-morandi-text-primary font-medium">
              NT$ {(customer.total_spent || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <Label className="text-morandi-text-primary">訂單數</Label>
            <div className="mt-1.5 h-10 flex items-center px-3 rounded-md bg-muted text-morandi-text-primary font-medium">
              {customer.total_orders || 0} 筆
            </div>
          </div>
        </div>
      </div>

      {/* 備註 */}
      <div>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">備註</h3>
        <Textarea
          value={formData.notes || ''}
          onChange={e => handleChange('notes', e.target.value)}
          disabled={!isEditing}
          rows={4}
          placeholder="輸入備註..."
        />
      </div>
    </div>
  )
}
