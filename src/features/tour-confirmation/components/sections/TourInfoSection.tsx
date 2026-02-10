/**
 * 團基本資訊區塊
 */

import React from 'react'
import { Check } from 'lucide-react'
import type { Tour, Itinerary } from '@/stores/types'
import type { TourConfirmationSheet } from '@/types/tour-confirmation-sheet.types'
import type { Database } from '@/lib/supabase/types'
import { formatFlightDate } from '../../constants/currency'
import type { TourOrder, AgeGroups } from '../../hooks/useTourSheetData'

type TourRequestRow = Database['public']['Tables']['tour_requests']['Row']

interface FlightInfo {
  airline?: string
  flightNumber?: string
  departureAirport?: string
  arrivalAirport?: string
  departureTime?: string
  arrivalTime?: string
}

interface TourInfoSectionProps {
  tour: Tour
  sheet: TourConfirmationSheet | null
  itinerary: Itinerary | null
  primaryContact: TourOrder | null
  ageGroups: AgeGroups
  vehicleRequests: TourRequestRow[]
}

export function TourInfoSection({
  tour,
  sheet,
  itinerary,
  primaryContact,
  ageGroups,
  vehicleRequests,
}: TourInfoSectionProps) {
  const outbound = itinerary?.outbound_flight || tour.outbound_flight
  const returnFlight = itinerary?.return_flight || tour.return_flight

  const outboundFlight = outbound && typeof outbound === 'object' 
    ? outbound as FlightInfo 
    : null
  const returnFlightData = returnFlight && typeof returnFlight === 'object' 
    ? returnFlight as FlightInfo 
    : null

  return (
    <div>
      <table className="w-full text-sm">
        <tbody>
          {/* 團名 / 團號 */}
          <tr className="border-b border-border">
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[100px]">團名</td>
            <td className="px-4 py-2 w-[40%]">{tour.name || '-'}</td>
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[100px]">團號</td>
            <td className="px-4 py-2">{tour.code || '-'}</td>
          </tr>

          {/* 出團日期 / 隨團領隊 */}
          <tr className="border-b border-border">
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">出團日期</td>
            <td className="px-4 py-2 w-[40%]">
              {tour.departure_date && tour.return_date
                ? `${tour.departure_date} ~ ${tour.return_date}`
                : tour.departure_date || '-'}
            </td>
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[100px]">隨團領隊</td>
            <td className="px-4 py-2">{sheet?.tour_leader_name || '-'}</td>
          </tr>

          {/* 聯絡人 + 去程航班 */}
          <tr className="border-b border-border">
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">聯絡人</td>
            <td className="px-4 py-2">{primaryContact?.contact_person || '-'}</td>
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[60px]">
              <span className="text-morandi-green">去程</span>
            </td>
            <td className="px-4 py-2">
              {outboundFlight?.flightNumber
                ? `${formatFlightDate(tour.departure_date)} ${outboundFlight.airline} ${outboundFlight.flightNumber} ${outboundFlight.departureAirport} ${outboundFlight.departureTime} → ${outboundFlight.arrivalAirport} ${outboundFlight.arrivalTime}`
                : '-'}
            </td>
          </tr>

          {/* 聯絡電話 + 回程航班 */}
          <tr className="border-b border-border">
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">聯絡電話</td>
            <td className="px-4 py-2">{primaryContact?.contact_phone || '-'}</td>
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">
              <span className="text-morandi-gold">回程</span>
            </td>
            <td className="px-4 py-2">
              {returnFlightData?.flightNumber
                ? `${formatFlightDate(tour.return_date)} ${returnFlightData.airline} ${returnFlightData.flightNumber} ${returnFlightData.departureAirport} ${returnFlightData.departureTime} → ${returnFlightData.arrivalAirport} ${returnFlightData.arrivalTime}`
                : '-'}
            </td>
          </tr>

          {/* 人數配置 */}
          <tr className="border-b border-border">
            <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">團體人數</td>
            <td className="px-4 py-2" colSpan={3}>
              <div className="flex items-center gap-6">
                <span className="font-medium">{ageGroups.total} 人</span>
                <span className="text-morandi-secondary">
                  <span className="text-morandi-green">6歲以下：{ageGroups.under6}</span>
                  <span className="mx-2">|</span>
                  <span className="text-morandi-gold">65歲以上：{ageGroups.over65}</span>
                  <span className="mx-2">|</span>
                  <span>一般：{ageGroups.others}</span>
                </span>
              </div>
            </td>
          </tr>

          {/* 交通（有資料才顯示） */}
          {vehicleRequests.length > 0 && (
            <tr>
              <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium align-top w-[100px]">交通</td>
              <td colSpan={3}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-morandi-container/20">
                      <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary w-[180px]">公司名稱</th>
                      <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary w-[100px]">司機</th>
                      <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary w-[120px]">車號</th>
                      <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary">手機電話</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleRequests.map((req, idx) => {
                      const reqAny = req as TourRequestRow & {
                        driver_name?: string | null
                        plate_number?: string | null
                        driver_phone?: string | null
                      }
                      return (
                        <tr key={req.id} className={idx % 2 === 1 ? 'bg-morandi-container/5' : ''}>
                          <td className="px-3 py-1.5">{req.supplier_name || '-'}</td>
                          <td className="px-3 py-1.5">{reqAny.driver_name || '-'}</td>
                          <td className="px-3 py-1.5">{reqAny.plate_number || '-'}</td>
                          <td className="px-3 py-1.5">{reqAny.driver_phone || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
