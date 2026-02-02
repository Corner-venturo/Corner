/**
 * Corner Travel 目錄頁（右頁）
 * 
 * 包含：
 * - 頂部標題（右對齊）
 * - 航班資訊
 * - 頁碼
 */
import type { PageProps } from './types'
import { pageStyle, headerStyle, dividerStyle, sectionTitleStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

export function TocRight({ data, pageNumber = 2, className }: PageProps) {
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
      
      {/* 航班資訊區塊 */}
      <div
        style={{
          position: 'absolute',
          bottom: '45mm',
          left: '8mm',
          right: '8mm',
        }}
      >
        <div style={sectionTitleStyle}>航班資訊 FLIGHT</div>
        <div style={bodyTextStyle}>
          <div style={{ marginBottom: '2mm' }}>
            {data.outboundFlight || '去程航班待確認'}
          </div>
          <div>
            {data.returnFlight || '回程航班待確認'}
          </div>
        </div>
      </div>
      
      {/* 行李規定（可選） */}
      <div
        style={{
          position: 'absolute',
          bottom: '20mm',
          left: '8mm',
          right: '8mm',
        }}
      >
        <div style={sectionTitleStyle}>行李規定 BAGGAGE</div>
        <div style={{ ...bodyTextStyle, fontSize: '7pt' }}>
          手提行李 7kg・托運行李 23kg×2件
        </div>
      </div>
      
      {/* 頁碼 */}
      <div style={{ ...pageNumberStyle, right: '8mm' }}>
        {String(pageNumber).padStart(2, '0')}
      </div>
    </div>
  )
}
