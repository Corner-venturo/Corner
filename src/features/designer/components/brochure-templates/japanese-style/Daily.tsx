/**
 * 日系風格每日行程頁
 */
'use client'

import Image from 'next/image'
import type { PageProps, DailyItinerary } from './types'
import { pageStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

interface DailyProps extends PageProps {
  day: DailyItinerary
  dayIndex: number
  image?: string
}

export function Daily({ data, day, dayIndex, image, pageNumber, className }: DailyProps) {
  const pageNum = pageNumber || dayIndex + 3

  return (
    <div className={className} style={pageStyle}>
      {/* 天數標題 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '3mm',
          marginBottom: '4mm',
        }}
      >
        <div
          style={{
            fontSize: '24pt',
            fontWeight: 800,
            color: COLORS.gold,
          }}
        >
          {String(dayIndex + 1).padStart(2, '0')}
        </div>
        <div style={{ fontSize: '10pt', color: COLORS.gray }}>
          DAY {dayIndex + 1}
        </div>
        {day.date && (
          <div style={{ fontSize: '9pt', color: COLORS.gray }}>
            {day.date}
          </div>
        )}
      </div>

      {/* 行程標題 */}
      <div
        style={{
          fontSize: '13pt',
          fontWeight: 700,
          marginBottom: '6mm',
          paddingBottom: '3mm',
          borderBottom: `2px solid ${COLORS.gold}`,
        }}
      >
        {day.title}
      </div>

      {/* 圖片 */}
      {image && (
        <div
          style={{
            width: '100%',
            height: '50mm',
            position: 'relative',
            borderRadius: '3mm',
            overflow: 'hidden',
            marginBottom: '5mm',
          }}
        >
          <Image src={image} alt="" fill style={{ objectFit: 'cover' }} />
        </div>
      )}

      {/* 活動列表 */}
      {day.activities && day.activities.length > 0 && (
        <div style={{ marginBottom: '5mm' }}>
          {day.activities.map((activity, i) => (
            <div
              key={i}
              style={{
                ...bodyTextStyle,
                display: 'flex',
                gap: '2mm',
                marginBottom: '2mm',
              }}
            >
              <span style={{ color: COLORS.gold }}>●</span>
              {activity}
            </div>
          ))}
        </div>
      )}

      {/* 餐食 */}
      <div
        style={{
          position: 'absolute',
          bottom: '25mm',
          left: '8mm',
          right: '8mm',
        }}
      >
        <div style={{ fontSize: '9pt', fontWeight: 600, marginBottom: '2mm', color: COLORS.gold }}>
          餐食
        </div>
        <div style={{ ...bodyTextStyle, fontSize: '8pt', display: 'flex', gap: '4mm' }}>
          <span>早｜{day.meals?.breakfast || '敬請自理'}</span>
          <span>午｜{day.meals?.lunch || '敬請自理'}</span>
          <span>晚｜{day.meals?.dinner || '敬請自理'}</span>
        </div>
      </div>

      {/* 住宿 */}
      <div
        style={{
          position: 'absolute',
          bottom: '12mm',
          left: '8mm',
          right: '8mm',
        }}
      >
        <div style={{ fontSize: '9pt', fontWeight: 600, marginBottom: '1mm', color: COLORS.gold }}>
          住宿
        </div>
        <div style={{ ...bodyTextStyle, fontSize: '8pt' }}>
          {day.accommodation || '敬請參閱確認單'}
        </div>
      </div>

      <div style={{ ...pageNumberStyle, right: '8mm' }}>
        {String(pageNum).padStart(2, '0')}
      </div>
    </div>
  )
}
