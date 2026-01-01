'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { InputIME } from '@/components/ui/input-ime'
import { StarRating } from '@/components/ui/star-rating'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Check, Calendar, Eye } from 'lucide-react'
import { TodoExpandedViewProps } from './types'
import { useTodoExpandedView } from './useTodoExpandedView'
import { SubTasksSection } from './SubTasksSection'
import { NotesSection } from './NotesSection'
import { AssignmentSection } from './AssignmentSection'
import { QuickActionsSection, QuickActionContent } from './QuickActionsSection'
import { useAuthStore } from '@/stores/auth-store'

export function TodoExpandedView({ todo, onUpdate, onClose }: TodoExpandedViewProps) {
  const { activeTab, setActiveTab } = useTodoExpandedView()
  const { user } = useAuthStore()

  if (!todo) {
    return null
  }

  // 判斷是否可編輯：建立者或在 visibility 列表中
  const currentUserId = user?.id
  const isCreator = todo.creator === currentUserId
  const isInVisibility = todo.visibility?.includes(currentUserId || '')
  const canEdit = isCreator || isInVisibility

  // 唯讀模式的 onUpdate（什麼都不做）
  const readOnlyUpdate = () => {}

  return (
    <Dialog open={!!todo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[900px] lg:max-w-[1200px] max-h-[95vh] sm:max-h-[85vh] flex flex-col p-0 gap-0">
        {/* 唯讀提示 */}
        {!canEdit && (
          <div className="absolute top-1 left-1 z-10 flex items-center gap-1 bg-morandi-gold/20 text-morandi-gold px-2 py-1 rounded-lg text-xs">
            <Eye size={12} />
            <span>唯讀模式</span>
          </div>
        )}

        {/* 主要內容區 */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden pt-2">
          {/* 左半部：詳情資料 */}
          <div className="w-full lg:w-1/2 px-4 sm:px-6 py-3 sm:py-4 border-b lg:border-b-0 lg:border-r border-border flex flex-col overflow-y-auto">
            {/* 標題與星級 */}
            <div className="mb-4 bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                {/* 左邊：標題 */}
                <div className="flex-1">
                  {canEdit ? (
                    <InputIME
                      value={todo.title}
                      onChange={value => onUpdate({ title: value })}
                      className="text-lg font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                      placeholder="輸入任務標題..."
                    />
                  ) : (
                    <div className="text-lg font-bold text-morandi-primary">{todo.title}</div>
                  )}
                </div>

                {/* 右邊：優先級 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-morandi-secondary">優先級:</span>
                  <StarRating
                    value={todo.priority}
                    onChange={canEdit ? (value => onUpdate({ priority: value as 1 | 2 | 3 | 4 | 5 })) : undefined}
                    size="sm"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            {/* 基本資訊 */}
            <AssignmentSection todo={todo} onUpdate={canEdit ? onUpdate : readOnlyUpdate} readOnly={!canEdit} />

            {/* 子任務清單 */}
            <SubTasksSection todo={todo} onUpdate={canEdit ? onUpdate : readOnlyUpdate} readOnly={!canEdit} />

            {/* 備註區 - 即使唯讀也可以留言 */}
            <NotesSection todo={todo} onUpdate={onUpdate} />
          </div>

          {/* 右半部：快速功能 */}
          <div className="w-full lg:w-1/2 px-4 sm:px-6 py-3 sm:py-4 flex flex-col overflow-y-auto">
            {/* 快速功能分頁 - 唯讀模式隱藏 */}
            {canEdit && (
              <>
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
                    className="flex-1 bg-gradient-to-r from-morandi-gold to-status-warning hover:from-morandi-gold/90 hover:to-status-warning/90 text-white shadow-md hover:shadow-lg transition-all gap-2"
                  >
                    <Check size={16} />
                    標記完成
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newDeadline = new Date()
                      newDeadline.setDate(newDeadline.getDate() + 7)
                      onUpdate({ deadline: newDeadline.toISOString().split('T')[0] })
                    }}
                    className="flex-1 border-morandi-container/50 hover:bg-morandi-container/20 hover:border-morandi-gold/20 shadow-sm transition-all gap-2"
                  >
                    <Calendar size={16} />
                    延期一週
                  </Button>
                </div>
              </>
            )}

            {/* 唯讀模式顯示提示 */}
            {!canEdit && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-morandi-secondary">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">這是公開的待辦事項</p>
                  <p className="text-xs mt-1">只有建立者和共享者可以編輯</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
