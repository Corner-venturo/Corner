'use client'

import React, { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, Map, X } from 'lucide-react'
import { TourCountry } from '../tour-form/types'
import { Attraction } from '@/features/attractions/types'
import { AttractionSearchBar } from './AttractionSearchBar'
import { AttractionList } from './AttractionList'
import { useAttractionSearch } from './hooks/useAttractionSearch'

// 使用 Next.js dynamic import 並禁用 SSR
const AttractionsMap = dynamic(
  () => import('@/features/attractions/components/AttractionsMap').then((mod) => mod.AttractionsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    ),
  }
)

// 擴展型別（加入 join 查詢的欄位）
interface AttractionWithCity extends Attraction {
  city_name?: string
  region_name?: string
}

interface AttractionSelectorProps {
  isOpen: boolean
  onClose: () => void
  tourCountries?: TourCountry[] // 用於預設選擇第一個國家（舊版）
  tourCountryName?: string // 行程的國家名稱（新版，來自 CoverInfo）
  onSelect: (attractions: AttractionWithCity[]) => void
  dayTitle?: string // 當天的行程標題，用於智能建議
  existingIds?: string[] // 已選過的景點 ID（顯示鎖定狀態）
}

export function AttractionSelector({
  isOpen,
  onClose,
  tourCountries = [],
  tourCountryName = '',
  onSelect,
  dayTitle = '',
  existingIds = [],
}: AttractionSelectorProps) {
  // 已選過的景點 ID Set（用於快速查找）
  const existingIdsSet = useMemo(() => new Set(existingIds), [existingIds])

  // 使用自定義 Hook 管理搜尋邏輯
  const {
    selectedCountryId,
    selectedCityId,
    searchQuery,
    attractions,
    suggestedAttractions,
    loading,
    cities,
    countries,
    handleCountryChange,
    handleCityChange,
    setSearchQuery,
  } = useAttractionSearch({
    isOpen,
    tourCountryName,
    dayTitle,
  })

  // 選擇狀態
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 手動新增景點
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualAttractionName, setManualAttractionName] = useState('')

  // 地圖相關狀態
  const [selectedMapAttraction, setSelectedMapAttraction] = useState<AttractionWithCity | null>(null)
  const [showMap, setShowMap] = useState(false)

  // 打開對話框時只清空勾選
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set())
      setSelectedMapAttraction(null)
      setShowMap(false)
    }
  }, [isOpen])

  // 切換選擇
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  // 點擊景點查看地圖
  const handleViewOnMap = (attraction: AttractionWithCity) => {
    setSelectedMapAttraction(attraction)
    setShowMap(true)
  }

  // 確認選擇
  const handleConfirm = () => {
    const selected = attractions.filter(a => selectedIds.has(a.id))
    onSelect(selected)
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  // 取消
  const handleCancel = () => {
    setSelectedIds(new Set())
    setSearchQuery('')
    setShowManualInput(false)
    setManualAttractionName('')
    setSelectedMapAttraction(null)
    setShowMap(false)
    onClose()
  }

  // 手動新增景點
  const handleManualAdd = () => {
    if (!manualAttractionName.trim()) return

    // 創建一個臨時的景點物件
    const manualAttraction: AttractionWithCity = {
      id: `manual_${Date.now()}`,
      name: manualAttractionName.trim(),
      name_en: undefined,
      category: undefined,
      description: undefined,
      thumbnail: undefined,
      images: undefined,
      country_id: selectedCountryId || '',
      region_id: undefined,
      city_id: selectedCityId || '',
      city_name: cities.find(c => c.id === selectedCityId)?.name || '',
      is_active: true,
      display_order: 0,
      created_at: '',
      updated_at: '',
    }

    onSelect([manualAttraction])
    setManualAttractionName('')
    setShowManualInput(false)
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="w-[1200px] h-[700px] max-w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-morandi-gold/10 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="text-morandi-gold" size={22} />
            選擇景點
          </DialogTitle>
        </DialogHeader>

        {/* 主要內容：左右分欄 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左側：景點列表 */}
          <div className="w-1/2 flex flex-col border-r border-border">
            <AttractionSearchBar
              countries={countries}
              cities={cities}
              selectedCountryId={selectedCountryId}
              selectedCityId={selectedCityId}
              searchQuery={searchQuery}
              showManualInput={showManualInput}
              manualAttractionName={manualAttractionName}
              onCountryChange={handleCountryChange}
              onCityChange={handleCityChange}
              onSearchChange={setSearchQuery}
              onToggleManualInput={() => setShowManualInput(!showManualInput)}
              onManualAttractionChange={setManualAttractionName}
              onManualAdd={handleManualAdd}
            />

            {/* 景點列表 */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <AttractionList
                attractions={attractions}
                suggestedAttractions={suggestedAttractions}
                selectedIds={selectedIds}
                existingIds={existingIdsSet}
                loading={loading}
                selectedCountryId={selectedCountryId}
                searchQuery={searchQuery}
                onToggleSelection={toggleSelection}
                onViewOnMap={handleViewOnMap}
                selectedMapAttractionId={selectedMapAttraction?.id}
              />
            </div>

            {/* 已選擇提示 */}
            {selectedIds.size > 0 && (
              <div className="px-4 pb-4">
                <div className="text-sm text-morandi-primary bg-morandi-gold/10 px-3 py-2 rounded-lg border border-morandi-gold/20 flex items-center gap-2">
                  <div className="w-5 h-5 bg-morandi-gold rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {selectedIds.size}
                  </div>
                  已選擇 {selectedIds.size} 個景點
                </div>
              </div>
            )}
          </div>

          {/* 右側：地圖區域 */}
          <div className="w-1/2 flex flex-col bg-slate-50">
            {!showMap ? (
              // 初始提示畫面
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <Map size={56} className="mb-4 opacity-30" />
                <p className="text-lg font-medium text-slate-500">查看附近景點</p>
                <p className="text-sm mt-2 text-center max-w-xs">
                  點擊景點右側的 <Map size={14} className="inline mx-1" /> 按鈕，即可在地圖上查看該景點周圍 5 公里內的其他景點
                </p>
              </div>
            ) : (
              // 地圖區域
              <>
                {/* 地圖標題 */}
                <div className="px-4 py-3 bg-white border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-red-500" />
                    <span className="font-medium text-morandi-primary">{selectedMapAttraction?.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowMap(false)
                      setSelectedMapAttraction(null)
                    }}
                    className="h-7 px-2"
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* 地圖 */}
                <div className="flex-1 relative min-h-[400px]">
                  <AttractionsMap
                    attractions={attractions as Attraction[]}
                    selectedAttraction={selectedMapAttraction as Attraction}
                    radiusKm={5}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-gray-50/50">
          <Button variant="outline" onClick={handleCancel} className="rounded-xl">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-xl min-w-[120px]"
          >
            確認新增 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
