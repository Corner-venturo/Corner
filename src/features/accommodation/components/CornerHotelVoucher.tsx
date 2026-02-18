'use client'
/**
 * Corner 風格入住憑證組件
 * 用於生成住宿憑證 PDF
 */


import React from 'react'

// Corner 品牌色系
const CORNER_COLORS = {
  orange: '#F89A1E', // Corner 橘色
  gold: '#B8A99A',   // 金色（次要）
  brown: '#333333',  // 深棕色
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
    <div className="p-0 bg-card text-[#4B5563] text-[11pt] leading-relaxed">
      {/* 頁首 - Corner Logo + 標題 */}
      <div className="relative border-b-2 border-[#F89A1E] pb-3 mb-5">
        {/* Logo - 左上角 */}
        <div className="absolute left-0 top-0">
          <img src="/corner-logo.png" alt="Corner Travel" className="h-[35px] w-auto" />
        </div>

        {/* 標題 - 右側 */}
        <div className="text-right">
          <div className="text-[18pt] font-bold text-[#333333] mb-1">{t.title}</div>
          <div className="text-[9pt] text-[#9CA3AF] tracking-[2px]">{t.subtitle}</div>
        </div>
      </div>

      {/* 確認資訊 */}
      <div className="bg-[#FAF7F2] p-3 px-4 rounded-lg mb-5 border-l-4 border-[#F89A1E]">
        <div className="mb-1.5">
          <span className="text-[#333333] font-semibold">{t.confirmation}</span>
          <span className="text-[#F89A1E] font-bold text-[12pt]">
            {data.confirmation_number}
          </span>
        </div>
        <div className="mb-1.5">
          <span className="text-[#333333] font-semibold">{t.pin}</span>
          <span className="font-bold">{data.pin_code}</span>
          <span className="text-[#9CA3AF] text-[9pt] ml-2">{t.pinNote}</span>
        </div>
        <div>
          <span className="text-[#333333] font-semibold">{t.order}</span>
          <span>{data.order_number}</span>
        </div>
      </div>

      {/* 酒店資訊 */}
      <div className="flex gap-4 mb-6 p-4 border border-[#E5E7EB] rounded-lg">
        {data.hotel_image && (
          <div className="flex-shrink-0">
            <img src={data.hotel_image}
              alt={data.hotel_name}
              className="w-[120px] h-[90px] object-cover rounded-md"
            />
          </div>
        )}
        <div className="flex-1">
          <h2 className="m-0 mb-2 text-[14pt] font-bold text-[#333333]">{data.hotel_name}</h2>
          <div className="text-[10pt] text-[#4B5563] mb-1">📍 {data.hotel_address}</div>
          <div className="text-[10pt] text-[#4B5563]">📞 {data.hotel_phone}</div>
        </div>
      </div>

      {/* 入住資訊表格 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 入住時間 */}
        <div className="p-4 bg-[#FAF7F2] rounded-lg text-center">
          <div className="text-[9pt] text-[#9CA3AF] mb-2 font-semibold">{t.checkIn}</div>
          <div className="text-[15pt] font-bold text-[#333333] mb-1">{data.check_in_date}</div>
          <div className="text-[9pt] text-[#4B5563] mb-1">{data.check_in_day}</div>
          <div className="text-[10pt] text-[#F89A1E] font-semibold">{data.check_in_time}</div>
          <div className="text-[8pt] text-[#9CA3AF] mt-0.5">{t.hotelTime}</div>
        </div>

        {/* 退房時間 */}
        <div className="p-4 bg-[#FAF7F2] rounded-lg text-center">
          <div className="text-[9pt] text-[#9CA3AF] mb-2 font-semibold">{t.checkOut}</div>
          <div className="text-[15pt] font-bold text-[#333333] mb-1">{data.check_out_date}</div>
          <div className="text-[9pt] text-[#4B5563] mb-1">{data.check_out_day}</div>
          <div className="text-[10pt] text-[#F89A1E] font-semibold">{data.check_out_time}</div>
          <div className="text-[8pt] text-[#9CA3AF] mt-0.5">{t.hotelTime}</div>
        </div>

        {/* 房間數量 / 晚數 */}
        <div className="p-4 bg-[#FAF7F2] rounded-lg text-center">
          <div className="text-[9pt] text-[#9CA3AF] mb-2 font-semibold">{t.rooms}</div>
          <div className="text-[28pt] font-bold text-[#F89A1E] leading-none">
            {data.rooms} <span className="text-[16pt] text-[#9CA3AF]">/</span> {data.nights}
          </div>
        </div>
      </div>

      {/* 房型與旅客資訊 */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* 房型 */}
        <div className="p-4 border border-[#E5E7EB] rounded-lg">
          <h3 className="m-0 mb-3 text-[12pt] font-bold text-[#333333] border-b border-[#F89A1E] pb-2">
            {data.room_type}
          </h3>

          {/* 旅客姓名 */}
          <div className="mb-3">
            <div className="text-[9pt] text-[#9CA3AF] mb-1 font-semibold">{t.guestName}</div>
            <div className="text-[11pt] font-semibold text-[#333333]">
              {data.guest_names.join(', ')}
            </div>
          </div>

          {/* 可入住人數 */}
          <div className="mb-3">
            <div className="text-[9pt] text-[#9CA3AF] mb-1 font-semibold">{t.maxOccupancy}</div>
            <div className="text-[10pt] text-[#4B5563]">{data.max_occupancy}</div>
          </div>

          {/* 房間資訊 */}
          <div className="mb-3">
            <div className="text-[9pt] text-[#9CA3AF] mb-1 font-semibold">{t.roomInfo}</div>
            <div className="text-[10pt] text-[#4B5563]">{data.bed_type}</div>
          </div>

          {/* 餐膳 */}
          <div className="mb-3">
            <div className="text-[9pt] text-[#9CA3AF] mb-1 font-semibold">{t.meal}</div>
            <div className="text-[10pt] text-[#4B5563]">{data.meal_plan}</div>
          </div>

          {/* 房間設施 */}
          <div>
            <div className="text-[9pt] text-[#9CA3AF] mb-1 font-semibold">{t.facilities}</div>
            <div className="text-[9pt] text-[#4B5563] leading-loose">
              {data.room_facilities.join('・')}
            </div>
          </div>
        </div>
      </div>

      {/* 頁尾 - Corner 資訊 */}
      <div className="mt-10 pt-4 border-t border-[#E5E7EB] text-center">
        <div className="text-[9pt] text-[#4B5563] italic mb-3">{t.slogan}</div>
        <div className="text-[8pt] text-[#9CA3AF]">
          {t.company} © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}

export default CornerHotelVoucher
