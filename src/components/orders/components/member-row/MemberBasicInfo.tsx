/**
 * MemberBasicInfo - 成員基本資訊欄位
 * 包含：中文姓名、出生年月日、性別、身分證號
 */

'use client'

import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderMember } from '../../order-member.types'
import type { ColumnVisibility } from '../../OrderMembersExpandable'

interface MemberBasicInfoProps {
  member: OrderMember
  index: number
  isEditMode: boolean
  showIdentityColumn: boolean
  showOrderCode: boolean
  columnVisibility?: ColumnVisibility
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
  columnVisibility,
  onUpdateField,
  onPreview,
  onKeyDown,
  onNameSearch,
  onIdNumberSearch,
}: MemberBasicInfoProps) {
  const [isComposing, setIsComposing] = useState(false)

  // 預設欄位顯示設定（訂金/尾款/應付金額 預設關閉）
  const cv = columnVisibility || {
    passport_name: true,
    birth_date: true,
    gender: true,
    id_number: true,
    passport_number: true,
    passport_expiry: true,
    special_meal: true,
    total_payable: false,
    deposit_amount: false,
    balance: false,
    remarks: true,
  }

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
      {/* 序號 - 凍結欄位（使用實色背景避免內容穿透） */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-[#f5f3f0] text-center sticky left-0 z-10">
        <span className="text-xs text-morandi-secondary">{index + 1}</span>
      </td>

      {/* 中文姓名 - 凍結欄位（使用實色背景避免內容穿透） */}
      <td className={cn(
        "border border-morandi-gold/20 px-2 py-1 sticky left-[40px] z-10",
        isEditMode ? 'bg-white' : (member.customer_verification_status === 'unverified' ? 'bg-[#fde8e8]' : 'bg-[#f5f3f0]')
      )}>
        {isEditMode ? (
          <input
            type="text"
            value={member.chinese_name || ''}
            onChange={e => {
              onUpdateField(member.id, 'chinese_name', e.target.value)
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={e => {
              setIsComposing(false)
              const value = e.currentTarget.value
              setTimeout(() => {
                onUpdateField(member.id, 'chinese_name', value)
              }, 0)
            }}
            onKeyDown={e => {
              // 按 Enter 時觸發搜尋（避免輸入新客戶時被打斷）
              if (e.key === 'Enter' && !isComposing) {
                e.preventDefault()
                onNameSearch?.(member.id, member.chinese_name || '')
              } else {
                onKeyDown(e, index, 'chinese_name')
              }
            }}
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
                member.customer_verification_status === 'unverified' ? 'text-status-danger font-medium' : 'text-morandi-primary'
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

      {/* 團體模式：訂單序號 */}
      {showOrderCode && (
        <td className="border border-morandi-gold/20 px-2 py-1 bg-status-info-bg text-center">
          <span className="text-xs text-status-info font-medium">{member.order_code || '-'}</span>
        </td>
      )}

      {/* 身份（領隊勾選） */}
      {showIdentityColumn && (
        <td className={cn("border border-morandi-gold/20 px-2 py-1 text-center", isEditMode ? "bg-white" : "bg-muted")}>
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

      {/* 護照拼音 */}
      {cv.passport_name && (
        <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-muted")}>
          {isEditMode ? (
            <input
              type="text"
              value={member.passport_name || ''}
              onChange={e => onUpdateField(member.id, 'passport_name', e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={e => {
                setIsComposing(false)
                setTimeout(() => onUpdateField(member.id, 'passport_name', e.currentTarget.value), 0)
              }}
              onKeyDown={e => onKeyDown(e, index, 'passport_name')}
              data-member={member.id}
              data-field="passport_name"
              className="w-full bg-transparent text-xs border-none outline-none shadow-none"
            />
          ) : (
            <span className="text-xs text-morandi-primary">{member.passport_name || '-'}</span>
          )}
        </td>
      )}

      {/* 出生年月日 */}
      {cv.birth_date && (
        <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-muted")}>
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
      )}

      {/* 性別 */}
      {cv.gender && (
        <td className={cn("border border-morandi-gold/20 px-2 py-1 text-xs text-center", isEditMode ? "bg-white" : "bg-muted")}>
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
      )}

      {/* 身分證號 */}
      {cv.id_number && (
        <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-muted")}>
          {isEditMode ? (
            <input
              type="text"
              value={member.id_number || ''}
              onChange={e => {
                onUpdateField(member.id, 'id_number', e.target.value)
              }}
              onKeyDown={e => {
                // 按 Enter 時觸發搜尋（避免輸入新客戶時被打斷）
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onIdNumberSearch?.(member.id, member.id_number || '', index)
                } else {
                  onKeyDown(e, index, 'id_number')
                }
              }}
              data-member={member.id}
              data-field="id_number"
              className="w-full bg-transparent text-xs border-none outline-none shadow-none"
              placeholder="按 Enter 搜尋"
            />
          ) : (
            <span className="text-xs text-morandi-primary">{member.id_number || '-'}</span>
          )}
        </td>
      )}
    </>
  )
}
