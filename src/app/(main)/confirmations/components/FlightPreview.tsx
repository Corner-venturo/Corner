import React from 'react'
import type { ConfirmationFormData, FlightData } from '@/types/confirmation.types'

interface FlightPreviewProps {
  formData: ConfirmationFormData
}

export function FlightPreview({ formData }: FlightPreviewProps) {
  const data = formData.data as Partial<FlightData>
  const extendedData = data as Partial<FlightData> & { airlineContacts?: string[] }

  return (
    <div className="p-8 space-y-4" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
      {/* 頂部資訊 */}
      <div className="flex justify-between items-start pb-3 border-b" style={{ borderColor: '#e5e7eb' }}>
        <div>
          <div className="font-medium" style={{ color: '#374151' }}>
            電腦代號: {formData.booking_number || '尚未填寫'}
          </div>
        </div>
      </div>

      {/* 免責聲明 */}
      <div className="text-center text-xs italic py-2 bg-status-warning-bg rounded" style={{ color: '#92400E' }}>
        **** 此文件資訊僅供參考, 實際資訊以航空公司及相關旅遊供應商為準 ****
      </div>

      {/* 旅客姓名 */}
      {data.passengers && data.passengers.length > 0 && (
        <div>
          {data.passengers.map((passenger, idx) => (
            <div key={idx} className="mb-1" style={{ color: '#374151' }}>
              旅客姓名:{String(idx + 1).padStart(2, '0')}. {passenger.nameEn}
            </div>
          ))}
        </div>
      )}

      {/* 航班資訊 - 使用虛線分隔 */}
      {data.segments && data.segments.length > 0 && (
        <div>
          <div className="border-t border-b py-2" style={{ borderColor: '#d4af37', borderStyle: 'dashed' }}>
            <div className="grid grid-cols-12 gap-2 font-medium" style={{ color: '#333333' }}>
              <div className="col-span-2 text-center">日 期</div>
              <div className="col-span-6">時 間  航 班</div>
              <div className="col-span-4">其 他 訊 息</div>
            </div>
          </div>

          {data.segments.map((segment, idx) => (
            <div key={idx}>
              {/* 航空公司行 */}
              <div className="grid grid-cols-12 gap-2 py-1.5">
                <div className="col-span-2"></div>
                <div className="col-span-6 font-medium" style={{ color: '#374151' }}>
                  {segment.airline}({segment.flightNumber})
                </div>
                <div className="col-span-4 text-right" style={{ color: '#6B7280' }}>
                  /直飛
                </div>
              </div>

              {/* 出發行 */}
              <div className="grid grid-cols-12 gap-2 py-1">
                <div className="col-span-2 text-center" style={{ color: '#374151' }}>
                  {segment.departureDate}
                </div>
                <div className="col-span-6" style={{ color: '#374151' }}>
                  {segment.departureTime} 出發: {segment.departureAirport}
                </div>
                <div className="col-span-4" style={{ color: '#6B7280' }}>
                  {segment.departureTerminal ? `航站${segment.departureTerminal} ` : ''}/{data.passengers?.[0]?.cabin || '經濟'} /OK
                </div>
              </div>

              {/* 抵達行 */}
              <div
                className="grid grid-cols-12 gap-2 py-1 pb-3"
                style={{
                  borderBottom: idx < (data.segments?.length || 0) - 1 ? '1px dashed #d4af37' : 'none'
                }}
              >
                <div className="col-span-2"></div>
                <div className="col-span-6" style={{ color: '#374151' }}>
                  {segment.arrivalTime} 抵達: {segment.arrivalAirport}
                </div>
                <div className="col-span-4" style={{ color: '#6B7280' }}>
                  {segment.arrivalTerminal ? `航站${segment.arrivalTerminal} ` : ''}/餐點
                </div>
              </div>
            </div>
          ))}

          <div className="border-b py-1" style={{ borderColor: '#d4af37', borderStyle: 'dashed' }}></div>
        </div>
      )}

      {/* 機票號碼 */}
      {data.passengers && data.passengers.length > 0 && data.passengers.some(p => p.ticketNumber) && (
        <div className="space-y-1">
          {data.passengers.map((passenger, idx) => (
            passenger.ticketNumber && (
              <div key={idx} style={{ color: '#374151' }}>
                機票號碼: {passenger.ticketNumber} - {passenger.nameEn}
              </div>
            )
          ))}
        </div>
      )}

      {/* 航空公司確認電話 */}
      {extendedData.airlineContacts && extendedData.airlineContacts.length > 0 && (
        <div>
          <div className="font-medium mb-1" style={{ color: '#374151' }}>
            航空公司確認電話:
          </div>
          <div className="space-y-1 pl-4" style={{ color: '#6B7280' }}>
            {extendedData.airlineContacts.map((contact, idx) => (
              <div key={idx}>{contact}</div>
            ))}
          </div>
        </div>
      )}

      {/* 重要資訊 */}
      {data.importantNotes && data.importantNotes.length > 0 && (
        <div className="mt-4 p-3 bg-status-warning-bg rounded border border-status-warning/30">
          <div className="font-semibold mb-2" style={{ color: '#92400E' }}>
            ⚠️ 重要資訊
          </div>
          <div className="space-y-1" style={{ color: '#78350F' }}>
            {data.importantNotes.map((note, idx) => (
              <div key={idx}>• {note}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
