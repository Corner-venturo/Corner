import React, { useEffect, useRef } from 'react'
import { TourFormData } from '../types'
import { Input } from '@/components/ui/input'

interface FlightInfoSectionProps {
  data: TourFormData
  updateFlightField: (
    flightType: 'outboundFlight' | 'returnFlight',
    field: string,
    value: string
  ) => void
}

export function FlightInfoSection({ data, updateFlightField }: FlightInfoSectionProps) {
  // Track previous values to detect changes
  const prevOutboundRef = useRef({
    airline: data.outboundFlight?.airline || '',
    arrivalAirport: data.outboundFlight?.arrivalAirport || '',
  })

  // Auto-fill outbound departure date from tour departure date
  useEffect(() => {
    if (data.departureDate && !data.outboundFlight?.departureDate) {
      // Convert date format if needed (e.g., "2024-10-21" to "10/21")
      const dateStr = data.departureDate
      let formattedDate = dateStr
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-')
        if (parts.length === 3) {
          formattedDate = `${parts[1]}/${parts[2]}`
        }
      }
      updateFlightField('outboundFlight', 'departureDate', formattedDate)
    }
  }, [data.departureDate, data.outboundFlight?.departureDate, updateFlightField])

  // Auto-fill return flight when outbound changes
  useEffect(() => {
    const currentAirline = data.outboundFlight?.airline || ''
    const currentArrival = data.outboundFlight?.arrivalAirport || ''
    const prevAirline = prevOutboundRef.current.airline
    const prevArrival = prevOutboundRef.current.arrivalAirport

    // If outbound airline changed and return airline is empty or was same as previous
    if (currentAirline !== prevAirline) {
      const returnAirline = data.returnFlight?.airline || ''
      if (!returnAirline || returnAirline === prevAirline) {
        updateFlightField('returnFlight', 'airline', currentAirline)
      }
    }

    // If outbound arrival airport changed, set it as return departure airport
    if (currentArrival !== prevArrival) {
      const returnDeparture = data.returnFlight?.departureAirport || ''
      if (!returnDeparture || returnDeparture === prevArrival) {
        updateFlightField('returnFlight', 'departureAirport', currentArrival)
      }
    }

    // Update ref
    prevOutboundRef.current = {
      airline: currentAirline,
      arrivalAirport: currentArrival,
    }
  }, [data.outboundFlight?.airline, data.outboundFlight?.arrivalAirport, data.returnFlight?.airline, data.returnFlight?.departureAirport, updateFlightField])

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-morandi-primary border-b-2 border-[#C9A961] pb-1.5">
        航班資訊
      </h2>

      {/* 去程航班 */}
      <div className="bg-[#F9F5ED] p-3 rounded-lg space-y-2 border border-[#E0D8CC]">
        <h3 className="font-bold text-sm text-[#3D2914]">去程航班</h3>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              航空公司
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.airline || ''}
              onChange={e => updateFlightField('outboundFlight', 'airline', e.target.value)}
              className="text-xs h-8"
              placeholder="長榮航空"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              航班號碼
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.flightNumber || ''}
              onChange={e => updateFlightField('outboundFlight', 'flightNumber', e.target.value)}
              className="text-xs h-8"
              placeholder="BR"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發機場
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.departureAirport || ''}
              onChange={e =>
                updateFlightField('outboundFlight', 'departureAirport', e.target.value)
              }
              className="text-xs h-8"
              placeholder="TPE"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              抵達機場
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.arrivalAirport || ''}
              onChange={e => updateFlightField('outboundFlight', 'arrivalAirport', e.target.value)}
              className="text-xs h-8"
              placeholder="KMQ"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發時間
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.departureTime || ''}
              onChange={e => updateFlightField('outboundFlight', 'departureTime', e.target.value)}
              className="text-xs h-8"
              placeholder="06:50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              抵達時間
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.arrivalTime || ''}
              onChange={e => updateFlightField('outboundFlight', 'arrivalTime', e.target.value)}
              className="text-xs h-8"
              placeholder="09:55"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發日期
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.departureDate || ''}
              onChange={e => updateFlightField('outboundFlight', 'departureDate', e.target.value)}
              className="text-xs h-8"
              placeholder="10/21"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              飛行時間
            </label>
            <Input
              type="text"
              value={data.outboundFlight?.duration || ''}
              readOnly
              className="text-xs h-8 bg-gray-100 text-morandi-secondary cursor-not-allowed"
              placeholder="自動計算"
            />
          </div>
        </div>
      </div>

      {/* 回程航班 */}
      <div className="bg-[#F5F0EB] p-3 rounded-lg space-y-2 border border-[#E0D8CC]">
        <h3 className="font-bold text-sm text-[#3D2914]">回程航班</h3>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              航空公司
            </label>
            <Input
              type="text"
              value={data.returnFlight?.airline || ''}
              onChange={e => updateFlightField('returnFlight', 'airline', e.target.value)}
              className="text-xs h-8"
              placeholder="長榮航空"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              航班號碼
            </label>
            <Input
              type="text"
              value={data.returnFlight?.flightNumber || ''}
              onChange={e => updateFlightField('returnFlight', 'flightNumber', e.target.value)}
              className="text-xs h-8"
              placeholder="CI111"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發機場
            </label>
            <Input
              type="text"
              value={data.returnFlight?.departureAirport || ''}
              onChange={e => updateFlightField('returnFlight', 'departureAirport', e.target.value)}
              className="text-xs h-8"
              placeholder="KMQ"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              抵達機場
            </label>
            <Input
              type="text"
              value={data.returnFlight?.arrivalAirport || ''}
              onChange={e => updateFlightField('returnFlight', 'arrivalAirport', e.target.value)}
              className="text-xs h-8"
              placeholder="TPE"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發時間
            </label>
            <Input
              type="text"
              value={data.returnFlight?.departureTime || ''}
              onChange={e => updateFlightField('returnFlight', 'departureTime', e.target.value)}
              className="text-xs h-8"
              placeholder="11:00"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              抵達時間
            </label>
            <Input
              type="text"
              value={data.returnFlight?.arrivalTime || ''}
              onChange={e => updateFlightField('returnFlight', 'arrivalTime', e.target.value)}
              className="text-xs h-8"
              placeholder="12:30"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              出發日期
            </label>
            <Input
              type="text"
              value={data.returnFlight?.departureDate || ''}
              onChange={e => updateFlightField('returnFlight', 'departureDate', e.target.value)}
              className="text-xs h-8"
              placeholder="10/25"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-secondary mb-0.5">
              飛行時間
            </label>
            <Input
              type="text"
              value={data.returnFlight?.duration || ''}
              readOnly
              className="text-xs h-8 bg-gray-100 text-morandi-secondary cursor-not-allowed"
              placeholder="自動計算"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
