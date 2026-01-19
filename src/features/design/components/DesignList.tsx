'use client'

import { MoreHorizontal, Trash2, Edit2, FileText } from 'lucide-react'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { DateCell } from '@/components/table-cells'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDesigns } from '../hooks/useDesigns'
import { DESIGN_TYPE_CONFIG, type Design, type DesignType } from '../types'
import { cn } from '@/lib/utils'

interface DesignListProps {
  onEdit?: (design: Design) => void
  onDelete?: (design: Design) => void
}

/**
 * 設計列表組件
 */
export function DesignList({ onEdit, onDelete }: DesignListProps) {
  const { designs, isLoading, error } = useDesigns()

  const columns: TableColumn<Design>[] = [
    {
      key: 'tour',
      label: '團名',
      width: '250',
      render: (_, row) => (
        <span className="text-sm text-morandi-primary">
          {row.tour_name || '(無團名)'}
        </span>
      ),
    },
    {
      key: 'design_type',
      label: '設計類型',
      width: '120',
      render: (_, row) => {
        const config = DESIGN_TYPE_CONFIG[row.design_type as DesignType]
        return (
          <span className="text-sm text-morandi-primary">
            {config?.label || row.design_type}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: '狀態',
      width: '80',
      render: (_, row) => (
        <span
          className={cn(
            'text-xs px-2 py-1 rounded-full',
            row.status === 'completed'
              ? 'bg-morandi-green/10 text-morandi-green'
              : 'bg-morandi-muted/10 text-morandi-secondary'
          )}
        >
          {row.status === 'completed' ? '已完成' : '草稿'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '建立日期',
      width: '120',
      render: (_, row) => <DateCell date={row.created_at} />,
    },
    {
      key: 'actions',
      label: '',
      width: '50',
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(row)}>
              <Edit2 size={14} className="mr-2" />
              編輯
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(row)}
              className="text-morandi-red"
            >
              <Trash2 size={14} className="mr-2" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-morandi-secondary">
        載入中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-red">
        <p>載入失敗</p>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    )
  }

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
        <FileText size={48} className="mb-4 opacity-30" />
        <p>尚無設計</p>
        <p className="text-sm">點擊右上角「新增設計」開始</p>
      </div>
    )
  }

  return (
    <EnhancedTable
      columns={columns}
      data={designs}
      className="min-h-full"
    />
  )
}
