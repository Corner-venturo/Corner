/**
 * QuickQuoteItemsTable - 收費明細表
 */

'use client'

import React from 'react'
import { QuickQuoteItem } from '@/types/quote.types'
import { MORANDI_COLORS, TABLE_STYLES } from '../shared/print-styles'

interface QuickQuoteItemsTableProps {
  items: QuickQuoteItem[]
}

export const QuickQuoteItemsTable: React.FC<QuickQuoteItemsTableProps> = ({ items }) => {
  return (
    <>
      <div className="mb-2">
        <h3 className="text-lg font-semibold" style={{ color: MORANDI_COLORS.brown }}>
          收費明細表 ▽
        </h3>
      </div>

      <table className="w-full mb-6 text-sm" style={TABLE_STYLES}>
        <thead>
          <tr style={{ backgroundColor: MORANDI_COLORS.lightBrown }}>
            <th
              className="px-3 py-2 text-left"
              style={{
                width: '35%',
                borderBottom: `1px solid ${MORANDI_COLORS.border}`,
                color: MORANDI_COLORS.brown,
                fontWeight: 600,
              }}
            >
              摘要
            </th>
            <th
              className="px-3 py-2 text-center"
              style={{
                width: '10%',
                borderBottom: `1px solid ${MORANDI_COLORS.border}`,
                borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                color: MORANDI_COLORS.brown,
                fontWeight: 600,
              }}
            >
              人數
            </th>
            <th
              className="px-3 py-2 text-center"
              style={{
                width: '15%',
                borderBottom: `1px solid ${MORANDI_COLORS.border}`,
                borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                color: MORANDI_COLORS.brown,
                fontWeight: 600,
              }}
            >
              單價
            </th>
            <th
              className="px-3 py-2 text-center"
              style={{
                width: '15%',
                borderBottom: `1px solid ${MORANDI_COLORS.border}`,
                borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                color: MORANDI_COLORS.brown,
                fontWeight: 600,
              }}
            >
              金額
            </th>
            <th
              className="px-3 py-2 text-left"
              style={{
                width: '25%',
                borderBottom: `1px solid ${MORANDI_COLORS.border}`,
                borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                color: MORANDI_COLORS.brown,
                fontWeight: 600,
              }}
            >
              備註
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="h-8">
              <td
                className="px-2 py-1"
                style={{
                  borderBottom: index === items.length - 1 ? 'none' : `1px solid ${MORANDI_COLORS.border}`,
                  color: MORANDI_COLORS.gray,
                }}
              >
                {item.description || '\u00A0'}
              </td>
              <td
                className="px-2 py-1 text-center"
                style={{
                  borderBottom: index === items.length - 1 ? 'none' : `1px solid ${MORANDI_COLORS.border}`,
                  borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                  color: MORANDI_COLORS.gray,
                }}
              >
                {item.quantity && item.quantity !== 0 ? item.quantity : '\u00A0'}
              </td>
              <td
                className="px-2 py-1 text-right"
                style={{
                  borderBottom: index === items.length - 1 ? 'none' : `1px solid ${MORANDI_COLORS.border}`,
                  borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                  color: MORANDI_COLORS.gray,
                }}
              >
                {item.unit_price && item.unit_price !== 0
                  ? (item.unit_price || 0).toLocaleString()
                  : '\u00A0'}
              </td>
              <td
                className="px-2 py-1 text-right"
                style={{
                  borderBottom: index === items.length - 1 ? 'none' : `1px solid ${MORANDI_COLORS.border}`,
                  borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                  color: MORANDI_COLORS.brown,
                  fontWeight: 600,
                }}
              >
                {item.amount && item.amount !== 0 ? (item.amount || 0).toLocaleString() : '\u00A0'}
              </td>
              <td
                className="px-2 py-1"
                style={{
                  borderBottom: index === items.length - 1 ? 'none' : `1px solid ${MORANDI_COLORS.border}`,
                  borderLeft: `1px solid ${MORANDI_COLORS.border}`,
                  color: MORANDI_COLORS.gray,
                }}
              >
                {item.notes || '\u00A0'}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-3 py-8 text-center"
                style={{ color: MORANDI_COLORS.lightGray }}
              >
                尚無收費項目
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
