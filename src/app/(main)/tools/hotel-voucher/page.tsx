/**
 * 入住憑證生成工具
 * 用於將 Trip.com 等訂房憑證轉換為 Corner 風格
 */

'use client'

import React, { useState } from 'react'
import { CornerHotelVoucher } from '@/features/accommodation/components/CornerHotelVoucher'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, Printer, FileText } from 'lucide-react'

// 預設資料（第一個 PDF - 赤阪城市酒店）
const SAMPLE_DATA_1 = {
  confirmation_number: '20251117113418',
  pin_code: '3119',
  order_number: '1658107382165874',
  hotel_name: '赤阪城市酒店別館',
  hotel_address: '2 Chome-10-1 Akasaka, 港區, 107-0052 東京都, 日本',
  hotel_phone: '+81-3-35838555',
  check_in_date: '2025年11月23日',
  check_in_day: '週日',
  check_in_time: '14:00-00:00',
  check_out_date: '2025年11月25日',
  check_out_day: '週二',
  check_out_time: '11:00前',
  rooms: 1,
  nights: 2,
  room_type: '單人房',
  guest_names: ['LAI TINGCHANG'],
  max_occupancy: '此房型最多可供1位住客入住，最多1位成人',
  bed_type: '1張小型雙人床',
  meal_plan: '不包括任何餐膳',
  room_facilities: [
    '牙刷', '牙膏', '洗頭水', '護髮素', '香皂',
    '浴缸或淋浴', '私人浴室', '私人洗手間', '智能馬桶',
    '風筒', '毛巾', '24小時熱水', '拖鞋'
  ],
}

// 第二個 PDF - 三井花園酒店
const SAMPLE_DATA_2 = {
  confirmation_number: '1658107382179415',
  pin_code: '5736',
  order_number: '1658107382178120',
  hotel_name: '三井花園酒店汐留意大利街 / 東京',
  hotel_address: '2 Chome-14-24, 港區, 105-0021 東京都, 日本',
  hotel_phone: '+81-3-34311131',
  check_in_date: '2025年11月25日',
  check_in_day: '週二',
  check_in_time: '15:00後',
  check_out_date: '2025年11月27日',
  check_out_day: '週四',
  check_out_time: '11:00前',
  rooms: 1,
  nights: 2,
  room_type: '高級房, 2 張床, 東京塔景觀',
  guest_names: ['LIN YUCHI', 'HUANG POLIN', 'HUANG CHENEN'],
  max_occupancy: '此房型最多可供3位住客入住，最多2位成人',
  bed_type: '2張單人床',
  meal_plan: '不包括任何餐膳',
  room_facilities: [
    '牙刷', '牙膏', '沐浴露', '洗頭水', '護髮素', '浴帽', '梳子', '剃鬚刀',
    '浴缸', '私人浴室', '私人洗手間', '風筒', '淋浴',
    '毛巾', '浴巾', '24小時熱水', '拖鞋', '坐浴盆噴霧器（Shattaf）'
  ],
}

// 第三個 PDF - 東京灣舞濱日航
const SAMPLE_DATA_3 = {
  confirmation_number: 'RYa0ky36e5',
  pin_code: '8880',
  order_number: '1658107382171367',
  hotel_name: '東京灣舞濱日航大酒店',
  hotel_address: '1-7 Maihama, Urayasu, 279-0031 浦安市, 千葉縣, 日本',
  hotel_phone: '+81-47-3503533',
  check_in_date: '2025年11月23日',
  check_in_day: '週日',
  check_in_time: '15:00-00:00',
  check_out_date: '2025年11月25日',
  check_out_day: '週二',
  check_out_time: '12:00前',
  rooms: 1,
  nights: 2,
  room_type: '花園標準房',
  guest_names: ['LIN YUCHI', 'HUANG POLIN', 'HUANG CHENEN'],
  max_occupancy: '此房型最多可供3位住客入住，最多3位成人',
  bed_type: '2張單人床',
  meal_plan: '不包括任何餐膳',
  room_facilities: [
    '牙刷', '牙膏', '沐浴露', '洗頭水', '護髮素', '香皂', '浴帽', '梳子', '剃鬚刀',
    '浴缸', '私人浴室', '私人洗手間', '智能馬桶', '風筒', '淋浴',
    '浴室化妝放大鏡', '毛巾', '浴巾', '24小時熱水', '拖鞋', '坐浴盆噴霧器（Shattaf）'
  ],
}

// 第四個 PDF - 廣島大和ROYNET (訂單 1658103200340134)
const SAMPLE_DATA_4 = {
  confirmation_number: '20250414962750496, 20250414962750493',
  pin_code: '4397',
  order_number: '1658103200340134',
  hotel_name: '廣島大和ROYNET飯店',
  hotel_address: '1 Chome-3-20 Kokutaijimachi, 中區, 730-0042 廣島市, 廣島縣, 日本',
  hotel_phone: '+81-82-5452955',
  check_in_date: '2025年11月26日',
  check_in_day: '週三',
  check_in_time: '14:00-23:00',
  check_out_date: '2025年11月30日',
  check_out_day: '週日',
  check_out_time: '11:00前',
  rooms: 2,
  nights: 4,
  room_type: '經濟雙床房',
  guest_names: ['HUANG CHIENYU', 'FU HSIAOCHUN', 'CHEN LITING', 'ZHUANG PEIXUAN'],
  max_occupancy: '此房型可入住最多2位房客，其中最多2位成人',
  bed_type: '2張單人床',
  meal_plan: '無餐點',
  room_facilities: [
    '牙刷', '洗髮乳', '護髮乳', '香皂', '浴缸或淋浴',
    '私人浴室', '私人洗手間', '智慧型馬桶', '吹風機',
    '毛巾', '24小時熱水', '拖鞋'
  ],
}

