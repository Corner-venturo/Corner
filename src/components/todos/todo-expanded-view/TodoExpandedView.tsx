'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { InputIME } from '@/components/ui/input-ime'
import { StarRating } from '@/components/ui/star-rating'
import {
  X,
  Eye,
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  Receipt,
  FileText,
  Users,
  Plane,
  Share2,
} from 'lucide-react'
import { TodoExpandedViewProps } from './types'
import { useTodoExpandedView } from './useTodoExpandedView'
import { SubTasksSection } from './SubTasksSection'
import { NotesSection } from './NotesSection'
import { AssignmentSection } from './AssignmentSection'
import { QuickActionContent } from './QuickActionsSection'
import { useAuthStore } from '@/stores/auth-store'
import { useCalendarEventStore } from '@/stores'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { logger } from '@/lib/utils/logger'
import type { QuickActionTab } from './types'

// 快速操作按鈕配置
const quickActionButtons = [
  { key: 'receipt' as const, label: '收款管理', desc: '收款追蹤', icon: Receipt, color: 'bg-[#C9D4C5]/20 text-[#AEBEA8]', hoverColor: 'group-hover:bg-[#C9D4C5] group-hover:text-[#333333]' },
  { key: 'invoice' as const, label: '請款管理', desc: '請款', icon: FileText, color: 'bg-[#B8A99A]/20 text-[#B8A99A]', hoverColor: 'group-hover:bg-[#B8A99A] group-hover:text-white' },
  { key: 'group' as const, label: '開團', desc: '旅遊', icon: Users, color: 'bg-[#8FA9C2]/20 text-[#8FA9C2]', hoverColor: 'group-hover:bg-[#8FA9C2] group-hover:text-white' },
  { key: 'pnr' as const, label: '連結 PNR', desc: '機票', icon: Plane, color: 'bg-[#D4B483]/20 text-[#D4B483]', hoverColor: 'group-hover:bg-[#D4B483] group-hover:text-white' },
  { key: 'share' as const, label: '共享任務', desc: '協作', icon: Share2, color: 'bg-[#333333]/10 text-[#333333]', hoverColor: 'group-hover:bg-[#333333] group-hover:text-white' },
]

