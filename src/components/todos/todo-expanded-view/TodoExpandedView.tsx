'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StarRating } from '@/components/ui/star-rating'
import { Check, Calendar, X } from 'lucide-react'
import { TodoExpandedViewProps } from './types'
import { useTodoExpandedView } from './useTodoExpandedView'
import { SubTasksSection } from './SubTasksSection'
import { NotesSection } from './NotesSection'
import { AssignmentSection } from './AssignmentSection'
import { QuickActionsSection, QuickActionContent } from './QuickActionsSection'

export function TodoExpandedView({ todo, onUpdate, onClose }: TodoExpandedViewProps) {
  const { activeTab, setActiveTab } = useTodoExpandedView()

  if (!todo) {
    return null
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-[1400px] h-[90vh] flex flex-col relative border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* 右上角關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-morandi-red/10 hover:text-morandi-red transition-colors rounded-lg text-morandi-secondary"
        >
          <X size={18} />
        </button>

        {/* 主要內容區 */}
        <div className="flex flex-1 overflow-hidden pt-12">
          {/* 左半部：詳情資料 */}
          <div className="w-1/2 px-6 py-4 border-r border-border flex flex-col">
            {/* 標題與星級 */}
            <div className="mb-4 bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                {/* 左邊：標題 */}
                <div className="flex-1">
                  <Input
                    value={todo.title}
                    onChange={e => onUpdate({ title: e.target.value })}
                    className="text-lg font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                    placeholder="輸入任務標題..."
                  />
                </div>

                {/* 右邊：優先級 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-morandi-secondary">優先級:</span>
                  <StarRating
                    value={todo.priority}
                    onChange={value => onUpdate({ priority: value as 1 | 2 | 3 | 4 | 5 })}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* 基本資訊 */}
            <AssignmentSection todo={todo} onUpdate={onUpdate} />

            {/* 子任務清單 */}
            <SubTasksSection todo={todo} onUpdate={onUpdate} />

            {/* 備註區 */}
            <NotesSection todo={todo} onUpdate={onUpdate} />
          </div>

          {/* 右半部：快速功能 */}
          <div className="w-1/2 px-6 py-4 flex flex-col">
            {/* 快速功能分頁 */}
            <QuickActionsSection activeTab={activeTab} onTabChange={setActiveTab} />

            {/* 分頁內容 */}
            <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto shadow-sm">
              <QuickActionContent activeTab={activeTab} todo={todo} onUpdate={onUpdate} />
            </div>

            {/* 快速操作按鈕 */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  onUpdate({ status: 'completed', completed: true })
                  onClose()
                }}
                className="flex-1 bg-gradient-to-r from-morandi-gold to-yellow-400 hover:from-morandi-gold/90 hover:to-yellow-400/90 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Check size={16} className="mr-1" />
                標記完成
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newDeadline = new Date()
                  newDeadline.setDate(newDeadline.getDate() + 7)
                  onUpdate({ deadline: newDeadline.toISOString().split('T')[0] })
                }}
                className="flex-1 border-morandi-container/50 hover:bg-morandi-container/20 hover:border-morandi-gold/20 shadow-sm transition-all"
              >
                <Calendar size={16} className="mr-1" />
                延期一週
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
