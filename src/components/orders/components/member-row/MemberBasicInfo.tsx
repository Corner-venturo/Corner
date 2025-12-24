/**
 * MemberBasicInfo - 成員基本資訊欄位
 * 包含：中文姓名、出生年月日、性別、身分證號
 */

'use client'

import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderMember } from '../../order-member.types'

interface MemberBasicInfoProps {
  member: OrderMember
  index: number
  isEditMode: boolean
  showIdentityColumn: boolean
  showOrderCode: boolean
  onUpdateField: (memberId: string, field: keyof OrderMember, value: string | number | null) => void
  onPreview: (member: OrderMember) => void
  onKeyDown: (e: React.KeyboardEvent, memberIndex: number, field: string) => void
  onNameSearch?: (memberId: string, value: string) => void
  onIdNumberSearch?: (memberId: string, value: string, memberIndex: number) => void
}

export function MemberBasicInfo({
  member,
  index,
  isEditMode,
  showIdentityColumn,
  showOrderCode,
  onUpdateField,
  onPreview,
  onKeyDown,
  onNameSearch,
  onIdNumberSearch,
}: MemberBasicInfoProps) {
  const [isComposing, setIsComposing] = useState(false)

  // 處理日期輸入（自動格式化）
  const handleDateInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    let formatted = digitsOnly
    if (digitsOnly.length >= 4) {
      formatted = digitsOnly.slice(0, 4)
      if (digitsOnly.length >= 6) {
        formatted += '-' + digitsOnly.slice(4, 6)
        if (digitsOnly.length >= 8) {
          formatted += '-' + digitsOnly.slice(6, 8)
        }
      } else if (digitsOnly.length > 4) {
        formatted += '-' + digitsOnly.slice(4)
      }
    }
    onUpdateField(member.id, 'birth_date', formatted)
  }

  return (
    <>
      {/* 團體模式：訂單序號 */}
      {showOrderCode && (
        <td className="border border-morandi-gold/20 px-2 py-1 bg-blue-50/50 text-center">
          <span className="text-xs text-blue-600 font-medium">{member.order_code || '-'}</span>
        </td>
      )}

      {/* 身份（領隊勾選） */}
      {showIdentityColumn && (
        <td className={cn("border border-morandi-gold/20 px-2 py-1 text-center", isEditMode ? "bg-white" : "bg-gray-50")}>
          {isEditMode ? (
            <input
              type="checkbox"
              checked={member.identity === '領隊'}
              onChange={e => onUpdateField(member.id, 'identity', e.target.checked ? '領隊' : '大人')}
              data-member={member.id}
              data-field="identity"
              className="w-4 h-4 cursor-pointer accent-morandi-primary"
              title="勾選設為領隊"
            />
          ) : (
            <span className="text-xs text-morandi-primary">{member.identity === '領隊' ? '✓ 領隊' : '-'}</span>
          )}
        </td>
      )}

      {/* 中文姓名 */}
      <td className={cn(
        "border border-morandi-gold/20 px-2 py-1",
        isEditMode ? 'bg-white' : (member.customer_verification_status === 'unverified' ? 'bg-red-50' : 'bg-gray-50')
      )}>
        {isEditMode ? (
          <input
            type="text"
            value={member.chinese_name || ''}
            onChange={e => {
              onUpdateField(member.id, 'chinese_name', e.target.value)
              onNameSearch?.(member.id, e.target.value)
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={e => {
              setIsComposing(false)
              const value = e.currentTarget.value
              setTimeout(() => {
                onUpdateField(member.id, 'chinese_name', value)
                onNameSearch?.(member.id, value)
              }, 0)
            }}
            onKeyDown={e => onKeyDown(e, index, 'chinese_name')}
            data-member={member.id}
            data-field="chinese_name"
            className="w-full bg-transparent text-xs border-none outline-none shadow-none"
            placeholder="輸入姓名，按 Enter 搜尋"
          />
        ) : (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "flex-1 text-xs",
                member.customer_verification_status === 'unverified' ? 'text-red-600 font-medium' : 'text-morandi-primary'
              )}
              title={member.customer_verification_status === 'unverified' ? '⚠️ 待驗證 - 請點擊編輯按鈕' : ''}
            >
              {member.chinese_name || '-'}
            </span>
            {member.passport_image_url && (
              <button
                type="button"
                onClick={() => onPreview(member)}
                className="p-0.5 text-morandi-gold hover:text-morandi-gold/80 transition-colors"
                title="查看護照照片"
              >
                <Eye size={12} />
              </button>
            )}
          </div>
        )}
      </td>

      {/* 出生年月日 */}
      <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-gray-50")}>
        {isEditMode ? (
          <input
            type="text"
            value={member.birth_date || ''}
            onChange={e => handleDateInput(e.target.value)}
            onKeyDown={e => onKeyDown(e, index, 'birth_date')}
            data-member={member.id}
            data-field="birth_date"
            className="w-full bg-transparent text-xs border-none outline-none shadow-none"
            placeholder="YYYYMMDD"
          />
        ) : (
          <span className="text-xs text-morandi-primary">{member.birth_date || '-'}</span>
        )}
      </td>

      {/* 性別 */}
      <td className={cn("border border-morandi-gold/20 px-2 py-1 text-xs text-center", isEditMode ? "bg-white" : "bg-gray-50")}>
        {isEditMode ? (
          <select
            value={member.gender || ''}
            onChange={e => onUpdateField(member.id, 'gender', e.target.value)}
            data-member={member.id}
            data-field="gender"
            className="w-full bg-transparent text-xs text-center border-none outline-none shadow-none"
          >
            <option value="">-</option>
            <option value="M">男</option>
            <option value="F">女</option>
          </select>
        ) : (
          <span className="text-morandi-primary">
            {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
          </span>
        )}
      </td>

      {/* 身分證號 */}
      <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-gray-50")}>
        {isEditMode ? (
          <input
            type="text"
            value={member.id_number || ''}
            onChange={e => {
              onUpdateField(member.id, 'id_number', e.target.value)
              onIdNumberSearch?.(member.id, e.target.value, index)
            }}
            onKeyDown={e => onKeyDown(e, index, 'id_number')}
            data-member={member.id}
            data-field="id_number"
            className="w-full bg-transparent text-xs border-none outline-none shadow-none"
            placeholder="輸入身分證搜尋..."
          />
        ) : (
          <span className="text-xs text-morandi-primary">{member.id_number || '-'}</span>
        )}
      </td>
    </>
  )
}
