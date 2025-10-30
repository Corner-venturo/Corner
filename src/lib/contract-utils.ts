/**
 * 合約資料處理工具函數
 */

import { Tour } from '@/types/tour.types'
import { Order, Member } from '@/types/order.types'
import { Itinerary } from '@/stores/types'

export interface ContractData {
  // 審閱日期
  reviewYear: string
  reviewMonth: string
  reviewDay: string

  // 旅客資訊
  travelerName: string
  travelerAddress: string
  travelerIdNumber: string
  travelerPhone: string

  // 緊急聯絡人資訊
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactPhone: string

  // 旅遊團資訊
  tourName: string
  tourDestination: string
  tourCode: string

  // 集合資訊
  gatherYear: string
  gatherMonth: string
  gatherDay: string
  gatherHour: string
  gatherMinute: string
  gatherLocation: string

  // 費用資訊
  totalAmount: string
  depositAmount: string
  paymentMethod: string
  finalPaymentMethod: string

  // 保險金額
  deathInsurance: string
  medicalInsurance: string

  // 旅遊團資訊
  minParticipants: string

  // 乙方資訊
  companyExtension: string
}

/**
 * 計算集合時間（起飛時間 - 3小時）
 */
function calculateGatherTime(departureTime: string): { hour: string; minute: string } {
  const [hourStr, minuteStr] = departureTime.split(':')
  let hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)

  // 減3小時
  hour = hour - 3
  if (hour < 0) {
    hour = hour + 24
  }

  return {
    hour: hour.toString().padStart(2, '0'),
    minute: minute.toString().padStart(2, '0'),
  }
}

/**
 * 從各種資料來源準備合約資料
 * @param tour 旅遊團資料
 * @param order 訂單資料（用於聯絡人資訊）
 * @param member 團員資料（選填，用於身分證、緊急聯絡人等資訊）
 * @param itinerary 行程資料（選填，用於航班資訊）
 * @param depositAmount 訂金金額（選填）
 */
export function prepareContractData(
  tour: Tour,
  order: Order,
  member?: Member,
  itinerary?: Itinerary,
  depositAmount?: number
): Partial<ContractData> {
  const today = new Date()

  // 預設集合時間（如果沒有行程表）
  let gatherHour = '06'
  let gatherMinute = '00'
  let gatherYear = ''
  let gatherMonth = ''
  let gatherDay = ''

  // 如果有行程表且有航班資訊
  if (itinerary?.outboundFlight?.departureTime) {
    const gatherTime = calculateGatherTime(itinerary.outboundFlight.departureTime)
    gatherHour = gatherTime.hour
    gatherMinute = gatherTime.minute

    // 從航班日期或旅遊團出發日期取得
    const departureDate = new Date(tour.departure_date)
    gatherYear = departureDate.getFullYear().toString()
    gatherMonth = (departureDate.getMonth() + 1).toString()
    gatherDay = departureDate.getDate().toString()
  } else if (tour.departure_date) {
    // 沒有行程表，使用旅遊團出發日期
    const departureDate = new Date(tour.departure_date)
    gatherYear = departureDate.getFullYear().toString()
    gatherMonth = (departureDate.getMonth() + 1).toString()
    gatherDay = departureDate.getDate().toString()
  }

  return {
    // 審閱日期（今天）
    reviewYear: today.getFullYear().toString(),
    reviewMonth: (today.getMonth() + 1).toString(),
    reviewDay: today.getDate().toString(),

    // 旅客資訊（優先使用訂單聯絡人，若有團員資料則補充）
    travelerName: order.contact_person || '',
    travelerAddress: '', // 需手動填寫
    travelerIdNumber: member?.id_number || '',
    travelerPhone: order.contact_phone || member?.phone || '',

    // 緊急聯絡人資訊（來自團員資料）
    emergencyContactName: member?.emergency_contact || '',
    emergencyContactRelation: '', // 需手動填寫
    emergencyContactPhone: member?.emergency_phone || '',

    // 旅遊團資訊
    tourName: tour.name,
    tourDestination: tour.location || '',
    tourCode: tour.code,

    // 集合資訊
    gatherYear,
    gatherMonth,
    gatherDay,
    gatherHour,
    gatherMinute,
    gatherLocation: itinerary?.outboundFlight?.departureAirport
      ? `桃園國際機場` // 可根據機場代碼決定
      : '',

    // 費用資訊
    totalAmount: order.total_amount?.toString() || '',
    depositAmount:
      depositAmount?.toString() ||
      (order.total_amount ? (order.total_amount * 0.3).toFixed(0) : ''),
    paymentMethod: '現金',
    finalPaymentMethod: '現金',

    // 保險金額（固定）
    deathInsurance: '2,500,000',
    medicalInsurance: '100,000',

    // 旅遊團資訊
    minParticipants: tour.max_participants?.toString() || '16',

    // 乙方資訊
    companyExtension: '', // 需手動填寫
  }
}

/**
 * 替換合約範本中的變數
 */
export function replaceContractVariables(template: string, data: Partial<ContractData>): string {
  let result = template

  // 替換所有 {{變數名}} 格式的變數
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value || '')
  })

  return result
}
