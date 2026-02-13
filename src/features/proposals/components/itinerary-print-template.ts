import type { TimelineItineraryData } from '@/types/timeline-itinerary.types'
import { BROCHURE_PREVIEW_DIALOG_LABELS, ITINERARY_DIALOG_LABELS } from '../constants/labels'

/**
 * 產生行程表列印用 HTML
 */
export function generateItineraryPrintHtml(data: TimelineItineraryData): string {
  const formatTime = (time?: string): string => {
    if (!time || time.length !== 4) return time || ''
    return `${time.slice(0, 2)}:${time.slice(2)}`
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const weekdays = [ITINERARY_DIALOG_LABELS.日, ITINERARY_DIALOG_LABELS.一, ITINERARY_DIALOG_LABELS.二, ITINERARY_DIALOG_LABELS.三, ITINERARY_DIALOG_LABELS.四, ITINERARY_DIALOG_LABELS.五, ITINERARY_DIALOG_LABELS.六]
    return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
  }

  const daysHtml = data.days
    .map((day) => {
      const rowsHtml = day.attractions
        .map((attr) => {
          const timeStr =
            attr.startTime || attr.endTime
              ? `${formatTime(attr.startTime)} - ${formatTime(attr.endTime)}`
              : ''

          const imagesHtml =
            attr.images.length > 0
              ? `<div class="images">${attr.images.map((img) => `<img src="${img.url}" alt="" />`).join('')}</div>`
              : ''

          const colorStyle = attr.color ? `style="color: ${attr.color}"` : ''

          const menuRow = attr.menu
            ? `<div class="menu-row"><span class="menu-text" ${colorStyle}>${attr.menu}</span></div>`
            : ''

          const descriptionRow = attr.description
            ? `<div class="description-row"><span class="description-text" ${colorStyle}>${attr.description}</span></div>`
            : ''

          return `
        <div class="attraction-item">
          <div class="attraction-row">
            <span class="time">${timeStr}</span>
            <span class="name" ${colorStyle}>${attr.name || ''}</span>
          </div>
          ${descriptionRow}
          ${menuRow}
          ${imagesHtml}
        </div>
      `
        })
        .join('')

      return `
      <div class="day">
        <div class="day-header">
          <span class="day-number">Day ${day.dayNumber}</span>
          <span class="day-date">${formatDate(day.date)}</span>
          ${day.title ? `<span class="day-title">${day.title}</span>` : ''}
        </div>
        <div class="attractions">${rowsHtml}</div>
      </div>
    `
    })
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.title || BROCHURE_PREVIEW_DIALOG_LABELS.行程表}</title>
  <style>${ITINERARY_PRINT_STYLES}</style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-outline" onclick="window.close()">${ITINERARY_DIALOG_LABELS.關閉}</button>
    <button class="btn-primary" onclick="window.print()">${ITINERARY_DIALOG_LABELS.列印}</button>
  </div>
  <div class="header">
    <h1>${data.title || BROCHURE_PREVIEW_DIALOG_LABELS.行程表}</h1>
    ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
  </div>
  ${daysHtml}
</body>
</html>
`
}

const ITINERARY_PRINT_STYLES = `
  @page { size: A4 portrait; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "${ITINERARY_DIALOG_LABELS.標楷體}", "Microsoft JhengHei", sans-serif; font-size: 11pt; line-height: 1.5; padding: 10mm; background: white; }
  .print-controls { padding: 12px; border-bottom: 1px solid #eee; text-align: right; margin-bottom: 20px; }
  .print-controls button { padding: 8px 16px; margin-left: 8px; cursor: pointer; border-radius: 6px; }
  .btn-outline { background: white; border: 1px solid #ddd; }
  .btn-primary { background: #c9aa7c; color: white; border: none; }
  .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #c9aa7c; }
  .header h1 { font-size: 22pt; color: #3a3633; margin-bottom: 6px; }
  .header .subtitle { font-size: 13pt; color: #8b8680; }
  .day { margin-bottom: 20px; page-break-inside: avoid; }
  .day-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 6px 10px; background: #f6f4f1; border-left: 4px solid #c9aa7c; }
  .day-number { font-size: 13pt; font-weight: bold; color: #c9aa7c; }
  .day-date { font-size: 11pt; color: #8b8680; }
  .day-title { font-size: 12pt; font-weight: 500; color: #3a3633; margin-left: 10px; padding-left: 10px; border-left: 2px solid #c9aa7c; }
  .attractions { padding: 8px 0; }
  .attraction-item { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f0ede8; }
  .attraction-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .attraction-row { display: flex; align-items: center; gap: 12px; padding: 4px 12px; }
  .attraction-row .time { font-family: monospace; font-size: 10pt; color: #8b8680; white-space: nowrap; min-width: 90px; }
  .attraction-row .name { font-size: 11pt; font-weight: 500; color: #3a3633; flex: 1; }
  .description-row { padding: 2px 12px 2px 114px; }
  .description-row .description-text { font-size: 10pt; color: #666; line-height: 1.4; }
  .menu-row { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 114px; background: #faf9f7; border-radius: 4px; margin: 4px 12px 0 12px; }
  .menu-row .menu-text { font-size: 10pt; color: #3a3633; }
  .images { display: flex; gap: 8px; padding: 8px 12px; width: 100%; }
  .images img { flex: 1; height: auto; max-height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid #e8e5e0; }
  @media print { .print-controls { display: none !important; } body { padding: 0; } }
`
