'use client'

import React, { useState, useEffect } from 'react'
import { useEnterSubmitWithShift } from '@/hooks/useEnterSubmit'
import { Send } from 'lucide-react'
import { NotesSectionProps } from './types'
import { useAuthStore } from '@/stores/auth-store'
import { generateUUID } from '@/lib/utils/uuid'

export function NotesSection({ todo, onUpdate }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('')
  const { user } = useAuthStore()

  // 進入備註區時，自動標記所有未讀留言為已讀
  useEffect(() => {
    if (!user?.id || !todo.notes?.length) return

    const unreadNotes = todo.notes.filter(
      note => note.author_id !== user.id && !note.read_by?.includes(user.id)
    )

    if (unreadNotes.length > 0) {
      const updatedNotes = todo.notes.map(note => {
        if (note.author_id !== user.id && !note.read_by?.includes(user.id)) {
          return {
            ...note,
            read_by: [...(note.read_by || []), user.id],
          }
        }
        return note
      })
      onUpdate({ notes: updatedNotes })
    }
  }, [todo.id])

  const addNote = () => {
    if (!newNote.trim() || !user) return

    const note = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      content: newNote,
      author_id: user.id,
      author_name:
        user.display_name ||
        user.chinese_name ||
        user.english_name ||
        user.personal_info?.email ||
        '未知使用者',
      read_by: [user.id],
    }

    const updates: Partial<typeof todo> = {
      notes: [...(todo.notes || []), note],
    }

    if (todo.status === 'pending') {
      updates.status = 'in_progress'
    }

    onUpdate(updates)
    setNewNote('')
  }

  const { handleKeyDown: handleNoteKeyDown, compositionProps: noteCompositionProps } =
    useEnterSubmitWithShift(addNote)

  // 格式化時間
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // 獲取作者縮寫
  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const isCurrentUser = (authorId: string) => authorId === user?.id

  return (
    <div>
      <h3 className="text-lg font-serif font-bold text-[#333333] mb-6">討論</h3>

      <div className="space-y-6">
        {(todo.notes || []).map((note, index) => {
          const isMine = isCurrentUser(note.author_id)

          return (
            <div key={index} className="flex gap-4">
              {/* Avatar */}
              {isMine ? (
                <div className="w-8 h-8 rounded-full bg-[#B8A99A] text-white flex items-center justify-center text-xs font-bold mt-1 shadow-sm">
                  ME
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#C9D4C5] text-[#333333] flex items-center justify-center text-xs font-bold mt-1 shadow-sm">
                  {getInitials(note.author_name || '')}
                </div>
              )}

              {/* Message bubble */}
              <div className={`flex-1 rounded-r-xl rounded-bl-xl p-4 ${isMine ? 'bg-[#B8A99A]/10' : 'bg-[#F9F8F6]'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#333333]">
                    {isMine ? '你' : note.author_name}
                  </span>
                  <span className="text-[10px] text-[#8C8C8C] uppercase tracking-wide">
                    {formatTime(note.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-[#333333] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            </div>
          )
        })}

        {/* 新增留言輸入框 */}
        <div className="flex gap-4 mt-4">
          <div className="w-8 h-8 rounded-full bg-[#B8A99A] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            ME
          </div>
          <div className="flex-1 relative">
            <textarea
              placeholder="撰寫留言..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={handleNoteKeyDown}
              {...noteCompositionProps}
              rows={2}
              className="w-full bg-white border border-[#E8E4E0] rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#B8A99A] focus:border-[#B8A99A] outline-none resize-none shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] pr-12"
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="absolute bottom-3 right-3 text-[#B8A99A] hover:text-[#9E8C7A] transition-colors p-1 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
