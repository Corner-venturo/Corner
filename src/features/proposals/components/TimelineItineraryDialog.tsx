/**
 * TimelineItineraryDialog - 時間軸行程編輯器
 *
 * 表格式的時間軸介面，用於編輯每日行程
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DIALOG_SIZES,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  X,
  Save,
  Printer,
  Upload,
  Coffee,
  UtensilsCrossed,
  Moon,
} from 'lucide-react'
import type { ProposalPackage } from '@/types/proposal.types'
import type {
  TimelineDay,
  TimelineAttraction,
  TimelineItineraryData,
  MealType,
} from '@/types/timeline-itinerary.types'
import {
  generateId,
  createEmptyAttraction,
  createEmptyDay,
} from '@/types/timeline-itinerary.types'

interface TimelineItineraryDialogProps {
  isOpen: boolean
  onClose: () => void
  pkg: ProposalPackage | null
}

export function TimelineItineraryDialog({
  isOpen,
  onClose,
  pkg,
}: TimelineItineraryDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ dayId: string; attractionId: string } | null>(null)

  // localStorage key
  const storageKey = `timeline-itinerary-${pkg?.id || 'default'}`

  // 初始化資料（從 localStorage 讀取或建立新的）
  const [data, setData] = useState<TimelineItineraryData>(() => {
    // 嘗試從 localStorage 讀取
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // ignore parse error
        }
      }
    }
    // 沒有存檔，建立新的
    const startDate = pkg?.start_date || ''
    return {
      title: pkg?.version_name || '行程表',
      subtitle: '',
      startDate,
      days: [createEmptyDay(1, startDate)],
    }
  })

  // 計算日期
  const calculateDate = useCallback((dayNumber: number, startDate?: string): string => {
    if (!startDate) return ''
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayNumber - 1)
    return date.toISOString().split('T')[0]
  }, [])

  // 新增一天
  const addDay = useCallback(() => {
    setData((prev) => {
      const newDayNumber = prev.days.length + 1
      const newDate = calculateDate(newDayNumber, prev.startDate)
      return {
        ...prev,
        days: [...prev.days, createEmptyDay(newDayNumber, newDate)],
      }
    })
  }, [calculateDate])

  // 刪除一天
  const removeDay = useCallback((dayId: string) => {
    setData((prev) => {
      const newDays = prev.days
        .filter((d) => d.id !== dayId)
        .map((day, index) => ({
          ...day,
          dayNumber: index + 1,
          date: calculateDate(index + 1, prev.startDate),
        }))
      return { ...prev, days: newDays.length > 0 ? newDays : [createEmptyDay(1, prev.startDate)] }
    })
  }, [calculateDate])

  // 更新每日標題
  const updateDayTitle = useCallback((dayId: string, title: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId ? { ...day, title } : day
      ),
    }))
  }, [])

  // 新增景點
  const addAttraction = useCallback((dayId: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? { ...day, attractions: [...day.attractions, createEmptyAttraction()] }
          : day
      ),
    }))
  }, [])

  // 刪除景點
  const removeAttraction = useCallback((dayId: string, attractionId: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              attractions:
                day.attractions.length > 1
                  ? day.attractions.filter((a) => a.id !== attractionId)
                  : day.attractions,
            }
          : day
      ),
    }))
  }, [])

  // 更新景點
  const updateAttraction = useCallback(
    (dayId: string, attractionId: string, field: keyof TimelineAttraction, value: unknown) => {
      setData((prev) => ({
        ...prev,
        days: prev.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                attractions: day.attractions.map((a) =>
                  a.id === attractionId ? { ...a, [field]: value } : a
                ),
              }
            : day
        ),
      }))
    },
    []
  )

  // 壓縮圖片
  const compressImage = useCallback((file: File, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // 處理圖片上傳（最多 3 張，自動壓縮）
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !uploadTarget) return

    // 取得目前該景點已有幾張照片
    const currentDay = data.days.find(d => d.id === uploadTarget.dayId)
    const currentAttraction = currentDay?.attractions.find(a => a.id === uploadTarget.attractionId)
    const currentCount = currentAttraction?.images.length || 0
    const remaining = 3 - currentCount

    if (remaining <= 0) {
      e.target.value = ''
      setUploadTarget(null)
      return
    }

    // 只取剩餘可上傳的數量
    const filesToUpload = Array.from(files).slice(0, remaining)
    const targetDayId = uploadTarget.dayId
    const targetAttractionId = uploadTarget.attractionId

    for (const file of filesToUpload) {
      const compressedUrl = await compressImage(file)
      setData((prev) => ({
        ...prev,
        days: prev.days.map((day) =>
          day.id === targetDayId
            ? {
                ...day,
                attractions: day.attractions.map((a) =>
                  a.id === targetAttractionId && a.images.length < 3
                    ? { ...a, images: [...a.images, { id: generateId(), url: compressedUrl }] }
                    : a
                ),
              }
            : day
        ),
      }))
    }

    // Reset
    e.target.value = ''
    setUploadTarget(null)
  }, [uploadTarget, data.days, compressImage])

  // 觸發圖片上傳
  const triggerImageUpload = useCallback((dayId: string, attractionId: string) => {
    setUploadTarget({ dayId, attractionId })
    fileInputRef.current?.click()
  }, [])

  // 刪除照片
  const removeImage = useCallback((dayId: string, attractionId: string, imageId: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              attractions: day.attractions.map((a) =>
                a.id === attractionId
                  ? { ...a, images: a.images.filter((img) => img.id !== imageId) }
                  : a
              ),
            }
          : day
      ),
    }))
  }, [])

  // 格式化日期顯示
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
  }

  // 儲存到 localStorage
  const handleSave = useCallback(() => {
    localStorage.setItem(storageKey, JSON.stringify(data))
    alert('已儲存到本地')
  }, [storageKey, data])

  // 列印功能
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = generatePrintHtml(data)
    printWindow.document.write(html)
    printWindow.document.close()
  }, [data])

  if (!pkg) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={DIALOG_SIZES['4xl']}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={18} className="text-morandi-gold" />
            時間軸行程編輯器
          </DialogTitle>
        </DialogHeader>

        {/* 隱藏的檔案上傳 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {/* 標題區 */}
          <div className="mb-4 p-4 border border-border rounded-lg bg-morandi-container/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-morandi-secondary">行程標題</Label>
                <Input
                  value={data.title}
                  onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="輸入行程標題..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-morandi-secondary">副標題</Label>
                <Input
                  value={data.subtitle || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="輸入副標題..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* 新增一天按鈕 */}
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={addDay}
              className="gap-2 text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
            >
              <Plus size={16} />
              新增一天
            </Button>
          </div>

          {/* 每日行程表格 */}
          {data.days.map((day) => (
            <div key={day.id} className="mb-6 shrink-0">
              {/* Day 標題 */}
              <div className="flex items-center gap-3 mb-2 px-2">
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar size={16} className="text-morandi-gold" />
                  <span className="font-medium text-morandi-gold">Day {day.dayNumber}</span>
                  {day.date && (
                    <span className="text-morandi-secondary text-sm">- {formatDate(day.date)}</span>
                  )}
                </div>
                {/* 每日大標題輸入 */}
                <Input
                  value={day.title || ''}
                  onChange={(e) => updateDayTitle(day.id, e.target.value)}
                  placeholder="輸入今日主題（如：台北市區觀光）"
                  className="h-7 text-sm flex-1"
                />
                {data.days.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDay(day.id)}
                    className="h-6 w-6 p-0 text-morandi-red hover:bg-morandi-red/10 shrink-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>

              {/* 景點列表 */}
              <div className="space-y-1 shrink-0">
                {day.attractions.map((attraction) => (
                  <div key={attraction.id} className="hover:bg-morandi-container/10 rounded px-1 py-1">
                    {/* 主要行：時間 + 名稱 + 餐食按鈕 + 照片 + 刪除 */}
                    <div className="flex items-center gap-2">
                      {/* 時間 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          value={attraction.startTime || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            updateAttraction(day.id, attraction.id, 'startTime', val)
                          }}
                          placeholder="0900"
                          className="w-14 h-7 text-xs text-center font-mono"
                          maxLength={4}
                        />
                        <span className="text-morandi-muted">-</span>
                        <Input
                          value={attraction.endTime || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            updateAttraction(day.id, attraction.id, 'endTime', val)
                          }}
                          placeholder="1000"
                          className="w-14 h-7 text-xs text-center font-mono"
                          maxLength={4}
                        />
                      </div>

                      {/* 景點/餐廳名稱 */}
                      <div className="flex-1">
                        <Input
                          value={attraction.name}
                          onChange={(e) =>
                            updateAttraction(day.id, attraction.id, 'name', e.target.value)
                          }
                          placeholder={attraction.mealType && attraction.mealType !== 'none' ? '輸入餐廳名稱...' : '輸入景點名稱...'}
                          className="h-7 text-xs"
                        />
                      </div>

                      {/* 餐食類型按鈕 */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => updateAttraction(day.id, attraction.id, 'mealType', attraction.mealType === 'breakfast' ? 'none' : 'breakfast')}
                          className={`p-1 rounded transition-colors ${
                            attraction.mealType === 'breakfast'
                              ? 'bg-morandi-gold text-white'
                              : 'text-morandi-muted hover:bg-morandi-container'
                          }`}
                          title="早餐"
                        >
                          <Coffee size={14} />
                        </button>
                        <button
                          onClick={() => updateAttraction(day.id, attraction.id, 'mealType', attraction.mealType === 'lunch' ? 'none' : 'lunch')}
                          className={`p-1 rounded transition-colors ${
                            attraction.mealType === 'lunch'
                              ? 'bg-morandi-gold text-white'
                              : 'text-morandi-muted hover:bg-morandi-container'
                          }`}
                          title="午餐"
                        >
                          <UtensilsCrossed size={14} />
                        </button>
                        <button
                          onClick={() => updateAttraction(day.id, attraction.id, 'mealType', attraction.mealType === 'dinner' ? 'none' : 'dinner')}
                          className={`p-1 rounded transition-colors ${
                            attraction.mealType === 'dinner'
                              ? 'bg-morandi-gold text-white'
                              : 'text-morandi-muted hover:bg-morandi-container'
                          }`}
                          title="晚餐"
                        >
                          <Moon size={14} />
                        </button>
                      </div>

                      {/* 照片 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => triggerImageUpload(day.id, attraction.id)}
                          className="h-7 w-7 p-0 text-morandi-secondary hover:text-morandi-gold"
                          title="上傳照片"
                        >
                          <Upload size={14} />
                        </Button>
                        {attraction.images.length > 0 && (
                          <span className="text-xs text-morandi-gold">{attraction.images.length}</span>
                        )}
                      </div>

                      {/* 刪除 */}
                      <div className="shrink-0">
                        {day.attractions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttraction(day.id, attraction.id)}
                            className="h-7 w-7 p-0 text-morandi-muted hover:text-morandi-red"
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 菜色輸入（下方一排，選擇餐食後顯示） */}
                    {attraction.mealType && attraction.mealType !== 'none' && (
                      <div className="flex items-center gap-2 mt-1 ml-[124px]">
                        <Input
                          value={attraction.menu || ''}
                          onChange={(e) =>
                            updateAttraction(day.id, attraction.id, 'menu', e.target.value)
                          }
                          placeholder="輸入菜色..."
                          className="h-7 text-xs flex-1"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* 已上傳的照片預覽 */}
                {day.attractions.some(a => a.images.length > 0) && (
                  <div className="px-3 py-2 border-t border-border/50 bg-morandi-container/10">
                    <div className="text-xs text-morandi-secondary mb-2">已上傳照片：</div>
                    <div className="flex flex-wrap gap-2">
                      {day.attractions.map((attraction) =>
                        attraction.images.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.url}
                              alt=""
                              className="w-12 h-12 object-cover rounded border border-border"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImage(day.id, attraction.id, img.id)}
                              className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-morandi-red text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={8} />
                            </Button>
                            <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-white truncate">
                              {attraction.name || '景點'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* 新增景點按鈕 */}
              <div className="mt-2 px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addAttraction(day.id)}
                  className="gap-1 text-xs text-morandi-secondary hover:text-morandi-gold"
                >
                  <Plus size={12} />
                  新增景點
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X size={16} />
            關閉
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer size={16} />
            列印
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            <Save size={16} />
            儲存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 產生列印用 HTML
function generatePrintHtml(data: TimelineItineraryData): string {
  const formatTime = (time?: string): string => {
    if (!time || time.length !== 4) return time || ''
    return `${time.slice(0, 2)}:${time.slice(2)}`
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
  }

  const getMealLabel = (mealType?: string) => {
    if (mealType === 'breakfast') return '早餐'
    if (mealType === 'lunch') return '午餐'
    if (mealType === 'dinner') return '晚餐'
    return ''
  }

  const daysHtml = data.days.map((day) => {
    const rowsHtml = day.attractions.map((attr) => {
      const timeStr = attr.startTime || attr.endTime
        ? `${formatTime(attr.startTime)} - ${formatTime(attr.endTime)}`
        : ''

      const mealLabel = getMealLabel(attr.mealType)

      const imagesHtml = attr.images.length > 0
        ? `<div class="images">${attr.images.map(img => `<img src="${img.url}" alt="" />`).join('')}</div>`
        : ''

      // 菜色在下方一排（不顯示標籤）
      const menuRow = attr.menu
        ? `<div class="menu-row"><span class="menu-text">${attr.menu}</span></div>`
        : ''

      return `
        <div class="attraction-item">
          <div class="attraction-row">
            <span class="time">${timeStr}</span>
            <span class="name">${attr.name || ''}</span>
          </div>
          ${menuRow}
          ${imagesHtml}
        </div>
      `
    }).join('')

    return `
      <div class="day">
        <div class="day-header">
          <span class="day-number">Day ${day.dayNumber}</span>
          <span class="day-date">${formatDate(day.date)}</span>
          ${day.title ? `<span class="day-title">${day.title}</span>` : ''}
        </div>
        <div class="attractions">
          ${rowsHtml}
        </div>
      </div>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.title || '行程表'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "標楷體", "Microsoft JhengHei", sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      padding: 10mm;
      background: white;
    }
    .print-controls {
      padding: 12px;
      border-bottom: 1px solid #eee;
      text-align: right;
      margin-bottom: 20px;
    }
    .print-controls button {
      padding: 8px 16px;
      margin-left: 8px;
      cursor: pointer;
      border-radius: 6px;
    }
    .btn-outline { background: white; border: 1px solid #ddd; }
    .btn-primary { background: #c9aa7c; color: white; border: none; }

    .header {
      text-align: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #c9aa7c;
    }
    .header h1 {
      font-size: 22pt;
      color: #3a3633;
      margin-bottom: 6px;
    }
    .header .subtitle {
      font-size: 13pt;
      color: #8b8680;
    }

    .day {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .day-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #f6f4f1;
      border-left: 4px solid #c9aa7c;
    }
    .day-number {
      font-size: 13pt;
      font-weight: bold;
      color: #c9aa7c;
    }
    .day-date {
      font-size: 11pt;
      color: #8b8680;
    }
    .day-title {
      font-size: 12pt;
      font-weight: 500;
      color: #3a3633;
      margin-left: 10px;
      padding-left: 10px;
      border-left: 2px solid #c9aa7c;
    }

    .attractions {
      padding: 8px 0;
    }
    .attraction-item {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0ede8;
    }
    .attraction-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .attraction-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 12px;
    }
    .attraction-row .time {
      font-family: monospace;
      font-size: 10pt;
      color: #8b8680;
      white-space: nowrap;
      min-width: 90px;
    }
    .attraction-row .name {
      font-size: 11pt;
      font-weight: 500;
      color: #3a3633;
      flex: 1;
    }
    /* 菜色下方一排 */
    .menu-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 114px;
      background: #faf9f7;
      border-radius: 4px;
      margin: 4px 12px 0 12px;
    }
    .menu-row .meal-label {
      font-size: 9pt;
      color: #c9aa7c;
      font-weight: 600;
      white-space: nowrap;
    }
    .menu-row .menu-text {
      font-size: 10pt;
      color: #3a3633;
    }

    .images {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      width: 100%;
    }
    .images img {
      flex: 1;
      height: auto;
      max-height: 200px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e8e5e0;
    }

    @media print {
      .print-controls { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-outline" onclick="window.close()">關閉</button>
    <button class="btn-primary" onclick="window.print()">列印</button>
  </div>

  <div class="header">
    <h1>${data.title || '行程表'}</h1>
    ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
  </div>

  ${daysHtml}
</body>
</html>
`
}
