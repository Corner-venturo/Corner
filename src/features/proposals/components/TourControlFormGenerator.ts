/**
 * 團控表 HTML 產生器
 * Tour Control Form HTML Generator
 *
 * 完全複製 Word 版團控表 (2026團控表表單弟.htm) 的版面
 * 表格總寬度約 720px (540pt)，共 26 欄
 */

import type { TourControlFormData } from '@/types/tour-control-form.types'

/**
 * 格式化日期為 MM/DD 格式（供飯店列使用，格式為 " /  :"）
 */
function formatDateForHotel(dateStr: string | null | undefined): string {
  if (!dateStr) return '&nbsp;/&nbsp;&nbsp;:'
  const date = new Date(dateStr)
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${m}/${d}:`
}

/**
 * 格式化日期為簡短格式 (用於景點日期)
 */
function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '/'
  const date = new Date(dateStr)
  const m = (date.getMonth() + 1).toString()
  const d = date.getDate().toString()
  return `${m}/${d}`
}

/**
 * 數字轉字串，0 或 undefined 顯示空白
 */
function numToStr(val: number | undefined | null): string {
  return val ? String(val) : ''
}

/**
 * 產生團控表 HTML（完全複製 Word 版面）
 */
export function generateTourControlFormHtml(data: TourControlFormData): string {
  const pax = data.pax

  // 預約景點 - 至少顯示4列
  const minAttractionRows = 4
  const attractions = data.attractions && data.attractions.length > 0
    ? data.attractions
    : []
  // 確保至少有 4 列
  while (attractions.length < minAttractionRows) {
    attractions.push({ date: '', name: '', phone: '', contact: '', status: '', price: '', agreement: '', remarks: '' })
  }

  // 餐食 - 至少顯示4天
  const meals = data.meals && data.meals.length > 0 ? data.meals : [
    { date: '', lunch: '', dinner: '', dailyItinerary: '' },
    { date: '', lunch: '', dinner: '', dailyItinerary: '' },
    { date: '', lunch: '', dinner: '', dailyItinerary: '' },
    { date: '', lunch: '', dinner: '', dailyItinerary: '' }
  ]

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>團控表 - ${data.tourCode || ''}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "標楷體", "DFKai-SB", "Microsoft JhengHei", sans-serif;
      font-size: 10pt;
      line-height: 1.2;
      padding: 10px;
      background: #fff;
    }

    table {
      border-collapse: collapse;
      width: 720px;
      margin: 0 auto;
    }
    td {
      border: 1px solid #000;
      padding: 2px 4px;
      vertical-align: middle;
      font-size: 9pt;
      height: 20px;
    }

    .print-controls {
      padding: 10px;
      text-align: center;
      margin-bottom: 10px;
    }
    .print-controls button {
      padding: 8px 20px;
      margin: 0 5px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 10pt;
    }
    .btn-close { background: #fff; border: 1px solid #999; }
    .btn-print { background: #c9aa7c; color: #fff; border: none; }

    .footer {
      text-align: right;
      font-size: 9pt;
      margin-top: 5px;
      width: 720px;
      margin-left: auto;
      margin-right: auto;
    }

    @media print {
      .print-controls { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-close" onclick="window.close()">關閉</button>
    <button class="btn-print" onclick="window.print()">列印</button>
  </div>

  <table>
    <!-- Row 0: 日期 | (data) | 車條名稱 | (data) | 平安 | (data) -->
    <tr>
      <td style="width:41px;">日期</td>
      <td colspan="9" style="width:272px;">${data.date || ''}</td>
      <td rowspan="2" style="width:47px;">車條名稱</td>
      <td colspan="12" rowspan="2" style="width:255px;">${data.tourName || ''}</td>
      <td style="width:38px;">平安</td>
      <td colspan="2" style="width:67px;"></td>
    </tr>
    <!-- Row 1: 團號 | (data) | | | 責任 | (data) -->
    <tr>
      <td>團號</td>
      <td colspan="9">${data.tourCode || ''}</td>
      <td>責任</td>
      <td colspan="2"></td>
    </tr>

    <!-- Row 2: 聯絡窗口 | 名稱: | 地址： -->
    <tr>
      <td rowspan="2">聯絡<br/>窗口</td>
      <td colspan="9">名稱：${data.bidContact?.name || ''}</td>
      <td colspan="15">地址：</td>
    </tr>
    <!-- Row 3: | 標案聯絡人: | 行程聯絡人： -->
    <tr>
      <td colspan="9">標案聯絡人：${data.bidContact?.name || ''} ${data.bidContact?.phone || ''}</td>
      <td colspan="15">行程聯絡人：${data.itineraryContact?.name || ''} ${data.itineraryContact?.phone || ''}</td>
    </tr>

    <!-- Row 4: 人數 | 每車領隊... -->
    <tr>
      <td>人數</td>
      <td colspan="24">每車領隊&nbsp;&nbsp;${numToStr(pax?.perBus?.total ?? pax?.total)}人=&nbsp;公司業務:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;總領:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;護士:&nbsp;&nbsp;&nbsp;領隊:</td>
    </tr>
    <!-- Row 5: 領隊 | 公司領團... -->
    <tr>
      <td>領隊</td>
      <td colspan="24">公司領團:&nbsp;&nbsp;&nbsp;&nbsp;總領:&nbsp;&nbsp;&nbsp;&nbsp;護士:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;領隊</td>
    </tr>

    <!-- Row 6: 交通 | 遊覽車公司:1. | 聯絡人: | 確認時間 | (data) -->
    <tr>
      <td rowspan="8">交通</td>
      <td colspan="6">遊覽車公司:1.${data.busCompanies?.[0]?.name || ''}</td>
      <td colspan="10">聯絡人:${data.busCompanies?.[0]?.contact || ''}</td>
      <td colspan="3">確認時間</td>
      <td colspan="5">${data.busCompanies?.[0]?.confirmTime || ''}</td>
    </tr>
    <!-- Row 7: | 2. | 聯絡人: | 確認時間 | (data) -->
    <tr>
      <td colspan="6">2.${data.busCompanies?.[1]?.name || ''}</td>
      <td colspan="10">聯絡人:${data.busCompanies?.[1]?.contact || ''}</td>
      <td colspan="3">確認時間</td>
      <td colspan="5">${data.busCompanies?.[1]?.confirmTime || ''}</td>
    </tr>
    <!-- Row 8: | 3. | 聯絡人: | 確認時間 | (data) -->
    <tr>
      <td colspan="6">3.${data.busCompanies?.[2]?.name || ''}</td>
      <td colspan="10">聯絡人:${data.busCompanies?.[2]?.contact || ''}</td>
      <td colspan="3">確認時間</td>
      <td colspan="5">${data.busCompanies?.[2]?.confirmTime || ''}</td>
    </tr>
    <!-- Row 9: | 火車: | 去 / = 次 : / : 回 / = 次 : / : (一個大格子) -->
    <tr>
      <td colspan="6">火車:</td>
      <td colspan="18">去&nbsp;/&nbsp;=&nbsp;&nbsp;次&nbsp;:&nbsp;/&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;回&nbsp;/&nbsp;=&nbsp;&nbsp;次&nbsp;:&nbsp;/&nbsp;:</td>
    </tr>
    <!-- Row 10: | 外島 | 船: | 船: 去... -->
    <tr>
      <td colspan="2" rowspan="2">外島</td>
      <td colspan="4">船:</td>
      <td colspan="18">船: 去&nbsp;/&nbsp;=&nbsp;&nbsp;次&nbsp;:&nbsp;/&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;回&nbsp;/&nbsp;=&nbsp;&nbsp;次&nbsp;:&nbsp;/&nbsp;:</td>
    </tr>
    <!-- Row 11: | | 機車: | (empty) | (empty) | (empty) -->
    <tr>
      <td colspan="4">機車:</td>
      <td colspan="6"></td>
      <td colspan="6"></td>
      <td colspan="6"></td>
    </tr>
    <!-- Row 12: | 活動廠商 | (empty) | (empty) | (empty) | (empty) -->
    <tr>
      <td colspan="3" rowspan="2">活動廠商</td>
      <td colspan="3"></td>
      <td colspan="6"></td>
      <td colspan="6"></td>
      <td colspan="6"></td>
    </tr>
    <!-- Row 13: | | (empty) | (empty) | (empty) | (empty) -->
    <tr>
      <td colspan="3"></td>
      <td colspan="6"></td>
      <td colspan="6"></td>
      <td colspan="6"></td>
    </tr>

    <!-- Row 14: 飯店 | /  :  飯店 | 聯絡人: | 確認時間 | (空) | 訂金: | 協議: -->
    <tr>
      <td rowspan="3">飯店</td>
      <td colspan="6">${formatDateForHotel(data.hotels?.[0]?.date)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;飯店</td>
      <td colspan="5">聯絡人:</td>
      <td colspan="4">確認時間</td>
      <td colspan="2"></td>
      <td colspan="4">訂金:</td>
      <td colspan="4">協議:</td>
    </tr>
    <tr>
      <td colspan="6">${formatDateForHotel(data.hotels?.[1]?.date)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;飯店</td>
      <td colspan="5">聯絡人:</td>
      <td colspan="4">確認時間</td>
      <td colspan="2"></td>
      <td colspan="4">訂金:</td>
      <td colspan="4"></td>
    </tr>
    <tr>
      <td colspan="6">${formatDateForHotel(data.hotels?.[2]?.date)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;飯店</td>
      <td colspan="5">聯絡人:</td>
      <td colspan="4">確認時間</td>
      <td colspan="2"></td>
      <td colspan="4">訂金:</td>
      <td colspan="4"></td>
    </tr>

    <!-- 預約景點門票 標題列 -->
    <tr>
      <td colspan="2" rowspan="${attractions.length + 1}" style="border-top: 3px double #000; border-bottom: 3px double #000;">預約景點門票 </td>
      <td colspan="4" style="border-top: 3px double #000;">日期</td>
      <td colspan="3">名稱</td>
      <td colspan="6">電話</td>
      <td colspan="4">連絡人</td>
      <td colspan="2">預約狀況</td>
      <td colspan="4">備註:價格/協議</td>
    </tr>
    <!-- 預約景點門票 資料列 -->
    ${attractions.map((a) => `
    <tr>
      <td colspan="4">${a.date ? formatDateShort(a.date) : '/'}</td>
      <td colspan="3">${a.name || ''}</td>
      <td colspan="6">${a.phone || ''}</td>
      <td colspan="4">${a.contact || ''}</td>
      <td colspan="2">${a.status || ''}</td>
      <td colspan="4">${a.remarks || ''}${a.price ? a.price : ''}${a.agreement ? '/' + a.agreement : ''}</td>
    </tr>
    `).join('')}

    <!-- 餐食：每天3列（午餐、晚餐、本日行程） -->
    ${meals.map((meal, i) => `
    <tr>
      ${i === 0 ? `<td rowspan="${meals.length * 3}">餐食</td>` : ''}
      <td colspan="3" rowspan="3">${meal.date ? formatDateShort(meal.date) : '/'}</td>
      <td colspan="21">午餐：${meal.lunch || ''}</td>
    </tr>
    <tr>
      <td colspan="21">晚餐：${meal.dinner || ''}</td>
    </tr>
    <tr>
      <td colspan="21">本日行程：${meal.dailyItinerary || ''}</td>
    </tr>
    `).join('')}

    <!-- 注意事項 -->
    <tr>
      <td>注意<br/>事項</td>
      <td colspan="24" style="height:100px; vertical-align:top;">${data.remarks || ''}</td>
    </tr>
  </table>

  <div class="footer">勁揚國際／原昇旅行社有限公司</div>

</body>
</html>
`
}

/**
 * 開啟新視窗顯示團控表
 */
export function openTourControlForm(data: TourControlFormData): void {
  const html = generateTourControlFormHtml(data)
  const printWindow = window.open('', '_blank', 'width=800,height=1000')

  if (!printWindow) {
    throw new Error('請允許彈出視窗以進行列印')
  }

  printWindow.document.write(html)
  printWindow.document.close()
}
