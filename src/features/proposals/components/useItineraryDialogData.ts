/**
 * useItineraryDialogData - 行程編輯器資料管理 Hook
 *
 * 從 ItineraryDialog 抽出的資料邏輯，包含：
 * - 行程資料的初始化與狀態管理
 * - Day 的增刪改
 * - 景點的增刪改、圖片管理
 * - 儲存格編輯與鍵盤導航
 */

import { useState, useCallback, useRef, useEffect } from 'react'
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
import type { LuxuryHotel } from '@/components/editor/HotelSelector'
import { BROCHURE_PREVIEW_DIALOG_LABELS, ITINERARY_DIALOG_LABELS } from '../constants/labels'
import { generateItineraryPrintHtml } from './itinerary-print-template'

// 可編輯欄位
export type EditableField = 'startTime' | 'endTime' | 'name' | 'menu'

// 編輯中的儲存格
export interface EditingCell {
  rowIndex: number
  field: EditableField
}

export function useItineraryDialogData(pkg: ProposalPackage | null, onSave?: (data: TimelineItineraryData) => Promise<void>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ dayId: string; attractionId: string } | null>(null)
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState<number | null>(null)
  const [attractionSelectorOpen, setAttractionSelectorOpen] = useState(false)
  const [hotelSelectorOpen, setHotelSelectorOpen] = useState(false)
  const [insertAtRowIndex, setInsertAtRowIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // 計算日期的輔助函數
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
    const days = Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1
      return createEmptyDay(dayNumber, calcDate(dayNumber, startDate))
    })
    return {
      title: pkg?.version_name || BROCHURE_PREVIEW_DIALOG_LABELS.行程表,
      subtitle: '',
      startDate,
      days,
    }
  })

  const activeDay = data.days[activeDayIndex] || data.days[0]

  const calculateDate = useCallback((dayNumber: number, startDate?: string): string => {
    if (!startDate) return ''
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayNumber - 1)
    return date.toISOString().split('T')[0]
  }, [])

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

  const updateDayTitle = useCallback((title: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) =>
        idx === activeDayIndex ? { ...day, title } : day
      ),
    }))
  }, [activeDayIndex])

  const updateDayAccommodation = useCallback((accommodation: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((day, idx) =>
        idx === activeDayIndex ? { ...day, accommodation } : day
      ),
    }))
  }, [activeDayIndex])

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

  const openAttractionSelector = useCallback((rowIndex: number | null = null) => {
    setInsertAtRowIndex(rowIndex)
    setAttractionSelectorOpen(true)
  }, [])

  const handleAttractionSelect = useCallback((selectedAttractions: { id: string; name: string; english_name?: string; description?: string; thumbnail?: string; images?: string[] }[]) => {
    const newAttractions = selectedAttractions.map((a) => {
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
        if (insertAtRowIndex !== null) {
          const before = day.attractions.slice(0, insertAtRowIndex + 1)
          const after = day.attractions.slice(insertAtRowIndex + 1)
          return { ...day, attractions: [...before, ...newAttractions, ...after] }
        }
        return { ...day, attractions: [...day.attractions, ...newAttractions] }
      }),
    }))
    setAttractionSelectorOpen(false)
    setInsertAtRowIndex(null)
  }, [activeDayIndex, insertAtRowIndex])

  const handleHotelSelect = useCallback((selectedHotels: LuxuryHotel[]) => {
    if (selectedHotels.length === 0) return
    const hotel = selectedHotels[0]
    const displayName = hotel.city_name
      ? `${hotel.name}（${hotel.city_name}）`
      : hotel.name
    updateDayAccommodation(displayName)
    setHotelSelectorOpen(false)
  }, [updateDayAccommodation])

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

  const triggerImageUpload = useCallback((dayId: string, attractionId: string) => {
    setUploadTarget({ dayId, attractionId })
    fileInputRef.current?.click()
  }, [])

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

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const weekdays = [ITINERARY_DIALOG_LABELS.日, ITINERARY_DIALOG_LABELS.一, ITINERARY_DIALOG_LABELS.二, ITINERARY_DIALOG_LABELS.三, ITINERARY_DIALOG_LABELS.四, ITINERARY_DIALOG_LABELS.五, ITINERARY_DIALOG_LABELS.六]
    return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
  }

  const handleSave = useCallback(async () => {
    if (!onSave) {
      window.alert(ITINERARY_DIALOG_LABELS.儲存功能未啟用)
      return
    }
    setSaving(true)
    try {
      await onSave(data)
      window.alert(ITINERARY_DIALOG_LABELS.儲存成功)
    } catch {
      window.alert(ITINERARY_DIALOG_LABELS.儲存失敗)
    } finally {
      setSaving(false)
    }
  }, [data, onSave])

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = generateItineraryPrintHtml(data)
    printWindow.document.write(html)
    printWindow.document.close()
  }, [data])

  const handleCellClick = useCallback((rowIndex: number, field: EditableField) => {
    setEditingCell({ rowIndex, field })
  }, [])

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

  return {
    // Refs
    fileInputRef,
    inputRef,
    textareaRef,
    // State
    data,
    setData,
    activeDay,
    activeDayIndex,
    setActiveDayIndex,
    editingCell,
    setEditingCell,
    colorPickerOpen,
    setColorPickerOpen,
    attractionSelectorOpen,
    setAttractionSelectorOpen,
    hotelSelectorOpen,
    setHotelSelectorOpen,
    insertAtRowIndex,
    setInsertAtRowIndex,
    saving,
    // Actions
    addDay,
    removeDay,
    updateDayTitle,
    updateDayAccommodation,
    insertSymbolToTitle,
    addAttraction,
    openAttractionSelector,
    handleAttractionSelect,
    handleHotelSelect,
    removeAttraction,
    updateAttractionField,
    handleImageUpload,
    triggerImageUpload,
    removeImage,
    formatDate,
    handleSave,
    handlePrint,
    handleCellClick,
    handleKeyDown,
  }
}
