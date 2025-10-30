/**
 * Canvas List - displays available personal canvases
 */

'use client'

import { Button } from '@/components/ui/button'
import { FileText, Plus, Eye } from 'lucide-react'
import { PersonalCanvas as PersonalCanvasType } from '@/stores/workspace-store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CANVAS_LIMITS } from '../shared/constants'

interface CanvasListProps {
  canvases: PersonalCanvasType[]
  onSelectCanvas: (canvasId: string) => void
  onAddCanvas: () => void
}

export function CanvasList({ canvases, onSelectCanvas, onAddCanvas }: CanvasListProps) {
  const canAddMore = canvases.length < CANVAS_LIMITS.MAX_PERSONAL_CANVASES

  if (canvases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FileText className="w-16 h-16 text-morandi-secondary/50 mb-4" />
        <h3 className="text-lg font-medium text-morandi-primary mb-2">還沒有任何工作區</h3>
        <p className="text-morandi-secondary mb-4">建立您的第一個個人工作區來開始使用</p>
        <Button
          onClick={onAddCanvas}
          className="bg-morandi-gold hover:bg-morandi-gold/80 text-white"
        >
          <Plus size={16} className="mr-2" />
          建立工作區
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {canvases.map((canvas: PersonalCanvasType) => (
        <div
          key={canvas.id}
          className="morandi-card p-6 transition-all hover:shadow-md cursor-pointer"
          onClick={() => onSelectCanvas(canvas.id)}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-morandi-primary text-base">{canvas.title}</h3>
            <FileText className="w-5 h-5 text-morandi-secondary" />
          </div>
          <p className="text-sm text-morandi-secondary mb-4">工作區 #{canvas.canvas_number}</p>
          <div className="flex items-center justify-between text-xs text-morandi-secondary">
            <span>
              {canvas.updated_at ? format(new Date(canvas.updated_at), 'MM/dd') : '未知日期'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={e => {
                e.stopPropagation()
                onSelectCanvas(canvas.id)
              }}
            >
              <Eye size={12} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

interface CanvasListHeaderProps {
  canvasCount: number
  onAddCanvas: () => void
}

export function CanvasListHeader({ canvasCount, onAddCanvas }: CanvasListHeaderProps) {
  const canAddMore = canvasCount < CANVAS_LIMITS.MAX_PERSONAL_CANVASES

  return (
    <div className="flex items-center justify-between p-6 border-b border-border bg-white">
      <div>
        <h2 className="text-lg font-semibold text-morandi-primary">私人畫布</h2>
        <p className="text-sm text-morandi-secondary">選擇或創建您的個人工作區</p>
      </div>
      <Button
        onClick={onAddCanvas}
        disabled={!canAddMore}
        className={cn(
          'text-sm',
          !canAddMore
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-morandi-gold hover:bg-morandi-gold/80 text-white'
        )}
        title={
          !canAddMore
            ? `最多只能建立 ${CANVAS_LIMITS.MAX_PERSONAL_CANVASES} 個自訂工作區`
            : '新增自訂工作區'
        }
      >
        <Plus size={16} className="mr-2" />
        新增工作區 ({canvasCount}/{CANVAS_LIMITS.MAX_PERSONAL_CANVASES})
      </Button>
    </div>
  )
}
