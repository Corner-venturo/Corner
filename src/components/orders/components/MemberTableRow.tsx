'use client'

import { Eye, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderMember } from '../order-member.types'
import { formatPassportExpiryWithStatus } from '@/lib/utils/passport-expiry'

interface CustomCostField {
  id: string
  name: string
  values: Record<string, string>
}

interface MemberTableRowProps {
  member: OrderMember
  index: number
  isAllEditMode: boolean
  showIdentityColumn: boolean
  showRoomColumn: boolean
  showPnrColumn: boolean
  showOrderColumn: boolean
  departureDate: string | null
  roomAssignment?: string
  pnrValue?: string
  customCostFields: CustomCostField[]
  isComposing: boolean
  onDelete: (id: string) => void
  onFieldChange: (id: string, field: keyof OrderMember, value: string | number) => void
  onEditModeNameChange: (id: string, value: string) => void
  onEditModeNameBlur: (id: string, field: string, value: string) => void
  onEditModeIdNumberChange: (id: string, value: string, index: number) => void
  onDateInput: (id: string, field: keyof OrderMember, value: string) => void
  onNumberInput: (id: string, field: keyof OrderMember, value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: string) => void
  onOpenEdit: (member: OrderMember, mode: 'edit' | 'verify') => void
  onPreviewImage: (member: OrderMember) => void
  onPnrBlur: (id: string, value: string) => void
  onCustomCostChange: (fieldId: string, memberId: string, value: string) => void
  onCompositionStart: () => void
  onCompositionEnd: (value: string, callback: (value: string) => void) => void
}

