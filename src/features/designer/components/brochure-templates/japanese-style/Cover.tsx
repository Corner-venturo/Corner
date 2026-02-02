/**
 * 日系風格封面
 * 
 * 特點：簡約留白、圓拱形圖片、金色裝飾線
 */
'use client'

import Image from 'next/image'
import type { PageProps } from './types'
import { pageStyle, headerStyle, goldUnderline, COLORS } from './styles'

export function Cover({ data, className }: PageProps) {
  return (
    <div className={className} style={pageStyle}>
      {/* 公司名稱 */}
      <div style={{ ...headerStyle, marginTop: '15mm' }}>
        {data.companyName || 'Corner Travel'}
      </div>
      <div style={goldUnderline} />

      {/* 封面圖片區（圓拱形） */}
      <div
        style={{
          margin: '10mm auto',
          width: '100mm',
          height: '110mm',
          borderRadius: '50mm 50mm 4mm 4mm',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: COLORS.lightGray,
        }}
      >
        {data.coverImage ? (
          <Image src={data.coverImage} alt="" fill style={{ objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.gray,
              fontSize: '10pt',
            }}
          >
            封面圖片
          </div>
        )}
      </div>

      {/* 底部資訊 */}
      <div
        style={{
          position: 'absolute',
          bottom: '15mm',
          left: '8mm',
          right: '8mm',
          textAlign: 'center',
        }}
      >
        {/* 主標題 */}
        <div
          style={{
            fontSize: '18pt',
            fontWeight: 700,
            letterSpacing: '3px',
            marginBottom: '3mm',
          }}
        >
          {data.mainTitle || data.destination || '旅行手冊'}
        </div>

        {/* 副標題 */}
        {data.subTitle && (
          <div
            style={{
              fontSize: '10pt',
              color: COLORS.gray,
              marginBottom: '3mm',
            }}
          >
            {data.subTitle}
          </div>
        )}

        {/* 日期 */}
        <div
          style={{
            fontSize: '9pt',
            color: COLORS.gray,
            letterSpacing: '1px',
          }}
        >
          {data.travelDates}
        </div>
      </div>
    </div>
  )
}
