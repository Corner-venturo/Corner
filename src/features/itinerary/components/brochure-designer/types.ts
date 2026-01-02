/**
 * 手冊封面設計器類型定義
 */

export interface BrochureCoverData {
  // 基本資訊
  clientName: string         // 客戶名稱（如：Acme Corp 年度旅遊）
  country: string            // 國家（如：JAPAN）
  city: string               // 城市（如：KYOTO）
  airportCode: string        // IATA 機場代碼（如：KIX）
  travelDates: string        // 旅遊日期（如：Oct 15 - Oct 22, 2024）

  // 封面圖片
  coverImage: string         // 封面圖片 URL
  coverImagePosition?: {     // 圖片位置設定
    x: number
    y: number
    scale: number
  }

  // 公司資訊
  companyName: string        // 公司名稱
  companyLogo?: string       // 公司 Logo
  emergencyContact: string   // 緊急聯絡電話
  emergencyEmail: string     // 緊急聯絡 Email
}

export const DEFAULT_COVER_DATA: BrochureCoverData = {
  clientName: '',
  country: '',
  city: '',
  airportCode: '',
  travelDates: '',
  coverImage: '',
  companyName: '角落旅行社',
  emergencyContact: '+886 2-2345-6789',
  emergencyEmail: 'service@corner.travel',
}
