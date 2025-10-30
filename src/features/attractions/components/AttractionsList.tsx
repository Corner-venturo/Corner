import { MapPin, Trash2, Power, Edit2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Attraction, SortField, SortDirection } from '../types'

// ============================================
// 景點列表組件
// ============================================

interface AttractionsListProps {
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

export function AttractionsList({
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
}: AttractionsListProps) {
  // 排序按鈕渲染
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

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-full flex flex-col">
      {/* 表格標題行 */}
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
          <div className="w-20 text-sm font-medium text-morandi-primary text-center">狀態</div>
          <div className="w-32 text-sm font-medium text-morandi-primary text-center">操作</div>
        </div>
      </div>

      {/* 載入中 */}
      {loading && (
        <div className="text-center py-12 text-morandi-secondary">
          <MapPin size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
          <p>載入中...</p>
        </div>
      )}

      {/* 無資料 */}
      {!loading && sortedAttractions.length === 0 && (
        <div className="text-center py-12 text-morandi-secondary">
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p>無符合條件的景點</p>
          <Button
            onClick={onAddNew}
            className="mt-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} className="mr-2" />
            新增第一個景點
          </Button>
        </div>
      )}

      {/* 景點列表 */}
      {!loading && sortedAttractions.length > 0 && (
        <div className="flex-1">
          {sortedAttractions.map(attraction => {
            const country = countries.find(c => c.id === attraction.country_id)
            const city = cities.find(c => c.id === attraction.city_id)

            return (
              <div
                key={attraction.id}
                className="border-b border-border last:border-b-0 hover:bg-morandi-container/20 transition-colors"
              >
                <div className="flex items-center px-4 py-3 gap-3">
                  {/* 圖片縮圖 */}
                  <div className="w-24">
                    {attraction.images && attraction.images.length > 0 ? (
                      <img
                        src={attraction.images[0]}
                        alt={attraction.name}
                        className="w-20 h-14 object-cover rounded border border-border shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-14 bg-morandi-container/30 rounded border border-border flex items-center justify-center">
                        <MapPin size={16} className="text-morandi-muted opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* 景點名稱 */}
                  <div className="w-48">
                    <div className="font-medium text-morandi-primary line-clamp-1">
                      {attraction.name}
                    </div>
                    {attraction.name_en && (
                      <div className="text-xs text-morandi-muted line-clamp-1">
                        {attraction.name_en}
                      </div>
                    )}
                  </div>

                  {/* 地點 */}
                  <div className="w-32 text-sm text-morandi-secondary line-clamp-1">
                    {country?.emoji} {city?.name || attraction.city_id}
                  </div>

                  {/* 類別 */}
                  <div className="w-24 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-morandi-blue/10 text-morandi-blue">
                      {attraction.category || '-'}
                    </span>
                  </div>

                  {/* 簡介 */}
                  <div className="flex-1 min-w-[200px] text-sm text-morandi-secondary">
                    <p className="line-clamp-2 leading-relaxed">
                      {attraction.description || '暫無簡介'}
                    </p>
                  </div>

                  {/* 時長 */}
                  <div className="w-20 text-center text-sm text-morandi-secondary">
                    {attraction.duration_minutes
                      ? `${Math.floor(attraction.duration_minutes / 60)}h`
                      : '-'}
                  </div>

                  {/* 標籤 */}
                  <div className="w-32 flex flex-wrap gap-1">
                    {attraction.tags?.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-morandi-container text-morandi-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                    {(attraction.tags?.length || 0) > 2 && (
                      <span className="text-xs text-morandi-muted">
                        +{(attraction.tags?.length || 0) - 2}
                      </span>
                    )}
                  </div>

                  {/* 狀態 */}
                  <div className="w-20 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        attraction.is_active
                          ? 'bg-morandi-green/80 text-white'
                          : 'bg-morandi-container text-morandi-secondary'
                      )}
                    >
                      {attraction.is_active ? '啟用' : '停用'}
                    </span>
                  </div>

                  {/* 操作 */}
                  <div className="w-32 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(attraction)}
                      className="h-8 px-2 text-morandi-blue hover:bg-morandi-blue/10"
                      title="編輯"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(attraction)}
                      className="h-8 px-2"
                      title={attraction.is_active ? '停用' : '啟用'}
                    >
                      <Power
                        size={14}
                        className={
                          attraction.is_active ? 'text-morandi-green' : 'text-morandi-secondary'
                        }
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(attraction.id)}
                      className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
                      title="刪除"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
