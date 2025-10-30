import React from 'react'
import { TourFormData } from '../types'

interface FlightInfoSectionProps {
  data: TourFormData
  updateFlightField: (
    flightType: 'outboundFlight' | 'returnFlight',
    field: string,
    value: string
  ) => void
}

export function FlightInfoSection({ data, updateFlightField }: FlightInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-blue-500 pb-2">
        ✈️ 航班資訊
      </h2>

      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
        <h3 className="font-bold text-blue-900">去程航班</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              航空公司
            </label>
            <input
              type="text"
              value={data.outboundFlight?.airline || ''}
              onChange={e => updateFlightField('outboundFlight', 'airline', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="中華航空"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              航班號碼
            </label>
            <input
              type="text"
              value={data.outboundFlight?.flightNumber || ''}
              onChange={e => updateFlightField('outboundFlight', 'flightNumber', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="CI110"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              出發機場
            </label>
            <input
              type="text"
              value={data.outboundFlight?.departureAirport || ''}
              onChange={e =>
                updateFlightField('outboundFlight', 'departureAirport', e.target.value)
              }
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="TPE"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              出發時間
            </label>
            <input
              type="text"
              value={data.outboundFlight?.departureTime || ''}
              onChange={e => updateFlightField('outboundFlight', 'departureTime', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="06:50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              出發日期
            </label>
            <input
              type="text"
              value={data.outboundFlight?.departureDate || ''}
              onChange={e => updateFlightField('outboundFlight', 'departureDate', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="10/21"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              抵達機場
            </label>
            <input
              type="text"
              value={data.outboundFlight?.arrivalAirport || ''}
              onChange={e => updateFlightField('outboundFlight', 'arrivalAirport', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="FUK"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              抵達時間
            </label>
            <input
              type="text"
              value={data.outboundFlight?.arrivalTime || ''}
              onChange={e => updateFlightField('outboundFlight', 'arrivalTime', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="09:55"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              飛行時間（自動計算）
            </label>
            <div className="w-full px-2 py-1 border rounded text-sm bg-gray-100 text-morandi-primary">
              {data.outboundFlight?.duration || '請輸入出發/抵達時間'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
        <h3 className="font-bold text-indigo-900">回程航班</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              航空公司
            </label>
            <input
              type="text"
              value={data.returnFlight?.airline || ''}
              onChange={e => updateFlightField('returnFlight', 'airline', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="中華航空"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              航班號碼
            </label>
            <input
              type="text"
              value={data.returnFlight?.flightNumber || ''}
              onChange={e => updateFlightField('returnFlight', 'flightNumber', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="CI111"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              出發機場
            </label>
            <input
              type="text"
              value={data.returnFlight?.departureAirport || ''}
              onChange={e => updateFlightField('returnFlight', 'departureAirport', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="FUK"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              出發時間
            </label>
            <input
              type="text"
              value={data.returnFlight?.departureTime || ''}
              onChange={e => updateFlightField('returnFlight', 'departureTime', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="11:00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              出發日期
            </label>
            <input
              type="text"
              value={data.returnFlight?.departureDate || ''}
              onChange={e => updateFlightField('returnFlight', 'departureDate', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="10/25"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              抵達機場
            </label>
            <input
              type="text"
              value={data.returnFlight?.arrivalAirport || ''}
              onChange={e => updateFlightField('returnFlight', 'arrivalAirport', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="TPE"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              抵達時間
            </label>
            <input
              type="text"
              value={data.returnFlight?.arrivalTime || ''}
              onChange={e => updateFlightField('returnFlight', 'arrivalTime', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="12:30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-morandi-secondary mb-1">
              飛行時間（自動計算）
            </label>
            <div className="w-full px-2 py-1 border rounded text-sm bg-gray-100 text-morandi-primary">
              {data.returnFlight?.duration || '請輸入出發/抵達時間'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
