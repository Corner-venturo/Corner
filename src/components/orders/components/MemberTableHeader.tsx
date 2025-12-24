/**
 * MemberTableHeader - 成員表格標題列
 */

'use client'

import React from 'react'

interface MemberTableHeaderProps {
  mode: 'order' | 'tour'
  orderCount: number
  showIdentityColumn: boolean
  showPnrColumn: boolean
  showRoomColumn: boolean
  customCostFields: Array<{ id: string; name: string; values: Record<string, string> }>
}

export function MemberTableHeader({
  mode,
  orderCount,
  showIdentityColumn,
  showPnrColumn,
  showRoomColumn,
  customCostFields,
}: MemberTableHeaderProps) {
  return (
    <thead className="sticky top-0 bg-morandi-gold/10 z-10">
      <tr>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[40px]">序</th>

        {/* 團體模式：訂單編號 */}
        {mode === 'tour' && orderCount > 1 && (
          <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[60px]">單號</th>
        )}

        {/* 可選：身份 */}
        {showIdentityColumn && (
          <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[60px]">身份</th>
        )}

        {/* 基本資訊 */}
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]">中文姓名</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[120px]">護照拼音</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[100px]">出生年月日</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[50px]">性別</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[100px]">身分證號</th>

        {/* 護照資訊 */}
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[100px]">護照號碼</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[100px]">護照效期</th>

        {/* 其他資訊 */}
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]">飲食禁忌</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]">訂房代號</th>

        {/* 金額 */}
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]">應付金額</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]">訂金</th>
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]">尾款</th>

        {/* 備註 */}
        <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[120px]">備註</th>

        {/* 團體模式：分房 */}
        {mode === 'tour' && showRoomColumn && (
          <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[100px]">分房</th>
        )}

        {/* 團體模式：PNR */}
        {mode === 'tour' && showPnrColumn && (
          <th className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]">PNR</th>
        )}

        {/* 團體模式：自訂費用欄位 */}
        {mode === 'tour' && customCostFields.map(field => (
          <th
            key={field.id}
            className="border border-morandi-gold/20 px-2 py-2 text-left text-xs font-medium text-morandi-primary min-w-[80px]"
          >
            {field.name}
          </th>
        ))}

        {/* 操作 */}
        <th className="border border-morandi-gold/20 px-2 py-2 text-center text-xs font-medium text-morandi-primary sticky right-0 bg-morandi-gold/10 min-w-[120px]">
          操作
        </th>
      </tr>
    </thead>
  )
}
