/**
 * Corner 風格入住憑證組件
 * 用於生成住宿憑證 PDF
 */

'use client'

import React from 'react'

// Corner 品牌色系
const CORNER_COLORS = {
  orange: '#F89A1E', // Corner 橘色
  gold: '#D4AF37',   // 金色（次要）
  brown: '#6B5B4F',  // 深棕色
  lightBrown: '#FAF7F2', // 淺棕背景
  gray: '#4B5563',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
}

interface HotelVoucherData {
  // 確認資訊
  confirmation_number: string
  pin_code: string
  order_number: string

  // 酒店資訊
  hotel_name: string
  hotel_address: string
  hotel_phone: string
  hotel_image?: string

  // 入住資訊
  check_in_date: string
  check_in_day: string
  check_in_time: string
  check_out_date: string
  check_out_day: string
  check_out_time: string
  rooms: number
  nights: number

  // 房型資訊
  room_type: string
  guest_names: string[]
  max_occupancy: string
  bed_type: string
  meal_plan: string
  room_facilities: string[]
}

interface CornerHotelVoucherProps {
  data: HotelVoucherData
  language?: 'zh' | 'ja'
}

export const CornerHotelVoucher: React.FC<CornerHotelVoucherProps> = ({ data, language = 'zh' }) => {
  const labels = {
    zh: {
      title: '入住憑證',
      subtitle: 'HOTEL VOUCHER',
      confirmation: '確認編號：',
      pin: 'PIN 碼：',
      pinNote: '(請勿透露)',
      order: '訂單編號：',
      checkIn: '入住時間',
      checkOut: '退房時間',
      rooms: '房間數量 / 晚數',
      hotelTime: '飯店當地時間',
      guestName: '旅客姓名',
      maxOccupancy: '可入住人數（每間房）',
      roomInfo: '房間資訊',
      meal: '餐點',
      facilities: '房間設施',
      slogan: '如果可以，讓我們一起探索世界的每個角落',
      company: '角落旅行社股份有限公司',
    },
    ja: {
      title: '予約確認書',
      subtitle: 'HOTEL VOUCHER',
      confirmation: '確認番号：',
      pin: '確認キー：',
      pinNote: '(他人に共有しないでください)',
      order: '予約番号：',
      checkIn: 'チェックイン',
      checkOut: 'チェックアウト',
      rooms: '客室数 / 泊数',
      hotelTime: 'ホテル現地時間',
      guestName: '宿泊者姓名',
      maxOccupancy: '定員（1室につき）',
      roomInfo: '客室情報',
      meal: '食事',
      facilities: '客室備品',
      slogan: '如果可以，讓我們一起探索世界的每個角落',
      company: '角落旅行社股份有限公司',
    },
  }

  const t = labels[language]
  return (
    <div style={{
      padding: '0',
      backgroundColor: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif',
      fontSize: '11pt',
      color: CORNER_COLORS.gray,
      lineHeight: 1.6,
    }}>
      {/* 頁首 - Corner Logo + 標題 */}
      <div style={{
        borderBottom: `2px solid ${CORNER_COLORS.orange}`,
        paddingBottom: '12px',
        marginBottom: '20px',
        position: 'relative',
      }}>
        {/* Logo - 左上角 */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
        }}>
          <img
            src="/corner-logo.png"
            alt="Corner Travel"
            style={{
              height: '35px',
              width: 'auto',
            }}
          />
        </div>

        {/* 標題 - 右側 */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '18pt',
            fontWeight: 'bold',
            color: CORNER_COLORS.brown,
            marginBottom: '4px',
          }}>
            {t.title}
          </div>
          <div style={{
            fontSize: '9pt',
            color: CORNER_COLORS.lightGray,
            letterSpacing: '2px',
          }}>
            {t.subtitle}
          </div>
        </div>
      </div>

      {/* 確認資訊 */}
      <div style={{
        backgroundColor: CORNER_COLORS.lightBrown,
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        borderLeft: `4px solid ${CORNER_COLORS.orange}`,
      }}>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: CORNER_COLORS.brown, fontWeight: '600' }}>{t.confirmation}</span>
          <span style={{ color: CORNER_COLORS.orange, fontWeight: 'bold', fontSize: '12pt' }}>
            {data.confirmation_number}
          </span>
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: CORNER_COLORS.brown, fontWeight: '600' }}>{t.pin}</span>
          <span style={{ fontWeight: 'bold' }}>{data.pin_code}</span>
          <span style={{ color: CORNER_COLORS.lightGray, fontSize: '9pt', marginLeft: '8px' }}>
            {t.pinNote}
          </span>
        </div>
        <div>
          <span style={{ color: CORNER_COLORS.brown, fontWeight: '600' }}>{t.order}</span>
          <span>{data.order_number}</span>
        </div>
      </div>

      {/* 酒店資訊 */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        border: `1px solid ${CORNER_COLORS.border}`,
        borderRadius: '8px',
      }}>
        {data.hotel_image && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={data.hotel_image}
              alt={data.hotel_name}
              style={{
                width: '120px',
                height: '90px',
                objectFit: 'cover',
                borderRadius: '6px',
              }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '14pt',
            fontWeight: 'bold',
            color: CORNER_COLORS.brown,
          }}>
            {data.hotel_name}
          </h2>
          <div style={{ fontSize: '10pt', color: CORNER_COLORS.gray, marginBottom: '4px' }}>
            📍 {data.hotel_address}
          </div>
          <div style={{ fontSize: '10pt', color: CORNER_COLORS.gray }}>
            📞 {data.hotel_phone}
          </div>
        </div>
      </div>

      {/* 入住資訊表格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* 入住時間 */}
        <div style={{
          padding: '16px',
          backgroundColor: CORNER_COLORS.lightBrown,
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '9pt',
            color: CORNER_COLORS.lightGray,
            marginBottom: '8px',
            fontWeight: '600',
          }}>
            {t.checkIn}
          </div>
          <div style={{
            fontSize: '15pt',
            fontWeight: 'bold',
            color: CORNER_COLORS.brown,
            marginBottom: '4px',
          }}>
            {data.check_in_date}
          </div>
          <div style={{ fontSize: '9pt', color: CORNER_COLORS.gray, marginBottom: '4px' }}>
            {data.check_in_day}
          </div>
          <div style={{ fontSize: '10pt', color: CORNER_COLORS.orange, fontWeight: '600' }}>
            {data.check_in_time}
          </div>
          <div style={{ fontSize: '8pt', color: CORNER_COLORS.lightGray, marginTop: '2px' }}>
            {t.hotelTime}
          </div>
        </div>

        {/* 退房時間 */}
        <div style={{
          padding: '16px',
          backgroundColor: CORNER_COLORS.lightBrown,
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '9pt',
            color: CORNER_COLORS.lightGray,
            marginBottom: '8px',
            fontWeight: '600',
          }}>
            {t.checkOut}
          </div>
          <div style={{
            fontSize: '15pt',
            fontWeight: 'bold',
            color: CORNER_COLORS.brown,
            marginBottom: '4px',
          }}>
            {data.check_out_date}
          </div>
          <div style={{ fontSize: '9pt', color: CORNER_COLORS.gray, marginBottom: '4px' }}>
            {data.check_out_day}
          </div>
          <div style={{ fontSize: '10pt', color: CORNER_COLORS.orange, fontWeight: '600' }}>
            {data.check_out_time}
          </div>
          <div style={{ fontSize: '8pt', color: CORNER_COLORS.lightGray, marginTop: '2px' }}>
            {t.hotelTime}
          </div>
        </div>

        {/* 房間數量 / 晚數 */}
        <div style={{
          padding: '16px',
          backgroundColor: CORNER_COLORS.lightBrown,
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '9pt',
            color: CORNER_COLORS.lightGray,
            marginBottom: '8px',
            fontWeight: '600',
          }}>
            {t.rooms}
          </div>
          <div style={{
            fontSize: '28pt',
            fontWeight: 'bold',
            color: CORNER_COLORS.orange,
            lineHeight: 1,
          }}>
            {data.rooms} <span style={{ fontSize: '16pt', color: CORNER_COLORS.lightGray }}>/</span> {data.nights}
          </div>
        </div>
      </div>

      {/* 房型與旅客資訊 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* 房型 */}
        <div style={{
          padding: '16px',
          border: `1px solid ${CORNER_COLORS.border}`,
          borderRadius: '8px',
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '12pt',
            fontWeight: 'bold',
            color: CORNER_COLORS.brown,
            borderBottom: `1px solid ${CORNER_COLORS.orange}`,
            paddingBottom: '8px',
          }}>
            {data.room_type}
          </h3>

          {/* 旅客姓名 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '9pt',
              color: CORNER_COLORS.lightGray,
              marginBottom: '4px',
              fontWeight: '600',
            }}>
              {t.guestName}
            </div>
            <div style={{ fontSize: '11pt', fontWeight: '600', color: CORNER_COLORS.brown }}>
              {data.guest_names.join(', ')}
            </div>
          </div>

          {/* 可入住人數 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '9pt',
              color: CORNER_COLORS.lightGray,
              marginBottom: '4px',
              fontWeight: '600',
            }}>
              {t.maxOccupancy}
            </div>
            <div style={{ fontSize: '10pt', color: CORNER_COLORS.gray }}>
              {data.max_occupancy}
            </div>
          </div>

          {/* 房間資訊 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '9pt',
              color: CORNER_COLORS.lightGray,
              marginBottom: '4px',
              fontWeight: '600',
            }}>
              {t.roomInfo}
            </div>
            <div style={{ fontSize: '10pt', color: CORNER_COLORS.gray }}>
              {data.bed_type}
            </div>
          </div>

          {/* 餐膳 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '9pt',
              color: CORNER_COLORS.lightGray,
              marginBottom: '4px',
              fontWeight: '600',
            }}>
              {t.meal}
            </div>
            <div style={{ fontSize: '10pt', color: CORNER_COLORS.gray }}>
              {data.meal_plan}
            </div>
          </div>

          {/* 房間設施 */}
          <div>
            <div style={{
              fontSize: '9pt',
              color: CORNER_COLORS.lightGray,
              marginBottom: '4px',
              fontWeight: '600',
            }}>
              {t.facilities}
            </div>
            <div style={{
              fontSize: '9pt',
              color: CORNER_COLORS.gray,
              lineHeight: 1.8,
            }}>
              {data.room_facilities.join('・')}
            </div>
          </div>
        </div>
      </div>

      {/* 頁尾 - Corner 資訊 */}
      <div style={{
        marginTop: '40px',
        paddingTop: '16px',
        borderTop: `1px solid ${CORNER_COLORS.border}`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '9pt',
          color: CORNER_COLORS.gray,
          fontStyle: 'italic',
          marginBottom: '12px',
        }}>
          {t.slogan}
        </div>
        <div style={{
          fontSize: '8pt',
          color: CORNER_COLORS.lightGray,
        }}>
          {t.company} © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}

export default CornerHotelVoucher
