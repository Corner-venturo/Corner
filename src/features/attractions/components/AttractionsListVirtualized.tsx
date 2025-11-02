import { useRef, useCallback, useState } from 'react'
import { MapPin, Trash2, Power, Edit2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Attraction, SortField, SortDirection } from '../types'

// ============================================
// 虛擬滾動景點列表組件（處理大量資料）
// ============================================

interface AttractionsListVirtualizedProps {
  loading: boolean
  sortedAttractions: Attraction[]
  countries: any[]
  cities: any[]
  sortField: SortField | null
  sortDirection: SortDirection
  handleSort: (field: SortField) => void
  onEdit: (attraction: Attraction) => void
  onToggleStatus: (attraction: Attraction) => void
  onDelete: (id: string) => void
  onAddNew: () => void
}

const ITEMS_PER_PAGE = 20 // 每頁只顯示 20 筆

export function AttractionsListVirtualized({
  loading,
  sortedAttractions,
  countries,
  cities,
  sortField,
  sortDirection,
  handleSort,
  onEdit,
  onToggleStatus,
  onDelete,
  onAddNew,
}: AttractionsListVirtualizedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // 計算總頁數
  const totalPages = Math.ceil(sortedAttractions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedAttractions.length)
  const currentPageData = sortedAttractions.slice(startIndex, endIndex)

  // 分頁控制
  const goToPage = (page: number) => {
    setCurrentPage(page)
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }

  // 排序按鈕
  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-morandi-gold transition-colors"
    >
      {label}
      {sortField === field && sortDirection === 'asc' && <ArrowUp size={14} />}
      {sortField === field && sortDirection === 'desc' && <ArrowDown size={14} />}
      {sortField !== field && <ArrowUpDown size={14} className="opacity-30" />}
    </button>
  )

  // 取得國家名稱
  const getCountryName = (countryId: string) => {
    return countries.find(c => c.id === countryId || c.code === countryId)?.name || countryId
  }

  // 取得城市名稱
  const getCityName = (cityId: string) => {
    return cities.find(c => c.id === cityId)?.name || cityId
  }

  // 渲染景點項目（簡化版，移除虛擬滾動）
  const renderAttractionItem = (attraction: Attraction) => {
    return (
      <div key={attraction.id} className="border-b border-border hover:bg-morandi-container/20 transition-colors">
        {(
          <div className="flex items-center px-4 py-3 gap-3 hover:bg-morandi-container/20 transition-colors border-b border-border h-full">
            {/* 圖片 */}
            <div className="w-24 h-20 bg-morandi-container/30 rounded overflow-hidden flex-shrink-0">
              {attraction.thumbnail || (attraction.images && attraction.images.length > 0) ? (
                <img
                  src={attraction.thumbnail || attraction.images![0]}
                  alt={attraction.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin size={24} className="text-morandi-secondary opacity-50" />
                </div>
              )}
            </div>

            {/* 名稱 */}
            <div className="w-48">
              <p className="font-semibold text-morandi-primary truncate">{attraction.name}</p>
              {attraction.name_en && (
                <p className="text-xs text-morandi-secondary truncate">{attraction.name_en}</p>
              )}
            </div>

            {/* 地點 */}
            <div className="w-32">
              <p className="text-sm text-morandi-secondary truncate">
                {getCountryName(attraction.country_id)}
              </p>
              <p className="text-xs text-morandi-secondary/70 truncate">
                {getCityName(attraction.city_id)}
              </p>
            </div>

            {/* 類別 */}
            <div className="w-24 text-center">
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  attraction.category === '景點' && 'bg-blue-100 text-blue-700',
                  attraction.category === '餐廳' && 'bg-orange-100 text-orange-700',
                  attraction.category === '住宿' && 'bg-purple-100 text-purple-700',
                  attraction.category === '購物' && 'bg-pink-100 text-pink-700',
                  attraction.category === '交通' && 'bg-green-100 text-green-700'
                )}
              >
                {attraction.category || '未分類'}
              </span>
            </div>

            {/* 簡介 */}
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-morandi-secondary line-clamp-2">
                {attraction.description || '無簡介'}
              </p>
            </div>

            {/* 時長 */}
            <div className="w-20 text-center text-sm text-morandi-secondary">
              {attraction.duration_minutes ? `${attraction.duration_minutes}分` : '-'}
            </div>

            {/* 標籤 */}
            <div className="w-32">
              {attraction.tags && attraction.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {attraction.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-morandi-gold/10 text-morandi-gold text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {attraction.tags.length > 2 && (
                    <span className="text-xs text-morandi-secondary">+{attraction.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* 狀態 */}
            <div className="w-20 text-center">
              <button
                onClick={() => onToggleStatus(attraction)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-colors',
                  attraction.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {attraction.is_active ? '啟用' : '停用'}
              </button>
            </div>

            {/* 操作 */}
            <div className="w-32 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(attraction)}
                className="h-8 px-2"
              >
                <Edit2 size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleStatus(attraction)}
                className="h-8 px-2"
              >
                <Power size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(attraction.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm flex flex-col h-full">
      {/* 標題行 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20 backdrop-blur-sm">
        <div className="flex items-center px-4 py-3 gap-3">
          <div className="w-24 text-sm font-medium text-morandi-primary">圖片</div>
          <div className="w-48 text-sm font-medium text-morandi-primary">
            <SortButton field="name" label="景點名稱" />
          </div>
          <div className="w-32 text-sm font-medium text-morandi-primary">
            <SortButton field="city" label="地點" />
          </div>
          <div className="w-24 text-sm font-medium text-morandi-primary text-center">
            <SortButton field="category" label="類別" />
          </div>
          <div className="flex-1 min-w-[200px] text-sm font-medium text-morandi-primary">簡介</div>
          <div className="w-20 text-sm font-medium text-morandi-primary text-center">
            <SortButton field="duration" label="時長" />
          </div>
          <div className="w-32 text-sm font-medium text-morandi-primary">標籤</div>
          <div className="w-20 text-sm font-medium text-morandi-primary text-center">
            <SortButton field="status" label="狀態" />
          </div>
          <div className="w-32 text-sm font-medium text-morandi-primary text-center">操作</div>
        </div>
      </div>

      {/* 載入中 */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12 text-morandi-secondary">
            <MapPin size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
            <p>載入中...</p>
          </div>
        </div>
      )}

      {/* 無資料 */}
      {!loading && sortedAttractions.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12 text-morandi-secondary">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p>無符合條件的景點</p>
            <Button
              onClick={onAddNew}
              className="mt-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Plus size={16} className="mr-2" />
              新增景點
            </Button>
          </div>
        </div>
      )}

      {/* 虛擬滾動容器 */}
      {!loading && sortedAttractions.length > 0 && (
        <>
          {/* 分頁資訊 */}
          <div className="px-4 py-2 bg-morandi-container/20 border-b text-sm text-morandi-secondary flex items-center justify-between">
            <div>
              共 <span className="font-semibold text-morandi-gold">{sortedAttractions.length}</span> 筆景點
              （第 {startIndex + 1}-{endIndex} 筆）
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">
                第 {currentPage} / {totalPages} 頁
              </span>
            </div>
          </div>

          {/* 簡單列表（移除虛擬滾動） */}
          <div ref={containerRef} className="overflow-y-auto" style={{ maxHeight: '600px' }}>
            {currentPageData.map(attraction => renderAttractionItem(attraction))}
          </div>

          {/* 分頁控制 */}
          <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              上一頁
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }

                return (
                  <Button
                    key={i}
                    size="sm"
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    onClick={() => goToPage(pageNum)}
                    className={cn(
                      'w-8 h-8 p-0',
                      currentPage === pageNum && 'bg-morandi-gold hover:bg-morandi-gold/90'
                    )}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              下一頁
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
