/**
 * MemberRow - 成員行元件
 * 從 OrderMembersExpandable.tsx 拆分出來
 *
 * 功能：
 * - 顯示單個成員的所有資訊
 * - 支援編輯模式（行內編輯）
 * - 支援團體模式額外欄位
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Eye, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPassportExpiryWithStatus } from '@/lib/utils/passport-expiry'
import type { OrderMember, CustomCostField } from '../order-member.types'

interface MemberRowProps {
  member: OrderMember
  index: number
  isEditMode: boolean
  showIdentityColumn: boolean
  showPnrColumn: boolean
  showOrderCode: boolean
  departureDate: string | null
  roomAssignment?: string
  vehicleAssignment?: string
  pnrValue?: string
  customCostFields: CustomCostField[]
  mode: 'order' | 'tour'
  onUpdateField: (memberId: string, field: keyof OrderMember, value: string | number | null) => void
  onDelete: (memberId: string) => void
  onEdit: (member: OrderMember, mode: 'verify' | 'edit') => void
  onPreview: (member: OrderMember) => void
  onPnrChange: (memberId: string, value: string) => void
  onCustomCostChange: (fieldId: string, memberId: string, value: string) => void
  onKeyDown: (e: React.KeyboardEvent, memberIndex: number, field: string) => void
  onNameSearch?: (memberId: string, value: string) => void
  onIdNumberSearch?: (memberId: string, value: string, memberIndex: number) => void
}

export function MemberRow({
  member,
  index,
  isEditMode,
  showIdentityColumn,
  showPnrColumn,
  showOrderCode,
  departureDate,
  pnrValue,
  customCostFields,
  mode,
  onUpdateField,
  onDelete,
  onEdit,
  onPreview,
  onPnrChange,
  onCustomCostChange,
  onKeyDown,
  onNameSearch,
  onIdNumberSearch,
}: MemberRowProps) {
  const [isComposing, setIsComposing] = useState(false)

  // 處理日期輸入（自動格式化）
  const handleDateInput = useCallback((field: 'birth_date' | 'passport_expiry', value: string) => {
    // 移除非數字
    const digitsOnly = value.replace(/\D/g, '')

    // 自動格式化為 YYYY-MM-DD
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

    onUpdateField(member.id, field, formatted)
  }, [member.id, onUpdateField])

  // 處理數字輸入
  const handleNumberInput = useCallback((field: keyof OrderMember, value: string) => {
    const num = parseInt(value.replace(/\D/g, ''), 10)
    onUpdateField(member.id, field, isNaN(num) ? null : num)
  }, [member.id, onUpdateField])

  return (
    <tr className="group relative hover:bg-morandi-container/20 transition-colors">
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

      {/* 護照拼音 */}
      <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-gray-50")}>
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

      {/* 出生年月日 */}
      <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-gray-50")}>
        {isEditMode ? (
          <input
            type="text"
            value={member.birth_date || ''}
            onChange={e => handleDateInput('birth_date', e.target.value)}
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

      {/* 護照號碼 */}
      <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-gray-50")}>
        {isEditMode ? (
          <input
            type="text"
            value={member.passport_number || ''}
            onChange={e => onUpdateField(member.id, 'passport_number', e.target.value)}
            onKeyDown={e => onKeyDown(e, index, 'passport_number')}
            data-member={member.id}
            data-field="passport_number"
            className="w-full bg-transparent text-xs border-none outline-none shadow-none"
          />
        ) : (
          <span className="text-xs text-morandi-primary">{member.passport_number || '-'}</span>
        )}
      </td>

      {/* 護照效期 */}
      <td className={cn("border border-morandi-gold/20 px-2 py-1", isEditMode ? "bg-white" : "bg-gray-50")}>
        {isEditMode ? (
          <input
            type="text"
            value={member.passport_expiry || ''}
            onChange={e => handleDateInput('passport_expiry', e.target.value)}
            onKeyDown={e => onKeyDown(e, index, 'passport_expiry')}
            data-member={member.id}
            data-field="passport_expiry"
            className="w-full bg-transparent text-xs border-none outline-none shadow-none"
            placeholder="YYYYMMDD"
          />
        ) : (
          (() => {
            const expiryInfo = formatPassportExpiryWithStatus(member.passport_expiry, departureDate)
            return (
              <span className={cn("text-xs", expiryInfo.className)}>
                {expiryInfo.text}
                {expiryInfo.statusLabel && (
                  <span className="ml-1 text-[10px] font-medium">
                    ({expiryInfo.statusLabel})
                  </span>
                )}
              </span>
            )
          })()
        )}
      </td>

      {/* 飲食禁忌 */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-amber-50/50">
        <input
          type="text"
          value={member.special_meal || ''}
          onChange={e => onUpdateField(member.id, 'special_meal', e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={e => {
            setIsComposing(false)
            setTimeout(() => onUpdateField(member.id, 'special_meal', e.currentTarget.value), 0)
          }}
          onKeyDown={e => onKeyDown(e, index, 'special_meal')}
          data-member={member.id}
          data-field="special_meal"
          className="w-full bg-transparent text-xs border-none outline-none shadow-none"
        />
      </td>

      {/* 訂房代號 */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
        <input
          type="text"
          value={member.hotel_confirmation || ''}
          onChange={e => onUpdateField(member.id, 'hotel_confirmation', e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={e => {
            setIsComposing(false)
            setTimeout(() => onUpdateField(member.id, 'hotel_confirmation', e.currentTarget.value), 0)
          }}
          data-member={member.id}
          data-field="hotel_confirmation"
          className="w-full bg-transparent text-xs font-mono border-none outline-none shadow-none"
          placeholder="輸入訂房代號"
        />
      </td>

      {/* 應付金額 */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
        <input
          type="text"
          inputMode="numeric"
          value={member.total_payable || ''}
          onChange={e => handleNumberInput('total_payable', e.target.value)}
          className="w-full bg-transparent text-xs border-none outline-none shadow-none"
        />
      </td>

      {/* 訂金 */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
        <input
          type="text"
          inputMode="numeric"
          value={member.deposit_amount || ''}
          onChange={e => handleNumberInput('deposit_amount', e.target.value)}
          className="w-full bg-transparent text-xs border-none outline-none shadow-none"
        />
      </td>

      {/* 尾款 (自動計算) */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-gray-50 text-xs text-center text-morandi-secondary">
        {((member.total_payable || 0) - (member.deposit_amount || 0)).toLocaleString()}
      </td>

      {/* 備註 */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
        <input
          type="text"
          value={member.remarks || ''}
          onChange={e => onUpdateField(member.id, 'remarks', e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={e => {
            setIsComposing(false)
            setTimeout(() => onUpdateField(member.id, 'remarks', e.currentTarget.value), 0)
          }}
          className="w-full bg-transparent text-xs border-none outline-none shadow-none"
        />
      </td>

      {/* 團體模式：PNR 欄位 */}
      {mode === 'tour' && showPnrColumn && (
        <td className="border border-morandi-gold/20 px-2 py-1 bg-sky-50/50">
          <input
            type="text"
            value={pnrValue || ''}
            onChange={e => onPnrChange(member.id, e.target.value)}
            className="w-full bg-transparent text-xs border-none outline-none shadow-none"
            placeholder="輸入 PNR"
          />
        </td>
      )}

      {/* 團體模式：自訂費用欄位 */}
      {mode === 'tour' && customCostFields.map(field => (
        <td
          key={field.id}
          className="border border-morandi-gold/20 px-2 py-1 bg-emerald-50/50"
        >
          <input
            type="text"
            value={field.values[member.id] || ''}
            onChange={e => onCustomCostChange(field.id, member.id, e.target.value)}
            className="w-full bg-transparent text-xs border-none outline-none shadow-none"
            placeholder="輸入金額"
          />
        </td>
      ))}

      {/* 操作按鈕 */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-white text-center">
        <div className="flex items-center justify-center gap-1">
          {/* 警告按鈕（待驗證時顯示） */}
          {member.customer_verification_status === 'unverified' && (
            <button
              onClick={() => onEdit(member, 'verify')}
              className="text-amber-500 hover:text-amber-600 transition-colors p-1"
              title="待驗證 - 點擊驗證"
            >
              <AlertTriangle size={14} />
            </button>
          )}
          {/* 編輯按鈕 */}
          <button
            onClick={() => onEdit(member, 'edit')}
            className="text-morandi-blue hover:text-morandi-blue/80 transition-colors p-1"
            title="編輯成員"
          >
            <Pencil size={14} />
          </button>
          {/* 刪除按鈕 */}
          <button
            onClick={() => onDelete(member.id)}
            className="text-morandi-secondary/50 hover:text-red-500 transition-colors p-1"
            title="刪除成員"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}
