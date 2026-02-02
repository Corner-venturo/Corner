/**
 * Corner Travel 目錄頁（左頁）
 * 
 * 包含：
 * - 頂部標題
 * - 行程索引列表
 * - 聯絡資訊
 */
import type { PageProps } from './types'
import { pageStyle, headerStyle, dividerStyle, sectionTitleStyle, bodyTextStyle, COLORS } from './styles'

export function TocLeft({ data, className }: PageProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  const dailyItineraries = data.dailyItineraries || []
  
  return (
    <div className={className} style={pageStyle}>
      {/* 頂部標題 */}
      <div style={headerStyle}>
        <div>TRAVEL GUIDE FOR VISITING JAPAN</div>
        <div>{cityName}</div>
      </div>
      
      {/* 分隔線 */}
      <div style={dividerStyle} />
      
      {/* INDEX 標題 */}
      <div
        style={{
          fontSize: '12pt',
          fontWeight: 700,
          letterSpacing: '1px',
          marginBottom: '6mm',
        }}
      >
        INDEX｜行程規劃及索引
      </div>
      
      {/* 每日行程列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5mm' }}>
        {dailyItineraries.map((day, index) => (
          <div key={index}>
            {/* 天數標題 */}
            <div
              style={{
                fontSize: '10pt',
                fontWeight: 600,
                letterSpacing: '0.5px',
                marginBottom: '1mm',
              }}
            >
              第{index + 1}天行程 DAY {index + 1}
            </div>
            
            {/* 行程內容 */}
            <div style={{ ...bodyTextStyle, marginBottom: '1mm' }}>
              {day.title}
            </div>
            
            {/* 餐食資訊 */}
            {day.meals && (
              <div style={{ ...bodyTextStyle, fontSize: '7pt' }}>
                {[
                  day.meals.breakfast && `早餐 ${day.meals.breakfast}`,
                  day.meals.lunch && `午餐 ${day.meals.lunch}`,
                  day.meals.dinner && `晚餐 ${day.meals.dinner}`,
                ].filter(Boolean).join('　')}
              </div>
            )}
            
            {/* 住宿資訊 */}
            {day.accommodation && (
              <div style={{ ...bodyTextStyle, fontSize: '7pt' }}>
                住宿 {day.accommodation}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 底部聯絡資訊 */}
      <div
        style={{
          position: 'absolute',
          bottom: '8mm',
          left: '8mm',
        }}
      >
        <div style={sectionTitleStyle}>聯絡資訊 CONTACTS</div>
        <div style={bodyTextStyle}>
          <div>隨團人員｜{data.leaderName || '待確認'} {data.leaderPhone || ''}</div>
          <div>送機人員｜待確認</div>
        </div>
      </div>
    </div>
  )
}
