'use client'

import { Hash, Lock, Star, Trash2, UserPlus, Edit2, LogOut } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { SortableChannelItemProps } from './types'
import { DELETE_TOUR_CHANNEL_PASSWORD } from '@/lib/constants/workspace-settings'

export function SortableChannelItem({
  channel,
  isActive,
  onSelectChannel,
  toggleChannelFavorite,
  onDelete,
  onEdit,
  isAdmin = false,
  isMember = true,
  onJoinChannel,
  onLeaveChannel,
}: SortableChannelItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // 判斷是否為旅遊團頻道
  const isTourChannel = !!channel.tour_id

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-grab active:cursor-grabbing transition-colors',
        isActive
          ? 'bg-morandi-gold/15 text-morandi-primary font-medium'
          : 'text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary'
      )}
    >
      <div
        className="flex items-center gap-2 flex-1 min-w-0"
        onClick={() => onSelectChannel(channel)}
      >
        {channel.type === 'private' ? (
          <Lock size={14} className="shrink-0" />
        ) : (
          <Hash size={14} className="shrink-0" />
        )}
        <span className="flex-1 truncate">{channel.name}</span>
      </div>
      <div className="flex items-center gap-1" onPointerDown={e => e.stopPropagation()}>
        {/* 🔥 未加入頻道：顯示「加入」按鈕 */}
        {!isMember && onJoinChannel && (
          <button
            onClick={e => {
              e.stopPropagation()
              onJoinChannel(channel.id)
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-morandi-gold/20 text-morandi-gold transition-opacity"
            title="加入頻道"
          >
            <UserPlus size={12} />
          </button>
        )}

        {/* 🔥 已加入頻道：顯示管理按鈕 */}
        {isMember && (
          <>
            {/* 離開按鈕 */}
            {onLeaveChannel && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onLeaveChannel(channel.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition-opacity"
                title="離開頻道"
              >
                <LogOut size={12} />
              </button>
            )}
            {/* 編輯按鈕 */}
            {onEdit && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onEdit(channel.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-morandi-gold/20 text-morandi-secondary transition-opacity"
                title="編輯頻道"
              >
                <Edit2 size={12} />
              </button>
            )}
            {/* 釘選按鈕 */}
            <button
              onClick={e => {
                e.stopPropagation()
                toggleChannelFavorite(channel.id)
              }}
              className={cn(
                'p-0.5 rounded hover:bg-morandi-gold/20 transition-colors',
                channel.is_favorite ? 'text-morandi-gold' : 'text-morandi-secondary opacity-0 group-hover:opacity-100'
              )}
              title={channel.is_favorite ? '取消釘選' : '釘選頻道'}
            >
              <Star size={12} fill={channel.is_favorite ? 'currentColor' : 'none'} />
            </button>
            {/* 刪除按鈕（所有頻道都可刪除，旅遊團頻道需要密碼） */}
            {onDelete && (
              <button
                onClick={async e => {
                  e.stopPropagation()

                  // 如果是旅遊團頻道，需要輸入密碼
                  if (isTourChannel) {
                    const password = prompt(
                      '⚠️ 刪除旅遊團頻道需要密碼確認\n\n' +
                        `即將刪除：${channel.name}\n` +
                        '此操作無法復原，請輸入密碼：'
                    )

                    // 使用者取消
                    if (password === null) {
                      return
                    }

                    // 驗證密碼
                    if (password !== DELETE_TOUR_CHANNEL_PASSWORD) {
                      alert('❌ 密碼錯誤')
                      return
                    }
                  }

                  onDelete(channel.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-opacity"
                title={isTourChannel ? '刪除頻道（需要密碼）' : '刪除頻道'}
              >
                <Trash2 size={12} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
