/**
 * Corner Travel 封底頁
 * 
 * 封面跨頁的左頁，包含：
 * - 頂部標題
 * - 小圖片
 * - Slogan
 * - 公司資訊
 * - LINE QR Code
 */
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import type { PageProps } from './types'
import { pageStyle, headerStyle, bodyTextStyle, COLORS } from './styles'

export function BackCover({ data, className }: PageProps) {
  const destination = data.destination?.split(',')[1]?.trim().toUpperCase() || 'JAPAN'
  
  return (
    <div className={className} style={pageStyle}>
      {/* 頂部標題 */}
      <div style={headerStyle}>
        <div>TRAVEL GUIDE FOR VISITING</div>
        <div>{destination}</div>
      </div>
      
      {/* 小圖片區塊 */}
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
          <Image
            src={data.coverImage}
            alt="封面圖"
            fill
            style={{ objectFit: 'cover' }}
          />
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
          <div>{data.companyName || '角落旅行社股份有限公司'} CORNER TRAVEL AGENCY CO.</div>
          <div>{data.companyAddress || '10350 台北市大同區重慶北路一段67號8樓之2'}</div>
          <div>
            TEL {data.companyPhone || '+886 2 7751 6051'}
            ・FAX {data.companyFax || '+886 2 2552 1332'}
          </div>
        </div>
        
        {/* QR Code */}
        {data.lineQrCode ? (
          <QRCodeSVG
            value={data.lineQrCode}
            size={60}
            bgColor={COLORS.white}
            fgColor={COLORS.black}
          />
        ) : (
          <div
            style={{
              width: '15mm',
              height: '15mm',
              backgroundColor: COLORS.lightGray,
              border: `1px solid ${COLORS.gray}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6pt',
              color: COLORS.gray,
            }}
          >
            QR
          </div>
        )}
      </div>
    </div>
  )
}
