/**
 * 團控表 HTML 產生器
 * Tour Control Form HTML Generator
 */

import type { TourControlFormData, TourControlHotel, TourControlMeal, TourControlBusCompany, TourControlAttraction } from '@/types/tour-control-form.types'

/**
 * 格式化日期為 MM/DD 格式
 */
function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
}

/**
 * 格式化日期為完整格式
 */
function formatDateFull(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
}

/**
 * 產生飯店列（最多 6 列）
 */
function generateHotelRows(hotels: TourControlHotel[] = []): string {
  const rows: string[] = []
  const maxRows = 6

  for (let i = 0; i < maxRows; i++) {
    const hotel = hotels[i]
    const isFirst = i === 0
    const rowspan = isFirst ? ` rowspan="${maxRows}"` : ''
    const showLabel = isFirst ? `<td width="41" nowrap${rowspan} style="width:30.85pt;border:solid windowtext 1.0pt;padding:2pt 4pt;vertical-align:middle;"><span style="font-family:標楷體;">飯店</span></td>` : ''

    rows.push(`
      <tr style="height:16pt;">
        ${showLabel}
        <td colspan="6" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${isFirst ? '飯店確認：' : ''}${i + 1}. ${hotel?.hotelName || ''}</span>
        </td>
        <td colspan="4" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">聯絡人：${hotel?.contact || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">訂金：${hotel?.deposit || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">協議：${hotel?.agreement || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">確認時間</span>
        </td>
        <td colspan="5" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${hotel?.confirmTime || ''}</span>
        </td>
      </tr>
    `)
  }

  return rows.join('')
}

/**
 * 產生遊覽車列（最多 3 列）
 */
function generateBusRows(busCompanies: TourControlBusCompany[] = []): string {
  const rows: string[] = []
  const maxRows = 3

  for (let i = 0; i < maxRows; i++) {
    const bus = busCompanies[i]
    const isFirst = i === 0
    const rowspan = isFirst ? ` rowspan="${maxRows}"` : ''
    const showLabel = isFirst ? `<td width="41" nowrap${rowspan} style="width:30.85pt;border:solid windowtext 1.0pt;padding:2pt 4pt;vertical-align:middle;"><span style="font-family:標楷體;">車隊</span></td>` : ''

    rows.push(`
      <tr style="height:14pt;">
        ${showLabel}
        <td colspan="6" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${isFirst ? '遊覽車公司：' : ''}${i + 1}. ${bus?.name || ''}</span>
        </td>
        <td colspan="10" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">聯絡人：${bus?.contact || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">確認時間</span>
        </td>
        <td colspan="5" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${bus?.confirmTime || ''}</span>
        </td>
      </tr>
    `)
  }

  return rows.join('')
}

/**
 * 產生預約景點門票列
 */
function generateAttractionRows(attractions: TourControlAttraction[] = []): string {
  const rows: string[] = []
  const minRows = 3  // 最少顯示 3 列空白
  const maxRows = Math.max(attractions.length, minRows)

  // 標題行
  rows.push(`
    <tr style="height:14pt;">
      <td width="41" nowrap rowspan="${maxRows + 1}" style="width:30.85pt;border:solid windowtext 1.0pt;padding:1pt 3pt;vertical-align:middle;">
        <span style="font-family:標楷體;">預約</span><br/>
        <span style="font-family:標楷體;">景點</span><br/>
        <span style="font-family:標楷體;">門票</span>
      </td>
      <td colspan="2" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;background:#f0f0f0;">
        <span style="font-family:標楷體;">日期</span>
      </td>
      <td colspan="5" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;background:#f0f0f0;">
        <span style="font-family:標楷體;">名稱</span>
      </td>
      <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;background:#f0f0f0;">
        <span style="font-family:標楷體;">電話</span>
      </td>
      <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;background:#f0f0f0;">
        <span style="font-family:標楷體;">連絡人</span>
      </td>
      <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;background:#f0f0f0;">
        <span style="font-family:標楷體;">預約狀況</span>
      </td>
      <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;background:#f0f0f0;">
        <span style="font-family:標楷體;">價格/協議</span>
      </td>
      <td colspan="5" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;background:#f0f0f0;">
        <span style="font-family:標楷體;">備註</span>
      </td>
    </tr>
  `)

  // 資料行
  for (let i = 0; i < maxRows; i++) {
    const attraction = attractions[i]
    rows.push(`
      <tr style="height:14pt;">
        <td colspan="2" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${attraction ? formatDateShort(attraction.date) : ''}</span>
        </td>
        <td colspan="5" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${attraction?.name || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${attraction?.phone || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${attraction?.contact || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${attraction?.status || ''}</span>
        </td>
        <td colspan="3" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${attraction?.price || ''}${attraction?.agreement ? '/' + attraction.agreement : ''}</span>
        </td>
        <td colspan="5" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${attraction?.remarks || ''}</span>
        </td>
      </tr>
    `)
  }

  return rows.join('')
}

