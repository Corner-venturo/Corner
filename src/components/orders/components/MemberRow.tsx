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
import { cn } from '@/lib/utils'
import type { OrderMember, CustomCostField } from '../order-member.types'
import { MemberBasicInfo, MemberPassportInfo, MemberActions } from './member-row'

interface MemberRowProps {
  member: OrderMember
  index: number
  isEditMode: boolean
  showIdentityColumn: boolean
  showPnrColumn: boolean
  showRoomColumn: boolean
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
  showRoomColumn,
  showOrderCode,
  departureDate,
  roomAssignment,
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

  // 處理數字輸入
  const handleNumberInput = useCallback((field: keyof OrderMember, value: string) => {
    const num = parseInt(value.replace(/\D/g, ''), 10)
    onUpdateField(member.id, field, isNaN(num) ? null : num)
  }, [member.id, onUpdateField])

  return (
    <tr className="group relative hover:bg-morandi-container/20 transition-colors">
      {/* 基本資訊欄位 */}
      <MemberBasicInfo
        member={member}
        index={index}
        isEditMode={isEditMode}
        showIdentityColumn={showIdentityColumn}
        showOrderCode={showOrderCode}
        onUpdateField={onUpdateField}
        onPreview={onPreview}
        onKeyDown={onKeyDown}
        onNameSearch={onNameSearch}
        onIdNumberSearch={onIdNumberSearch}
      />

      {/* 護照資訊欄位 */}
      <MemberPassportInfo
        member={member}
        index={index}
        isEditMode={isEditMode}
        departureDate={departureDate}
        onUpdateField={onUpdateField}
        onKeyDown={onKeyDown}
      />

      {/* 飲食禁忌 */}
      <td className="border border-morandi-gold/20 px-2 py-1 bg-status-warning-bg">
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
      <td className="border border-morandi-gold/20 px-2 py-1 bg-muted text-xs text-center text-morandi-secondary">
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

      {/* 團體模式：分房欄位 */}
      {mode === 'tour' && showRoomColumn && (
        <td className="border border-morandi-gold/20 px-2 py-1 bg-emerald-50/50 text-xs">
          {roomAssignment || '-'}
        </td>
      )}

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
      <MemberActions
        member={member}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </tr>
  )
}
