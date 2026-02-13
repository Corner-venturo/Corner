import type { Tour } from '@/stores/types'
import type { OrderMember } from '@/components/orders/order-member.types'
import type { PNR, PNRSegment } from '@/types/pnr.types'
import { CLASS_NAMES, STATUS_NAMES } from '../tour-print-constants'
import { TOUR_PRINT_DIALOG_LABELS } from '../constants/labels'

interface FlightPrintOptions {
  tour: Tour
  members: OrderMember[]
  pnrData: PNR[]
  getAirportName: (code: string) => string
  getAirlineName: (code: string) => string
}

function calculateDuration(depTime: string | undefined, arrTime: string | undefined): string | null {
  if (!depTime || !arrTime || depTime.length < 4 || arrTime.length < 4) return null
  const depHour = parseInt(depTime.substring(0, 2))
  const depMin = parseInt(depTime.substring(2, 4))
  const arrHour = parseInt(arrTime.substring(0, 2))
  const arrMin = parseInt(arrTime.substring(2, 4))
  let totalMin = (arrHour * 60 + arrMin) - (depHour * 60 + depMin)
  if (totalMin < 0) totalMin += 24 * 60
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  return `${String(hours).padStart(2, '0')}小時${String(mins).padStart(2, '0')}分`
}

function formatPnrDate(dateStr: string): string {
  const months: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  }
  const day = parseInt(dateStr.substring(0, 2))
  const monthStr = dateStr.substring(2, 5).toUpperCase()
  const month = months[monthStr] ?? 0
  const year = new Date().getFullYear()
  const date = new Date(year, month, day)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${String(month + 1).padStart(2, '0')}月${String(day).padStart(2, '0')}日 (${days[date.getDay()]})`
}

function formatTime(time: string | undefined): string {
  if (!time || time.length < 4) return time || '--:--'
  return `${time.substring(0, 2)}:${time.substring(2, 4)}`
}

function getClassName(code: string): string {
  return CLASS_NAMES[code] || code
}

function buildFlightCard(seg: PNRSegment, getAirportName: (c: string) => string, getAirlineName: (c: string) => string): string {
  const duration = seg.duration || calculateDuration(seg.departureTime, seg.arrivalTime)
  const className = getClassName(seg.class)
  const depAirportName = getAirportName(seg.origin) || seg.origin
  const arrAirportName = getAirportName(seg.destination) || seg.destination
  const airlineName = getAirlineName(seg.airline) || seg.airline
  const depTerminal = seg.departureTerminal ? `第${seg.departureTerminal}航廈` : ''
  const arrTerminal = seg.arrivalTerminal ? `第${seg.arrivalTerminal}航廈` : ''

  return `
    <div class="flight-card">
      <div class="flight-header-row">
        <span class="flight-number">${seg.airline}${seg.flightNumber}</span>
        <span class="flight-airline">${airlineName}</span>
        <span class="flight-date">${formatPnrDate(seg.departureDate)}</span>
      </div>
      <div class="flight-content">
        <div class="flight-departure">
          <div class="flight-label">${TOUR_PRINT_DIALOG_LABELS.出發_DEPART}</div>
          <div class="flight-time">${formatTime(seg.departureTime)}</div>
          <div class="flight-airport">${depAirportName}</div>
          <div class="flight-terminal">${seg.origin}${depTerminal ? ' ' + depTerminal : ''}</div>
        </div>
        <div class="flight-middle">
          <div class="flight-path">
            <span class="path-line"></span>
            <span class="path-icon">✈</span>
            <span class="path-line with-arrow"></span>
          </div>
          <div class="flight-duration">${duration || ''}</div>
          <div class="flight-class">${className}</div>
        </div>
        <div class="flight-arrival">
          <div class="flight-label">${TOUR_PRINT_DIALOG_LABELS.抵達_ARRIVE}</div>
          <div class="flight-time">${formatTime(seg.arrivalTime)}</div>
          <div class="flight-airport">${arrAirportName}</div>
          <div class="flight-terminal">${seg.destination}${arrTerminal ? ' ' + arrTerminal : ''}</div>
        </div>
      </div>
    </div>
  `
}

function buildTourFlightCard(
  flight: NonNullable<Tour['outbound_flight']>,
  date: string,
  getAirportName: (c: string) => string
): string {
  const depCity = getAirportName(flight.departureAirport || '') || flight.departureAirport
  const arrCity = getAirportName(flight.arrivalAirport || '') || flight.arrivalAirport
  return `
    <div class="flight-card">
      <div class="flight-header-row">
        <span class="flight-number">${flight.airline}${flight.flightNumber}</span>
        <span class="flight-date">${date}</span>
      </div>
      <div class="flight-content">
        <div class="flight-departure">
          <div class="flight-label">${TOUR_PRINT_DIALOG_LABELS.出發_DEPART}</div>
          <div class="flight-time">${flight.departureTime || '--:--'}</div>
          <div class="flight-airport">${flight.departureAirport} ${depCity}</div>
        </div>
        <div class="flight-middle">
          <div class="flight-path">
            <span class="path-line"></span>
            <span class="path-icon">✈</span>
            <span class="path-line with-arrow"></span>
          </div>
          <div class="flight-duration">${flight.duration || ''}</div>
          <div class="flight-class">${TOUR_PRINT_DIALOG_LABELS.經濟艙_Economy}</div>
        </div>
        <div class="flight-arrival">
          <div class="flight-label">${TOUR_PRINT_DIALOG_LABELS.抵達_ARRIVE}</div>
          <div class="flight-time">${flight.arrivalTime || '--:--'}</div>
          <div class="flight-airport">${arrCity} ${flight.arrivalAirport}</div>
        </div>
      </div>
    </div>
  `
}

export function generateFlightPrintContent({ tour, members, pnrData, getAirportName, getAirlineName }: FlightPrintOptions): string {
  const pages = members.map((member, index) => {
    const formatPassportName = (name: string) => name.toUpperCase().replace('/', ' / ')
    const passengerName = member.passport_name
      ? formatPassportName(member.passport_name)
      : member.chinese_name || '未知'

    const memberPnr = pnrData.find(p => p.record_locator === member.pnr)
    const segments: PNRSegment[] = memberPnr?.segments || []

    const flightCards: string[] = []

    if (segments.length > 0) {
      segments.forEach((seg) => {
        flightCards.push(buildFlightCard(seg, getAirportName, getAirlineName))
      })
    } else if (tour.outbound_flight || tour.return_flight) {
      if (tour.outbound_flight) {
        flightCards.push(buildTourFlightCard(tour.outbound_flight, tour.departure_date || '', getAirportName))
      }
      if (tour.return_flight) {
        flightCards.push(buildTourFlightCard(tour.return_flight, tour.return_date || '', getAirportName))
      }
    }

    return `
      <div class="page" style="${index > 0 ? 'page-break-before: always;' : ''}">
        <div class="watermark">
          <img src="/corner-logo.png" alt="" />
        </div>
        <div class="content">
          <div class="header">
            <div class="header-left">
              <div class="company-name">${TOUR_PRINT_DIALOG_LABELS.角落旅行社股份有限公司}</div>
              <div class="ticket-label">${TOUR_PRINT_DIALOG_LABELS.電子機票號碼_E_TICKET_NUMBER}</div>
              <div class="ticket-number">${member.ticket_number || '尚未開票'}</div>
            </div>
            <div class="header-right">
              <div class="pnr-label">${TOUR_PRINT_DIALOG_LABELS.電腦代號_PNR}</div>
              <div class="pnr-box">${member.pnr || '-'}</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="passenger-section">
            <div class="passenger-label">旅客姓名 PASSENGER NAME</div>
            <div class="passenger-name">
              <span class="name-bar"></span>
              ${passengerName}
            </div>
          </div>
          <div class="flights-section">
            ${flightCards.length > 0 ? flightCards.join('') : TOUR_PRINT_DIALOG_LABELS.div_class_no_flight_尚無航班資訊_div}
          </div>
        </div>
        <div class="footer">
          <div class="footer-notice">${TOUR_PRINT_DIALOG_LABELS.此文件資訊僅供參考_實際資訊以航空公司及相關旅遊供應商為準}</div>
          <div class="footer-contact">
            <span>📍 台北市大同區重慶北路一段67號八樓之二</span>
            <span>📞 886-2-77516051</span>
            <span>📠 886-2-25553098</span>
            <span>✉ sales@cornertravel.com.tw</span>
          </div>
        </div>
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>電子機票 - ${tour.code}</title>
        <style>${FLIGHT_PRINT_STYLES}</style>
      </head>
      <body>${pages}</body>
    </html>
  `
}

const FLIGHT_PRINT_STYLES = `
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; min-height: 297mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.5; background: white; color: #333; }
  .page { width: 210mm; height: 297mm; padding: 18mm 20mm; position: relative; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; }
  .content { flex: 1; min-height: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .company-name { font-size: 18px; font-weight: bold; margin-bottom: 16px; }
  .ticket-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .ticket-number { font-size: 22px; font-weight: 300; letter-spacing: 2px; }
  .header-right { text-align: right; }
  .pnr-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .pnr-box { border: 1px solid #999; padding: 8px 16px; font-size: 16px; font-weight: bold; letter-spacing: 3px; font-family: monospace; }
  .divider { border-top: 1px solid #ddd; margin: 20px 0; }
  .passenger-section { margin-bottom: 30px; }
  .passenger-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .passenger-name { font-size: 26px; font-weight: 500; display: flex; align-items: center; gap: 10px; }
  .name-bar { width: 4px; height: 28px; background: #333; }
  .flights-section { margin-bottom: 40px; }
  .flight-card { margin-bottom: 30px; }
  .flight-header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
  .flight-number { background: #333; color: white; padding: 4px 12px; font-size: 13px; font-weight: 500; }
  .flight-airline { font-size: 13px; color: #666; margin-left: 8px; }
  .flight-date { font-size: 13px; color: #666; margin-left: auto; }
  .flight-content { display: flex; align-items: flex-start; justify-content: space-between; }
  .flight-departure, .flight-arrival { width: 120px; }
  .flight-departure { text-align: left; }
  .flight-arrival { text-align: right; }
  .flight-label { font-size: 11px; color: #888; margin-bottom: 4px; }
  .flight-time { font-size: 38px; font-weight: 300; line-height: 1; margin-bottom: 8px; }
  .flight-airport { font-size: 12px; color: #666; }
  .flight-terminal { font-size: 11px; color: #999; margin-top: 2px; }
  .flight-middle { flex: 1; display: flex; flex-direction: column; align-items: center; padding-top: 24px; }
  .flight-path { display: flex; align-items: center; width: 100%; margin-bottom: 8px; }
  .path-line { flex: 1; height: 1px; background: #ccc; }
  .path-line.with-arrow { position: relative; }
  .path-line.with-arrow::after { content: '›'; position: absolute; right: -4px; top: 50%; transform: translateY(-50%); font-size: 16px; line-height: 1; color: #999; }
  .path-icon { margin: 0 8px; font-size: 14px; color: #666; }
  .flight-duration { font-size: 11px; color: #888; margin-bottom: 6px; }
  .flight-class { border: 1px solid #ccc; padding: 3px 10px; font-size: 10px; color: #666; }
  .no-flight { text-align: center; padding: 40px; color: #999; }
  .watermark { position: absolute; right: -195px; bottom: 420px; pointer-events: none; z-index: 0; }
  .watermark img { width: 650px; height: auto; opacity: 0.1; transform: rotate(270deg); transform-origin: center; }
  .footer { margin-top: auto; padding-top: 30px; border-top: 1px solid #eee; }
  .footer-notice { text-align: center; font-size: 10px; color: #999; margin-bottom: 12px; }
  .footer-contact { display: flex; justify-content: center; gap: 20px; font-size: 9px; color: #aaa; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    html, body { width: 100%; background: white !important; margin: 0; padding: 0; }
    .page { width: 100%; height: 100vh; padding: 12mm 15mm; page-break-after: always; position: relative; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; }
    .page:last-child { page-break-after: auto; }
    .content { flex: 1; min-height: 0; }
    .flight-number { background: #333 !important; color: white !important; }
    .name-bar { background: #333 !important; }
    .watermark { position: absolute; right: -200px; bottom: 410px; }
    .watermark img { width: 600px; opacity: 0.1 !important; transform: rotate(270deg); transform-origin: center; }
    .footer { margin-top: auto; padding-top: 15px; border-top: 1px solid #eee; }
  }
  @media screen {
    body { background: #f0f0f0; padding: 20px; }
    .page { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto 20px; }
  }
`