export function MemberTableRow(props: MemberTableRowProps) {
  const {
    member, index, isAllEditMode, showIdentityColumn, showRoomColumn, showPnrColumn,
    showOrderColumn, departureDate, roomAssignment, pnrValue, customCostFields,
    onDelete, onFieldChange, onEditModeNameChange, onEditModeNameBlur,
    onEditModeIdNumberChange, onDateInput, onNumberInput, onKeyDown,
    onOpenEdit, onPreviewImage, onPnrBlur, onCustomCostChange,
    onCompositionStart, onCompositionEnd,
  } = props

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>, callback: (value: string) => void) => {
    onCompositionEnd(e.currentTarget.value, callback)
  }

  const cellClass = (bg?: string) => cn(
    "border border-morandi-gold/20 px-2 py-1",
    bg || (isAllEditMode ? "bg-card" : "bg-muted")
  )

  const inputClass = "w-full bg-transparent text-xs border-none outline-none shadow-none focus:ring-0 text-morandi-primary"

  return (
    <tr className="group relative hover:bg-morandi-container/20 transition-colors">
      {showOrderColumn && (
        <td className={cn(cellClass(), "bg-status-info-bg text-center")}>
          <span className="text-xs text-status-info font-medium">{member.order_code || '-'}</span>
        </td>
      )}

      {showIdentityColumn && (
        <td className={cn(cellClass(), "text-center")}>
          {isAllEditMode ? (
            <input
              type="checkbox"
              checked={member.identity === '領隊'}
              onChange={e => onFieldChange(member.id, 'identity', e.target.checked ? '領隊' : '大人')}
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

      <td className={cellClass(isAllEditMode ? 'bg-card' : (member.customer_verification_status === 'unverified' ? 'bg-status-danger-bg' : 'bg-muted'))}>
        {isAllEditMode ? (
          <input
            type="text"
            value={member.chinese_name || ''}
            onChange={e => onEditModeNameChange(member.id, e.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={e => handleCompositionEnd(e, v => onEditModeNameChange(member.id, v))}
            onBlur={e => onEditModeNameBlur(member.id, 'chinese_name', e.target.value)}
            onKeyDown={e => onKeyDown(e, index, 'chinese_name')}
            data-member={member.id}
            data-field="chinese_name"
            className={inputClass}
            placeholder="輸入姓名，按 Enter 搜尋"
          />
        ) : (
          <div className="flex items-center gap-1">
            <span
              className={cn("flex-1 text-xs", member.customer_verification_status === 'unverified' ? 'text-status-danger font-medium' : 'text-morandi-primary')}
              title={member.customer_verification_status === 'unverified' ? '⚠️ 待驗證 - 請點擊編輯按鈕' : ''}
            >
              {member.chinese_name || '-'}
            </span>
            {member.passport_image_url && (
              <button type="button" onClick={() => onPreviewImage(member)} className="p-0.5 text-morandi-gold hover:text-morandi-gold/80 transition-colors" title="查看護照照片">
                <Eye size={12} />
              </button>
            )}
          </div>
        )}
      </td>

      <td className={cellClass()}>
        {isAllEditMode ? (
          <input type="text" value={member.passport_name || ''} onChange={e => onFieldChange(member.id, 'passport_name', e.target.value)} onCompositionStart={onCompositionStart} onCompositionEnd={e => handleCompositionEnd(e, v => onFieldChange(member.id, 'passport_name', v))} onKeyDown={e => onKeyDown(e, index, 'passport_name')} data-member={member.id} data-field="passport_name" className={inputClass} />
        ) : (
          <span className="text-xs text-morandi-primary">{member.passport_name || '-'}</span>
        )}
      </td>

      <td className={cellClass()}>
        {isAllEditMode ? (
          <input type="text" value={member.birth_date || ''} onChange={e => onDateInput(member.id, 'birth_date', e.target.value)} onKeyDown={e => onKeyDown(e, index, 'birth_date')} data-member={member.id} data-field="birth_date" className={inputClass} placeholder="YYYYMMDD" />
        ) : (
          <span className="text-xs text-morandi-primary">{member.birth_date || '-'}</span>
        )}
      </td>

      <td className={cn(cellClass(), "text-xs text-center")}>
        {isAllEditMode ? (
          <select value={member.gender || ''} onChange={e => onFieldChange(member.id, 'gender', e.target.value)} data-member={member.id} data-field="gender" className="w-full bg-transparent text-xs text-center border-none outline-none shadow-none">
            <option value="">-</option>
            <option value="M">男</option>
            <option value="F">女</option>
          </select>
        ) : (
          <span className="text-morandi-primary">{member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}</span>
        )}
      </td>

      <td className={cellClass()}>
        {isAllEditMode ? (
          <input type="text" value={member.id_number || ''} onChange={e => onEditModeIdNumberChange(member.id, e.target.value, index)} onBlur={e => onEditModeNameBlur(member.id, 'id_number', e.target.value)} onKeyDown={e => onKeyDown(e, index, 'id_number')} data-member={member.id} data-field="id_number" className={inputClass} placeholder="輸入身分證搜尋..." />
        ) : (
          <span className="text-xs text-morandi-primary">{member.id_number || '-'}</span>
        )}
      </td>

      <td className={cellClass()}>
        {isAllEditMode ? (
          <input type="text" value={member.passport_number || ''} onChange={e => onFieldChange(member.id, 'passport_number', e.target.value)} onKeyDown={e => onKeyDown(e, index, 'passport_number')} data-member={member.id} data-field="passport_number" className={inputClass} />
        ) : (
          <span className="text-xs text-morandi-primary">{member.passport_number || '-'}</span>
        )}
      </td>

      <td className={cellClass()}>
        {isAllEditMode ? (
          <input type="text" value={member.passport_expiry || ''} onChange={e => onDateInput(member.id, 'passport_expiry', e.target.value)} onKeyDown={e => onKeyDown(e, index, 'passport_expiry')} data-member={member.id} data-field="passport_expiry" className={inputClass} placeholder="YYYYMMDD" />
        ) : (
          (() => {
            const info = formatPassportExpiryWithStatus(member.passport_expiry, departureDate)
            return (
              <span className={cn("text-xs", info.className)}>
                {info.text}
                {info.statusLabel && <span className="ml-1 text-[10px] font-medium">({info.statusLabel})</span>}
              </span>
            )
          })()
        )}
      </td>

      <td className={cn(cellClass(), "bg-status-warning-bg")}>
        <input type="text" value={member.special_meal || ''} onChange={e => onFieldChange(member.id, 'special_meal', e.target.value)} onCompositionStart={onCompositionStart} onCompositionEnd={e => handleCompositionEnd(e, v => onFieldChange(member.id, 'special_meal', v))} onKeyDown={e => onKeyDown(e, index, 'special_meal')} data-member={member.id} data-field="special_meal" className={inputClass} />
      </td>

      <td className={cn(cellClass(), "bg-card")}>
        <input type="text" inputMode="numeric" value={member.total_payable || ''} onChange={e => onNumberInput(member.id, 'total_payable', e.target.value)} className={inputClass} />
      </td>

      <td className={cn(cellClass(), "bg-card")}>
        <input type="text" inputMode="numeric" value={member.deposit_amount || ''} onChange={e => onNumberInput(member.id, 'deposit_amount', e.target.value)} className={inputClass} />
      </td>

      <td className={cn(cellClass(), "bg-muted text-xs text-center text-morandi-secondary")}>
        {((member.total_payable || 0) - (member.deposit_amount || 0)).toLocaleString()}
      </td>

      <td className={cn(cellClass(), "bg-card")}>
        <input type="text" value={member.remarks || ''} onChange={e => onFieldChange(member.id, 'remarks', e.target.value)} onCompositionStart={onCompositionStart} onCompositionEnd={e => handleCompositionEnd(e, v => onFieldChange(member.id, 'remarks', v))} className={inputClass} />
      </td>

      {showRoomColumn && (
        <td className={cn(cellClass(), "bg-status-warning-bg")}>
          <span className="text-xs text-morandi-gold">{roomAssignment || '未分房'}</span>
        </td>
      )}

      {showPnrColumn && (
        <td className={cn(cellClass(), "bg-sky-50/50")}>
          <input type="text" value={pnrValue || ''} onChange={e => onFieldChange(member.id, 'pnr', e.target.value)} onBlur={e => onPnrBlur(member.id, e.target.value)} className={inputClass} placeholder="輸入 PNR" />
        </td>
      )}

      {customCostFields.map(field => (
        <td key={field.id} className={cn(cellClass(), "bg-emerald-50/50")}>
          <input type="text" value={field.values[member.id] || ''} onChange={e => onCustomCostChange(field.id, member.id, e.target.value)} className={inputClass} placeholder="輸入金額" />
        </td>
      ))}

      <td className={cn(cellClass(), "bg-card text-center")}>
        <div className="flex items-center justify-center gap-1">
          {member.customer_verification_status === 'unverified' && (
            <button onClick={() => onOpenEdit(member, 'verify')} className="text-status-warning hover:text-morandi-gold transition-colors p-1" title="待驗證 - 點擊驗證">
              <AlertTriangle size={14} />
            </button>
          )}
          <button onClick={() => onOpenEdit(member, 'edit')} className="text-morandi-blue hover:text-morandi-blue/80 transition-colors p-1" title="編輯成員">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(member.id)} className="text-morandi-secondary/50 hover:text-status-danger transition-colors p-1" title="刪除成員">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}
