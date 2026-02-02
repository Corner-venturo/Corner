/**
 * 日系風格飯店頁
 */
'use client'

import Image from 'next/image'
import type { PageProps, HotelInfo } from './types'
import { pageStyle, sectionTitleStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

interface HotelProps extends PageProps {
  hotel: HotelInfo
}

export function Hotel({ hotel, pageNumber, className }: HotelProps) {
  return (
    <div className={className} style={pageStyle}>
      {/* 標題 */}
      <div
        style={{
          fontSize: '10pt',
          color: COLORS.gold,
          letterSpacing: '2px',
          marginBottom: '2mm',
        }}
      >
        ACCOMMODATION
      </div>
      <div
        style={{
          fontSize: '16pt',
          fontWeight: 700,
          marginBottom: '2mm',
        }}
      >
        {hotel.name}
      </div>
      {hotel.nameEn && (
        <div
          style={{
            fontSize: '9pt',
            color: COLORS.gray,
            marginBottom: '5mm',
          }}
        >
          {hotel.nameEn}
        </div>
      )}

      {/* 飯店圖片 */}
      {hotel.image && (
        <div
          style={{
            width: '100%',
            height: '60mm',
            position: 'relative',
            borderRadius: '3mm',
            overflow: 'hidden',
            marginBottom: '5mm',
          }}
        >
          <Image src={hotel.image} alt={hotel.name} fill style={{ objectFit: 'cover' }} />
        </div>
      )}

      {/* 飯店資訊 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm' }}>
        {hotel.address && (
          <div style={bodyTextStyle}>
            <span style={{ color: COLORS.gold, marginRight: '2mm' }}>📍</span>
            {hotel.address}
          </div>
        )}
        {hotel.phone && (
          <div style={bodyTextStyle}>
            <span style={{ color: COLORS.gold, marginRight: '2mm' }}>📞</span>
            {hotel.phone}
          </div>
        )}
        <div style={{ ...bodyTextStyle, display: 'flex', gap: '6mm' }}>
          {hotel.checkIn && <span>Check-in {hotel.checkIn}</span>}
          {hotel.checkOut && <span>Check-out {hotel.checkOut}</span>}
        </div>
        {hotel.nights && (
          <div
            style={{
              display: 'inline-block',
              padding: '1mm 3mm',
              backgroundColor: COLORS.gold,
              color: COLORS.white,
              borderRadius: '2mm',
              fontSize: '8pt',
              fontWeight: 600,
            }}
          >
            {hotel.nights} 晚
          </div>
        )}
      </div>

      {pageNumber && (
        <div style={{ ...pageNumberStyle, right: '8mm' }}>
          {String(pageNumber).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
