/**
 * Corner Travel 每日行程頁（右頁）
 * 
 * 包含：
 * - 頂部標題（右對齊）
 * - 景點圖片
 * - 住宿資訊
 */
import Image from 'next/image'
import type { PageProps, DailyItinerary } from './types'
import { pageStyle, headerStyle, dividerStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

interface DailyRightProps extends PageProps {
  day: DailyItinerary
  dayIndex: number
  attractionImage?: string
}

export function DailyRight({ data, day, dayIndex, attractionImage, pageNumber, className }: DailyRightProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  
  return (
    <div className={className} style={pageStyle}>
      {/* 頂部標題（右對齊） */}
      <div style={{ ...headerStyle, textAlign: 'right' }}>
        <div>{cityName} × JAPAN</div>
        <div>{data.mainTitle || '日本東京行程手冊'}</div>
      </div>
      
      {/* 分隔線（右對齊） */}
      <div style={{ ...dividerStyle, marginLeft: 'auto' }} />
      
      {/* 景點圖片區塊 */}
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
          <Image
            src={attractionImage}
            alt="景點圖片"
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
      
      {/* 住宿區塊 */}
      <div
        style={{
          position: 'absolute',
          bottom: '8mm',
          left: '8mm',
          right: '8mm',
        }}
      >
        <div
          style={{
            fontSize: '9pt',
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginBottom: '2mm',
          }}
        >
          住宿安排 ACCOMMODATION
        </div>
        <div style={bodyTextStyle}>
          {day.accommodation || '敬請參閱確認單'}
        </div>
      </div>
      
      {/* 頁碼 */}
      {pageNumber && (
        <div style={{ ...pageNumberStyle, right: '8mm' }}>
          {String(pageNumber).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
