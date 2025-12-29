/**
 * MemberActions - 成員操作按鈕
 * 包含：警告、編輯、刪除按鈕
 */

'use client'

import React from 'react'
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import type { OrderMember } from '../../order-member.types'

interface MemberActionsProps {
  member: OrderMember
  onEdit: (member: OrderMember, mode: 'verify' | 'edit') => void
  onDelete: (memberId: string) => void
}

export function MemberActions({
  member,
  onEdit,
  onDelete,
}: MemberActionsProps) {
  return (
    <td className="border border-morandi-gold/20 px-2 py-1 bg-muted text-center sticky right-0">
      <div className="flex items-center justify-center gap-1">
        {/* 警告按鈕（待驗證時顯示） */}
        {member.customer_verification_status === 'unverified' && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(member, 'verify') }}
            className="text-status-warning hover:text-morandi-gold hover:bg-morandi-gold/10 transition-colors p-1 rounded"
            title="待驗證 - 點擊驗證"
          >
            <AlertTriangle size={14} />
          </button>
        )}
        {/* 編輯按鈕 */}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(member, 'edit') }}
          className="text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10 transition-colors p-1 rounded"
          title="編輯成員"
        >
          <Pencil size={14} />
        </button>
        {/* 刪除按鈕 */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(member.id) }}
          className="text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10 transition-colors p-1 rounded"
          title="刪除成員"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </td>
  )
}
