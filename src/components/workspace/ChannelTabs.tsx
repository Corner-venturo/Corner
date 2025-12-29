'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Plus, FileText, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { prompt, confirm } from '@/lib/ui/alert-dialog'
import { CanvasEditor } from './CanvasEditor'
import { Channel } from '@/stores/workspace-store'

interface Canvas {
  id: string
  name: string
  createdAt: number
}

interface ChannelTabsProps {
  channel: Channel
  children: React.ReactNode // 對話內容
  headerActions?: React.ReactNode // 右上角操作按鈕（選填）
}

export function ChannelTabs({ channel, children, headerActions }: ChannelTabsProps) {
  const [activeTab, setActiveTab] = useState<'chat' | string>('chat') // 'chat' 或 canvas id
  const [canvases, setCanvases] = useState<Canvas[]>([])

  // 載入畫布列表
  useEffect(() => {
    const stored = localStorage.getItem(`canvases-${channel.id}`)
    if (stored) {
      try {
        setCanvases(JSON.parse(stored))
      } catch {
        setCanvases([])
      }
    }
  }, [channel.id])

  // 儲存畫布列表
  const saveCanvases = useCallback(
    (newCanvases: Canvas[]) => {
      setCanvases(newCanvases)
      localStorage.setItem(`canvases-${channel.id}`, JSON.stringify(newCanvases))
    },
    [channel.id]
  )

  // 新增畫布
  const handleAddCanvas = async () => {
    const name = await prompt('請輸入畫布名稱', {
      title: '新增畫布',
      placeholder: '輸入名稱...',
    })
    if (!name || !name.trim()) return

    const newCanvas: Canvas = {
      id: `canvas-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
    }
    const newCanvases = [...canvases, newCanvas]
    saveCanvases(newCanvases)
    setActiveTab(newCanvas.id)
  }

  // 刪除畫布
  const handleDeleteCanvas = async (canvasId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const canvas = canvases.find(c => c.id === canvasId)
    if (!canvas) return

    const confirmed = await confirm(`確定要刪除畫布「${canvas.name}」嗎？`, {
      title: '刪除畫布',
      type: 'warning',
    })
    if (!confirmed) return

    const newCanvases = canvases.filter(c => c.id !== canvasId)
    saveCanvases(newCanvases)

    // 刪除畫布內容
    localStorage.removeItem(`canvas-${channel.id}-${canvasId}`)

    // 如果刪除的是當前顯示的畫布，切換到對話
    if (activeTab === canvasId) {
      setActiveTab('chat')
    }
  }

  const activeCanvas = canvases.find(c => c.id === activeTab)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 分頁標籤 - 高度對齊 logo 分割線 (72px - 16px padding = 56px) */}
      <div className="h-[56px] border-b border-border bg-white px-6 flex items-center shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1 items-center">
            {/* 對話 Tab */}
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                'flex items-center gap-2 px-4 h-[56px] text-sm font-medium transition-colors relative',
                activeTab === 'chat'
                  ? 'text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
            >
              <MessageSquare size={16} />
              <span>對話</span>
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-morandi-gold transition-all"></div>
              )}
            </button>

            {/* 畫布 Tabs */}
            {canvases.map(canvas => (
              <button
                key={canvas.id}
                onClick={() => setActiveTab(canvas.id)}
                className={cn(
                  'group flex items-center gap-2 px-4 h-[56px] text-sm font-medium transition-colors relative',
                  activeTab === canvas.id
                    ? 'text-morandi-primary'
                    : 'text-morandi-secondary hover:text-morandi-primary'
                )}
              >
                <FileText size={16} />
                <span className="max-w-[100px] truncate">{canvas.name}</span>
                <button
                  onClick={e => handleDeleteCanvas(canvas.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-status-danger-bg rounded transition-opacity"
                  title="刪除畫布"
                >
                  <Trash2 size={12} className="text-status-danger" />
                </button>
                {activeTab === canvas.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-morandi-gold transition-all"></div>
                )}
              </button>
            ))}

            {/* 新增畫布按鈕 */}
            <button
              onClick={handleAddCanvas}
              className="flex items-center justify-center w-8 h-8 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/10 rounded transition-colors"
              title="新增畫布"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* 右側操作按鈕 */}
          <div className="flex items-center gap-1">{headerActions}</div>
        </div>
      </div>

      {/* 分頁內容 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 對話分頁 */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col transition-opacity duration-150',
            activeTab === 'chat'
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          )}
        >
          {children}
        </div>

        {/* 畫布分頁 */}
        {activeCanvas && (
          <div
            className={cn(
              'absolute inset-0 flex flex-col transition-opacity duration-150',
              activeTab !== 'chat' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
          >
            <CanvasEditor
              key={activeCanvas.id}
              channelId={channel.id}
              canvasId={`canvas-${channel.id}-${activeCanvas.id}`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
