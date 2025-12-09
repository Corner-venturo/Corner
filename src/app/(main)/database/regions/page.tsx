'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useMemo, useEffect } from 'react'
import { MapPin, Building2, Map, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'

interface Country {
  id: string
  name: string
  name_en: string
  code: string | null
  emoji: string | null
  has_regions: boolean | null
  display_order: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  [key: string]: unknown
}

interface Region {
  id: string
  country_id: string
  name: string
  name_en: string | null
  description: string | null
  display_order: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  [key: string]: unknown
}

interface City {
  id: string
  country_id: string
  region_id: string | null
  name: string
  name_en: string | null
  description: string | null
  timezone: string | null
  display_order: number | null
  is_active: boolean | null
  background_image_url: string | null
  background_image_url_2: string | null
  primary_image: number | null
  airport_code: string | null
  created_at: string | null
  updated_at: string | null
  [key: string]: unknown
}

export default function RegionsPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('countries')
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all')
  const [selectedRegionCountryFilter, setSelectedRegionCountryFilter] = useState('all')

  // 編輯城市對話框
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [editForm, setEditForm] = useState({
    background_image_url: '',
  })

  // 載入資料
  const fetchData = async () => {
    setLoading(true)

    const [countriesRes, regionsRes, citiesRes] = await Promise.all([
      supabase.from('countries').select('*').order('display_order'),
      supabase.from('regions').select('*').order('country_id').order('display_order'),
      supabase.from('cities').select('*').order('country_id').order('region_id').order('name'),
    ])

    if (countriesRes.error) logger.error('Error fetching countries:', countriesRes.error)
    if (regionsRes.error) logger.error('Error fetching regions:', regionsRes.error)
    if (citiesRes.error) logger.error('Error fetching cities:', citiesRes.error)

    if (countriesRes.data) setCountries(countriesRes.data)
    if (regionsRes.data) setRegions(regionsRes.data)
    if (citiesRes.data) setCities(citiesRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 開啟編輯對話框
  const handleEditCity = (city: City) => {
    setEditingCity(city)
    setEditForm({
      background_image_url: city.background_image_url || '',
    })
    setIsEditDialogOpen(true)
  }

  // 儲存編輯
  const handleSaveCity = async () => {
    if (!editingCity) return

    const { error } = await supabase
      .from('cities')
      .update({
        background_image_url: editForm.background_image_url || null,
      })
      .eq('id', editingCity.id)

    if (error) {
      logger.error('Error updating city:', error)
      toast.error('更新失敗')
      return
    }

    toast.success('更新成功')
    setIsEditDialogOpen(false)
    fetchData()
  }

  // 切換地區狀態
  const handleToggleRegionStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('regions')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      logger.error('Error updating region:', error)
      toast.error('更新失敗')
      return
    }

    toast.success('更新成功')
    fetchData()
  }

  // 刪除地區
  const handleDeleteRegion = async (id: string) => {
    const confirmed = await confirm('確定要刪除這個地區嗎？', {
      title: '刪除地區',
      type: 'warning',
    })
    if (!confirmed) return

    const { error } = await supabase.from('regions').delete().eq('id', id)

    if (error) {
      logger.error('Error deleting region:', error)
      toast.error('刪除失敗')
      return
    }

    toast.success('刪除成功')
    fetchData()
  }

  // 國家表格
  const countryColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'emoji',
        label: '',
        render: (value: unknown) => <span className="text-2xl">{(value as string) || '🌍'}</span>,
      },
      {
        key: 'name',
        label: '國家名稱',
        sortable: true,
        filterable: true,
        render: (value: unknown, row: unknown) => (
          <div>
            <div className="font-medium text-morandi-primary">{value as string}</div>
            <div className="text-xs text-morandi-secondary">{(row as Country).name_en}</div>
          </div>
        ),
      },
      {
        key: 'code',
        label: '代碼',
        sortable: true,
      },
      {
        key: 'has_regions',
        label: '有地區分類',
        render: (value: unknown) => (
          <span className={value ? 'text-green-600' : 'text-gray-400'}>
            {value ? '是' : '否'}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: '狀態',
        render: (value: unknown) => (
          <span className={value ? 'text-green-600' : 'text-gray-400'}>
            {value ? '啟用' : '停用'}
          </span>
        ),
      },
    ],
    []
  )

  // 地區表格
  const regionColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'country_id',
        label: '國家',
        render: (value: unknown) => {
          const country = countries.find(c => c.id === value)
          return <span>{country?.emoji} {country?.name || (value as string)}</span>
        },
      },
      {
        key: 'name',
        label: '地區名稱',
        sortable: true,
        filterable: true,
        render: (value: unknown, row: unknown) => (
          <div>
            <div className="font-medium text-morandi-primary">{value as string}</div>
            <div className="text-xs text-morandi-secondary">{(row as Region).name_en}</div>
          </div>
        ),
      },
      {
        key: 'description',
        label: '描述',
        render: (value: unknown) => (
          <span className="text-sm text-morandi-secondary truncate max-w-xs block">
            {(value as string) || '-'}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: '狀態',
        render: (value: unknown) => (
          <span className={value ? 'text-green-600' : 'text-gray-400'}>
            {value ? '啟用' : '停用'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        render: (_value: unknown, row: unknown) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleRegionStatus((row as Region).id, (row as Region).is_active ?? false)}
              className="h-8 px-2 text-xs"
            >
              {(row as Region).is_active ? '停用' : '啟用'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteRegion((row as Region).id)}
              className="h-8 px-2 text-xs text-red-500 hover:text-red-600"
            >
              刪除
            </Button>
          </div>
        ),
      },
    ],
    [countries]
  )

  // 篩選地區資料
  const filteredRegions = useMemo(() => {
    if (!selectedRegionCountryFilter || selectedRegionCountryFilter === 'all') return regions
    return regions.filter(region => region.country_id === selectedRegionCountryFilter)
  }, [regions, selectedRegionCountryFilter])

  // 篩選城市資料
  const filteredCities = useMemo(() => {
    if (!selectedCountryFilter || selectedCountryFilter === 'all') return cities
    return cities.filter(city => city.country_id === selectedCountryFilter)
  }, [cities, selectedCountryFilter])

  // 城市表格
  const cityColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'country_id',
        label: '國家',
        render: (value: unknown) => {
          const country = countries.find(c => c.id === value)
          return <span>{country?.emoji} {country?.name || (value as string)}</span>
        },
      },
      {
        key: 'region_id',
        label: '地區',
        render: (value: unknown) => {
          if (!value) return <span className="text-gray-400">-</span>
          const region = regions.find(r => r.id === value)
          return <span>{region?.name || (value as string)}</span>
        },
      },
      {
        key: 'name',
        label: '城市名稱',
        sortable: true,
        filterable: true,
        render: (value: unknown, row: unknown) => (
          <div>
            <div className="font-medium text-morandi-primary">{value as string}</div>
            <div className="text-xs text-morandi-secondary">{(row as City).name_en}</div>
          </div>
        ),
      },
      {
        key: 'background_image_url',
        label: '封面圖',
        render: (value: unknown) => {
          if (!value) {
            return <span className="text-xs text-gray-400">未設定</span>
          }
          return (
            <img
              src={value as string}
              alt="封面圖"
              className="w-16 h-10 object-cover rounded"
              onError={(e) => {
                e.currentTarget.src = ''
                e.currentTarget.alt = '圖片載入失敗'
              }}
            />
          )
        },
      },
      {
        key: 'is_active',
        label: '狀態',
        render: (value: unknown) => (
          <span className={value ? 'text-green-600' : 'text-gray-400'}>
            {value ? '啟用' : '停用'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        render: (_value: unknown, row: unknown) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCity(row as City)}
            className="h-8 w-8 p-0"
          >
            <Edit size={16} />
          </Button>
        ),
      },
    ],
    [countries, regions]
  )

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="地區管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '地區管理', href: '/database/regions' },
        ]}
        tabs={[
          { value: 'countries', label: '國家', icon: Building2 },
          { value: 'regions', label: '地區', icon: Map },
          { value: 'cities', label: '城市', icon: MapPin },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={
          activeTab === 'cities' ? (
            <Select value={selectedCountryFilter} onValueChange={setSelectedCountryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="所有國家" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有國家</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.emoji} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : activeTab === 'regions' ? (
            <Select value={selectedRegionCountryFilter} onValueChange={setSelectedRegionCountryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="所有國家" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有國家</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.emoji} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto">
        {activeTab === 'countries' && (
          <EnhancedTable
            columns={countryColumns}
            data={countries}
            isLoading={loading}
            emptyMessage="尚無國家資料"
          />
        )}
        {activeTab === 'regions' && (
          <EnhancedTable
            columns={regionColumns}
            data={filteredRegions}
            isLoading={loading}
            emptyMessage="尚無地區資料"
          />
        )}
        {activeTab === 'cities' && (
          <EnhancedTable
            columns={cityColumns}
            data={filteredCities}
            isLoading={loading}
            emptyMessage="尚無城市資料"
          />
        )}
      </div>

      {/* 編輯城市對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯城市 - {editingCity?.name}</DialogTitle>
          </DialogHeader>

          {editingCity && (
            <div className="space-y-6">
              {/* 封面圖 */}
              <div>
                <Label>封面圖 URL</Label>
                <Input
                  value={editForm.background_image_url}
                  onChange={e => setEditForm({ ...editForm, background_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
                <p className="text-xs text-morandi-secondary mt-1">
                  建立行程時會自動使用此封面圖
                </p>
                {editForm.background_image_url && (
                  <div className="mt-2">
                    <img
                      src={editForm.background_image_url}
                      alt="預覽"
                      className="w-full h-40 object-cover rounded"
                      onError={e => {
                        e.currentTarget.src = ''
                        e.currentTarget.alt = '圖片載入失敗'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveCity}>儲存</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
