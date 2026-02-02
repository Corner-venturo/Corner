/**
 * 日系風格目錄頁
 */
'use client'

import type { PageProps } from './types'
import { pageStyle, sectionTitleStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

export function Toc({ data, pageNumber = 2, className }: PageProps) {
  const dailyItineraries = data.dailyItineraries || []

  return (
    <div className={className} style={pageStyle}>
      {/* 標題 */}
      <div
        style={{
          fontSize: '14pt',
          fontWeight: 700,
          textAlign: 'center',
          marginTop: '10mm',
          marginBottom: '8mm',
          letterSpacing: '2px',
        }}
      >
        INDEX
      </div>
      <div
        style={{
          fontSize: '10pt',
          textAlign: 'center',
          color: COLORS.gray,
          marginBottom: '10mm',
        }}
      >
        行程總覽
      </div>

      {/* 行程列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5mm' }}>
        {dailyItineraries.map((day, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '4mm',
              paddingBottom: '4mm',
              borderBottom: i < dailyItineraries.length - 1 ? `1px solid ${COLORS.lightGray}` : 'none',
            }}
          >
            {/* 天數 */}
            <div
              style={{
                width: '20mm',
                fontSize: '12pt',
                fontWeight: 700,
                color: COLORS.gold,
              }}
            >
              DAY {i + 1}
            </div>

            {/* 內容 */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '1mm' }}>
                {day.title}
              </div>
              {day.accommodation && (
                <div style={{ ...bodyTextStyle, fontSize: '8pt', color: COLORS.gray }}>
                  🏨 {day.accommodation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 聯絡資訊 */}
      <div
        style={{
          position: 'absolute',
          bottom: '15mm',
          left: '8mm',
          right: '8mm',
          padding: '4mm',
          backgroundColor: COLORS.lightGray,
          borderRadius: '2mm',
        }}
      >
        <div style={{ ...sectionTitleStyle, fontSize: '9pt' }}>聯絡資訊</div>
        <div style={{ ...bodyTextStyle, fontSize: '8pt' }}>
          領隊：{data.leaderName || '待確認'} {data.leaderPhone || ''}
        </div>
      </div>

      <div style={{ ...pageNumberStyle, right: '8mm' }}>
        {String(pageNumber).padStart(2, '0')}
      </div>
    </div>
  )
}
