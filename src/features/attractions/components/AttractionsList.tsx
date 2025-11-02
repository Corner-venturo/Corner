import { MapPin, Trash2, Power, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { Attraction } from '../types'

// ============================================
// 景點列表組件（使用 EnhancedTable）
// ============================================

interface AttractionsListProps {
  loading: boolean
  sortedAttractions: Attraction[]
  countries: any[]
  cities: any[]
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
  onEdit,
  onToggleStatus,
  onDelete,
}: AttractionsListProps) {
  // 定義表格欄位
  const columns = [
    {
      key: 'image',
      label: '圖片',
      sortable: false,
      render: (_: any, attraction: Attraction) => (
        <div className="w-20">
          {(attraction.images && attraction.images.length > 0) || attraction.thumbnail ? (
            <img
              src={
                attraction.images && attraction.images.length > 0
                  ? attraction.images[0]
                  : attraction.thumbnail!
              }
              alt={attraction.name}
              className="w-20 h-14 object-cover rounded border border-border shadow-sm"
            />
          ) : (
            <div className="w-20 h-14 bg-morandi-container/30 rounded border border-border flex items-center justify-center">
              <MapPin size={16} className="text-morandi-muted opacity-40" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: '景點名稱',
      sortable: true,
      render: (_: any, attraction: Attraction) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-morandi-primary line-clamp-1">{attraction.name}</div>
          {attraction.name_en && (
            <div className="text-xs text-morandi-muted line-clamp-1">{attraction.name_en}</div>
          )}
        </div>
      ),
    },
    {
      key: 'city',
      label: '地點',
      sortable: true,
      render: (_: any, attraction: Attraction) => {
        const country = countries.find(c => c.id === attraction.country_id)
        const city = cities.find(c => c.id === attraction.city_id)
        return (
          <div className="text-sm text-morandi-secondary line-clamp-1">
            {country?.emoji} {city?.name || attraction.city_id}
          </div>
        )
      },
    },
    {
      key: 'category',
      label: '類別',
      sortable: true,
      render: (_: any, attraction: Attraction) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-morandi-blue/10 text-morandi-blue">
          {attraction.category || '-'}
        </span>
      ),
    },
    {
      key: 'description',
      label: '簡介',
      sortable: false,
      render: (_: any, attraction: Attraction) => (
        <div className="min-w-[200px] text-sm text-morandi-secondary">
          <p className="line-clamp-2 leading-relaxed">
            {attraction.description || '暫無簡介'}
          </p>
        </div>
      ),
    },
    {
      key: 'duration_minutes',
      label: '時長',
      sortable: true,
      render: (_: any, attraction: Attraction) => (
        <div className="text-center text-sm text-morandi-secondary">
          {attraction.duration_minutes ? `${Math.floor(attraction.duration_minutes / 60)}h` : '-'}
        </div>
      ),
    },
    {
      key: 'tags',
      label: '標籤',
      sortable: false,
      render: (_: any, attraction: Attraction) => (
        <div className="flex flex-wrap gap-1 min-w-[120px]">
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
      ),
    },
    {
      key: 'is_active',
      label: '狀態',
      sortable: true,
      render: (_: any, attraction: Attraction) => (
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
      ),
    },
  ]

  return (
    <EnhancedTable
      columns={columns}
      data={sortedAttractions}
      loading={loading}
      onRowClick={onEdit}
      initialPageSize={20}
      actions={(attraction: Attraction) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onEdit(attraction)
            }}
            className="h-8 px-2 text-morandi-blue hover:bg-morandi-blue/10"
            title="編輯"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onToggleStatus(attraction)
            }}
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
            onClick={e => {
              e.stopPropagation()
              onDelete(attraction.id)
            }}
            className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
            title="刪除"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    />
  )
}
