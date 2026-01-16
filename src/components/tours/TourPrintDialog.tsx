'use client'

/**
 * TourPrintDialog - 團體列印對話框
 * 整合所有列印功能：成員名單、航班確認單、住宿確認單
 */

import React, { useState, useEffect } from 'react'
import { Printer, X, Plane, Hotel, Users, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import type { Tour } from '@/stores/types'
import type { OrderMember, ExportColumnsConfig } from '@/components/orders/order-member.types'
import type { PNR, PNRSegment } from '@/types/pnr.types'

interface TourPrintDialogProps {
  isOpen: boolean
  tour: Tour
  members: OrderMember[]
  onClose: () => void
}

// 成員名單欄位標籤
const COLUMN_LABELS: Record<keyof ExportColumnsConfig, string> = {
  identity: '身份',
  chinese_name: '中文姓名',
  passport_name: '護照姓名',
  birth_date: '生日',
  gender: '性別',
  id_number: '身分證號',
  passport_number: '護照號碼',
  passport_expiry: '護照效期',
  special_meal: '特殊餐食',
  hotel_confirmation: '訂房代號',
  remarks: '備註',
  // 金額相關欄位放最後
  total_payable: '應付金額',
  deposit_amount: '已付訂金',
  balance: '尾款',
}

// 預設欄位選擇
const DEFAULT_COLUMNS: ExportColumnsConfig = {
  identity: false,
  chinese_name: true,
  passport_name: true,
  birth_date: true,
  gender: true,
  id_number: false,
  passport_number: true,
  passport_expiry: true,
  special_meal: true,
  hotel_confirmation: false,
  remarks: false,
  // 金額相關欄位預設顯示
  total_payable: true,
  deposit_amount: true,
  balance: true,
}

// 艙等代碼對照表
const CLASS_NAMES: Record<string, string> = {
  F: '頭等艙',
  C: '商務艙',
  J: '商務艙',
  W: '豪華經濟艙',
  Y: '經濟艙',
  B: '經濟艙',
  M: '經濟艙',
  H: '經濟艙',
  K: '經濟艙',
  L: '經濟艙',
  Q: '經濟艙',
  T: '經濟艙',
  V: '經濟艙',
  X: '經濟艙',
}

// 狀態代碼對照表
const STATUS_NAMES: Record<string, string> = {
  HK: 'OK',
  TK: '已開票',
  UC: '未確認',
  XX: '取消',
  HX: '已刪除',
  HL: '候補',
  HN: '需確認',
  LL: '候補中',
  WL: '候補',
}

// 機場代碼對照表
const AIRPORT_NAMES: Record<string, string> = {
  TPE: '台灣桃園機場',
  TSA: '台北松山機場',
  KHH: '高雄小港機場',
  RMQ: '台中清泉崗機場',
  XMN: '廈門高崎國際機場',
  PVG: '上海浦東國際機場',
  SHA: '上海虹橋機場',
  PEK: '北京首都機場',
  PKX: '北京大興機場',
  CAN: '廣州白雲機場',
  HKG: '香港國際機場',
  NRT: '東京成田機場',
  HND: '東京羽田機場',
  KIX: '大阪關西機場',
  ICN: '首爾仁川機場',
  BKK: '曼谷素萬那普機場',
  SIN: '新加坡樟宜機場',
  OKA: '沖繩那霸機場',
  FUK: '福岡機場',
  NGO: '名古屋中部機場',
  CTS: '札幌新千歲機場',
}

// 航空公司代碼對照表
const AIRLINE_NAMES: Record<string, string> = {
  BR: '長榮航空',
  CI: '中華航空',
  CX: '國泰航空',
  MF: '廈門航空',
  CA: '中國國際航空',
  MU: '中國東方航空',
  CZ: '中國南方航空',
  NH: '全日空',
  JL: '日本航空',
  MM: '樂桃航空',
  IT: '台灣虎航',
  SQ: '新加坡航空',
  TG: '泰國航空',
  KE: '大韓航空',
  OZ: '韓亞航空',
  UA: '美國聯合航空',
  AA: '美國航空',
}

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

  // 取得機場名稱
  const getAirportName = (code: string) => AIRPORT_NAMES[code] || code

  // 取得航空公司名稱
  const getAirlineName = (code: string) => AIRLINE_NAMES[code] || code

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

  // ==================== 列印航班確認單 ====================
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
      return `${String(month + 1).padStart(2, '0')}月${String(day).padStart(2, '0')}日(${days[date.getDay()]})`
    }

    // 格式化時間 (e.g., "1110" -> "11:10")
    const formatTime = (time: string | undefined) => {
      if (!time || time.length < 4) return time || '--:--'
      return `${time.substring(0, 2)}:${time.substring(2, 4)}`
    }

    // 產生每位旅客的確認單
    const pages = printMembers.map((member, index) => {
      const passengerName = member.passport_name?.toUpperCase() || member.chinese_name || '未知'

      // 找到該旅客的 PNR
      const memberPnr = pnrData.find(p => p.record_locator === member.pnr)
      const segments: PNRSegment[] = memberPnr?.segments || []

      // 航班資訊行
      const flightRows: string[] = []

      if (segments.length > 0) {
        // 從 PNR segments 產生航班資訊
        segments.forEach((seg) => {
          const airlineName = getAirlineName(seg.airline)
          // 優先使用儲存的 duration，否則計算
          const duration = seg.duration || calculateDuration(seg.departureTime, seg.arrivalTime)
          const className = getClassName(seg.class)
          const statusName = getStatusName(seg.status)
          // 新增欄位
          const depTerminal = seg.departureTerminal ? `航站${seg.departureTerminal}` : ''
          const arrTerminal = seg.arrivalTerminal ? `航站${seg.arrivalTerminal}` : ''
          const directFlight = seg.isDirect ? '/直飛' : ''
          const mealInfo = seg.meal ? `/${seg.meal}` : ''

          flightRows.push(`
            <tr class="flight-header">
              <td colspan="2">
                <div class="flight-main">
                  <strong>${airlineName}(${seg.airline}${seg.flightNumber})</strong>
                  <span class="flight-meta">${duration ? `飛行${duration}` : ''}${directFlight}</span>
                </div>
              </td>
              <td class="flight-extra">
                <span>/${className}</span>
                <span>/${statusName}</span>
              </td>
            </tr>
            <tr class="flight-detail">
              <td class="flight-date">${formatPnrDate(seg.departureDate)}</td>
              <td class="flight-times">
                <div>${formatTime(seg.departureTime)} 出發: ${seg.origin ? `${getAirportName(seg.origin)}(${seg.origin})` : '待確認'}${depTerminal ? ` ${depTerminal}` : ''}</div>
                <div>${formatTime(seg.arrivalTime)} 抵達: ${seg.destination ? `${getAirportName(seg.destination)}(${seg.destination})` : '待確認'}${arrTerminal ? ` ${arrTerminal}` : ''}</div>
              </td>
              <td class="flight-extra">
                ${seg.aircraft ? `<span>/${seg.aircraft}</span>` : ''}
                ${mealInfo ? `<span>${mealInfo}</span>` : ''}
              </td>
            </tr>
          `)
        })
      } else if (tour.outbound_flight || tour.return_flight) {
        // 降級使用 tour 的航班資訊
        const outbound = tour.outbound_flight
        const returnFlight = tour.return_flight

        if (outbound) {
          const airlineCode = outbound.airline || ''
          const airlineName = getAirlineName(airlineCode)
          flightRows.push(`
            <tr class="flight-header">
              <td colspan="2">
                <div class="flight-main">
                  <strong>${airlineName}(${airlineCode}${outbound.flightNumber})</strong>
                  <span class="flight-meta">${outbound.duration ? `飛行${outbound.duration}` : ''}</span>
                </div>
              </td>
              <td class="flight-extra"></td>
            </tr>
            <tr class="flight-detail">
              <td class="flight-date">${tour.departure_date}</td>
              <td class="flight-times">
                <div>${outbound.departureTime} 出發: ${outbound.departureAirport ? `${getAirportName(outbound.departureAirport)}(${outbound.departureAirport})` : '待確認'}</div>
                <div>${outbound.arrivalTime} 抵達: ${outbound.arrivalAirport ? `${getAirportName(outbound.arrivalAirport)}(${outbound.arrivalAirport})` : '待確認'}</div>
              </td>
              <td class="flight-extra"></td>
            </tr>
          `)
        }

        if (returnFlight) {
          const airlineCode = returnFlight.airline || ''
          const airlineName = getAirlineName(airlineCode)
          flightRows.push(`
            <tr class="flight-header">
              <td colspan="2">
                <div class="flight-main">
                  <strong>${airlineName}(${airlineCode}${returnFlight.flightNumber})</strong>
                  <span class="flight-meta">${returnFlight.duration ? `飛行${returnFlight.duration}` : ''}</span>
                </div>
              </td>
              <td class="flight-extra"></td>
            </tr>
            <tr class="flight-detail">
              <td class="flight-date">${tour.return_date}</td>
              <td class="flight-times">
                <div>${returnFlight.departureTime} 出發: ${returnFlight.departureAirport ? `${getAirportName(returnFlight.departureAirport)}(${returnFlight.departureAirport})` : '待確認'}</div>
                <div>${returnFlight.arrivalTime} 抵達: ${returnFlight.arrivalAirport ? `${getAirportName(returnFlight.arrivalAirport)}(${returnFlight.arrivalAirport})` : '待確認'}</div>
              </td>
              <td class="flight-extra"></td>
            </tr>
          `)
        }
      }

      return `
        <div class="page" style="${index > 0 ? 'page-break-before: always;' : ''}">
          <div class="content">
            <div class="header">
              <div class="company">角落旅行社股份有限公司</div>
              <div class="address">台北市大同區重慶北路一段67號八樓之二</div>
              <table class="contact-table">
                <tr>
                  <td>電話: 886-2-77516051</td>
                  <td>承辦人: -</td>
                </tr>
                <tr>
                  <td>傳真: 886-2-25553098</td>
                  <td>電子郵件: sales@cornertravel.com.tw</td>
                </tr>
              </table>
            </div>

            <div class="pnr-info">
              電腦代號：${member.pnr || '-'}
            </div>

            <div class="notice">
              **** 此文件資訊僅提供參考, 實際資訊以航空公司及相關旅遊供應商為準 ****
            </div>

            <div class="passenger">
              旅客姓名: ${passengerName}
              ${member.special_meal ? `<span class="meal">(餐食: ${member.special_meal})</span>` : ''}
            </div>

            <table class="flight-table">
              <thead>
                <tr>
                  <th style="width: 85px;">日期</th>
                  <th>時間 / 航班資訊</th>
                  <th style="width: 80px;">其他訊息</th>
                </tr>
              </thead>
              <tbody>
                ${flightRows.length > 0 ? flightRows.join('') : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">尚無航班資訊</td></tr>'}
              </tbody>
            </table>

            <div class="ticket-info">
              機票號碼: ${member.ticket_number || '尚未開票'} - ${passengerName}
            </div>
          </div>

          <div class="footer">
            <div class="footer-line"></div>
            <div class="footer-content">
              <img src="/corner-logo.png" alt="Corner Travel" class="footer-logo" onerror="this.style.display='none'" />
              <div class="slogan-cn">如果可以，讓我們一起探索世界的每個角落</div>
              <div class="copyright">角落旅行社股份有限公司 © ${new Date().getFullYear()}</div>
            </div>
          </div>
        </div>
      `
    }).join('')

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>航班確認單 - ${tour.code}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 210mm;
              min-height: 297mm;
            }
            body {
              font-family: 'Microsoft JhengHei', Arial, sans-serif;
              font-size: 13px;
              line-height: 1.5;
              background: white;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 15mm 20mm;
              display: flex;
              flex-direction: column;
            }
            .content {
              flex: 1;
            }
            .header { margin-bottom: 15px; }
            .company { font-size: 16px; font-weight: bold; }
            .address { font-size: 11px; color: #666; margin-top: 2px; }
            .contact-table {
              width: 100%;
              font-size: 11px;
              margin-top: 8px;
              border-collapse: collapse;
            }
            .contact-table td { padding: 1px 0; }
            .pnr-info {
              margin: 12px 0;
              padding: 8px 10px;
              background: #f5f5f5;
              font-family: monospace;
              font-size: 12px;
            }
            .notice {
              text-align: center;
              color: #999;
              font-size: 10px;
              margin: 10px 0;
            }
            .passenger {
              font-size: 13px;
              font-weight: bold;
              margin: 12px 0;
            }
            .passenger .meal {
              font-weight: normal;
              color: #666;
              font-size: 11px;
            }
            .flight-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #ddd;
              margin: 10px 0;
            }
            .flight-table th {
              background: #f0f0f0;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
              font-size: 12px;
            }
            .flight-table td {
              padding: 6px 8px;
              vertical-align: top;
              font-size: 12px;
            }
            .ticket-info {
              margin-top: 15px;
              padding: 8px 10px;
              background: #fffbe6;
              border: 1px solid #ffe58f;
              font-size: 12px;
            }
            /* Flight table styles */
            .flight-header td {
              padding: 8px 8px 3px;
              border-bottom: 1px dashed #ccc;
              vertical-align: top;
            }
            .flight-detail td {
              padding: 3px 8px 8px;
              vertical-align: top;
            }
            .flight-main {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .flight-meta {
              color: #666;
              font-size: 11px;
            }
            .flight-date {
              width: 90px;
              white-space: nowrap;
            }
            .flight-times {
              line-height: 1.6;
            }
            .flight-extra {
              width: 80px;
              text-align: right;
              font-size: 11px;
              color: #666;
            }
            .flight-extra span {
              display: block;
            }
            /* Footer styles */
            .footer {
              margin-top: auto;
              padding-top: 20px;
              text-align: center;
            }
            .footer-line {
              width: 100%;
              height: 1px;
              background: #ddd;
              margin-bottom: 20px;
            }
            .footer-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
            }
            .footer-logo {
              height: 50px;
              width: auto;
              object-fit: contain;
            }
            .slogan-cn {
              font-size: 12px;
              letter-spacing: 0.5px;
              color: #c9aa7c;
            }
            .copyright {
              font-size: 10px;
              color: #999;
            }
            @media print {
              html, body {
                width: 100%;
                min-height: auto;
              }
              .page {
                width: 100%;
                min-height: auto;
                padding: 0;
                page-break-after: always;
              }
              .page:last-child {
                page-break-after: auto;
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
      <DialogContent className="max-w-lg">
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
              <Button onClick={handlePrintMembers} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                <Printer size={16} className="mr-1" />
                列印 ({members.length} 人)
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
