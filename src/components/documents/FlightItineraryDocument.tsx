/**
 * FlightItineraryDocument - 航班行程單文件組件
 *
 * 特色：
 * - 符合 Venturo 設計風格（莫蘭迪配色）
 * - 支援列印（A4 尺寸優化）
 * - 不顯示價格資訊
 * - 清晰的資訊層級
 */

'use client'

import React, { forwardRef } from 'react'
import { PrintableItineraryData } from '@/types/flight-itinerary.types'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface FlightItineraryDocumentProps {
  data: PrintableItineraryData
  showHeader?: boolean // 是否顯示頁首
}

export const FlightItineraryDocument = forwardRef<HTMLDivElement, FlightItineraryDocumentProps>(
  ({ data, showHeader = true }, ref) => {
    // 格式化日期時間
    const formatDateTime = (isoString: string) => {
      try {
        const date = new Date(isoString)
        return {
          date: format(date, 'yyyy 年 M 月 d 日', { locale: zhTW }),
          time: format(date, 'HH:mm', { locale: zhTW }),
          weekday: format(date, 'EEEE', { locale: zhTW }),
        }
      } catch {
        return { date: isoString, time: '', weekday: '' }
      }
    }

    // 格式化艙等
    const formatCabin = (cabin: string) => {
      const cabinMap: Record<string, string> = {
        economy: '經濟艙',
        business: '商務艙',
        first: '頭等艙',
      }
      return cabinMap[cabin] || cabin
    }

    return (
      <div ref={ref} className="itinerary-document">
        {/* 頁首 */}
        {showHeader && (
          <div className="document-header">
            <div className="header-content">
              <h1 className="document-title">航班行程單</h1>
              {data.companyInfo && (
                <div className="company-info">
                  <p className="company-name">{data.companyInfo.name}</p>
                  {data.companyInfo.phone && (
                    <p className="company-contact">{data.companyInfo.phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 預訂資訊 */}
        <section className="info-section">
          <h2 className="section-title">預訂須知</h2>
          <div className="info-box">
            <p className="instruction-text">請自行列印行程單並隨身攜帶，以確保旅程順利。</p>
            <div className="booking-number">
              <span className="label">訂單編號</span>
              <span className="value">{data.bookingNumber}</span>
            </div>
          </div>
        </section>

        {/* 旅客資訊（按航段分組） */}
        {data.flights.map((flight, flightIndex) => (
          <section key={flightIndex} className="info-section">
            <h3 className="subsection-title">{flight.direction}</h3>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>艙等</th>
                    <th>電子機票票號</th>
                    <th>航空公司訂位代號</th>
                  </tr>
                </thead>
                <tbody>
                  {data.passengers.map((passenger, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="passenger-name">
                          <span className="name-en">
                            {passenger.lastName.toUpperCase()} (姓氏){' '}
                            {passenger.firstName.toUpperCase()} (名字)
                          </span>
                          {passenger.chineseName && (
                            <span className="name-zh">{passenger.chineseName}</span>
                          )}
                        </div>
                      </td>
                      <td>{formatCabin(passenger.cabin)}</td>
                      <td className="font-mono">{passenger.eTicketNumber}</td>
                      <td className="font-mono">{passenger.bookingReference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* 航班資訊 */}
        <section className="info-section">
          <h2 className="section-title">航班資訊</h2>

          {data.flights.map((flight, flightIndex) => {
            const departure = formatDateTime(flight.departure.dateTime)
            const arrival = formatDateTime(flight.arrival.dateTime)

            return (
              <div key={flightIndex} className="flight-card">
                <h3 className="flight-direction">{flight.direction}</h3>

                <div className="flight-details">
                  <div className="detail-row">
                    <span className="detail-label">出發</span>
                    <span className="detail-value">
                      {departure.date} {departure.time}, {flight.departure.airport}
                      {flight.departure.terminal && ` ${flight.departure.terminal}`}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">抵達</span>
                    <span className="detail-value">
                      {arrival.date} {arrival.time}, {flight.arrival.airport}
                      {flight.arrival.terminal && ` ${flight.arrival.terminal}`}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">航空公司</span>
                    <span className="detail-value">
                      {flight.airline} {flight.flightNumber}
                    </span>
                  </div>

                  {flight.duration && (
                    <div className="detail-row">
                      <span className="detail-label">飛行時間</span>
                      <span className="detail-value">{flight.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        {/* 行李額度 */}
        <section className="info-section">
          <h2 className="section-title">行李額度</h2>
          <p className="section-hint">請查看底端的行李資訊，以進一步了解詳情。</p>

          {Object.entries(data.baggageBySegment).map(([segmentKey, baggage], idx) => (
            <div key={idx} className="baggage-section">
              <h3 className="subsection-title">{segmentKey}</h3>

              {data.passengers.map((passenger, passengerIdx) => (
                <div key={passengerIdx} className="baggage-info-box">
                  <p className="passenger-label">
                    {passenger.firstName.toUpperCase()} {passenger.lastName.toUpperCase()} (成人)
                  </p>

                  <div className="baggage-grid">
                    <div className="baggage-item">
                      <span className="baggage-label">個人物品</span>
                      <span className="baggage-value">{baggage.personalItem}</span>
                    </div>

                    <div className="baggage-item">
                      <span className="baggage-label">手提行李</span>
                      <span className="baggage-value">
                        每人 {baggage.carryOn.pieces} 件，每件 {baggage.carryOn.weight} 公斤
                      </span>
                    </div>

                    <div className="baggage-item">
                      <span className="baggage-label">託運行李</span>
                      <span className="baggage-value">
                        每人 {baggage.checked.pieces} 件，每件 {baggage.checked.weight} 公斤
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* 重要資訊 */}
        {data.notes && data.notes.length > 0 && (
          <section className="info-section">
            <h2 className="section-title">重要資訊</h2>
            <ul className="notes-list">
              {data.notes.map((note, idx) => (
                <li key={idx} className="note-item">
                  {note}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 行李詳細資訊 */}
        <section className="info-section">
          <h2 className="section-title">行李資訊</h2>

          {Object.entries(data.baggageBySegment).map(([segmentKey, baggage], idx) => (
            <div key={idx} className="baggage-detail-section">
              <h3 className="subsection-title">{segmentKey}</h3>

              <ul className="baggage-detail-list">
                {baggage.carryOn.dimensions && (
                  <li>
                    <strong>手提行李:</strong> 每人 {baggage.carryOn.pieces} 件， 每件{' '}
                    {baggage.carryOn.weight} 公斤 每件尺寸上限 {baggage.carryOn.dimensions}
                  </li>
                )}

                {baggage.checked.dimensions && (
                  <li>
                    <strong>託運行李:</strong> 每人 {baggage.checked.pieces} 件， 每件{' '}
                    {baggage.checked.weight} 公斤 每件尺寸 {baggage.checked.dimensions}
                  </li>
                )}

                <li>
                  <strong>個人物品:</strong> {baggage.personalItem}{' '}
                  請聯繫航空公司以進一步了解行李政策 必須置於您前面座位的下方。
                </li>
              </ul>
            </div>
          ))}
        </section>

        {/* 頁尾 */}
        <div className="document-footer">
          <p className="footer-text">
            開票日期：{format(new Date(data.issuedDate), 'yyyy 年 M 月 d 日', { locale: zhTW })}
          </p>
        </div>
      </div>
    )
  }
)

FlightItineraryDocument.displayName = 'FlightItineraryDocument'
