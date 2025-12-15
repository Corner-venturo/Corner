import { Tour } from '@/stores/types'

export interface NewTourData {
  name: string
  countryCode: string // 國家代碼 (如: JPN, THI)
  cityCode: string // 城市代碼 (如: TYO, BKK)
  customCountry?: string // 自訂國家名稱
  customLocation?: string // 自訂城市名稱
  customCityCode?: string // 自訂城市代號
  departure_date: string
  return_date: string
  price: number
  status: Tour['status']
  isSpecial: boolean
  max_participants: number
  description?: string
  enable_checkin?: boolean // 是否開啟報到功能
  outbound_flight_text?: string // 去程航班文字 (如: BR 190 07:25-11:45)
  return_flight_text?: string // 回程航班文字 (如: BR 191 13:00-16:30)
}

export interface TourExtraFields {
  addOns: boolean
  refunds: boolean
  customFields: Array<{ id: string; name: string }>
}

export interface DeleteConfirmState {
  isOpen: boolean
  tour: Tour | null
}
