'use client'

import { useState, useMemo, useEffect } from 'react'
import { Bus, Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { confirm } from '@/lib/ui/alert-dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface TransportationRate {
  id: string
  country_id: string
  country_name: string
  vehicle_type: string
  price: number
  currency: string
  unit: string
  notes: string | null
  is_active: boolean
  display_order: number
}

interface Country {
  id: string
  name: string
  code: string
}

const CURRENCIES = [
  { value: 'TWD', label: 'TWD (台幣)' },
  { value: 'JPY', label: 'JPY (日圓)' },
  { value: 'USD', label: 'USD (美金)' },
  { value: 'EUR', label: 'EUR (歐元)' },
  { value: 'THB', label: 'THB (泰銖)' },
  { value: 'KRW', label: 'KRW (韓圜)' },
]

const UNITS = [
  { value: 'day', label: '天' },
  { value: 'trip', label: '趟' },
  { value: 'km', label: '公里' },
]

export default function TransportationRatesPage() {
  const { user } = useAuthStore()
  const [rates, setRates] = useState<TransportationRate[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<TransportationRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    country_id: '',
    country_name: '',
    vehicle_type: '',
    price: 0,
    currency: 'TWD',
    unit: 'day',
    notes: '',
  })

  // 載入國家資料
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order')

      if (error) {
        console.error('Error fetching countries:', error)
        toast.error('載入國家資料失敗')
        return
      }

      setCountries(data || [])
    }

    fetchCountries()
  }, [])

  // 載入車資資料
  const fetchRates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transportation_rates')
      .select('*')
      .order('country_name')
      .order('display_order')

    if (error) {
      console.error('Error fetching rates:', error)
      toast.error('載入車資資料失敗')
      setLoading(false)
      return
    }

    setRates(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRates()
  }, [])

  // 表格欄位定義
  const columns: TableColumn[] = useMemo(
    () => [
      {
        key: 'country_name',
        label: '國家',
        sortable: true,
        filterable: true,
        render: value => (
          <div className="flex items-center">
            <Bus size={16} className="mr-2 text-morandi-gold" />
            <span className="font-medium text-morandi-primary">{value}</span>
          </div>
        ),
      },
      {
        key: 'vehicle_type',
        label: '車款類型',
        sortable: true,
        filterable: true,
      },
      {
        key: 'price',
        label: '參考價格',
        sortable: true,
        render: (value, row: TransportationRate) => (
          <span className="font-medium">
            {value.toLocaleString()} {row.currency}
          </span>
        ),
      },
      {
        key: 'unit',
        label: '計價單位',
        render: value => {
          const unitLabel = UNITS.find(u => u.value === value)?.label || value
          return <span className="text-sm text-morandi-secondary">/ {unitLabel}</span>
        },
      },
      {
        key: 'notes',
        label: '注意事項',
        render: value => (
          <span className="text-sm text-morandi-secondary truncate max-w-xs block">
            {value || '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        render: (_value, row: TransportationRate) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
              className="h-8 w-8 p-0"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const handleAdd = () => {
    setEditingRate(null)
    setFormData({
      country_id: '',
      country_name: '',
      vehicle_type: '',
      price: 0,
      currency: 'TWD',
      unit: 'day',
      notes: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (rate: TransportationRate) => {
    setEditingRate(rate)
    setFormData({
      country_id: rate.country_id,
      country_name: rate.country_name,
      vehicle_type: rate.vehicle_type,
      price: rate.price,
      currency: rate.currency,
      unit: rate.unit,
      notes: rate.notes || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這筆車資資料嗎？')) return

    const { error } = await supabase.from('transportation_rates').delete().eq('id', id)

    if (error) {
      console.error('Error deleting rate:', error)
      toast.error('刪除失敗')
      return
    }

    toast.success('刪除成功')
    fetchRates()
  }

  const handleSave = async () => {
    if (!formData.country_id || !formData.vehicle_type || formData.price < 0) {
      toast.error('請填寫完整資料')
      return
    }

    const saveData = {
      ...formData,
      workspace_id: user?.workspace_id || null,
    }

    if (editingRate) {
      // 更新
      const { error } = await supabase
        .from('transportation_rates')
        .update(saveData)
        .eq('id', editingRate.id)

      if (error) {
        console.error('Error updating rate:', error)
        toast.error('更新失敗')
        return
      }

      toast.success('更新成功')
    } else {
      // 新增
      const { error } = await supabase.from('transportation_rates').insert(saveData)

      if (error) {
        console.error('Error creating rate:', error)
        toast.error('新增失敗')
        return
      }

      toast.success('新增成功')
    }

    setIsDialogOpen(false)
    fetchRates()
  }

  const handleCountryChange = (countryId: string) => {
    const country = countries.find(c => c.id === countryId)
    setFormData({
      ...formData,
      country_id: countryId,
      country_name: country?.name || '',
    })
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader title="車資管理" onAdd={handleAdd} addLabel="新增車資" />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          columns={columns}
          data={rates}
          isLoading={loading}
          emptyMessage="尚無車資資料"
        />
      </div>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRate ? '編輯車資' : '新增車資'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>國家 *</Label>
                <Select value={formData.country_id} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇國家" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>車款類型 *</Label>
                <Input
                  value={formData.vehicle_type}
                  onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="例：45座遊覽車"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>參考價格 *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>幣別</Label>
                <Select value={formData.currency} onValueChange={value => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>計價單位</Label>
                <Select value={formData.unit} onValueChange={value => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>注意事項</Label>
              <Textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="例：含司機導遊小費、過路費另計..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingRate ? '更新' : '新增'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
