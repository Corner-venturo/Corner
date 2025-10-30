/**
 * Document Viewer - displays a single document in view mode
 */

'use client'

import { Button } from '@/components/ui/button'
import { Edit, Trash2, Star } from 'lucide-react'
import { RichTextViewer } from '@/components/workspace/RichTextEditor'
import { RichDocument } from '@/stores/workspace-store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DocumentViewerProps {
  document: RichDocument
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onBack: () => void
}

export function DocumentViewer({
  document,
  onEdit,
  onDelete,
  onToggleFavorite,
  onBack,
}: DocumentViewerProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-white">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← 返回
          </Button>
          <div className="flex items-center gap-2">
            <Star
              className={cn(
                'w-5 h-5 cursor-pointer',
                document.is_favorite
                  ? 'text-morandi-gold fill-morandi-gold'
                  : 'text-morandi-secondary'
              )}
              onClick={onToggleFavorite}
            />
            <span className="text-sm text-morandi-secondary">
              {document.created_at
                ? format(new Date(document.created_at), 'yyyy/MM/dd HH:mm')
                : '未知時間'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit size={16} className="mr-2" />
            編輯
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-morandi-red/10 hover:text-morandi-red"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <RichTextViewer title={document.title} content={document.content} />
      </div>
    </div>
  )
}
