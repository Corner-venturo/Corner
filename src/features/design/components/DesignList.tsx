'use client'

import Image from 'next/image'
import { MoreHorizontal, Trash2, Edit2, FileText, Copy, Image as ImageIcon } from 'lucide-react'
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
import { LABELS } from '../constants/labels'

interface DesignListProps {
  onEdit?: (design: Design) => void
  onDelete?: (design: Design) => void
  onDuplicate?: (design: Design) => void
}

/**
 * 設計列表組件
 */
export function DesignList({ onEdit, onDelete, onDuplicate }: DesignListProps) {
  const { designs, isLoading, error } = useDesigns()

  const columns: TableColumn<Design>[] = [
    {
      key: 'thumbnail',
      label: '',
      width: '60',
      render: (_, row) => (
        <div className="relative w-10 h-14 rounded overflow-hidden bg-morandi-container flex items-center justify-center">
          {row.thumbnail_url ? (
            <Image src={row.thumbnail_url} alt="" fill className="object-cover" />
          ) : (
            <ImageIcon size={16} className="text-morandi-muted" />
          )}
        </div>
      ),
    },
    {
      key: 'tour',
      label: LABELS.tourName,
      width: '250',
      render: (_, row) => (
        <span className="text-sm text-morandi-primary">
          {row.tour_name || `(${LABELS.noTourName})`}
        </span>
      ),
    },
    {
      key: 'design_type',
      label: LABELS.designType,
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
      label: LABELS.status,
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
          {row.status === 'completed' ? LABELS.completed : LABELS.draft}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: LABELS.createdDate,
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
              {LABELS.edit}
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(row)}>
                <Copy size={14} className="mr-2" />
                複製
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete?.(row)}
              className="text-morandi-red"
            >
              <Trash2 size={14} className="mr-2" />
              {LABELS.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-morandi-secondary">
        {LABELS.loading}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-red">
        <p>{LABELS.loadFailed}</p>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    )
  }

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
        <FileText size={48} className="mb-4 opacity-30" />
        <p>{LABELS.noDesigns}</p>
        <p className="text-sm">{LABELS.noDesignsHint1}「{LABELS.noDesignsHint2}」{LABELS.noDesignsHint3}</p>
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