/**
 * 產生餐食列
 */
function generateMealRows(meals: TourControlMeal[] = []): string {
  if (meals.length === 0) return ''

  const rows: string[] = []
  const rowspan = meals.length

  meals.forEach((meal, i) => {
    const isFirst = i === 0
    const showLabel = isFirst ? `<td width="41" nowrap rowspan="${rowspan}" style="width:30.85pt;border:solid windowtext 1.0pt;padding:2pt 4pt;vertical-align:middle;"><span style="font-family:標楷體;">餐食</span></td>` : ''

    rows.push(`
      <tr style="height:14pt;">
        ${showLabel}
        <td colspan="2" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">${formatDateShort(meal.date)}</span>
        </td>
        <td colspan="6" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">午餐：${meal.lunch || ''}</span>
        </td>
        <td colspan="6" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">晚餐：${meal.dinner || ''}</span>
        </td>
        <td colspan="10" style="border:solid windowtext 1.0pt;border-left:none;padding:1pt 3pt;">
          <span style="font-family:標楷體;">本日行程：${meal.dailyItinerary || ''}</span>
        </td>
      </tr>
    `)
  })

  return rows.join('')
}

/**
 * 產生團控表 HTML
 */
export function generateTourControlFormHtml(data: TourControlFormData): string {
  const pax = data.pax || { total: 0 }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>團控表 - ${data.tourCode || ''}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
    }
    body {
      font-family: "標楷體", "Microsoft JhengHei", sans-serif;
      font-size: 11pt;
      line-height: 1.3;
      padding: 5px;
      display: flex;
      flex-direction: column;
    }
    .table-container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
      font-size: 11pt;
      flex: 1;
    }
    td, th {
      border: 1px solid #000;
      padding: 3pt 4pt;
      vertical-align: middle;
      word-wrap: break-word;
      overflow: hidden;
    }
    .print-controls {
      padding: 12px;
      border-bottom: 1px solid #eee;
      text-align: right;
      margin-bottom: 10px;
    }
    .print-controls button {
      padding: 8px 16px;
      margin-left: 8px;
      cursor: pointer;
      border-radius: 6px;
    }
    .btn-outline { background: white; border: 1px solid #ddd; }
    .btn-primary { background: #c9aa7c; color: white; border: none; }
    @media print {
      .print-controls { display: none !important; }
      html, body {
        height: 100%;
        width: 100%;
      }
      body {
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .table-container {
        height: 100%;
      }
      table {
        height: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-outline" onclick="window.close()">關閉</button>
    <button class="btn-primary" onclick="window.print()">列印</button>
  </div>

  <div class="table-container">
  <table>
    <!-- 第一行：日期、車條名稱、平安 -->
    <tr style="height:16pt;">
      <td width="41" nowrap style="width:30.85pt;padding:1pt 3pt;">
        <span style="font-family:標楷體;">日期</span>
      </td>
      <td colspan="7" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">${formatDateFull(data.date)}</span>
      </td>
      <td nowrap style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">車條</span>
      </td>
      <td colspan="12" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">${data.tourName || ''}</span>
      </td>
      <td nowrap style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">平安</span>
      </td>
      <td colspan="3" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;"></span>
      </td>
    </tr>

    <!-- 第二行：團號、責任 -->
    <tr style="height:16pt;">
      <td nowrap style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">團號</span>
      </td>
      <td colspan="7" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">${data.tourCode || ''}</span>
      </td>
      <td colspan="13" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;"></span>
      </td>
      <td nowrap style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">責任</span>
      </td>
      <td colspan="3" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;"></span>
      </td>
    </tr>

    <!-- 第三行：聯絡窗口 -->
    <tr style="height:14pt;">
      <td nowrap rowspan="2" style="padding:1pt 3pt;vertical-align:middle;">
        <span style="font-family:標楷體;">聯絡</span><br/>
        <span style="font-family:標楷體;">窗口</span>
      </td>
      <td colspan="9" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">姓名：${data.bidContact?.name || ''}</span>
      </td>
      <td colspan="15" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">地址：</span>
      </td>
    </tr>
    <tr style="height:14pt;">
      <td colspan="9" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">標案聯絡人：${data.bidContact?.phone || ''}</span>
      </td>
      <td colspan="15" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">行程聯絡人：${data.itineraryContact?.name || ''} ${data.itineraryContact?.phone || ''}</span>
      </td>
    </tr>

    <!-- 第四行：人數 -->
    <tr style="height:14pt;">
      <td nowrap style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">人數</span>
      </td>
      <td colspan="24" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">
          遊覽車領隊&nbsp;&nbsp;${pax.total || ''}人 = &nbsp;公司業務：${pax.business || ''}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          總領：${pax.leader || ''}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          護士：${pax.nurse || ''}&nbsp;&nbsp;&nbsp;
          領隊：${pax.tourLeader || ''}
        </span>
      </td>
    </tr>

    <!-- 第五行：去程 -->
    <tr style="height:14pt;">
      <td nowrap style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">去程</span>
      </td>
      <td colspan="24" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">
          ${data.outboundFlight?.flightNumber || ''}&nbsp;&nbsp;
          ${data.outboundFlight?.departure || ''} → ${data.outboundFlight?.arrival || ''}&nbsp;&nbsp;
          ${data.outboundFlight?.departureTime || ''} - ${data.outboundFlight?.arrivalTime || ''}
        </span>
      </td>
    </tr>

    <!-- 第六行：回程 -->
    <tr style="height:14pt;">
      <td nowrap style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">回程</span>
      </td>
      <td colspan="24" style="padding:1pt 3pt;">
        <span style="font-family:標楷體;">
          ${data.returnFlight?.flightNumber || ''}&nbsp;&nbsp;
          ${data.returnFlight?.departure || ''} → ${data.returnFlight?.arrival || ''}&nbsp;&nbsp;
          ${data.returnFlight?.departureTime || ''} - ${data.returnFlight?.arrivalTime || ''}
        </span>
      </td>
    </tr>

    <!-- 遊覽車列 -->
    ${generateBusRows(data.busCompanies)}

    <!-- 飯店列 -->
    ${generateHotelRows(data.hotels)}

    <!-- 預約景點門票 -->
    ${generateAttractionRows(data.attractions)}

    <!-- 餐食列 -->
    ${generateMealRows(data.meals)}

    <!-- 注意事項 -->
    <tr style="height:30pt;">
      <td nowrap style="padding:1pt 3pt;vertical-align:top;">
        <span style="font-family:標楷體;">備註</span>
      </td>
      <td colspan="24" style="padding:1pt 3pt;vertical-align:top;">
        <span style="font-family:標楷體;">${data.remarks || ''}</span>
      </td>
    </tr>
  </table>
  </div>
</body>
</html>
`
}

/**
 * 開啟新視窗顯示團控表
 */
export function openTourControlForm(data: TourControlFormData): void {
  const html = generateTourControlFormHtml(data)
  const printWindow = window.open('', '_blank', 'width=1100,height=800')

  if (!printWindow) {
    throw new Error('請允許彈出視窗以進行列印')
  }

  printWindow.document.write(html)
  printWindow.document.close()
}
