/**
 * FleetList - 車隊列表
 */

'use client'

import React from 'react'
import { EnhancedTable, type TableColumn } from '@/components/ui/enhanced-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { FleetVehicle, VehicleType, VehicleStatus } from '@/types/fleet.types'
import { getVehicleTypeLabel } from '@/types/fleet.types'

interface FleetListProps {
  items: FleetVehicle[]
  loading?: boolean
  onEdit?: (item: FleetVehicle) => void
  onDelete?: (item: FleetVehicle) => void
}

const STATUS_CONFIG: Record<VehicleStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: '可用', variant: 'default' },
  maintenance: { label: '維修中', variant: 'outline' },
  retired: { label: '已退役', variant: 'secondary' },
}

const VEHICLE_TYPE_ICONS: Record<VehicleType, string> = {
  large_bus: '🚌',
  medium_bus: '🚐',
  mini_bus: '🚐',
  van: '🚙',
  car: '🚗',
}

export const FleetList: React.FC<FleetListProps> = ({
  items,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const columns: TableColumn[] = [
    {
      key: 'license_plate',
      label: '車牌號碼',
      sortable: true,
      render: (value, row) => {
        const item = row as FleetVehicle
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{VEHICLE_TYPE_ICONS[item.vehicle_type] || '🚌'}</span>
            <span className="font-mono font-medium text-morandi-primary">{String(value || '-')}</span>
          </div>
        )
      },
    },
    {
      key: 'vehicle_name',
      label: '車輛名稱',
      sortable: true,
      render: value => (
        <span className="text-morandi-primary">{String(value || '-')}</span>
      ),
    },
    {
      key: 'vehicle_type',
      label: '車型',
      sortable: true,
      render: (value, row) => {
        const item = row as FleetVehicle
        return <span className="text-morandi-primary">{getVehicleTypeLabel(item.vehicle_type)}</span>
      },
    },
    {
      key: 'capacity',
      label: '座位數',
      sortable: true,
      render: value => (
        <span className="text-morandi-primary">{value ? `${value} 人` : '-'}</span>
      ),
    },
    {
      key: 'driver_name',
      label: '司機',
      sortable: true,
      render: (value, row) => {
        const item = row as FleetVehicle
        if (!value) return <span className="text-morandi-muted">-</span>
        return (
          <div>
            <span className="font-medium text-morandi-primary">{String(value)}</span>
            {item.driver_phone && (
              <div className="text-xs text-morandi-secondary">{item.driver_phone}</div>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: value => {
        const status = (value || 'available') as VehicleStatus
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.available
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
  ]

  return (
    <EnhancedTable
      className="min-h-full"
      columns={columns}
      data={items}
      loading={loading}
      actions={row => {
        const item = row as FleetVehicle
        return (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={e => {
                  e.stopPropagation()
                  onEdit(item)
                }}
                className="text-morandi-blue hover:bg-morandi-blue/10"
                title="編輯"
              >
                <Pencil size={16} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={e => {
                  e.stopPropagation()
                  onDelete(item)
                }}
                className="text-morandi-red hover:bg-morandi-red/10"
                title="刪除"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )
      }}
    />
  )
}
