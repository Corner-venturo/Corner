/**
 * Corner Travel 封面跨頁
 * 
 * 左頁：封底（公司資訊、QR Code）
 * 右頁：封面（大圖、標題）
 */
'use client'

import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import type { PageProps } from './types'
import { pageStyle, headerStyle, bodyTextStyle, COLORS, A5_WIDTH_MM, A5_HEIGHT_MM } from './styles'

export function Cover({ data, className }: PageProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  const countryName = data.destination?.split(',')[1]?.trim().toUpperCase() || 'JAPAN'

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        width: `${A5_WIDTH_MM * 2}mm`,
        height: `${A5_HEIGHT_MM}mm`,
      }}
    >
      {/* 左頁：封底 */}
      <div style={pageStyle}>
        {/* 頂部標題 */}
        <div style={headerStyle}>
          <div>TRAVEL GUIDE FOR VISITING</div>
          <div>{countryName}</div>
        </div>

        {/* 小圖片 */}
        {data.coverImage && (
          <div
            style={{
              marginTop: '30mm',
              marginLeft: '12mm',
              width: '70mm',
              height: '80mm',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Image src={data.coverImage} alt="" fill style={{ objectFit: 'cover' }} />
          </div>
        )}

        {/* Slogan */}
        <div
          style={{
            marginTop: '8mm',
            marginLeft: '12mm',
            width: '70mm',
            textAlign: 'center',
            fontSize: '9pt',
            fontWeight: 500,
            letterSpacing: '2px',
          }}
        >
          EXPLORE EVERY CORNER OF THE WORLD
        </div>

        {/* 底部公司資訊 */}
        <div
          style={{
            position: 'absolute',
            bottom: '8mm',
            left: '8mm',
            right: '8mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={bodyTextStyle}>
            <div>{data.companyName || '角落旅行社股份有限公司'}</div>
            <div>{data.companyAddress || '10350 台北市大同區重慶北路一段67號8樓之2'}</div>
            <div>TEL {data.companyPhone || '+886 2 7751 6051'}</div>
          </div>
          {data.lineQrCode ? (
            <QRCodeSVG value={data.lineQrCode} size={50} />
          ) : (
            <div
              style={{
                width: '12mm',
                height: '12mm',
                backgroundColor: COLORS.lightGray,
                border: `1px solid ${COLORS.gray}`,
              }}
            />
          )}
        </div>
      </div>

      {/* 右頁：封面 */}
      <div style={{ ...pageStyle, padding: 0 }}>
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
            <Image src={data.coverImage} alt="" fill style={{ objectFit: 'cover' }} priority />
          </div>
        )}

        {/* 底部標題區 */}
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
          <div>
            <div style={{ fontSize: '9pt', color: COLORS.gray, letterSpacing: '1.5px' }}>
              TRAVEL GUIDE FOR VISITING {countryName}
            </div>
            <div style={{ fontSize: '36pt', fontWeight: 900, letterSpacing: '3px' }}>
              {cityName}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11pt', fontWeight: 500 }}>
              {data.mainTitle || '日本東京行程手冊'}
            </div>
            <div style={{ fontSize: '10pt', color: COLORS.gray }}>
              {data.travelDates}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
