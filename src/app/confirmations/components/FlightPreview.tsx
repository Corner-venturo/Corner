import type { ConfirmationFormData, FlightData } from '@/types/confirmation.types'

interface FlightPreviewProps {
  formData: ConfirmationFormData
}

export function FlightPreview({ formData }: FlightPreviewProps) {
  const data = formData.data as Partial<FlightData>

  // 格式化日期時間
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`
  }

  return (
    <div className="p-10">
      {/* 頁首 */}
      <div className="flex justify-between items-center pb-5 mb-7 border-b-2 border-morandi-gold">
        <div className="flex items-center gap-4">
          {/* LOGO */}
          <div className="w-12 h-12 bg-morandi-gold rounded-md flex items-center justify-center text-white text-2xl font-bold">
            V
          </div>
          <h1 className="text-3xl font-bold text-morandi-primary">航班行程單</h1>
        </div>
        <div className="text-sm text-morandi-secondary font-medium">VENTURO</div>
      </div>

      {/* 預訂須知 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-morandi-primary mb-4 pb-2 border-b-2 border-morandi-cream-dark">
          預訂須知
        </h2>
        <div className="bg-gradient-to-br from-morandi-cream to-morandi-cream-light border border-morandi-cream-dark rounded-md p-5">
          <p className="text-sm text-morandi-secondary mb-3">
            請自行列印行程單並隨身攜帶，以確保旅程順利。
          </p>
          {formData.booking_number && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-morandi-primary">訂單編號</span>
              <span className="text-sm font-mono text-morandi-gold bg-morandi-gold/10 px-2 py-1 rounded">
                {formData.booking_number}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 旅客資訊 */}
      {data.passengers && data.passengers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-morandi-primary mb-4 p-3 bg-gradient-to-r from-morandi-cream to-white border-l-4 border-morandi-gold rounded">
            旅客資訊
          </h3>
          <div className="border border-morandi-cream-dark rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-b from-morandi-cream to-morandi-cream-light">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-morandi-primary border-b-2 border-morandi-cream-dark">
                    姓名
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-morandi-primary border-b-2 border-morandi-cream-dark">
                    艙等
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-morandi-primary border-b-2 border-morandi-cream-dark">
                    電子機票票號
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-morandi-primary border-b-2 border-morandi-cream-dark">
                    訂位代號
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.passengers.map((passenger, i) => (
                  <tr key={i} className="hover:bg-morandi-cream-light">
                    <td className="p-3 text-sm border-b border-morandi-cream">
                      <div className="font-medium text-morandi-primary">{passenger.nameEn}</div>
                      {passenger.nameZh && (
                        <div className="text-xs text-morandi-secondary">{passenger.nameZh}</div>
                      )}
                    </td>
                    <td className="p-3 text-sm text-morandi-secondary border-b border-morandi-cream">
                      {passenger.cabin}
                    </td>
                    <td className="p-3 text-sm font-mono text-morandi-secondary border-b border-morandi-cream">
                      {passenger.ticketNumber}
                    </td>
                    <td className="p-3 text-sm font-mono text-morandi-secondary border-b border-morandi-cream">
                      {passenger.bookingCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 航班資訊 */}
      {data.segments && data.segments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-morandi-primary mb-4 pb-2 border-b-2 border-morandi-cream-dark">
            航班資訊
          </h2>
          {data.segments.map((segment, i) => (
            <div
              key={i}
              className="bg-white border border-morandi-cream-dark rounded-md p-5 mb-4 shadow-sm"
            >
              <div className="text-base font-semibold text-morandi-primary mb-4 pb-3 border-b border-morandi-cream">
                {segment.route}
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                  <div className="font-semibold text-morandi-secondary">出發</div>
                  <div className="text-morandi-primary">
                    {formatDate(segment.departureDate)} {segment.departureTime},{' '}
                    {segment.departureAirport} {segment.departureTerminal}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                  <div className="font-semibold text-morandi-secondary">抵達</div>
                  <div className="text-morandi-primary">
                    {formatDate(segment.arrivalDate)} {segment.arrivalTime}, {segment.arrivalAirport}{' '}
                    {segment.arrivalTerminal}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-3 text-sm">
                  <div className="font-semibold text-morandi-secondary">航空公司</div>
                  <div className="text-morandi-primary">
                    {segment.airline} {segment.flightNumber}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 行李額度 */}
      {data.baggage && data.baggage.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-morandi-primary mb-4 pb-2 border-b-2 border-morandi-cream-dark">
            行李額度
          </h2>
          <p className="text-sm text-morandi-secondary mb-4">
            請查看底端的行李資訊，以進一步了解詳情。
          </p>
          {data.baggage.map((bag, i) => (
            <div key={i} className="bg-morandi-cream-light border border-morandi-cream-dark rounded-md p-4 mb-3">
              <div className="text-sm font-semibold text-morandi-primary mb-3">{bag.passengerName}</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-semibold text-morandi-secondary mb-1">個人物品</div>
                  <div className="text-sm text-morandi-primary">{bag.personalItem}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-morandi-secondary mb-1">手提行李</div>
                  <div className="text-sm text-morandi-primary">{bag.carryOn}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-morandi-secondary mb-1">託運行李</div>
                  <div className="text-sm text-morandi-primary">{bag.checked}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 重要資訊 */}
      {data.importantNotes && data.importantNotes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-morandi-primary mb-4 pb-2 border-b-2 border-morandi-cream-dark">
            重要資訊
          </h2>
          <ul className="space-y-2">
            {data.importantNotes.map((note, i) => (
              <li key={i} className="pl-5 text-sm text-morandi-secondary relative leading-relaxed">
                <span className="absolute left-2 text-morandi-gold text-xs">●</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 行李詳細資訊 */}
      {data.baggageDetails && data.baggageDetails.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-morandi-primary mb-4 pb-2 border-b-2 border-morandi-cream-dark">
            行李資訊
          </h2>
          {data.baggageDetails.map((detail, i) => (
            <div key={i}>
              <h3 className="text-base font-semibold text-morandi-primary mb-4 p-3 bg-gradient-to-r from-morandi-cream to-white border-l-4 border-morandi-gold rounded">
                {detail.route}
              </h3>
              <ul className="space-y-2 mb-6">
                {detail.carryOnDetail && (
                  <li className="pl-4 py-3 text-sm text-morandi-secondary leading-relaxed bg-gradient-to-r from-morandi-cream-light to-white border-l-3 border-morandi-gold rounded-r">
                    <strong className="text-morandi-primary font-semibold">手提行李:</strong>{' '}
                    {detail.carryOnDetail}
                  </li>
                )}
                {detail.checkedDetail && (
                  <li className="pl-4 py-3 text-sm text-morandi-secondary leading-relaxed bg-gradient-to-r from-morandi-cream-light to-white border-l-3 border-morandi-gold rounded-r">
                    <strong className="text-morandi-primary font-semibold">託運行李:</strong>{' '}
                    {detail.checkedDetail}
                  </li>
                )}
                {detail.personalItemDetail && (
                  <li className="pl-4 py-3 text-sm text-morandi-secondary leading-relaxed bg-gradient-to-r from-morandi-cream-light to-white border-l-3 border-morandi-gold rounded-r">
                    <strong className="text-morandi-primary font-semibold">個人物品:</strong>{' '}
                    {detail.personalItemDetail}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