export function TodoExpandedView({ todo, onUpdate, onClose }: TodoExpandedViewProps) {
  const { activeTab, setActiveTab } = useTodoExpandedView()
  const { user } = useAuthStore()
  const { create: createCalendarEvent } = useCalendarEventStore()
  // 行事曆 Dialog 狀態
  const [calendarDialog, setCalendarDialog] = useState(false)
  const [calendarDate, setCalendarDate] = useState('')
  const [calendarTime, setCalendarTime] = useState('')

  // 快速操作 Dialog 狀態
  const [quickActionDialog, setQuickActionDialog] = useState(false)
  const [selectedQuickAction, setSelectedQuickAction] = useState<QuickActionTab | null>(null)

  // 點擊快速操作按鈕
  const handleQuickActionClick = (key: QuickActionTab) => {
    setSelectedQuickAction(key)
    setQuickActionDialog(true)
  }

  // 取得快速操作標題
  const getQuickActionTitle = (key: QuickActionTab | null) => {
    const btn = quickActionButtons.find(b => b.key === key)
    return btn?.label || '快速操作'
  }

  // 新增行事曆事件
  const handleAddToCalendar = async () => {
    if (!calendarDate || !user?.id) return

    try {
      const tzOffset = '+08:00'
      const startDateTime = calendarTime
        ? `${calendarDate}T${calendarTime}:00${tzOffset}`
        : `${calendarDate}T09:00:00${tzOffset}`

      const endHour = calendarTime ? parseInt(calendarTime.split(':')[0]) + 1 : 10
      const endTime = `${String(endHour).padStart(2, '0')}:${calendarTime?.split(':')[1] || '00'}`
      const endDateTime = `${calendarDate}T${endTime}:00${tzOffset}`

      const newEvent = await createCalendarEvent({
        title: todo.title,
        description: `待辦事項：${todo.title}`,
        start: startDateTime,
        end: endDateTime,
        all_day: !calendarTime,
        type: 'task',
        visibility: 'company',
        owner_id: user.id,
        created_by: user.id,
      })

      if (newEvent?.id) {
        onUpdate({ calendar_event_id: newEvent.id })
      }

      logger.log('[Todo] 已新增行事曆事件:', newEvent?.id)
      setCalendarDialog(false)
      setCalendarDate('')
      setCalendarTime('')
    } catch (error) {
      logger.error('[Todo] 新增行事曆失敗:', error)
    }
  }

  if (!todo) {
    return null
  }

  // 判斷是否可編輯
  const currentUserId = user?.id
  const isCreator = todo.creator === currentUserId
  const isInVisibility = todo.visibility?.includes(currentUserId || '')
  const canEdit = isCreator || isInVisibility
  const readOnlyUpdate = () => {}

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '未設定'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // 優先級顏色
  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-[#C77D7D] bg-[#C77D7D]/10'
    if (priority >= 3) return 'text-[#D4B483] bg-[#D4B483]/10'
    return 'text-[#8C8C8C] bg-[#E8E4E0]'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return '高優先'
    if (priority >= 3) return '中優先'
    return '一般'
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '進行中'
      default: return '待處理'
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(51, 51, 51, 0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[1200px] max-h-[90vh] rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-[#E8E4E0] overflow-hidden flex flex-col md:flex-row relative"
        onClick={e => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-[#E8E4E0]/50 text-[#333333] transition-colors"
          title="關閉"
        >
          <X size={24} />
        </button>

        {/* 左側主要內容區 (3/4) */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-full border-r border-[#E8E4E0] bg-white">
          {/* Header */}
          <div className="p-6 lg:p-8 border-b border-[#E8E4E0] shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* 標籤列 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8C8C8C] border border-[#E8E4E0] rounded-sm bg-[#F9F8F6]">
                    {todo.todo_number || 'TASK'}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm ${getPriorityColor(todo.priority)}`}>
                    {getPriorityLabel(todo.priority)}
                  </span>
                </div>
                {/* 標題 */}
                {canEdit ? (
                  <InputIME
                    value={todo.title}
                    onChange={value => onUpdate({ title: value })}
                    className="text-2xl md:text-3xl font-serif text-[#333333] font-medium bg-transparent border-none p-0 focus-visible:ring-0 w-full placeholder-gray-300 leading-tight"
                    placeholder="輸入任務標題..."
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-serif text-[#333333] font-medium leading-tight">
                    {todo.title}
                  </h1>
                )}
              </div>
              {/* 右側星級和行事曆 */}
              <div className="flex flex-col items-end gap-2 pr-8 md:pr-0">
                <StarRating
                  value={todo.priority}
                  onChange={canEdit ? (value => onUpdate({ priority: value as 1 | 2 | 3 | 4 | 5 })) : undefined}
                  size="sm"
                  disabled={!canEdit}
                />
                {todo.calendar_event_id ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-1">
                    <CalendarCheck size={18} />
                    已加入行事曆
                  </span>
                ) : canEdit && (
                  <button
                    onClick={() => setCalendarDialog(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#B8A99A] hover:text-[#9E8C7A] transition-colors mt-1"
                  >
                    <Calendar size={18} />
                    加入行事曆
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 可滾動內容區 */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
            {/* 指派、期限、狀態區塊 */}
            <AssignmentSection todo={todo} onUpdate={canEdit ? onUpdate : readOnlyUpdate} readOnly={!canEdit} />

            {/* 子任務區 */}
            <SubTasksSection todo={todo} onUpdate={canEdit ? onUpdate : readOnlyUpdate} readOnly={!canEdit} />

            {/* 討論區 */}
            <div className="pt-6 border-t border-[#E8E4E0]">
              <NotesSection todo={todo} onUpdate={onUpdate} />
            </div>
          </div>
        </div>

        {/* 右側邊欄 (1/4) */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-[#F9F8F6] flex flex-col h-full border-l border-[#E8E4E0] relative">
          {/* 唯讀模式標籤 */}
          {!canEdit && (
            <div className="absolute top-0 right-0 p-2 z-10 pointer-events-none">
              <span className="bg-[#E8E4E0] text-[10px] uppercase font-bold text-[#8C8C8C] px-2 py-1 rounded-bl-lg rounded-tr-lg opacity-50">
                唯讀模式
              </span>
            </div>
          )}

          <div className="p-6 overflow-y-auto flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C8C8C] mb-6 border-l-2 border-[#B8A99A] pl-3">
              快速操作
            </h3>

            {canEdit ? (
              <>
                {/* 快速操作按鈕 */}
                <div className="space-y-3 mb-6">
                  {quickActionButtons.map(btn => {
                    const Icon = btn.icon
                    return (
                      <button
                        key={btn.key}
                        onClick={() => handleQuickActionClick(btn.key)}
                        className="w-full flex items-center gap-3 p-3 bg-white rounded-lg shadow-[0_2px_12px_-2px_rgba(51,51,51,0.05)] hover:shadow-md transition-all group text-left border border-transparent hover:border-[#B8A99A]/30"
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${btn.color} ${btn.hoverColor}`}>
                          <Icon size={18} />
                        </span>
                        <div>
                          <span className="block text-sm font-medium text-[#333333]">{btn.label}</span>
                          <span className="block text-[10px] text-[#8C8C8C]">{btn.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* 系統日誌 */}
                <div className="mt-6 pt-6 border-t border-[#E8E4E0]">
                  <h4 className="text-[10px] font-bold uppercase text-[#8C8C8C] mb-3">系統紀錄</h4>
                  <ul className="space-y-3 relative before:absolute before:left-[5px] before:top-1 before:bottom-0 before:w-px before:bg-[#E8E4E0]">
                    <li className="pl-4 relative">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#C9D4C5] z-10"></div>
                      <p className="text-xs text-[#333333]">狀態更新為 <span className="font-bold text-[#D4B483]">{getStatusLabel(todo.status)}</span></p>
                      <p className="text-[10px] text-[#8C8C8C] mt-0.5">剛剛</p>
                    </li>
                    <li className="pl-4 relative">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#B8A99A] z-10"></div>
                      <p className="text-xs text-[#333333]">建立任務</p>
                      <p className="text-[10px] text-[#8C8C8C] mt-0.5">{formatDate(todo.created_at)}</p>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[#8C8C8C]">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">這是公開的待辦事項</p>
                  <p className="text-xs mt-1">只有建立者和共享者可以編輯</p>
                </div>
              </div>
            )}
          </div>

          {/* 底部操作按鈕 */}
          {canEdit && (
            <div className="mt-auto p-6 border-t border-[#E8E4E0] bg-white">
              <button
                onClick={() => {
                  onUpdate({ status: 'completed', completed: true })
                  onClose()
                }}
                className="w-full bg-[#C9D4C5] hover:bg-[#AEBEA8] text-[#333333] active:scale-95 transition-all duration-300 py-3 rounded-lg text-sm font-semibold tracking-wide shadow-sm hover:shadow-md mb-3 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                標記完成
              </button>
              <button
                onClick={() => {
                  const newDeadline = new Date()
                  newDeadline.setDate(newDeadline.getDate() + 7)
                  onUpdate({ deadline: newDeadline.toISOString().split('T')[0] })
                }}
                className="w-full bg-transparent border border-[#B8A99A] text-[#B8A99A] hover:bg-[#B8A99A] hover:text-white transition-all duration-300 py-2.5 rounded-lg text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
              >
                <Clock size={20} />
                延期一週
              </button>
            </div>
          )}
        </div>

        {/* 行事曆 Dialog */}
        <Dialog open={calendarDialog} onOpenChange={(open) => {
          if (!open) {
            setCalendarDialog(false)
            setCalendarDate('')
            setCalendarTime('')
          }
        }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-[#B8A99A]" />
                加入行事曆
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8C8C8C] mb-1 block">任務名稱</label>
                <div className="text-sm font-medium text-[#333333] bg-[#F9F8F6] px-3 py-2 rounded-lg">
                  {todo.title}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8C8C8C] mb-1 block">日期 *</label>
                <Input
                  type="date"
                  value={calendarDate}
                  onChange={e => setCalendarDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#8C8C8C] mb-1 block">時間（可選）</label>
                <Input
                  type="time"
                  value={calendarTime}
                  onChange={e => setCalendarTime(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="不填則為全天"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  className="flex-1 h-9 px-4 rounded-lg border border-[#E8E4E0] text-[#333333] bg-white hover:bg-[#F9F8F6] transition-colors text-sm font-medium"
                  onClick={() => {
                    setCalendarDialog(false)
                    setCalendarDate('')
                    setCalendarTime('')
                  }}
                >
                  取消
                </button>
                <button
                  className="flex-1 h-9 px-4 rounded-lg bg-[#B8A99A] hover:bg-[#9E8C7A] text-white text-sm font-medium disabled:opacity-50"
                  onClick={handleAddToCalendar}
                  disabled={!calendarDate}
                >
                  建立
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 快速操作 Dialog */}
        <Dialog open={quickActionDialog} onOpenChange={setQuickActionDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-serif">
                {selectedQuickAction && (() => {
                  const btn = quickActionButtons.find(b => b.key === selectedQuickAction)
                  if (!btn) return null
                  const Icon = btn.icon
                  return (
                    <>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${btn.color}`}>
                        <Icon size={18} />
                      </span>
                      {btn.label}
                    </>
                  )
                })()}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedQuickAction && (
                <QuickActionContent
                  activeTab={selectedQuickAction}
                  todo={todo}
                  onUpdate={onUpdate}
                  onClose={() => setQuickActionDialog(false)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
