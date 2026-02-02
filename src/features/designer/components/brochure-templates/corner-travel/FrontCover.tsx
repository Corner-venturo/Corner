/**
 * Corner Travel 封面頁
 * 
 * 封面跨頁的右頁，包含：
 * - 大圖片（幾乎滿版）
 * - 底部白色區塊
 * - 城市名稱（英文大字）
 * - 中文標題和日期
 */
import Image from 'next/image'
import type { PageProps } from './types'
import { pageStyle, COLORS } from './styles'

export function FrontCover({ data, className }: PageProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  const countryName = data.destination?.split(',')[1]?.trim().toUpperCase() || 'JAPAN'
  
  return (
    <div className={className} style={{ ...pageStyle, padding: 0 }}>
      {/* 主圖片 */}
      {data.coverImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${210 - 30}mm`,
            overflow: 'hidden',
          }}
        >
          <Image
            src={data.coverImage}
            alt="封面主圖"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      )}
      
      {/* 底部白色區塊 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30mm',
          backgroundColor: COLORS.white,
          padding: '4mm 8mm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* 左側：城市名 */}
        <div>
          <div
            style={{
              fontSize: '9pt',
              fontWeight: 500,
              letterSpacing: '1.5px',
              color: COLORS.gray,
              marginBottom: '2mm',
            }}
          >
            TRAVEL GUIDE FOR VISITING {countryName}
          </div>
          <div
            style={{
              fontSize: '36pt',
              fontWeight: 900,
              letterSpacing: '3px',
              color: COLORS.black,
              lineHeight: 1,
            }}
          >
            {cityName}
          </div>
        </div>
        
        {/* 右側：中文標題和日期 */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '11pt',
              fontWeight: 500,
              color: COLORS.black,
              marginBottom: '1mm',
            }}
          >
            {data.mainTitle || '日本東京行程手冊'}
          </div>
          <div
            style={{
              fontSize: '10pt',
              fontWeight: 400,
              color: COLORS.gray,
            }}
          >
            {data.travelDates || ''}
          </div>
        </div>
      </div>
    </div>
  )
}
