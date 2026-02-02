/**
 * Corner Travel 每日行程頁（左頁）
 * 
 * 包含：
 * - 頂部標題
 * - 當日景點列表
 * - 餐食資訊
 */
import type { PageProps, DailyItinerary } from './types'
import { pageStyle, headerStyle, dividerStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

interface DailyLeftProps extends PageProps {
  day: DailyItinerary
  dayIndex: number
}

export function DailyLeft({ data, day, dayIndex, pageNumber, className }: DailyLeftProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  
  return (
    <div className={className} style={pageStyle}>
      {/* 頂部標題 */}
      <div style={headerStyle}>
        <div>TRAVEL GUIDE FOR VISITING JAPAN</div>
        <div>{cityName}</div>
      </div>
      
      {/* 分隔線 */}
      <div style={dividerStyle} />
      
      {/* 天數大標題 */}
      <div
        style={{
          fontSize: '24pt',
          fontWeight: 900,
          letterSpacing: '2px',
          color: COLORS.black,
          marginBottom: '2mm',
        }}
      >
        DAY {dayIndex + 1}
      </div>
      
      {/* 中文標題 */}
      <div
        style={{
          fontSize: '11pt',
          fontWeight: 600,
          color: COLORS.black,
          marginBottom: '6mm',
        }}
      >
        第{dayIndex + 1}天行程
      </div>
      
      {/* 行程內容 */}
      <div style={{ ...bodyTextStyle, marginBottom: '8mm' }}>
        {day.title}
      </div>
      
      {/* 餐食區塊 */}
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
          餐食安排 MEALS
        </div>
        <div style={{ ...bodyTextStyle, display: 'flex', gap: '6mm' }}>
          <div>
            <span style={{ color: COLORS.black, fontWeight: 500 }}>早餐</span>{' '}
            {day.meals?.breakfast || '敬請自理'}
          </div>
          <div>
            <span style={{ color: COLORS.black, fontWeight: 500 }}>午餐</span>{' '}
            {day.meals?.lunch || '敬請自理'}
          </div>
          <div>
            <span style={{ color: COLORS.black, fontWeight: 500 }}>晚餐</span>{' '}
            {day.meals?.dinner || '敬請自理'}
          </div>
        </div>
      </div>
      
      {/* 頁碼 */}
      {pageNumber && (
        <div style={{ ...pageNumberStyle, left: '8mm' }}>
          {String(pageNumber).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
