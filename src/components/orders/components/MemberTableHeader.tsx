/**
 * MemberTableHeader - 成員表格標題列
 */

'use client'

import React from 'react'
import type { ColumnVisibility } from '../OrderMembersExpandable'

interface MemberTableHeaderProps {
  mode: 'order' | 'tour'
  orderCount: number
  showIdentityColumn: boolean
  showPnrColumn: boolean
  showRoomColumn: boolean
  showVehicleColumn: boolean
  customCostFields: Array<{ id: string; name: string; values: Record<string, string> }>
  columnVisibility?: ColumnVisibility
}

const thClass = "border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary bg-morandi-gold/10"
// 凍結欄位必須使用實色背景，避免滾動時內容穿透
// z-30: 比資料列凍結欄位(z-10)高，這樣向下滾動時表頭會在上面
const thStickyClass = "border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary bg-[#f0ebe3] sticky z-30"

export function MemberTableHeader({
  mode,
  orderCount,
  showIdentityColumn,
  showPnrColumn,
  showRoomColumn,
  showVehicleColumn,
  customCostFields,
  columnVisibility,
}: MemberTableHeaderProps) {
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
    pnr: false,
    ticket_number: true,  // 預設顯示機票號碼
    ticketing_deadline: false,
    flight_cost: false,   // 機票金額預設關閉
  }

  return (
    <thead className="sticky top-0 z-20 bg-[#f6f4f1]">
      <tr>
        {/* 凍結欄位：序號 */}
        <th className={`${thStickyClass} left-0 min-w-[40px]`}>序</th>

        {/* 凍結欄位：中文姓名 */}
        <th className={`${thStickyClass} left-[40px] min-w-[80px]`}>中文姓名</th>

        {/* 團體模式：訂單編號 */}
        {mode === 'tour' && orderCount > 1 && (
          <th className={`${thClass} min-w-[60px]`}>單號</th>
        )}

        {/* 可選：身份 */}
        {showIdentityColumn && (
          <th className={`${thClass} min-w-[60px]`}>身份</th>
        )}
        {cv.passport_name && <th className={`${thClass} min-w-[120px]`}>護照拼音</th>}
        {cv.birth_date && <th className={`${thClass} min-w-[100px]`}>出生年月日</th>}
        {cv.gender && <th className={`${thClass} min-w-[50px]`}>性別</th>}
        {cv.id_number && <th className={`${thClass} min-w-[100px]`}>身分證號</th>}

        {/* 護照資訊 */}
        {cv.passport_number && <th className={`${thClass} min-w-[100px]`}>護照號碼</th>}
        {cv.passport_expiry && <th className={`${thClass} min-w-[100px]`}>護照效期</th>}

        {/* 其他資訊 */}
        {cv.special_meal && <th className={`${thClass} min-w-[80px]`}>飲食禁忌</th>}

        {/* 金額 */}
        {cv.total_payable && <th className={`${thClass} min-w-[80px]`}>應付金額</th>}
        {cv.deposit_amount && <th className={`${thClass} min-w-[80px]`}>訂金</th>}
        {cv.balance && <th className={`${thClass} min-w-[80px]`}>尾款</th>}

        {/* 備註 */}
        {cv.remarks && <th className={`${thClass} min-w-[120px]`}>備註</th>}

        {/* 團體模式：分房 */}
        {mode === 'tour' && showRoomColumn && (
          <th className={`${thClass} min-w-[100px]`}>分房</th>
        )}

        {/* 團體模式：分車 */}
        {mode === 'tour' && showVehicleColumn && (
          <th className={`${thClass} min-w-[80px]`}>分車</th>
        )}

        {/* 團體模式：PNR */}
        {mode === 'tour' && showPnrColumn && (
          <th className={`${thClass} min-w-[80px]`}>PNR</th>
        )}

        {/* 團體模式：機票號碼 */}
        {mode === 'tour' && cv.ticket_number && (
          <th className={`${thClass} min-w-[120px]`}>機票號碼</th>
        )}

        {/* 團體模式：開票期限 */}
        {mode === 'tour' && cv.ticketing_deadline && (
          <th className={`${thClass} min-w-[100px]`}>開票期限</th>
        )}

        {/* 團體模式：機票金額 */}
        {mode === 'tour' && cv.flight_cost && (
          <th className={`${thClass} min-w-[100px]`}>機票金額</th>
        )}

        {/* 團體模式：自訂費用欄位 */}
        {mode === 'tour' && customCostFields.map(field => (
          <th key={field.id} className={`${thClass} min-w-[80px]`}>
            {field.name}
          </th>
        ))}

        {/* 操作 */}
        <th className={`${thClass} min-w-[80px] text-center`}>
          操作
        </th>
      </tr>
    </thead>
  )
}
