/**
 * Corner Travel 目錄跨頁
 * 
 * 左頁：行程索引、聯絡資訊
 * 右頁：航班資訊、行李規定
 */
'use client'

import type { PageProps } from './types'
import { pageStyle, headerStyle, dividerStyle, sectionTitleStyle, bodyTextStyle, pageNumberStyle, COLORS, A5_WIDTH_MM, A5_HEIGHT_MM } from './styles'

export function Toc({ data, pageNumber = 2, className }: PageProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  const dailyItineraries = data.dailyItineraries || []

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

        <div style={{ fontSize: '12pt', fontWeight: 700, marginBottom: '6mm' }}>
          INDEX｜行程規劃及索引
        </div>

        {/* 每日行程列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4mm' }}>
          {dailyItineraries.map((day, i) => (
            <div key={i}>
              <div style={{ fontSize: '10pt', fontWeight: 600, marginBottom: '1mm' }}>
                第{i + 1}天行程 DAY {i + 1}
              </div>
              <div style={bodyTextStyle}>{day.title}</div>
              {day.meals && (
                <div style={{ ...bodyTextStyle, fontSize: '7pt' }}>
                  {[
                    day.meals.breakfast && `早餐 ${day.meals.breakfast}`,
                    day.meals.lunch && `午餐 ${day.meals.lunch}`,
                    day.meals.dinner && `晚餐 ${day.meals.dinner}`,
                  ].filter(Boolean).join('　')}
                </div>
              )}
              {day.accommodation && (
                <div style={{ ...bodyTextStyle, fontSize: '7pt' }}>住宿 {day.accommodation}</div>
              )}
            </div>
          ))}
        </div>

        {/* 聯絡資訊 */}
        <div style={{ position: 'absolute', bottom: '8mm', left: '8mm' }}>
          <div style={sectionTitleStyle}>聯絡資訊 CONTACTS</div>
          <div style={bodyTextStyle}>
            <div>隨團人員｜{data.leaderName || '待確認'} {data.leaderPhone || ''}</div>
            <div>送機人員｜待確認</div>
          </div>
        </div>
      </div>

      {/* 右頁 */}
      <div style={pageStyle}>
        <div style={{ ...headerStyle, textAlign: 'right' }}>
          <div>{cityName} × JAPAN</div>
          <div>{data.mainTitle || '日本東京行程手冊'}</div>
        </div>
        <div style={{ ...dividerStyle, marginLeft: 'auto' }} />

        {/* 航班資訊 */}
        <div style={{ position: 'absolute', bottom: '45mm', left: '8mm', right: '8mm' }}>
          <div style={sectionTitleStyle}>航班資訊 FLIGHT</div>
          <div style={bodyTextStyle}>
            <div style={{ marginBottom: '2mm' }}>{data.outboundFlight || '去程航班待確認'}</div>
            <div>{data.returnFlight || '回程航班待確認'}</div>
          </div>
        </div>

        {/* 行李規定 */}
        <div style={{ position: 'absolute', bottom: '20mm', left: '8mm', right: '8mm' }}>
          <div style={sectionTitleStyle}>行李規定 BAGGAGE</div>
          <div style={{ ...bodyTextStyle, fontSize: '7pt' }}>
            手提行李 7kg・托運行李 23kg×2件
          </div>
        </div>

        <div style={{ ...pageNumberStyle, right: '8mm' }}>
          {String(pageNumber).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}
