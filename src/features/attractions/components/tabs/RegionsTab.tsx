'use client'

import { useState, useMemo, useEffect } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface Country {
  id: string
  name: string
  name_en: string
  code: string | null
  has_regions: boolean | null
  display_order: number | null
  is_active: boolean | null
}

interface Region {
  id: string
  country_id: string
  name: string
  name_en: string | null
  description: string | null
  display_order: number | null
  is_active: boolean | null
}

interface City {
  id: string
  country_id: string
  region_id: string | null
  name: string
  name_en: string | null
  is_active: boolean | null
  is_major: boolean | null
}

export default function RegionsTab() {
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  // 城市管理視窗
  const [isCitiesDialogOpen, setIsCitiesDialogOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)

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

    if (countriesRes.data) setCountries(countriesRes.data as Country[])
    if (regionsRes.data) setRegions(regionsRes.data as Region[])
    if (citiesRes.data) setCities(citiesRes.data as City[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 開啟城市管理視窗
  const handleOpenCitiesDialog = (country: Country) => {
    setSelectedCountry(country)
    setIsCitiesDialogOpen(true)
  }

  // 切換城市主要狀態
  const handleToggleMajor = async (cityId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('cities')
      .update({ is_major: !currentStatus })
      .eq('id', cityId)

    if (error) {
      logger.error('Error updating city:', error)
      toast.error('更新失敗')
      return
    }

    setCities(prev => prev.map(c => (c.id === cityId ? { ...c, is_major: !currentStatus } : c)))
  }

  // 取得選中國家的城市
  const countryCities = useMemo(() => {
    if (!selectedCountry) return []
    return cities.filter(c => c.country_id === selectedCountry.id)
  }, [cities, selectedCountry])

  // 按地區分組城市
  const citiesByRegion = useMemo(() => {
    const grouped: Record<string, City[]> = { '': [] }
    countryCities.forEach(city => {
      const regionId = city.region_id || ''
      if (!grouped[regionId]) grouped[regionId] = []
      grouped[regionId].push(city)
    })
    return grouped
  }, [countryCities])

  // 取得地區名稱
  const getRegionName = (regionId: string) => {
    if (!regionId) return '未分類'
    const region = regions.find(r => r.id === regionId)
    return region?.name || regionId
  }

  // 國家表格欄位
  const countryColumns: TableColumn<Country>[] = useMemo(
    () => [
      {
        key: 'name',
        label: '國家名稱',
        sortable: true,
        filterable: true,
        render: (_value, row) => (
          <div>
            <div className="font-medium text-foreground">{row.name}</div>
            <div className="text-xs text-muted-foreground">{row.name_en}</div>
          </div>
        ),
      },
      {
        key: 'code',
        label: '代碼',
        render: (_value, row) => <span className="text-sm font-mono">{row.code || '-'}</span>,
      },
      {
        key: 'has_regions',
        label: '有地區',
        render: (_value, row) => (
          <span className={row.has_regions ? 'text-status-success' : 'text-muted-foreground'}>
            {row.has_regions ? '是' : '否'}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: '狀態',
        render: (_value, row) => (
          <span className={row.is_active ? 'text-status-success' : 'text-muted-foreground'}>
            {row.is_active ? '啟用' : '停用'}
          </span>
        ),
      },
      {
        key: 'id',
        label: '城市',
        render: (_value, row) => {
          const cityCount = cities.filter(c => c.country_id === row.id).length
          const majorCount = cities.filter(c => c.country_id === row.id && c.is_major).length
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenCitiesDialog(row)}
              className="h-8 px-3 text-xs"
            >
              {cityCount} 城市
              {majorCount > 0 && <span className="ml-1 text-morandi-gold">({majorCount} 主要)</span>}
            </Button>
          )
        },
      },
    ],
    [cities]
  )

  return (
    <div className="h-full flex flex-col">
      {/* 表格內容 */}
      <div className="flex-1 overflow-auto">
        <EnhancedTable<Country>
          columns={countryColumns}
          data={countries}
          isLoading={loading}
          emptyMessage="尚無國家資料"
        />
      </div>

      {/* 城市管理視窗 */}
      <Dialog open={isCitiesDialogOpen} onOpenChange={setIsCitiesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCountry?.name} - 主要城市設定</DialogTitle>
          </DialogHeader>

          {countryCities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">此國家尚無城市資料</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(citiesByRegion).map(([regionId, regionCities]) => (
                <div key={regionId || 'no-region'}>
                  <div className="text-sm font-medium text-muted-foreground mb-2 pb-1 border-b">
                    {getRegionName(regionId)} ({regionCities.length})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {regionCities.map(city => (
                      <label
                        key={city.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={city.is_major ?? false}
                          onCheckedChange={() => handleToggleMajor(city.id, city.is_major ?? false)}
                        />
                        <span className="text-sm">{city.name}</span>
                        {city.is_major && (
                          <Star size={12} className="text-morandi-gold fill-morandi-gold ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              已選 {countryCities.filter(c => c.is_major).length} 個主要城市
            </div>
            <Button onClick={() => setIsCitiesDialogOpen(false)}>完成</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
