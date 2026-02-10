'use client'

/**
 * TourPrintDialog - 團體列印對話框
 * 整合所有列印功能：成員名單、航班確認單、住宿確認單
 */

import React, { useState, useEffect } from 'react'
import { Printer, X, Plane, Hotel, Users, Check, Loader2, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import { useReferenceData } from '@/lib/pnr'
import type { Tour } from '@/stores/types'
import type { OrderMember, ExportColumnsConfig } from '@/components/orders/order-member.types'
import type { PNR, PNRSegment } from '@/types/pnr.types'
import {
  COLUMN_LABELS,
  DEFAULT_COLUMNS,
  CLASS_NAMES,
  STATUS_NAMES,
} from './tour-print-constants'

interface TourPrintDialogProps {
  isOpen: boolean
  tour: Tour
  members: OrderMember[]
  onClose: () => void
}

// 機場和航空公司名稱從 useReferenceData hook 取得（統一從資料庫 ref_airports, ref_airlines 表讀取）

export function TourPrintDialog({
  isOpen,
  tour,
  members,
  onClose,
}: TourPrintDialogProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'flight' | 'hotel'>('members')
  const [columns, setColumns] = useState<ExportColumnsConfig>(DEFAULT_COLUMNS)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(members.map(m => m.id))
  )
  const [pnrData, setPnrData] = useState<PNR[]>([])
  const [loadingPnr, setLoadingPnr] = useState(false)

  // 從資料庫取得機場和航空公司名稱（統一來源）
  const { getAirportName: getAirportNameFromDb, getAirlineName: getAirlineNameFromDb } = useReferenceData({ enabled: false })

  // 常用機場中文名稱（備援）
  const AIRPORT_NAMES: Record<string, string> = {
    TPE: '台北桃園', TSA: '台北松山', KHH: '高雄', RMQ: '台中',
    HKG: '香港', MFM: '澳門',
    NRT: '東京成田', HND: '東京羽田', KIX: '大阪關西', NGO: '名古屋', FUK: '福岡', CTS: '札幌', OKA: '沖繩',
    ICN: '首爾仁川', GMP: '首爾金浦', PUS: '釜山',
    BKK: '曼谷', CNX: '清邁', HKT: '普吉島',
    SIN: '新加坡', KUL: '吉隆坡',
    PVG: '上海浦東', SHA: '上海虹橋', PEK: '北京首都', PKX: '北京大興', CAN: '廣州', SZX: '深圳',
    MNL: '馬尼拉', SGN: '胡志明市', HAN: '河內',
    LAX: '洛杉磯', SFO: '舊金山', JFK: '紐約乾迺迪', SEA: '西雅圖',
    LHR: '倫敦希斯洛', CDG: '巴黎戴高樂', FRA: '法蘭克福', AMS: '阿姆斯特丹',
    SYD: '雪梨', MEL: '墨爾本', AKL: '奧克蘭',
  }

  // 常用航空公司中文名稱（備援）
  const AIRLINE_NAMES: Record<string, string> = {
    CI: '中華航空', BR: '長榮航空', JX: '星宇航空', IT: '台灣虎航', B7: '立榮航空', AE: '華信航空',
    CX: '國泰航空', KA: '國泰港龍', HX: '香港航空', UO: '香港快運',
    JL: '日本航空', NH: '全日空', MM: '樂桃航空', BC: '天馬航空',
    KE: '大韓航空', OZ: '韓亞航空', TW: '德威航空', LJ: '真航空', '7C': '濟州航空',
    SQ: '新加坡航空', TR: '酷航', MH: '馬來西亞航空', AK: '亞洲航空',
    TG: '泰國航空', FD: '泰亞航空', VZ: '泰越捷',
    VN: '越南航空', PR: '菲律賓航空',
    CA: '中國國航', MU: '東方航空', CZ: '南方航空', HU: '海南航空',
    UA: '聯合航空', AA: '美國航空', DL: '達美航空',
    BA: '英國航空', AF: '法國航空', LH: '漢莎航空', KL: '荷蘭皇家',
    EK: '阿聯酋航空', QR: '卡達航空', EY: '阿提哈德',
    QF: '澳洲航空', NZ: '紐西蘭航空',
  }

  // 取得機場名稱（優先用資料庫，再用本地對照表）
  const getAirportName = (code: string) => {
    const dbName = getAirportNameFromDb(code)
    if (dbName && dbName !== code) return dbName
    return AIRPORT_NAMES[code] || code
  }

  // 取得航空公司名稱（優先用資料庫，再用本地對照表）
  const getAirlineName = (code: string) => {
    const dbName = getAirlineNameFromDb(code)
    if (dbName && dbName !== code) return dbName
    return AIRLINE_NAMES[code] || code
  }

  // 載入 PNR 資料 - 先用 tour_id，再用成員的 PNR 代號
  useEffect(() => {
    if (isOpen && tour.id) {
      setLoadingPnr(true)

      // 收集成員的 PNR 代號
      const memberPnrCodes = members
        .map(m => m.pnr)
        .filter((pnr): pnr is string => !!pnr)

      // 查詢方式：tour_id 或 record_locator
      const fetchPnrs = async () => {
        const results: PNR[] = []

        // 1. 先查 tour 關聯的 PNR
        const { data: tourPnrs } = await supabase
          .from('pnrs')
          .select('*')
          .eq('tour_id', tour.id)

        if (tourPnrs) {
          results.push(...(tourPnrs as unknown as PNR[]))
        }

        // 2. 再查成員 PNR 代號（排除已經找到的）
        if (memberPnrCodes.length > 0) {
          const existingLocators = new Set(results.map(p => p.record_locator))
          const missingCodes = memberPnrCodes.filter(c => !existingLocators.has(c))

          if (missingCodes.length > 0) {
            const { data: memberPnrs } = await supabase
              .from('pnrs')
              .select('*')
              .in('record_locator', missingCodes)

            if (memberPnrs) {
              results.push(...(memberPnrs as unknown as PNR[]))
            }
          }
        }

        setPnrData(results)
        setLoadingPnr(false)
      }

      fetchPnrs()
    }
  }, [isOpen, tour.id, members])

  // 切換欄位選擇
  const toggleColumn = (key: keyof ExportColumnsConfig) => {
    setColumns({ ...columns, [key]: !columns[key] })
  }

  // 全選/取消全選欄位
  const toggleAllColumns = () => {
    const allSelected = Object.values(columns).every(v => v)
    const newColumns = Object.keys(columns).reduce((acc, key) => ({
      ...acc,
      [key]: !allSelected,
    }), {} as ExportColumnsConfig)
    setColumns(newColumns)
  }

  // 切換成員選擇
  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMembers(newSelected)
  }

  // 全選/取消全選成員
  const toggleAllMembers = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)))
    }
  }

  // getAirportName 和 getAirlineName 來自 useReferenceData hook（統一從資料庫讀取）

  // 取得艙等名稱
  const getClassName = (code: string) => CLASS_NAMES[code] || code

  // 取得狀態名稱
  const getStatusName = (code: string) => STATUS_NAMES[code] || code

  // 計算飛行時間
  const calculateDuration = (depTime: string | undefined, arrTime: string | undefined) => {
    if (!depTime || !arrTime || depTime.length < 4 || arrTime.length < 4) return null
    const depHour = parseInt(depTime.substring(0, 2))
    const depMin = parseInt(depTime.substring(2, 4))
    const arrHour = parseInt(arrTime.substring(0, 2))
    const arrMin = parseInt(arrTime.substring(2, 4))
    let totalMin = (arrHour * 60 + arrMin) - (depHour * 60 + depMin)
    if (totalMin < 0) totalMin += 24 * 60 // 跨日
    const hours = Math.floor(totalMin / 60)
    const mins = totalMin % 60
    return `${String(hours).padStart(2, '0')}小時${String(mins).padStart(2, '0')}分`
  }

  // ==================== 列印成員名單 ====================
  const handlePrintMembers = () => {
    const selectedColumns = Object.entries(columns)
      .filter(([, selected]) => selected)
      .map(([key]) => key as keyof ExportColumnsConfig)

    const printMembers = members.filter(m => selectedMembers.has(m.id))

    const tableRows = printMembers.map((member, index) => {
      const cells = selectedColumns.map(col => {
        let value = ''
        switch (col) {
          case 'identity': value = member.identity || ''; break
          case 'chinese_name': value = member.chinese_name || ''; break
          case 'passport_name': value = member.passport_name || ''; break
          case 'birth_date': value = member.birth_date || ''; break
          case 'gender': value = member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : ''; break
          case 'id_number': value = member.id_number || ''; break
          case 'passport_number': value = member.passport_number || ''; break
          case 'passport_expiry': value = member.passport_expiry || ''; break
          case 'special_meal': value = member.special_meal || ''; break
          case 'hotel_confirmation': value = member.hotel_confirmation || ''; break
          case 'total_payable': value = member.total_payable?.toLocaleString() || ''; break
          case 'deposit_amount': value = member.deposit_amount?.toLocaleString() || ''; break
          case 'balance': value = member.balance_amount?.toLocaleString() || ''; break
          case 'remarks': value = member.remarks || ''; break
        }
        return `<td style="border: 1px solid #ddd; padding: 8px;">${value}</td>`
      }).join('')

      return `<tr><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>${cells}</tr>`
    }).join('')

    const headerCells = selectedColumns
      .map(col => `<th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">${COLUMN_LABELS[col]}</th>`)
      .join('')

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>成員名單 - ${tour.code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .info { font-size: 12px; color: #666; margin-bottom: 15px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>成員名單 - ${tour.code} ${tour.name}</h1>
          <div class="info">
            出發日期：${tour.departure_date || '未設定'} | 總人數：${printMembers.length} 人
          </div>
          <table>
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; width: 40px;">#</th>
                ${headerCells}
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `
    openPrintWindow(printContent)
  }

  // ==================== 匯出 Excel ====================
  const handleExportExcel = async () => {
    const selectedColumns = Object.entries(columns)
      .filter(([, selected]) => selected)
      .map(([key]) => key as keyof ExportColumnsConfig)

    if (selectedColumns.length === 0) return

    // 動態載入 xlsx（避免污染首屏 bundle）
    const XLSX = await import('xlsx')

    // 轉換資料
    const data = members.map((member, idx) => {
      const row: Record<string, string | number> = { '序': idx + 1 }
      selectedColumns.forEach(col => {
        const label = COLUMN_LABELS[col]
        switch (col) {
          case 'gender':
            row[label] = member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : ''
            break
          case 'balance':
            row[label] = (member.total_payable || 0) - (member.deposit_amount || 0)
            break
          case 'total_payable':
          case 'deposit_amount':
            row[label] = member[col] || 0
            break
          default:
            row[label] = member[col as keyof OrderMember] as string || ''
        }
      })
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '團員名單')

    // 設定欄寬
    const colWidths = [{ wch: 5 }] // 序號欄
    selectedColumns.forEach(col => {
      if (['chinese_name', 'passport_name'].includes(col)) {
        colWidths.push({ wch: 20 })
      } else if (['remarks', 'special_meal'].includes(col)) {
        colWidths.push({ wch: 25 })
      } else if (['total_payable', 'deposit_amount', 'balance'].includes(col)) {
        colWidths.push({ wch: 12 })
      } else {
        colWidths.push({ wch: 15 })
      }
    })
    worksheet['!cols'] = colWidths

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const fileName = `${tour.code}_團員名單_${today}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  // ==================== 列印航班確認單（電子機票格式）====================
  const handlePrintFlightConfirmation = () => {
    const printMembers = members.filter(m => selectedMembers.has(m.id))

    // 格式化 PNR 日期 (e.g., "04JAN" -> "01月04日(六)")
    const formatPnrDate = (dateStr: string) => {
      const months: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
      }
      const day = parseInt(dateStr.substring(0, 2))
      const monthStr = dateStr.substring(2, 5).toUpperCase()
      const month = months[monthStr] ?? 0
      const year = new Date().getFullYear()
      const date = new Date(year, month, day)
      const days = ['日', '一', '二', '三', '四', '五', '六']
      return `${String(month + 1).padStart(2, '0')}月${String(day).padStart(2, '0')}日 (${days[date.getDay()]})`
    }

    // 格式化時間 (e.g., "1110" -> "11:10")
    const formatTime = (time: string | undefined) => {
      if (!time || time.length < 4) return time || '--:--'
      return `${time.substring(0, 2)}:${time.substring(2, 4)}`
    }

    // 產生每位旅客的確認單
    const pages = printMembers.map((member, index) => {
      // 格式化護照姓名：LEE/WAILAN → LEE / WAILAN
      const formatPassportName = (name: string) => {
        return name.toUpperCase().replace('/', ' / ')
      }
      const passengerName = member.passport_name
        ? formatPassportName(member.passport_name)
        : member.chinese_name || '未知'

      // 找到該旅客的 PNR
      const memberPnr = pnrData.find(p => p.record_locator === member.pnr)
      const segments: PNRSegment[] = memberPnr?.segments || []

      // 航班卡片 HTML
      const flightCards: string[] = []

      if (segments.length > 0) {
        // 從 PNR segments 產生航班資訊
        segments.forEach((seg) => {
          const duration = seg.duration || calculateDuration(seg.departureTime, seg.arrivalTime)
          const className = getClassName(seg.class)
          const depAirportName = getAirportName(seg.origin) || seg.origin
          const arrAirportName = getAirportName(seg.destination) || seg.destination
          const airlineName = getAirlineName(seg.airline) || seg.airline
          const depTerminal = seg.departureTerminal ? `第${seg.departureTerminal}航廈` : ''
          const arrTerminal = seg.arrivalTerminal ? `第${seg.arrivalTerminal}航廈` : ''

          flightCards.push(`
            <div class="flight-card">
              <div class="flight-header-row">
                <span class="flight-number">${seg.airline}${seg.flightNumber}</span>
                <span class="flight-airline">${airlineName}</span>
                <span class="flight-date">${formatPnrDate(seg.departureDate)}</span>
              </div>
              <div class="flight-content">
                <div class="flight-departure">
                  <div class="flight-label">出發 DEPART</div>
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
                  <div class="flight-label">抵達 ARRIVE</div>
                  <div class="flight-time">${formatTime(seg.arrivalTime)}</div>
                  <div class="flight-airport">${arrAirportName}</div>
                  <div class="flight-terminal">${seg.destination}${arrTerminal ? ' ' + arrTerminal : ''}</div>
                </div>
              </div>
            </div>
          `)
        })
      } else if (tour.outbound_flight || tour.return_flight) {
        // 降級使用 tour 的航班資訊
        const outbound = tour.outbound_flight
        const returnFlight = tour.return_flight

        if (outbound) {
          const depCity = getAirportName(outbound.departureAirport || '') || outbound.departureAirport
          const arrCity = getAirportName(outbound.arrivalAirport || '') || outbound.arrivalAirport
          flightCards.push(`
            <div class="flight-card">
              <div class="flight-header-row">
                <span class="flight-number">${outbound.airline}${outbound.flightNumber}</span>
                <span class="flight-date">${tour.departure_date || ''}</span>
              </div>
              <div class="flight-content">
                <div class="flight-departure">
                  <div class="flight-label">出發 DEPART</div>
                  <div class="flight-time">${outbound.departureTime || '--:--'}</div>
                  <div class="flight-airport">${outbound.departureAirport} ${depCity}</div>
                </div>
                <div class="flight-middle">
                  <div class="flight-path">
                    <span class="path-line"></span>
                    <span class="path-icon">✈</span>
                    <span class="path-line with-arrow"></span>
                  </div>
                  <div class="flight-duration">${outbound.duration || ''}</div>
                  <div class="flight-class">經濟艙 Economy</div>
                </div>
                <div class="flight-arrival">
                  <div class="flight-label">抵達 ARRIVE</div>
                  <div class="flight-time">${outbound.arrivalTime || '--:--'}</div>
                  <div class="flight-airport">${arrCity} ${outbound.arrivalAirport}</div>
                </div>
              </div>
            </div>
          `)
        }

        if (returnFlight) {
          const depCity = getAirportName(returnFlight.departureAirport || '') || returnFlight.departureAirport
          const arrCity = getAirportName(returnFlight.arrivalAirport || '') || returnFlight.arrivalAirport
          flightCards.push(`
            <div class="flight-card">
              <div class="flight-header-row">
                <span class="flight-number">${returnFlight.airline}${returnFlight.flightNumber}</span>
                <span class="flight-date">${tour.return_date || ''}</span>
              </div>
              <div class="flight-content">
                <div class="flight-departure">
                  <div class="flight-label">出發 DEPART</div>
                  <div class="flight-time">${returnFlight.departureTime || '--:--'}</div>
                  <div class="flight-airport">${returnFlight.departureAirport} ${depCity}</div>
                </div>
                <div class="flight-middle">
                  <div class="flight-path">
                    <span class="path-line"></span>
                    <span class="path-icon">✈</span>
                    <span class="path-line with-arrow"></span>
                  </div>
                  <div class="flight-duration">${returnFlight.duration || ''}</div>
                  <div class="flight-class">經濟艙 Economy</div>
                </div>
                <div class="flight-arrival">
                  <div class="flight-label">抵達 ARRIVE</div>
                  <div class="flight-time">${returnFlight.arrivalTime || '--:--'}</div>
                  <div class="flight-airport">${arrCity} ${returnFlight.arrivalAirport}</div>
                </div>
              </div>
            </div>
          `)
        }
      }

      return `
        <div class="page" style="${index > 0 ? 'page-break-before: always;' : ''}">
          <!-- Watermark - 潮牌風格垂直貼右邊 -->
          <div class="watermark">
            <img src="/corner-logo.png" alt="" />
          </div>

          <!-- Content Area -->
          <div class="content">
            <!-- Header -->
            <div class="header">
              <div class="header-left">
                <div class="company-name">角落旅行社股份有限公司</div>
                <div class="ticket-label">電子機票號碼 E-TICKET NUMBER</div>
                <div class="ticket-number">${member.ticket_number || '尚未開票'}</div>
              </div>
              <div class="header-right">
                <div class="pnr-label">電腦代號 PNR</div>
                <div class="pnr-box">${member.pnr || '-'}</div>
              </div>
            </div>

            <!-- Divider -->
            <div class="divider"></div>

            <!-- Passenger Name -->
            <div class="passenger-section">
              <div class="passenger-label">旅客姓名 PASSENGER NAME</div>
              <div class="passenger-name">
                <span class="name-bar"></span>
                ${passengerName}
              </div>
            </div>

            <!-- Flight Cards -->
            <div class="flights-section">
              ${flightCards.length > 0 ? flightCards.join('') : '<div class="no-flight">尚無航班資訊</div>'}
            </div>
          </div>

          <!-- Footer - 固定在底部 -->
          <div class="footer">
            <div class="footer-notice">**** 此文件資訊僅供參考，實際資訊以航空公司及相關旅遊供應商為準 ****</div>
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

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>電子機票 - ${tour.code}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 210mm;
              min-height: 297mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              background: white;
              color: #333;
            }
            .page {
              width: 210mm;
              height: 297mm;
              padding: 18mm 20mm;
              position: relative;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              box-sizing: border-box;
            }
            .content {
              flex: 1;
              min-height: 0;
            }

            /* Header */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            .header-left {}
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 16px;
            }
            .ticket-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .ticket-number {
              font-size: 22px;
              font-weight: 300;
              letter-spacing: 2px;
            }
            .header-right {
              text-align: right;
            }
            .pnr-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .pnr-box {
              border: 1px solid #999;
              padding: 8px 16px;
              font-size: 16px;
              font-weight: bold;
              letter-spacing: 3px;
              font-family: monospace;
            }

            /* Divider */
            .divider {
              border-top: 1px solid #ddd;
              margin: 20px 0;
            }

            /* Passenger */
            .passenger-section {
              margin-bottom: 30px;
            }
            .passenger-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .passenger-name {
              font-size: 26px;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .name-bar {
              width: 4px;
              height: 28px;
              background: #333;
            }

            /* Flight Cards */
            .flights-section {
              margin-bottom: 40px;
            }
            .flight-card {
              margin-bottom: 30px;
            }
            .flight-header-row {
              display: flex;
              align-items: center;
              gap: 16px;
              margin-bottom: 12px;
            }
            .flight-number {
              background: #333;
              color: white;
              padding: 4px 12px;
              font-size: 13px;
              font-weight: 500;
            }
            .flight-airline {
              font-size: 13px;
              color: #666;
              margin-left: 8px;
            }
            .flight-date {
              font-size: 13px;
              color: #666;
              margin-left: auto;
            }
            .flight-content {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
            }
            .flight-departure,
            .flight-arrival {
              width: 120px;
            }
            .flight-departure {
              text-align: left;
            }
            .flight-arrival {
              text-align: right;
            }
            .flight-label {
              font-size: 11px;
              color: #888;
              margin-bottom: 4px;
            }
            .flight-time {
              font-size: 38px;
              font-weight: 300;
              line-height: 1;
              margin-bottom: 8px;
            }
            .flight-airport {
              font-size: 12px;
              color: #666;
            }
            .flight-terminal {
              font-size: 11px;
              color: #999;
              margin-top: 2px;
            }
            .flight-middle {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding-top: 24px;
            }
            .flight-path {
              display: flex;
              align-items: center;
              width: 100%;
              margin-bottom: 8px;
            }
            .path-line {
              flex: 1;
              height: 1px;
              background: #ccc;
            }
            .path-line.with-arrow {
              position: relative;
            }
            .path-line.with-arrow::after {
              content: '›';
              position: absolute;
              right: -4px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 16px;
              line-height: 1;
              color: #999;
            }
            .path-icon {
              margin: 0 8px;
              font-size: 14px;
              color: #666;
            }
            .flight-duration {
              font-size: 11px;
              color: #888;
              margin-bottom: 6px;
            }
            .flight-class {
              border: 1px solid #ccc;
              padding: 3px 10px;
              font-size: 10px;
              color: #666;
            }
            .no-flight {
              text-align: center;
              padding: 40px;
              color: #999;
            }

            /* Watermark - 潮牌風格，C從底部分割線開始往上貼著右邊 */
            .watermark {
              position: absolute;
              right: -195px;
              bottom: 420px;
              pointer-events: none;
              z-index: 0;
            }
            .watermark img {
              width: 650px;
              height: auto;
              opacity: 0.1;
              transform: rotate(270deg);
              transform-origin: center;
            }

            /* Footer */
            .footer {
              margin-top: auto;
              padding-top: 30px;
              border-top: 1px solid #eee;
            }
            .footer-notice {
              text-align: center;
              font-size: 10px;
              color: #999;
              margin-bottom: 12px;
            }
            .footer-contact {
              display: flex;
              justify-content: center;
              gap: 20px;
              font-size: 9px;
              color: #aaa;
            }

            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              html, body {
                width: 100%;
                background: white !important;
                margin: 0;
                padding: 0;
              }
              .page {
                width: 100%;
                height: 100vh;
                padding: 12mm 15mm;
                page-break-after: always;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-sizing: border-box;
              }
              .page:last-child {
                page-break-after: auto;
              }
              .content {
                flex: 1;
                min-height: 0;
              }
              .flight-number {
                background: #333 !important;
                color: white !important;
              }
              .name-bar {
                background: #333 !important;
              }
              .watermark {
                position: absolute;
                right: -200px;
                bottom: 410px;
              }
              .watermark img {
                width: 600px;
                opacity: 0.1 !important;
                transform: rotate(270deg);
                transform-origin: center;
              }
              .footer {
                margin-top: auto;
                padding-top: 15px;
                border-top: 1px solid #eee;
              }
            }
            @media screen {
              body {
                background: #f0f0f0;
                padding: 20px;
              }
              .page {
                background: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin: 0 auto 20px;
              }
            }
          </style>
        </head>
        <body>${pages}</body>
      </html>
    `
    openPrintWindow(printContent)
  }

  // ==================== 列印住宿確認單 ====================
  const handlePrintHotelConfirmation = () => {
    const printMembers = members.filter(m => selectedMembers.has(m.id))

    const pages = printMembers.map((member, index) => {
      const guestName = member.passport_name?.toUpperCase() || member.chinese_name || '未知'
      const hotels: { name: string; checkin: string; checkout: string }[] = []

      if (member.hotel_1_name) {
        hotels.push({
          name: member.hotel_1_name,
          checkin: member.hotel_1_checkin || '-',
          checkout: member.hotel_1_checkout || '-',
        })
      }
      if (member.hotel_2_name) {
        hotels.push({
          name: member.hotel_2_name,
          checkin: member.hotel_2_checkin || '-',
          checkout: member.hotel_2_checkout || '-',
        })
      }

      const hotelRows = hotels.map(h => `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">${h.name}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${h.checkin}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${h.checkout}</td>
        </tr>
      `).join('')

      return `
        <div class="page" style="${index > 0 ? 'page-break-before: always;' : ''}">
          <div class="header">
            <div class="company">角落旅行社股份有限公司</div>
            <div class="address">台北市大同區重慶北路一段67號八樓之二</div>
          </div>

          <h2>住宿確認單</h2>

          <div class="info-row">
            <span>團號: ${tour.code}</span>
            <span>行程: ${tour.name}</span>
          </div>

          <div class="guest-info">
            <strong>旅客姓名:</strong> ${guestName}
            ${member.hotel_confirmation ? `<br/><strong>訂房代號:</strong> ${member.hotel_confirmation}` : ''}
          </div>

          <table class="hotel-table">
            <thead>
              <tr>
                <th>飯店名稱</th>
                <th style="width: 120px;">入住日期</th>
                <th style="width: 120px;">退房日期</th>
              </tr>
            </thead>
            <tbody>
              ${hotelRows || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">尚未設定住宿資訊</td></tr>'}
            </tbody>
          </table>

          <div class="notice">
            **** 此確認單僅供參考，實際訂房資訊以飯店確認為準 ****
          </div>
        </div>
      `
    }).join('')

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>住宿確認單 - ${tour.code}</title>
          <style>
            body {
              font-family: 'Microsoft JhengHei', Arial, sans-serif;
              padding: 20px;
              font-size: 13px;
            }
            .page { padding: 20px; }
            .header { margin-bottom: 20px; }
            .company { font-size: 18px; font-weight: bold; }
            .address { font-size: 12px; color: #666; margin-top: 4px; }
            h2 {
              text-align: center;
              margin: 30px 0 20px;
              font-size: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 14px;
            }
            .guest-info {
              padding: 15px;
              background: #f9f9f9;
              margin-bottom: 20px;
              line-height: 1.8;
            }
            .hotel-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .hotel-table th {
              background: #f0f0f0;
              padding: 12px;
              text-align: left;
              border: 1px solid #ddd;
            }
            .notice {
              text-align: center;
              color: #999;
              font-size: 11px;
              margin-top: 30px;
            }
            @media print {
              body { padding: 0; }
              .page { padding: 15mm; }
            }
          </style>
        </head>
        <body>${pages}</body>
      </html>
    `
    openPrintWindow(printContent)
  }

  // 開啟列印視窗
  const openPrintWindow = (content: string) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(content)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 250)
    }
    onClose()
  }

  const selectedCount = selectedMembers.size

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent level={2} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer size={18} />
            列印 - {tour.code}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="gap-1">
              <Users size={14} />
              成員名單
            </TabsTrigger>
            <TabsTrigger value="flight" className="gap-1">
              <Plane size={14} />
              航班確認
            </TabsTrigger>
            <TabsTrigger value="hotel" className="gap-1">
              <Hotel size={14} />
              住宿確認
            </TabsTrigger>
          </TabsList>

          {/* 成員名單 Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-morandi-secondary">選擇要匯出的欄位</span>
              <Button variant="ghost" size="sm" onClick={toggleAllColumns}>
                {Object.values(columns).every(v => v) ? '取消全選' : '全選'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {(Object.keys(columns) as (keyof ExportColumnsConfig)[]).map(key => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded hover:bg-morandi-bg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={columns[key]}
                    onChange={() => toggleColumn(key)}
                    className="rounded border-morandi-border"
                  />
                  <span className="text-sm">{COLUMN_LABELS[key]}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-morandi-border">
              <Button variant="outline" onClick={onClose}>
                <X size={16} className="mr-1" />
                取消
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet size={16} className="mr-1" />
                Excel
              </Button>
              <Button onClick={handlePrintMembers} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                <Printer size={16} className="mr-1" />
                列印
              </Button>
            </div>
          </TabsContent>

          {/* 航班確認單 Tab */}
          <TabsContent value="flight" className="space-y-4">
            <div className="text-sm text-morandi-secondary mb-2">
              選擇要列印航班確認單的成員（每人一頁）
              {loadingPnr && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  載入航班資料中...
                </span>
              )}
              {!loadingPnr && pnrData.length > 0 && (
                <span className="ml-2 text-morandi-green">
                  已載入 {pnrData.length} 筆 PNR 資料
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">{selectedCount} / {members.length} 人已選</span>
              <Button variant="ghost" size="sm" onClick={toggleAllMembers}>
                {selectedCount === members.length ? '取消全選' : '全選'}
              </Button>
            </div>
            <div className="max-h-[250px] overflow-y-auto border border-border rounded-lg">
              {members.map(member => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-3 hover:bg-morandi-bg cursor-pointer border-b border-border/50 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="rounded border-morandi-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.chinese_name || member.passport_name}</div>
                    <div className="text-xs text-morandi-secondary flex gap-2">
                      <span>PNR: {member.pnr || '-'}</span>
                      <span>票號: {member.ticket_number || '-'}</span>
                    </div>
                  </div>
                  {member.ticket_number && (
                    <Check size={14} className="text-morandi-green" />
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-morandi-border">
              <Button variant="outline" onClick={onClose}>
                <X size={16} className="mr-1" />
                取消
              </Button>
              <Button
                onClick={handlePrintFlightConfirmation}
                disabled={selectedCount === 0}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Printer size={16} className="mr-1" />
                列印 ({selectedCount} 人)
              </Button>
            </div>
          </TabsContent>

          {/* 住宿確認單 Tab */}
          <TabsContent value="hotel" className="space-y-4">
            <div className="text-sm text-morandi-secondary mb-2">
              選擇要列印住宿確認單的成員（每人一頁）
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">{selectedCount} / {members.length} 人已選</span>
              <Button variant="ghost" size="sm" onClick={toggleAllMembers}>
                {selectedCount === members.length ? '取消全選' : '全選'}
              </Button>
            </div>
            <div className="max-h-[250px] overflow-y-auto border border-border rounded-lg">
              {members.map(member => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-3 hover:bg-morandi-bg cursor-pointer border-b border-border/50 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="rounded border-morandi-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.chinese_name || member.passport_name}</div>
                    <div className="text-xs text-morandi-secondary">
                      {member.hotel_1_name || '未設定住宿'}
                      {member.hotel_2_name && ` / ${member.hotel_2_name}`}
                    </div>
                  </div>
                  {member.hotel_1_name && (
                    <Check size={14} className="text-morandi-green" />
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-morandi-border">
              <Button variant="outline" onClick={onClose}>
                <X size={16} className="mr-1" />
                取消
              </Button>
              <Button
                onClick={handlePrintHotelConfirmation}
                disabled={selectedCount === 0}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Printer size={16} className="mr-1" />
                列印 ({selectedCount} 人)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