// 第五個 PDF - 廣島大和ROYNET (訂單 1658103200338201)
const SAMPLE_DATA_5 = {
  confirmation_number: '20251120076913324, 20251120076913319',
  pin_code: '8860',
  order_number: '1658103200338201',
  hotel_name: '廣島大和ROYNET飯店',
  hotel_address: '1 Chome-3-20 Kokutaijimachi, 中區, 730-0042 廣島市, 廣島縣, 日本',
  hotel_phone: '+81-82-5452955',
  check_in_date: '2025年11月26日',
  check_in_day: '週三',
  check_in_time: '14:00-23:00',
  check_out_date: '2025年11月30日',
  check_out_day: '週日',
  check_out_time: '11:00前',
  rooms: 2,
  nights: 4,
  room_type: '經濟雙床房',
  guest_names: ['LU CHINGJU', 'WANG SHUPING', 'LIN SUICHUN', 'CHEN CHIAYI'],
  max_occupancy: '此房型可入住最多2位房客，其中最多2位成人',
  bed_type: '2張單人床',
  meal_plan: '無餐點',
  room_facilities: [
    '牙刷', '洗髮乳', '護髮乳', '香皂', '浴缸或淋浴',
    '私人浴室', '私人洗手間', '智慧型馬桶', '吹風機',
    '毛巾', '24小時熱水', '拖鞋'
  ],
}

const PRINT_STYLES = `
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    @page {
      size: A4;
      margin: 10mm;
    }

    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    /* 隱藏所有非列印內容 */
    body > *:not(#hotel-voucher-printable) {
      display: none !important;
    }

    #hotel-voucher-printable {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      background: transparent !important;
      padding: 0 !important;
      display: block !important;
      box-shadow: none !important;
    }

    #hotel-voucher-printable > div {
      box-shadow: none !important;
      border-radius: 0 !important;
      max-width: 100% !important;
      background: transparent !important;
      padding: 0 !important;
    }

    .print\\:hidden {
      display: none !important;
    }
  }
`

export default function HotelVoucherPage() {
  const [currentVoucher, setCurrentVoucher] = useState(1)
  const [isOpen, setIsOpen] = useState(true)
  const [language, setLanguage] = useState<'zh' | 'ja'>('zh')

  const getCurrentData = () => {
    switch (currentVoucher) {
      case 1: return SAMPLE_DATA_1
      case 2: return SAMPLE_DATA_2
      case 3: return SAMPLE_DATA_3
      case 4: return SAMPLE_DATA_4
      case 5: return SAMPLE_DATA_5
      default: return SAMPLE_DATA_1
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <FileText size={16} />
          開啟入住憑證
        </Button>
      </div>
    )
  }

  return (
    <>
      <style>{PRINT_STYLES}</style>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[900px] w-full max-h-[90vh] overflow-y-auto p-0 print:max-w-full print:rounded-none print:max-h-none print:overflow-visible print:shadow-none"
          id="hotel-voucher-printable"
        >
          {/* 控制面板 - 只在螢幕上顯示 */}
          <div className="print:hidden sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={currentVoucher === 1 ? 'default' : 'outline'}
                onClick={() => setCurrentVoucher(1)}
              >
                赤阪城市酒店
              </Button>
              <Button
                size="sm"
                variant={currentVoucher === 2 ? 'default' : 'outline'}
                onClick={() => setCurrentVoucher(2)}
              >
                三井花園酒店
              </Button>
              <Button
                size="sm"
                variant={currentVoucher === 3 ? 'default' : 'outline'}
                onClick={() => setCurrentVoucher(3)}
              >
                東京灣舞濱日航
              </Button>
              <Button
                size="sm"
                variant={currentVoucher === 4 ? 'default' : 'outline'}
                onClick={() => setCurrentVoucher(4)}
              >
                廣島 #1
              </Button>
              <Button
                size="sm"
                variant={currentVoucher === 5 ? 'default' : 'outline'}
                onClick={() => setCurrentVoucher(5)}
              >
                廣島 #2
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1 mr-4">
                <Button
                  size="sm"
                  variant={language === 'zh' ? 'default' : 'outline'}
                  onClick={() => setLanguage('zh')}
                >
                  中文
                </Button>
                <Button
                  size="sm"
                  variant={language === 'ja' ? 'default' : 'outline'}
                  onClick={() => setLanguage('ja')}
                >
                  日文
                </Button>
              </div>
              <Button size="sm" onClick={handlePrint} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
                <Printer size={16} />
                列印 / 儲存 PDF
              </Button>
            </div>
          </div>

          {/* 憑證內容 */}
          <div className="print:p-0">
            <CornerHotelVoucher data={getCurrentData()} language={language} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
