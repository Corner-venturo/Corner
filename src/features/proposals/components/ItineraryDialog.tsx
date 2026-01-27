/**
 * ItineraryDialog - 行程編輯器
 *
 * 分頁式的時間軸介面，用於編輯每日行程
 * - Tab 切換每日行程
 * - 表格式編輯（點擊儲存格直接編輯，無格線）
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
import { cn } from '@/lib/utils'
import {
  Clock,
  Plus,
  Trash2,
  X,
  Save,
  Printer,
  Upload,
  Coffee,
  UtensilsCrossed,
  Moon,
  Palette,
  Database,
  ArrowRight,
  Minus,
  Sparkles,
  Building2,
} from 'lucide-react'
import { AttractionSelector } from '@/components/editor/AttractionSelector'
import { HotelSelector, type LuxuryHotel } from '@/components/editor/HotelSelector'

// 預設顏色選項
const COLOR_OPTIONS = [
  { value: '', label: '預設', color: '#3a3633' },
  { value: '#3b82f6', label: '藍色', color: '#3b82f6' },
  { value: '#ef4444', label: '紅色', color: '#ef4444' },
  { value: '#22c55e', label: '綠色', color: '#22c55e' },
  { value: '#f59e0b', label: '橙色', color: '#f59e0b' },
  { value: '#8b5cf6', label: '紫色', color: '#8b5cf6' },
]
import type { ProposalPackage } from '@/types/proposal.types'
import type {
  TimelineAttraction,
  TimelineItineraryData,
} from '@/types/timeline-itinerary.types'
import {
  generateId,
  createEmptyAttraction,
  createEmptyDay,
} from '@/types/timeline-itinerary.types'

interface ItineraryDialogProps {
  isOpen: boolean
  onClose: () => void
  pkg: ProposalPackage | null
  onSave?: (timelineData: TimelineItineraryData) => Promise<void>
}

// 可編輯欄位
type EditableField = 'startTime' | 'endTime' | 'name' | 'menu'

// 編輯中的儲存格
interface EditingCell {
  rowIndex: number
  field: EditableField
}

export function ItineraryDialog({
  isOpen,
  onClose,
  pkg,
  onSave,
}: ItineraryDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ dayId: string; attractionId: string } | null>(null)
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null)
  const [attractionSelectorOpen, setAttractionSelectorOpen] = useState(false)
  const [hotelSelectorOpen, setHotelSelectorOpen] = useState(false)
  const [insertAtRowIndex, setInsertAtRowIndex] = useState<number | null>(null) // 插入到哪一行之後
  const [saving, setSaving] = useState(false)

  // 計算日期的輔助函數（提前定義）
  const calcDate = (dayNumber: number, startDate?: string): string => {
    if (!startDate) return ''
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayNumber - 1)
    return date.toISOString().split('T')[0]
  }

  // 初始化資料
  const [data, setData] = useState<TimelineItineraryData>(() => {
    if (pkg?.timeline_data) {
      return pkg.timeline_data
    }
    const startDate = pkg?.start_date || ''
    const totalDays = pkg?.days || 1

    // 根據套餐天數自動生成對應的 Day
    const days = Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1
      return createEmptyDay(dayNumber, calcDate(dayNumber, startDate))
    })

    return {
      title: pkg?.version_name || '行程表',
      subtitle: '',
      startDate,
      days,
    }
  })

  // 當前選中的日期
  const activeDay = data.days[activeDayIndex] || data.days[0]

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
    setActiveDayIndex(data.days.length)
  }, [calculateDate, data.days.length])

  // 刪除一天
  const removeDay = useCallback((dayIndex: number) => {
    setData((prev) => {
      const newDays = prev.days
        .filter((_, idx) => idx !== dayIndex)
        .map((day, index) => ({
          ...day,
          dayNumber: index + 1,
          date: calculateDate(index + 1, prev.startDate),
        }))
      return { ...prev, days: newDays.length > 0 ? newDays : [createEmptyDay(1, prev.startDate)] }
    })
    if (activeDayIndex >= data.days.length - 1) {
      setActiveDayIndex(Math.max(0, data.days.length - 2))
    }
  }, [calculateDate, activeDayIndex, data.days.length])

  // 更新每日標題
  const updateDayTitle = useCallback((title: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) =>
        idx === activeDayIndex ? { ...day, title } : day
      ),
    }))
  }, [activeDayIndex])

  // 更新每日住宿
  const updateDayAccommodation = useCallback((accommodation: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) =>
        idx === activeDayIndex ? { ...day, accommodation } : day
      ),
    }))
  }, [activeDayIndex])

  // 插入符號到今日主題
  const insertSymbolToTitle = useCallback((symbol: string) => {
    const input = document.querySelector('#day-title-input') as HTMLInputElement
    if (input) {
      const currentTitle = activeDay.title || ''
      const cursorPos = input.selectionStart || currentTitle.length
      const newValue = currentTitle.slice(0, cursorPos) + symbol + currentTitle.slice(cursorPos)
      updateDayTitle(newValue)
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(cursorPos + symbol.length, cursorPos + symbol.length)
      }, 0)
    }
  }, [activeDay.title, updateDayTitle])

  // 新增景點
  const addAttraction = useCallback(() => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) =>
        idx === activeDayIndex
          ? { ...day, attractions: [...day.attractions, createEmptyAttraction()] }
          : day
      ),
    }))
  }, [activeDayIndex])

  // 打開景點選擇器（指定插入位置）
  const openAttractionSelector = useCallback((rowIndex: number | null = null) => {
    setInsertAtRowIndex(rowIndex)
    setAttractionSelectorOpen(true)
  }, [])

  // 從景點庫選擇後新增
  const handleAttractionSelect = useCallback((selectedAttractions: { id: string; name: string; name_en?: string; description?: string; thumbnail?: string; images?: string[] }[]) => {
    const newAttractions = selectedAttractions.map((a) => {
      // 優先使用 images 陣列，否則用 thumbnail
      let imageList: { id: string; url: string }[] = []
      if (a.images && a.images.length > 0) {
        imageList = a.images.slice(0, 3).map(url => ({ id: generateId(), url }))
      } else if (a.thumbnail) {
        imageList = [{ id: generateId(), url: a.thumbnail }]
      }

      return {
        id: generateId(),
        name: a.name,
        description: a.description || '',
        images: imageList,
      }
    })

    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) => {
        if (idx !== activeDayIndex) return day

        // 如果有指定插入位置，則插入到該行之後
        if (insertAtRowIndex !== null) {
          const before = day.attractions.slice(0, insertAtRowIndex + 1)
          const after = day.attractions.slice(insertAtRowIndex + 1)
          return {
            ...day,
            attractions: [...before, ...newAttractions, ...after],
          }
        }

        // 否則加到最後
        return {
          ...day,
          attractions: [...day.attractions, ...newAttractions],
        }
      }),
    }))
    setAttractionSelectorOpen(false)
    setInsertAtRowIndex(null)
  }, [activeDayIndex, insertAtRowIndex])

  // 從飯店庫選擇後更新住宿
  const handleHotelSelect = useCallback((selectedHotels: LuxuryHotel[]) => {
    if (selectedHotels.length === 0) return
    const hotel = selectedHotels[0]
    // 顯示飯店名稱，如有城市名稱則附加（幫助區分同名飯店）
    const displayName = hotel.city_name
      ? `${hotel.name}（${hotel.city_name}）`
      : hotel.name
    updateDayAccommodation(displayName)
    setHotelSelectorOpen(false)
  }, [updateDayAccommodation])

  // 刪除景點
  const removeAttraction = useCallback((attractionIndex: number) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) =>
        idx === activeDayIndex
          ? {
              ...day,
              attractions:
                day.attractions.length > 1
                  ? day.attractions.filter((_, i) => i !== attractionIndex)
                  : day.attractions,
            }
          : day
      ),
    }))
  }, [activeDayIndex])

  // 更新景點欄位
  const updateAttractionField = useCallback(
    (attractionIndex: number, field: keyof TimelineAttraction, value: unknown) => {
      setData((prev) => ({
        ...prev,
        days: prev.days.map((day, idx) =>
          idx === activeDayIndex
            ? {
                ...day,
                attractions: day.attractions.map((a, i) =>
                  i === attractionIndex ? { ...a, [field]: value } : a
                ),
              }
            : day
        ),
      }))
    },
    [activeDayIndex]
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

  // 處理圖片上傳
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !uploadTarget) return

    const currentDay = data.days.find(d => d.id === uploadTarget.dayId)
    const currentAttraction = currentDay?.attractions.find(a => a.id === uploadTarget.attractionId)
    const currentCount = currentAttraction?.images.length || 0
    const remaining = 3 - currentCount

    if (remaining <= 0) {
      e.target.value = ''
      setUploadTarget(null)
      return
    }

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

    e.target.value = ''
    setUploadTarget(null)
  }, [uploadTarget, data.days, compressImage])

  // 觸發圖片上傳
  const triggerImageUpload = useCallback((dayId: string, attractionId: string) => {
    setUploadTarget({ dayId, attractionId })
    fileInputRef.current?.click()
  }, [])

  // 刪除照片
  const removeImage = useCallback((attractionIndex: number, imageId: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) =>
        idx === activeDayIndex
          ? {
              ...day,
              attractions: day.attractions.map((a, i) =>
                i === attractionIndex
                  ? { ...a, images: a.images.filter((img) => img.id !== imageId) }
                  : a
              ),
            }
          : day
      ),
    }))
  }, [activeDayIndex])

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
  }

  // 儲存
  const handleSave = useCallback(async () => {
    if (!onSave) {
      window.alert('儲存功能未啟用')
      return
    }
    setSaving(true)
    try {
      await onSave(data)
      window.alert('儲存成功')
    } catch {
      window.alert('儲存失敗')
    } finally {
      setSaving(false)
    }
  }, [data, onSave])

  // 列印
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = generatePrintHtml(data)
    printWindow.document.write(html)
    printWindow.document.close()
  }, [data])

  // 點擊儲存格開始編輯
  const handleCellClick = useCallback((rowIndex: number, field: EditableField) => {
    setEditingCell({ rowIndex, field })
  }, [])

  // 鍵盤導航
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, field: EditableField) => {
    const editableFields: EditableField[] = ['startTime', 'endTime', 'name', 'menu']
    const fieldIndex = editableFields.indexOf(field)

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        if (fieldIndex > 0) {
          setEditingCell({ rowIndex, field: editableFields[fieldIndex - 1] })
        } else if (rowIndex > 0) {
          setEditingCell({ rowIndex: rowIndex - 1, field: editableFields[editableFields.length - 1] })
        }
      } else {
        if (fieldIndex < editableFields.length - 1) {
          setEditingCell({ rowIndex, field: editableFields[fieldIndex + 1] })
        } else if (rowIndex < activeDay.attractions.length - 1) {
          setEditingCell({ rowIndex: rowIndex + 1, field: editableFields[0] })
        } else {
          setEditingCell(null)
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    } else if (e.key === 'ArrowDown' && rowIndex < activeDay.attractions.length - 1) {
      e.preventDefault()
      setEditingCell({ rowIndex: rowIndex + 1, field })
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault()
      setEditingCell({ rowIndex: rowIndex - 1, field })
    }
  }, [activeDay.attractions.length])

  // 自動 focus 輸入框
  useEffect(() => {
    if (editingCell) {
      const isTextareaField = editingCell.field === 'name' || editingCell.field === 'menu'
      if (isTextareaField && textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.select()
      } else if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }, [editingCell])

  // 渲染儲存格
  const renderCell = (attraction: TimelineAttraction, rowIndex: number, field: EditableField, width?: string) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field
    let value = ''
    let placeholder = ''

    switch (field) {
      case 'startTime':
        value = attraction.startTime || ''
        placeholder = '0900'
        break
      case 'endTime':
        value = attraction.endTime || ''
        placeholder = '1200'
        break
      case 'name':
        value = attraction.name || ''
        placeholder = attraction.mealType && attraction.mealType !== 'none' ? '餐廳名稱' : '景點名稱'
        break
      case 'menu':
        value = attraction.menu || ''
        placeholder = '菜色內容'
        break
    }

    // 時間欄位固定高度，名稱/菜色欄位允許多行
    const isTimeField = field === 'startTime' || field === 'endTime'
    const isTextareaField = field === 'name' || field === 'menu'

    if (isEditing) {
      if (isTextareaField) {
        // 名稱和菜色使用 textarea 支援多行
        return (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => updateAttractionField(rowIndex, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => {
              // Shift+Enter 換行，Enter 確認
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                setEditingCell(null)
              } else if (e.key === 'Escape') {
                setEditingCell(null)
              }
            }}
            className={cn(
              'w-full min-h-[32px] px-2 py-1 border-none outline-none bg-morandi-gold/10 focus:ring-0 resize-none text-sm leading-tight',
              width
            )}
            rows={Math.max(1, Math.ceil(value.length / 15))}
          />
        )
      }
      return (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            let newValue = e.target.value
            if (isTimeField) {
              newValue = newValue.replace(/\D/g, '').slice(0, 4)
            }
            updateAttractionField(rowIndex, field, newValue)
          }}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, field)}
          className={cn(
            'w-full h-8 px-2 border-none outline-none bg-morandi-gold/10 focus:ring-0',
            isTimeField && 'text-center font-mono text-xs',
            width
          )}
          maxLength={isTimeField ? 4 : undefined}
        />
      )
    }

    // 對於 name 和 menu 欄位，套用自訂顏色
    const textColor = (field === 'name' || field === 'menu') && attraction.color && value
      ? { color: attraction.color }
      : {}

    return (
      <div
        className={cn(
          'px-2 cursor-pointer hover:bg-morandi-gold/5 transition-colors',
          isTimeField ? 'h-8 flex items-center justify-center font-mono text-xs' : 'min-h-[32px] py-1 text-sm leading-tight whitespace-pre-wrap break-words',
          !value && 'text-morandi-muted/40',
          width
        )}
        style={textColor}
        onClick={() => handleCellClick(rowIndex, field)}
      >
        {value || placeholder}
      </div>
    )
  }

  if (!pkg) return null

  return (
    <>
    {/* 父 Dialog：使用 level={2}（作為子 Dialog 使用） */}
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent level={2} className={DIALOG_SIZES['4xl']}>
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

        {/* 標題區 */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
          <div>
            <Label className="text-xs text-morandi-primary">行程標題</Label>
            <Input
              value={data.title}
              onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="輸入行程標題..."
              className="mt-1 h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-morandi-primary">副標題</Label>
            <Input
              value={data.subtitle || ''}
              onChange={(e) => setData((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="輸入副標題..."
              className="mt-1 h-8"
            />
          </div>
        </div>

        {/* Day 分頁 Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {data.days.map((day, index) => (
            <button
              key={day.id}
              onClick={() => setActiveDayIndex(index)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                activeDayIndex === index
                  ? 'text-morandi-gold border-b-2 border-morandi-gold -mb-[1px]'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
            >
              Day {day.dayNumber}
              {day.date && <span className="ml-1 text-xs opacity-60">{formatDate(day.date)}</span>}
            </button>
          ))}
          <button
            onClick={addDay}
            className="px-3 py-2 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
            title="新增一天"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* 當日內容 */}
        <div className="flex flex-col">
          {/* 每日標題 */}
          <div className="py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-morandi-primary">今日主題</Label>
              <div className="flex items-center gap-1">
                {/* 符號插入按鈕 */}
                <button
                  type="button"
                  onClick={() => insertSymbolToTitle(' → ')}
                  className="p-1.5 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入箭頭"
                >
                  <ArrowRight size={14} className="text-morandi-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSymbolToTitle(' ⇀ ')}
                  className="px-2 py-1 text-xs bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors font-medium"
                  title="插入鉤箭頭"
                >
                  ⇀
                </button>
                <button
                  type="button"
                  onClick={() => insertSymbolToTitle(' · ')}
                  className="px-2 py-1 text-xs bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors font-medium"
                  title="插入間隔點"
                >
                  ·
                </button>
                <button
                  type="button"
                  onClick={() => insertSymbolToTitle(' | ')}
                  className="p-1.5 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入直線"
                >
                  <Minus size={14} className="text-morandi-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSymbolToTitle(' ⭐ ')}
                  className="p-1.5 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入星號"
                >
                  <Sparkles size={14} className="text-morandi-gold" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSymbolToTitle(' ✈ ')}
                  className="px-2 py-1 text-xs bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入飛機"
                >
                  ✈
                </button>
                {data.days.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDay(activeDayIndex)}
                    className="h-7 px-2 text-morandi-red hover:bg-morandi-red/10 ml-2"
                  >
                    <Trash2 size={14} className="mr-1" />
                    刪除此天
                  </Button>
                )}
              </div>
            </div>
            <Input
              id="day-title-input"
              value={activeDay.title || ''}
              onChange={(e) => updateDayTitle(e.target.value)}
              placeholder="台北 ✈ 福岡空港 → 由布院 · 金麟湖 → 阿蘇溫泉"
              className="h-8 text-sm"
            />
          </div>

          {/* 景點表格區域（固定高度可捲動） */}
          <div className="h-[280px] overflow-y-auto">
          {/* 景點表格（無格線） */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-morandi-secondary border-b border-border/30">
                <th className="py-2 px-1 text-center font-medium w-8"></th>
                <th className="py-2 px-2 text-left font-medium w-16">開始</th>
                <th className="py-2 px-2 text-left font-medium w-16">結束</th>
                <th className="py-2 px-2 text-left font-medium">景點/餐廳</th>
                <th className="py-2 px-2 text-left font-medium w-40">菜色</th>
                <th className="py-2 px-2 text-center font-medium w-24">餐食</th>
                <th className="py-2 px-2 text-center font-medium w-16">照片</th>
                <th className="py-2 px-2 text-center font-medium w-10">色</th>
                <th className="py-2 px-2 text-center font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {activeDay.attractions.map((attraction, rowIndex) => (
                <tr
                  key={attraction.id}
                  className="hover:bg-morandi-container/20 transition-colors"
                >
                  <td className="py-0.5 w-8">
                    <button
                      type="button"
                      onClick={() => openAttractionSelector(rowIndex)}
                      className="p-1 text-morandi-muted hover:text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
                      title="在此行下方插入景點"
                    >
                      <Plus size={14} />
                    </button>
                  </td>
                  <td className="py-0.5 w-16">{renderCell(attraction, rowIndex, 'startTime', 'w-16')}</td>
                  <td className="py-0.5 w-16">{renderCell(attraction, rowIndex, 'endTime', 'w-16')}</td>
                  <td className="py-0.5">{renderCell(attraction, rowIndex, 'name')}</td>
                  <td className="py-0.5 w-40">
                    {attraction.mealType && attraction.mealType !== 'none'
                      ? renderCell(attraction, rowIndex, 'menu')
                      : <div className="h-8 px-2 flex items-center text-morandi-muted/30">-</div>
                    }
                  </td>
                  <td className="py-0.5 w-24">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateAttractionField(rowIndex, 'mealType', attraction.mealType === 'breakfast' ? 'none' : 'breakfast')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          attraction.mealType === 'breakfast'
                            ? 'bg-morandi-gold text-white'
                            : 'text-morandi-muted hover:bg-morandi-container'
                        )}
                        title="早餐"
                      >
                        <Coffee size={14} />
                      </button>
                      <button
                        onClick={() => updateAttractionField(rowIndex, 'mealType', attraction.mealType === 'lunch' ? 'none' : 'lunch')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          attraction.mealType === 'lunch'
                            ? 'bg-morandi-gold text-white'
                            : 'text-morandi-muted hover:bg-morandi-container'
                        )}
                        title="午餐"
                      >
                        <UtensilsCrossed size={14} />
                      </button>
                      <button
                        onClick={() => updateAttractionField(rowIndex, 'mealType', attraction.mealType === 'dinner' ? 'none' : 'dinner')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          attraction.mealType === 'dinner'
                            ? 'bg-morandi-gold text-white'
                            : 'text-morandi-muted hover:bg-morandi-container'
                        )}
                        title="晚餐"
                      >
                        <Moon size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="py-0.5 w-16">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => triggerImageUpload(activeDay.id, attraction.id)}
                        className="p-1.5 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
                        title="上傳照片"
                      >
                        <Upload size={14} />
                      </button>
                      {attraction.images.length > 0 && (
                        <span className="text-xs text-morandi-gold font-medium">{attraction.images.length}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-0.5 w-10">
                    <div className="relative">
                      <button
                        onClick={() => setColorPickerOpen(colorPickerOpen === rowIndex ? null : rowIndex)}
                        className="p-1.5 rounded transition-colors hover:bg-morandi-container"
                        style={{ color: attraction.color || '#3a3633' }}
                        title="選擇顏色"
                      >
                        <Palette size={14} />
                      </button>
                      {colorPickerOpen === rowIndex && (
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg p-1 flex gap-1 z-10">
                          {COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                updateAttractionField(rowIndex, 'color', opt.value)
                                setColorPickerOpen(null)
                              }}
                              className={cn(
                                'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                                attraction.color === opt.value ? 'border-morandi-gold' : 'border-transparent'
                              )}
                              style={{ backgroundColor: opt.color }}
                              title={opt.label}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-0.5 w-10">
                    {activeDay.attractions.length > 1 && (
                      <button
                        onClick={() => removeAttraction(rowIndex)}
                        className="p-1.5 text-morandi-muted hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 新增景點 */}
          <div className="py-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAttractionSelector(null)}
              className="gap-1 text-xs text-morandi-gold hover:text-morandi-gold-hover"
              title="從景點庫選擇"
            >
              <Plus size={12} />
              從景點庫新增
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addAttraction}
              className="gap-1 text-xs text-morandi-secondary hover:text-morandi-gold"
            >
              <Plus size={12} />
              手動新增
            </Button>
          </div>
          </div>

          {/* 已上傳的照片預覽 */}
          {activeDay.attractions.some(a => a.images.length > 0) && (
            <div className="py-3 border-t border-border/50">
              <div className="text-xs text-morandi-secondary mb-2">已上傳照片：</div>
              <div className="flex flex-wrap gap-2">
                {activeDay.attractions.map((attraction, attrIndex) =>
                  attraction.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt=""
                        className="w-16 h-16 object-cover rounded border border-border"
                      />
                      <button
                        onClick={() => removeImage(attrIndex, img.id)}
                        className="absolute -top-1 -right-1 h-4 w-4 bg-morandi-red text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-white truncate px-0.5">
                        {attraction.name || '景點'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 當晚住宿 */}
          <div className="py-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-morandi-gold shrink-0" />
              <Label className="text-xs text-morandi-primary shrink-0">當晚住宿：</Label>
              <Input
                value={activeDay.accommodation || ''}
                onChange={(e) => updateDayAccommodation(e.target.value)}
                placeholder="輸入飯店名稱..."
                className="h-8 text-sm flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHotelSelectorOpen(true)}
                className="h-8 px-2 gap-1 text-xs text-morandi-gold hover:text-morandi-gold-hover shrink-0"
              >
                <Database size={14} />
                從飯店庫選擇
              </Button>
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end pt-4 border-t border-border">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="gap-2">
              <X size={16} />
              關閉
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer size={16} />
              列印
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Save size={16} />
              {saving ? '儲存中...' : '儲存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* 景點選擇器（level={3}） */}
    <AttractionSelector
      isOpen={attractionSelectorOpen}
      onClose={() => {
        setAttractionSelectorOpen(false)
        setInsertAtRowIndex(null)
      }}
      onSelect={handleAttractionSelect}
      dayTitle={activeDay.title || ''}
    />

    {/* 飯店選擇器（level={3}） */}
    <HotelSelector
      isOpen={hotelSelectorOpen}
      onClose={() => setHotelSelectorOpen(false)}
      tourCountryId={pkg?.country_id || undefined}
      onSelect={handleHotelSelect}
    />
    </>
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

  const daysHtml = data.days.map((day) => {
    const rowsHtml = day.attractions.map((attr) => {
      const timeStr = attr.startTime || attr.endTime
        ? `${formatTime(attr.startTime)} - ${formatTime(attr.endTime)}`
        : ''

      const imagesHtml = attr.images.length > 0
        ? `<div class="images">${attr.images.map(img => `<img src="${img.url}" alt="" />`).join('')}</div>`
        : ''

      // 套用自訂顏色
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
    @page { size: A4 portrait; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
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
    .header h1 { font-size: 22pt; color: #3a3633; margin-bottom: 6px; }
    .header .subtitle { font-size: 13pt; color: #8b8680; }
    .day { margin-bottom: 20px; page-break-inside: avoid; }
    .day-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #f6f4f1;
      border-left: 4px solid #c9aa7c;
    }
    .day-number { font-size: 13pt; font-weight: bold; color: #c9aa7c; }
    .day-date { font-size: 11pt; color: #8b8680; }
    .day-title {
      font-size: 12pt;
      font-weight: 500;
      color: #3a3633;
      margin-left: 10px;
      padding-left: 10px;
      border-left: 2px solid #c9aa7c;
    }
    .attractions { padding: 8px 0; }
    .attraction-item {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0ede8;
    }
    .attraction-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
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
    .attraction-row .name { font-size: 11pt; font-weight: 500; color: #3a3633; flex: 1; }
    .description-row {
      padding: 2px 12px 2px 114px;
    }
    .description-row .description-text { font-size: 10pt; color: #666; line-height: 1.4; }
    .menu-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 114px;
      background: #faf9f7;
      border-radius: 4px;
      margin: 4px 12px 0 12px;
    }
    .menu-row .menu-text { font-size: 10pt; color: #3a3633; }
    .images { display: flex; gap: 8px; padding: 8px 12px; width: 100%; }
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
