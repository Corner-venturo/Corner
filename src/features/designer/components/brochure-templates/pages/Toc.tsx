/**
 * 目錄頁
 */
'use client'

import { Page } from '../primitives/Page'
import { Text } from '../primitives/Text'
import { DaySchedule } from '../blocks/DaySchedule'
import type { PageProps } from '../types'

export function Toc({ data, theme, size, pageNumber = 2, className }: PageProps) {
  const dailyItineraries = data.dailyItineraries || []

  return (
    <Page theme={theme} size={size} className={className}>
      {/* 標題 */}
      <Text theme={theme} variant="h2" align="center" style={{ marginTop: '10mm', marginBottom: '2mm' }}>
        INDEX
      </Text>
      <Text theme={theme} variant="body" align="center" color="muted" style={{ marginBottom: '10mm' }}>
        行程總覽
      </Text>

      {/* 行程列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5mm' }}>
        {dailyItineraries.map((day, i) => (
          <div
            key={i}
            style={{
              paddingBottom: '4mm',
              borderBottom: i < dailyItineraries.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
            }}
          >
            <DaySchedule theme={theme} day={day} compact />
          </div>
        ))}
      </div>

      {/* 聯絡資訊 */}
      <div
        style={{
          position: 'absolute',
          bottom: '15mm',
          left: theme.spacing.page,
          right: theme.spacing.page,
          padding: '4mm',
          backgroundColor: theme.colors.surface,
          borderRadius: '2mm',
        }}
      >
        <Text theme={theme} variant="caption" style={{ fontWeight: 600, marginBottom: '2mm' }}>
          聯絡資訊
        </Text>
        <Text theme={theme} variant="caption">
          領隊：{data.leaderName || '待確認'} {data.leaderPhone || ''}
        </Text>
      </div>

      {/* 頁碼 */}
      <Text
        theme={theme}
        variant="caption"
        color="muted"
        style={{ position: 'absolute', bottom: '6mm', right: theme.spacing.page }}
      >
        {String(pageNumber).padStart(2, '0')}
      </Text>
    </Page>
  )
}
