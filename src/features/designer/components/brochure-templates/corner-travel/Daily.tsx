/**
 * Corner Travel 每日行程跨頁
 * 
 * 左頁：天數標題、行程內容、餐食
 * 右頁：景點圖片、住宿資訊
 */
'use client'

import Image from 'next/image'
import type { PageProps, DailyItinerary } from './types'
import { pageStyle, headerStyle, dividerStyle, bodyTextStyle, pageNumberStyle, COLORS, A5_WIDTH_MM, A5_HEIGHT_MM } from './styles'

interface DailyProps extends PageProps {
  day: DailyItinerary
  dayIndex: number
  attractionImage?: string
}

export function Daily({ data, day, dayIndex, attractionImage, pageNumber, className }: DailyProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  const leftPageNum = pageNumber || (dayIndex + 1) * 2 + 1
  const rightPageNum = leftPageNum + 1

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        width: `${A5_WIDTH_MM * 2}mm`,
        height: `${A5_HEIGHT_MM}mm`,
      }}
    >
      {/* 左頁 */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div>TRAVEL GUIDE FOR VISITING JAPAN</div>
          <div>{cityName}</div>
        </div>
        <div style={dividerStyle} />

        <div style={{ fontSize: '24pt', fontWeight: 900, letterSpacing: '2px', marginBottom: '2mm' }}>
          DAY {dayIndex + 1}
        </div>
        <div style={{ fontSize: '11pt', fontWeight: 600, marginBottom: '6mm' }}>
          第{dayIndex + 1}天行程
        </div>

        <div style={{ ...bodyTextStyle, marginBottom: '8mm' }}>{day.title}</div>

        {/* 餐食 */}
        <div style={{ position: 'absolute', bottom: '8mm', left: '8mm', right: '8mm' }}>
          <div style={{ fontSize: '9pt', fontWeight: 600, marginBottom: '2mm' }}>餐食安排 MEALS</div>
          <div style={{ ...bodyTextStyle, display: 'flex', gap: '6mm' }}>
            <div><b>早餐</b> {day.meals?.breakfast || '敬請自理'}</div>
            <div><b>午餐</b> {day.meals?.lunch || '敬請自理'}</div>
            <div><b>晚餐</b> {day.meals?.dinner || '敬請自理'}</div>
          </div>
        </div>

        <div style={{ ...pageNumberStyle, left: '8mm' }}>{String(leftPageNum).padStart(2, '0')}</div>
      </div>

      {/* 右頁 */}
      <div style={pageStyle}>
        <div style={{ ...headerStyle, textAlign: 'right' }}>
          <div>{cityName} × JAPAN</div>
          <div>{data.mainTitle || '日本東京行程手冊'}</div>
        </div>
        <div style={{ ...dividerStyle, marginLeft: 'auto' }} />

        {/* 景點圖片 */}
        {attractionImage && (
          <div
            style={{
              marginTop: '4mm',
              width: '100%',
              height: '80mm',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '2mm',
            }}
          >
            <Image src={attractionImage} alt="" fill style={{ objectFit: 'cover' }} />
          </div>
        )}

        {/* 住宿 */}
        <div style={{ position: 'absolute', bottom: '8mm', left: '8mm', right: '8mm' }}>
          <div style={{ fontSize: '9pt', fontWeight: 600, marginBottom: '2mm' }}>住宿安排 ACCOMMODATION</div>
          <div style={bodyTextStyle}>{day.accommodation || '敬請參閱確認單'}</div>
        </div>

        <div style={{ ...pageNumberStyle, right: '8mm' }}>{String(rightPageNum).padStart(2, '0')}</div>
      </div>
    </div>
  )
}
