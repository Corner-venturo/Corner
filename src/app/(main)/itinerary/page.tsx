'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { MapPin, Eye, Copy, Archive, Trash2, RotateCcw, Building2, CheckCircle2, Link2, Plane, Search, CalendarDays, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { useItineraries, useEmployees, useQuotes, useTours } from '@/hooks/cloud-hooks'
import { useRegionsStore } from '@/stores/region-store'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores'
import type { Itinerary } from '@/stores/types'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'

const statusFilters = ['全部', '提案', '進行中', '公司範例', '結案']

// 公司密碼（統編）
const COMPANY_PASSWORD = '83212711'

// 移除 HTML 標籤，只保留純文字
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  // 移除所有 HTML 標籤
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function ItineraryPage() {
  const router = useRouter()
  const { items: itineraries, delete: deleteItinerary, update: updateItinerary, create: createItinerary } = useItineraries()
  const { items: quotes, create: createQuote, update: updateQuote } = useQuotes()
  const { items: employees } = useEmployees()
  const { items: tours } = useTours()
  const { user } = useAuthStore()
  const { workspaces, loadWorkspaces } = useWorkspaceStore()
  const regionsStore = useRegionsStore()
  const countries = regionsStore.countries
  const cities = regionsStore.cities

  // 檢查是否為超級管理員
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.permissions?.includes('super_admin')

  // 超級管理員載入 workspaces
  // 注意：不要把 loadWorkspaces 放在依賴陣列，避免無限迴圈
  useEffect(() => {
    if (isSuperAdmin && workspaces.length === 0) {
      loadWorkspaces()
    }
     
  }, [isSuperAdmin])

  // 所有 useState hooks 集中在一起
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [authorFilter, setAuthorFilter] = useState<string>('__mine__') // 預設 __mine__ 表示當前登入者
  const [searchTerm, setSearchTerm] = useState('')
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<Itinerary | null>(null)
  const [duplicateTourCode, setDuplicateTourCode] = useState('')
  const [duplicateTitle, setDuplicateTitle] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  // 簡易新增行程表單 state
  const [newItineraryTitle, setNewItineraryTitle] = useState('')
  const [newItineraryTourCode, setNewItineraryTourCode] = useState('')
  const [newItineraryCountry, setNewItineraryCountry] = useState('')
  const [newItineraryCity, setNewItineraryCity] = useState('')
  const [newItineraryDepartureDate, setNewItineraryDepartureDate] = useState('')
  const [newItineraryDays, setNewItineraryDays] = useState('')
  const [newItineraryOutboundFlight, setNewItineraryOutboundFlight] = useState<{
    flightNumber: string
    airline: string
    departureAirport: string
    arrivalAirport: string
    departureTime: string
    arrivalTime: string
    departureDate: string
  } | null>(null)
  const [newItineraryReturnFlight, setNewItineraryReturnFlight] = useState<{
    flightNumber: string
    airline: string
    departureAirport: string
    arrivalAirport: string
    departureTime: string
    arrivalTime: string
    departureDate: string
  } | null>(null)
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false)
  const [loadingOutboundFlight, setLoadingOutboundFlight] = useState(false)
  const [loadingReturnFlight, setLoadingReturnFlight] = useState(false)

  // 出發日期變更時，自動填入去程航班日期
  useEffect(() => {
    if (newItineraryDepartureDate) {
      const date = new Date(newItineraryDepartureDate)
      const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
      setNewItineraryOutboundFlight(prev => ({
        flightNumber: prev?.flightNumber || '',
        airline: prev?.airline || '',
        departureAirport: prev?.departureAirport || 'TPE',
        arrivalAirport: prev?.arrivalAirport || '',
        departureTime: prev?.departureTime || '',
        arrivalTime: prev?.arrivalTime || '',
        departureDate: dateStr,
      }))
    }
  }, [newItineraryDepartureDate])

  // 天數變更時，自動填入回程航班日期
  useEffect(() => {
    if (newItineraryDepartureDate && newItineraryDays) {
      const returnDate = new Date(newItineraryDepartureDate)
      returnDate.setDate(returnDate.getDate() + parseInt(newItineraryDays) - 1)
      const dateStr = `${String(returnDate.getMonth() + 1).padStart(2, '0')}/${String(returnDate.getDate()).padStart(2, '0')}`
      setNewItineraryReturnFlight(prev => ({
        flightNumber: prev?.flightNumber || '',
        airline: prev?.airline || '',
        departureAirport: prev?.departureAirport || '',
        arrivalAirport: prev?.arrivalAirport || 'TPE',
        departureTime: prev?.departureTime || '',
        arrivalTime: prev?.arrivalTime || '',
        departureDate: dateStr,
      }))
    }
  }, [newItineraryDepartureDate, newItineraryDays])

  // 載入地區資料（只執行一次）
  React.useEffect(() => {
    regionsStore.fetchAll()
     
  }, [])

  // 根據 ID 取得國家名稱
  const getCountryName = useCallback((countryId?: string) => {
    if (!countryId) return '-'
    const country = countries.find(c => c.id === countryId)
    return country?.name || countryId
  }, [countries])

  // 根據 ID 取得城市名稱
  const getCityName = useCallback((cityId?: string) => {
    if (!cityId) return '-'
    const city = cities.find(c => c.id === cityId)
    return city?.name || cityId
  }, [cities])

  // 根據 created_by ID 查找員工名稱（優先使用 display_name）
  const getEmployeeName = useCallback((employeeId?: string) => {
    if (!employeeId) return '-'
    const employee = employees.find(e => e.id === employeeId)
    return employee?.display_name || employee?.chinese_name || '-'
  }, [employees])

  // 根據 tour_id 查找綁定的團號
  const getLinkedTourCode = useCallback((tourId?: string | null) => {
    if (!tourId) return null
    const tour = tours.find(t => t.id === tourId)
    return tour?.code || null
  }, [tours])

  // 打開新增行程對話框
  const handleOpenTypeSelect = useCallback(() => {
    // 重置表單
    setNewItineraryTitle('')
    setNewItineraryTourCode('')
    setNewItineraryCountry('')
    setNewItineraryCity('')
    setNewItineraryDepartureDate('')
    setNewItineraryDays('')
    setNewItineraryOutboundFlight(null)
    setNewItineraryReturnFlight(null)
    setIsTypeSelectOpen(true)
  }, [])

  // 查詢去程航班
  const handleSearchOutboundFlight = useCallback(async () => {
    const flightNumber = newItineraryOutboundFlight?.flightNumber
    if (!flightNumber) {
      await alertError('請先輸入航班號碼')
      return
    }

    setLoadingOutboundFlight(true)
    try {
      const result = await searchFlightAction(flightNumber, newItineraryDepartureDate || new Date().toISOString().split('T')[0])
      if (result.error) {
        await alertError(result.error)
        return
      }
      if (result.data) {
        setNewItineraryOutboundFlight(prev => ({
          flightNumber: flightNumber,
          airline: result.data.airline,
          departureAirport: result.data.departure.iata,
          arrivalAirport: result.data.arrival.iata,
          departureTime: result.data.departure.time,
          arrivalTime: result.data.arrival.time,
          departureDate: prev?.departureDate || '',
        }))
      }
    } catch {
      await alertError('查詢航班時發生錯誤')
    } finally {
      setLoadingOutboundFlight(false)
    }
  }, [newItineraryOutboundFlight?.flightNumber, newItineraryDepartureDate])

  // 查詢回程航班
  const handleSearchReturnFlight = useCallback(async () => {
    const flightNumber = newItineraryReturnFlight?.flightNumber
    if (!flightNumber) {
      await alertError('請先輸入航班號碼')
      return
    }

    // 計算回程日期
    let returnDateStr = new Date().toISOString().split('T')[0]
    if (newItineraryDepartureDate && newItineraryDays) {
      const returnDate = new Date(newItineraryDepartureDate)
      returnDate.setDate(returnDate.getDate() + parseInt(newItineraryDays) - 1)
      returnDateStr = returnDate.toISOString().split('T')[0]
    }

    setLoadingReturnFlight(true)
    try {
      const result = await searchFlightAction(flightNumber, returnDateStr)
      if (result.error) {
        await alertError(result.error)
        return
      }
      if (result.data) {
        setNewItineraryReturnFlight(prev => ({
          flightNumber: flightNumber,
          airline: result.data.airline,
          departureAirport: result.data.departure.iata,
          arrivalAirport: result.data.arrival.iata,
          departureTime: result.data.departure.time,
          arrivalTime: result.data.arrival.time,
          departureDate: prev?.departureDate || '',
        }))
      }
    } catch {
      await alertError('查詢航班時發生錯誤')
    } finally {
      setLoadingReturnFlight(false)
    }
  }, [newItineraryReturnFlight?.flightNumber, newItineraryDepartureDate, newItineraryDays])

  // 建立行程
  const handleCreateItinerary = useCallback(async () => {
    if (!newItineraryTitle.trim()) {
      await alertError('請填寫行程名稱')
      return
    }
    if (!newItineraryDepartureDate || !newItineraryDays) {
      await alertError('請填寫出發日期和行程天數')
      return
    }

    const days = parseInt(newItineraryDays)

    // 計算回程日期
    const returnDate = new Date(newItineraryDepartureDate)
    returnDate.setDate(returnDate.getDate() + days - 1)
    const returnDateStr = returnDate.toISOString().split('T')[0]

    setIsCreatingItinerary(true)
    try {
      // 產生每日行程框架
      const dailyItinerary = []
      for (let i = 1; i <= days; i++) {
        const date = new Date(newItineraryDepartureDate)
        date.setDate(date.getDate() + i - 1)
        const dateStr = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
        const weekday = date.toLocaleDateString('zh-TW', { weekday: 'short' })

        dailyItinerary.push({
          dayLabel: `Day ${i}`,
          date: `${dateStr} (${weekday})`,
          title: i === 1 ? '抵達目的地' : i === days ? '返回台灣' : '',
          highlight: '',
          description: '',
          images: [],
          activities: [],
          recommendations: [],
          meals: {
            breakfast: i === 1 ? '溫暖的家' : '飯店內早餐',
            lunch: '敬請自理',
            dinner: '敬請自理',
          },
          accommodation: i === days ? '' : '待確認',
        })
      }

      // 格式化日期顯示
      const formatDateForDisplay = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
      }

      const newItinerary = {
        tagline: 'Corner Travel 2025',
        title: newItineraryTitle.trim(),
        subtitle: '',
        description: '',
        departure_date: formatDateForDisplay(newItineraryDepartureDate),
        tour_code: newItineraryTourCode.trim() || '',
        cover_image: '',
        country: newItineraryCountry,
        city: newItineraryCity,
        status: '提案' as const,
        outbound_flight: newItineraryOutboundFlight ? {
          airline: newItineraryOutboundFlight.airline,
          flightNumber: newItineraryOutboundFlight.flightNumber,
          departureAirport: newItineraryOutboundFlight.departureAirport,
          departureTime: newItineraryOutboundFlight.departureTime,
          departureDate: newItineraryOutboundFlight.departureDate,
          arrivalAirport: newItineraryOutboundFlight.arrivalAirport,
          arrivalTime: newItineraryOutboundFlight.arrivalTime,
          duration: '',
        } : {
          airline: '',
          flightNumber: '',
          departureAirport: 'TPE',
          departureTime: '',
          departureDate: new Date(newItineraryDepartureDate).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
          arrivalAirport: '',
          arrivalTime: '',
          duration: '',
        },
        return_flight: newItineraryReturnFlight ? {
          airline: newItineraryReturnFlight.airline,
          flightNumber: newItineraryReturnFlight.flightNumber,
          departureAirport: newItineraryReturnFlight.departureAirport,
          departureTime: newItineraryReturnFlight.departureTime,
          departureDate: newItineraryReturnFlight.departureDate,
          arrivalAirport: newItineraryReturnFlight.arrivalAirport,
          arrivalTime: newItineraryReturnFlight.arrivalTime,
          duration: '',
        } : {
          airline: '',
          flightNumber: '',
          departureAirport: '',
          departureTime: '',
          departureDate: returnDate.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
          arrivalAirport: 'TPE',
          arrivalTime: '',
          duration: '',
        },
        features: [],
        focus_cards: [],
        leader: { name: '', domesticPhone: '', overseasPhone: '' },
        meeting_info: { time: '', location: '' },
        itinerary_subtitle: `${days}天${days - 1}夜精彩旅程規劃`,
        daily_itinerary: dailyItinerary,
        created_by: user?.id,
      }

      const createdItinerary = await createItinerary(newItinerary)

      if (createdItinerary?.id) {
        setIsTypeSelectOpen(false)
        router.push(`/itinerary/new?itinerary_id=${createdItinerary.id}`)
      } else {
        await alertError('建立失敗，請稍後再試')
      }
    } catch (error) {
      console.error('建立行程失敗:', error)
      await alertError('建立失敗，請稍後再試')
    } finally {
      setIsCreatingItinerary(false)
    }
  }, [newItineraryTitle, newItineraryTourCode, newItineraryCountry, newItineraryCity, newItineraryDepartureDate, newItineraryDays, newItineraryOutboundFlight, newItineraryReturnFlight, createItinerary, user?.id, router])

  // 打開複製行程對話框
  const handleOpenDuplicateDialog = useCallback((itinerary: Itinerary) => {
    setDuplicateSource(itinerary)
    setDuplicateTourCode('')
    setDuplicateTitle('')
    setIsDuplicateDialogOpen(true)
  }, [])

  // 執行複製行程
  const handleDuplicateSubmit = useCallback(async () => {
    if (!duplicateSource) return
    if (!duplicateTourCode.trim() || !duplicateTitle.trim()) {
      await alertError('請填寫行程編號和行程名稱')
      return
    }

    setIsDuplicating(true)
    try {
      // 複製所有欄位，但排除系統欄位，讓 store 自動注入
      const {
        id: sourceItineraryId,
        created_at: _createdAt,
        updated_at: _updatedAt,
        created_by: _createdBy, // 作者改為當前登入者
        updated_by: _updatedBy, // 更新者改為當前登入者
        workspace_id: _workspaceId, // workspace 由 store 自動注入當前用戶的
        tour_id: _tourId, // 複製的行程不關聯原有的團
        is_template: _isTemplate, // 複製的行程不是公司範例
        closed_at: _closedAt, // 複製的行程不是結案狀態
        archived_at: _archivedAt, // 複製的行程不是封存狀態
        ...restData
      } = duplicateSource

      const newItinerary = {
        ...restData,
        tour_code: duplicateTourCode.trim(),
        title: duplicateTitle.trim(),
        status: '提案' as const, // 複製的行程預設為草稿
        created_by: user?.id, // 作者為當前登入者
      }

      const createdItinerary = await createItinerary(newItinerary)

      // 查找並複製關聯的報價單（清空客戶資料，保留價格數值）
      const linkedQuotes = quotes.filter(q => q.itinerary_id === sourceItineraryId)
      let quoteCopiedCount = 0

      for (const quote of linkedQuotes) {
        const {
          id: _quoteId,
          created_at: _quoteCreatedAt,
          updated_at: _quoteUpdatedAt,
          // 清空客戶個人資料
          customer_name: _customerName,
          contact_person: _contactPerson,
          contact_phone: _contactPhone,
          contact_email: _contactEmail,
          contact_address: _contactAddress,
          // 清空關聯資料
          tour_id: _quoteTourId,
          converted_to_tour: _convertedToTour,
          // 重置狀態相關
          status: _status,
          received_amount: _receivedAmount,
          balance_amount: _balanceAmount,
          is_pinned: _isPinned,
          // 保留其他所有資料（價格、項目等）
          ...quoteRestData
        } = quote

        const newQuote = {
          ...quoteRestData,
          // 排除系統欄位，讓 store 自動生成/注入
          code: undefined, // 讓 store 自動生成新的報價單編號
          workspace_id: undefined, // 讓 store 自動注入當前用戶的 workspace
          // 關聯到新行程
          itinerary_id: createdItinerary?.id,
          // 清空客戶資料
          customer_name: '（待填寫）',
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          contact_address: undefined,
          // 重置狀態
          status: 'proposed' as const,
          received_amount: undefined,
          balance_amount: undefined,
          converted_to_tour: false,
          is_pinned: false,
          // 更新行程編號
          tour_code: duplicateTourCode.trim(),
          // 作者為當前登入者
          created_by: user?.id,
          created_by_name: user?.name || undefined,
        }

        await createQuote(newQuote)
        quoteCopiedCount++
      }

      const successMsg = quoteCopiedCount > 0
        ? `行程已複製成功！同時複製了 ${quoteCopiedCount} 個報價單（客戶資料已清空）`
        : '行程已複製成功！'
      await alertSuccess(successMsg)
      setIsDuplicateDialogOpen(false)
      setDuplicateSource(null)
      setDuplicateTourCode('')
      setDuplicateTitle('')
    } catch (error) {
      await alertError('複製失敗，請稍後再試')
    } finally {
      setIsDuplicating(false)
    }
  }, [duplicateSource, duplicateTourCode, duplicateTitle, createItinerary, createQuote, quotes, user?.id, user?.name])

  // 封存行程
  const handleArchive = useCallback(
    async (id: string) => {
      // 檢查是否有關聯的報價單
      const linkedQuotes = quotes.filter(q => q.itinerary_id === id)
      const hasLinkedQuotes = linkedQuotes.length > 0

      let syncAction: 'sync' | 'unlink' | 'cancel' = 'cancel'

      if (hasLinkedQuotes) {
        // 有關聯報價單，詢問處理方式
        const result = await confirm(
          `此行程有 ${linkedQuotes.length} 個關聯的報價單。\n\n請選擇封存方式：\n• 同步封存：報價單也一併封存\n• 僅封存行程：斷開關聯，報價單保留`,
          {
            type: 'warning',
            title: '封存行程',
            confirmText: '同步封存',
            cancelText: '取消',
            showThirdOption: true,
            thirdOptionText: '僅封存行程',
          }
        )

        if (result === true) {
          syncAction = 'sync'
        } else if (result === 'third') {
          syncAction = 'unlink'
        } else {
          return // 取消操作
        }
      } else {
        // 沒有關聯報價單，直接確認
        const confirmed = await confirm('確定要封存這個行程嗎？封存後可在「封存」分頁中找到。', {
          type: 'warning',
          title: '封存行程',
        })
        if (!confirmed) return
        syncAction = 'sync' // 沒有報價單，直接封存
      }

      try {
        const archivedAt = new Date().toISOString()

        // 封存行程
        await updateItinerary(id, { archived_at: archivedAt })

        if (hasLinkedQuotes) {
          if (syncAction === 'sync') {
            // 同步封存報價單
            for (const quote of linkedQuotes) {
              await updateQuote(quote.id, { status: 'rejected' as const }) // 報價單沒有 archived_at，改用 rejected 狀態
            }
            await alertSuccess(`已封存行程及 ${linkedQuotes.length} 個報價單！`)
          } else if (syncAction === 'unlink') {
            // 斷開關聯
            for (const quote of linkedQuotes) {
              await updateQuote(quote.id, { itinerary_id: undefined })
            }
            await alertSuccess('已封存行程！報價單已斷開關聯並保留。')
          }
        } else {
          await alertSuccess('已封存！')
        }
      } catch (error) {
        await alertError('封存失敗，請稍後再試')
      }
    },
    [updateItinerary, updateQuote, quotes]
  )

  // 取消封存
  const handleUnarchive = useCallback(
    async (id: string) => {
      try {
        await updateItinerary(id, { archived_at: null })
        await alertSuccess('已取消封存！')
      } catch (error) {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 刪除行程（僅封存列表可用）
  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要永久刪除這個行程嗎？此操作無法復原！', {
        type: 'warning',
        title: '永久刪除行程',
      })
      if (confirmed) {
        try {
          await deleteItinerary(id)
          await alertSuccess('已永久刪除！')
        } catch (error) {
          await alertError('刪除失敗，請稍後再試')
        }
      }
    },
    [deleteItinerary]
  )

  // 設為公司範例
  const handleSetTemplate = useCallback(
    async (id: string, isTemplate: boolean) => {
      try {
        await updateItinerary(id, { is_template: isTemplate })
        await alertSuccess(isTemplate ? '已設為公司範例！' : '已取消公司範例！')
      } catch (error) {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 手動結案
  const handleClose = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要結案這個行程嗎？結案後仍可在「結案」分頁中查看。', {
        type: 'warning',
        title: '結案行程',
      })
      if (confirmed) {
        try {
          await updateItinerary(id, { closed_at: new Date().toISOString() })
          await alertSuccess('已結案！')
        } catch (error) {
          await alertError('結案失敗，請稍後再試')
        }
      }
    },
    [updateItinerary]
  )

  // 取消結案
  const handleReopen = useCallback(
    async (id: string) => {
      try {
        await updateItinerary(id, { closed_at: null })
        await alertSuccess('已重新開啟！')
      } catch (error) {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 處理行程點擊（進行中需密碼解鎖）
  const handleRowClick = useCallback(
    (itinerary: Itinerary) => {
      // 如果是進行中狀態（已綁定旅遊團），需要密碼解鎖
      if (itinerary.status === '進行中') {
        setPendingEditId(itinerary.id)
        setPasswordInput('')
        setIsPasswordDialogOpen(true)
      } else {
        router.push(`/itinerary/${itinerary.id}`)
      }
    },
    [router]
  )

  // 密碼驗證
  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === COMPANY_PASSWORD) {
      setIsPasswordDialogOpen(false)
      if (pendingEditId) {
        router.push(`/itinerary/${pendingEditId}`)
      }
    } else {
      alertError('密碼錯誤！')
    }
  }, [passwordInput, pendingEditId, router])

  // 判斷行程是否已結案（手動結案或日期過期）
  const isItineraryClosed = useCallback((itinerary: Itinerary) => {
    // 手動結案
    if (itinerary.closed_at) return true
    // 公司範例不會因為日期過期而結案
    if (itinerary.is_template) return false
    // 日期過期自動結案
    if (itinerary.departure_date) {
      const departureDate = new Date(itinerary.departure_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return departureDate < today
    }
    return false
  }, [])

  // 表格配置
  const tableColumns: TableColumn<Itinerary>[] = useMemo(
    () => [
      {
        key: 'tour_code',
        label: '行程編號',
        sortable: true,
        render: (_value, itinerary) => {
          const linkedTourCode = getLinkedTourCode(itinerary.tour_id)
          const isLinked = !!linkedTourCode
          return (
            <div className="flex items-center gap-1.5">
              {isLinked && (
                <Link2 size={12} className="text-morandi-blue flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm font-mono",
                isLinked ? "text-morandi-blue font-medium" : "text-morandi-secondary"
              )}>
                {isLinked ? linkedTourCode : (itinerary.tour_code || '-')}
              </span>
            </div>
          )
        },
      },
      {
        key: 'title',
        label: '行程名稱',
        sortable: true,
        render: (_value, itinerary) => {
          const versionRecords = itinerary.version_records as Array<unknown> | undefined
          const versionCount = versionRecords?.length || 0
          const extraVersions = versionCount > 1 ? versionCount - 1 : 0
          // 移除 HTML 標籤，只顯示純文字
          const cleanTitle = stripHtml(itinerary.title)
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-morandi-primary">{cleanTitle}</span>
              {extraVersions > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-morandi-gold/10 text-morandi-gold font-medium">
                  +{extraVersions}
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'destination',
        label: '目的地',
        sortable: true,
        render: (_value, itinerary) => (
          <div className="flex items-center text-sm text-morandi-secondary">
            <MapPin size={14} className="mr-1" />
            {getCountryName(itinerary.country)} · {getCityName(itinerary.city)}
          </div>
        ),
      },
      {
        key: 'days',
        label: '天數',
        sortable: true,
        render: (_value, itinerary) => {
          // 排除備案，只計算主行程天數
          const dailyItinerary = itinerary.daily_itinerary as Array<{ isAlternative?: boolean }> | undefined
          const mainDays = dailyItinerary?.filter(d => !d.isAlternative).length || 0
          return (
            <span className="text-sm text-morandi-secondary">
              {mainDays} 天 {Math.max(0, mainDays - 1)} 夜
            </span>
          )
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (_value, itinerary) => {
          const isClosed = isItineraryClosed(itinerary)
          const isTemplate = itinerary.is_template

          // 優先顯示結案狀態
          if (isClosed) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                結案
              </span>
            )
          }
          // 公司範例顯示特殊標籤
          if (isTemplate) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-gold/10 text-morandi-gold">
                <Building2 size={10} />
                公司範例
              </span>
            )
          }
          // 一般狀態
          if (itinerary.status === '進行中') {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-green/10 text-morandi-green">
                進行中
              </span>
            )
          }
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-muted/20 text-morandi-secondary">
              提案
            </span>
          )
        },
      },
      {
        key: 'created_by',
        label: '作者',
        sortable: true,
        render: (_value, itinerary) => (
          <span className="text-sm text-morandi-secondary">
            {getEmployeeName(itinerary.created_by)}
          </span>
        ),
      },
      {
        key: 'created_at',
        label: '建立時間',
        sortable: true,
        render: (_value, itinerary) => (
          <span className="text-sm text-morandi-muted">
            {new Date(itinerary.created_at).toLocaleDateString('zh-TW')}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        render: (_value, itinerary) => {
          const isArchived = !!itinerary.archived_at
          const isClosed = isItineraryClosed(itinerary)
          const isTemplate = itinerary.is_template

          return (
            <div className="flex items-center gap-1">
              {/* 產生分享連結 */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                  const shareUrl = itinerary.tour_code
                    ? `${baseUrl}/view/${itinerary.tour_code}`
                    : `${baseUrl}/view/${itinerary.id}`
                  navigator.clipboard
                    .writeText(shareUrl)
                    .then(() => {
                      alertSuccess('分享連結已複製！\n\n' + shareUrl)
                    })
                    .catch(() => {
                      alertError('複製失敗，請手動複製：\n' + shareUrl)
                    })
                }}
                className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
                title="產生分享連結"
              >
                <Eye size={14} />
              </button>

              {/* 複製行程 */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  handleOpenDuplicateDialog(itinerary)
                }}
                className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
                title="複製行程"
              >
                <Copy size={14} />
              </button>

              {/* 公司範例：永遠顯示取消範例按鈕 */}
              {isTemplate && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleSetTemplate(itinerary.id, false)
                  }}
                  className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                  title="取消公司範例"
                >
                  <Building2 size={14} />
                </button>
              )}

              {/* 非公司範例的結案相關操作 */}
              {!isTemplate && (
                isClosed ? (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleReopen(itinerary.id)
                    }}
                    className="p-1 text-blue-500/60 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="重新開啟"
                  >
                    <RotateCcw size={14} />
                  </button>
                ) : (
                  <>
                    {/* 設為公司範例 */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleSetTemplate(itinerary.id, true)
                      }}
                      className="p-1 text-morandi-secondary hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      title="設為公司範例"
                    >
                      <Building2 size={14} />
                    </button>

                    {/* 結案按鈕 */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleClose(itinerary.id)
                      }}
                      className="p-1 text-morandi-secondary hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="結案"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  </>
                )
              )}

              {/* 封存操作 */}
              {isArchived ? (
                <>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleUnarchive(itinerary.id)
                    }}
                    className="p-1 text-morandi-green/60 hover:text-morandi-green hover:bg-morandi-green/10 rounded transition-colors"
                    title="取消封存"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(itinerary.id)
                    }}
                    className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
                    title="永久刪除"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleArchive(itinerary.id)
                  }}
                  className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
                  title="封存"
                >
                  <Archive size={14} />
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [handleDelete, handleOpenDuplicateDialog, handleArchive, handleUnarchive, handleSetTemplate, handleClose, handleReopen, isItineraryClosed, getEmployeeName, getCountryName, getCityName, getLinkedTourCode]
  )

  // 過濾資料
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries

    // 狀態篩選（移除封存分頁，改用新的五種分頁）
    switch (statusFilter) {
      case '提案':
        // 提案：未綁定、未結案、未封存
        filtered = filtered.filter(
          item => item.status === '提案' && !isItineraryClosed(item) && !item.archived_at && !item.is_template
        )
        break
      case '進行中':
        // 進行中：已綁定旅遊團、未結案、未封存、非公司範例
        filtered = filtered.filter(
          item => item.status === '進行中' && !isItineraryClosed(item) && !item.archived_at && !item.is_template
        )
        break
      case '公司範例':
        // 公司範例：is_template = true、未封存
        filtered = filtered.filter(item => item.is_template && !item.archived_at)
        break
      case '結案':
        // 結案：手動結案或日期過期、未封存
        filtered = filtered.filter(item => isItineraryClosed(item) && !item.archived_at)
        break
      default:
        // 全部：排除封存的和公司範例
        filtered = filtered.filter(item => !item.archived_at && !item.is_template)
    }

    // 作者篩選
    const effectiveAuthorFilter = authorFilter === '__mine__' ? user?.id : authorFilter
    if (effectiveAuthorFilter && effectiveAuthorFilter !== 'all') {
      filtered = filtered.filter(item => item.created_by === effectiveAuthorFilter)
    }

    // 超級管理員：分公司篩選
    if (isSuperAdmin) {
      const workspaceFilter = typeof window !== 'undefined' ? localStorage.getItem('itinerary_workspace_filter') : null
      if (workspaceFilter && workspaceFilter !== 'all') {
        filtered = filtered.filter(item => (item as Itinerary & { workspace_id?: string }).workspace_id === workspaceFilter)
      }
    }

    // 搜尋 - 搜尋所有文字欄位（移除 HTML 標籤後再搜尋）
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        item =>
          stripHtml(item.title).toLowerCase().includes(searchLower) ||
          item.country.toLowerCase().includes(searchLower) ||
          item.city.toLowerCase().includes(searchLower) ||
          item.tour_code?.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          stripHtml(item.description).toLowerCase().includes(searchLower)
      )
    }

    // 排序：已綁定團的行程表排在最後面
    filtered = filtered.sort((a, b) => {
      const aLinked = !!a.tour_id
      const bLinked = !!b.tour_id
      if (aLinked && !bLinked) return 1  // a 已綁定，排後面
      if (!aLinked && bLinked) return -1 // b 已綁定，排後面
      return 0 // 維持原順序
    })

    return filtered
  }, [itineraries, statusFilter, searchTerm, isItineraryClosed, authorFilter, user?.id, isSuperAdmin])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="行程管理"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋行程..."
        onAdd={handleOpenTypeSelect}
        addLabel="新增行程"
      >
        {/* 狀態篩選 + 作者篩選 */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {statusFilters.map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === filter
                    ? 'bg-morandi-gold text-white'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* 作者篩選 */}
          <div className="flex items-center gap-2">
            <Select value={authorFilter} onValueChange={setAuthorFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-sm">
                <SelectValue placeholder="我的行程" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__mine__">我的行程</SelectItem>
                <SelectItem value="all">全部作者</SelectItem>
                {employees
                  .filter(emp =>
                    // 排除當前使用者（已有「我的行程」選項）
                    emp.id !== user?.id &&
                    // 只顯示有建立過行程的員工
                    itineraries.some(it => it.created_by === emp.id)
                  )
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.display_name || emp.chinese_name || emp.english_name || emp.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* 超級管理員專用：分公司篩選 */}
          {isSuperAdmin && workspaces.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-morandi-blue" />
              <Select
                value={localStorage.getItem('itinerary_workspace_filter') || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    localStorage.removeItem('itinerary_workspace_filter')
                  } else {
                    localStorage.setItem('itinerary_workspace_filter', value)
                  }
                  // 重新整理頁面以套用篩選
                  window.location.reload()
                }}
              >
                <SelectTrigger className="w-auto min-w-[100px] h-8 text-sm border-morandi-blue/30">
                  <SelectValue placeholder="全部分公司" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分公司</SelectItem>
                  {workspaces.map((ws: { id: string; name: string }) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ResponsiveHeader>

      {/* 新增行程對話框 */}
      <Dialog open={isTypeSelectOpen} onOpenChange={setIsTypeSelectOpen}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-hidden p-0">
          <div className="flex h-full">
            {/* 左側：基本資訊 */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-morandi-gold" />
                  新增行程表
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* 行程名稱 */}
                <div className="space-y-2">
                  <Label htmlFor="newItineraryTitle">行程名稱 *</Label>
                  <Input
                    id="newItineraryTitle"
                    placeholder="例：沖繩五日遊"
                    value={newItineraryTitle}
                    onChange={e => setNewItineraryTitle(e.target.value)}
                  />
                </div>

                {/* 行程編號 */}
                <div className="space-y-2">
                  <Label htmlFor="newItineraryTourCode">行程編號（選填）</Label>
                  <Input
                    id="newItineraryTourCode"
                    placeholder="例：25JOK21CIG"
                    value={newItineraryTourCode}
                    onChange={e => setNewItineraryTourCode(e.target.value)}
                  />
                </div>

                {/* 國家 + 城市 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>國家</Label>
                    <Select
                      value={newItineraryCountry}
                      onValueChange={(value) => {
                        setNewItineraryCountry(value)
                        setNewItineraryCity('') // 切換國家時清空城市
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇國家" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>城市</Label>
                    <Select
                      value={newItineraryCity}
                      onValueChange={setNewItineraryCity}
                      disabled={!newItineraryCountry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇城市" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities
                          .filter(city => city.country_id === newItineraryCountry)
                          .map(city => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 出發日期 + 天數 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>出發日期 *</Label>
                    <DatePicker
                      value={newItineraryDepartureDate}
                      onChange={date => setNewItineraryDepartureDate(date)}
                      placeholder="選擇出發日期"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>行程天數 *</Label>
                    <Select
                      value={newItineraryDays}
                      onValueChange={setNewItineraryDays}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇天數" />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6, 7, 8, 9, 10].map(day => (
                          <SelectItem key={day} value={String(day)}>
                            {day} 天
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 航班資訊 */}
                <div className="pt-4 mt-4 relative">
                  <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-morandi-muted/40 to-transparent" />
                  <Label className="text-morandi-secondary mb-3 block">航班資訊（選填）</Label>
                  <div className="space-y-3">
                    {/* 去程航班 */}
                    <div className="p-2 rounded-lg border border-morandi-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">去程</span>
                          {newItineraryOutboundFlight?.departureDate && (
                            <span className="text-xs text-morandi-gold font-medium">({newItineraryOutboundFlight.departureDate})</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSearchOutboundFlight}
                          disabled={loadingOutboundFlight || !newItineraryOutboundFlight?.flightNumber}
                          className="h-5 text-[10px] gap-1 px-2"
                        >
                          {loadingOutboundFlight ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                          查詢
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        <Input placeholder="航班" value={newItineraryOutboundFlight?.flightNumber || ''} onChange={e => setNewItineraryOutboundFlight(prev => ({ ...prev, flightNumber: e.target.value, airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="航空" value={newItineraryOutboundFlight?.airline || ''} onChange={e => setNewItineraryOutboundFlight(prev => ({ ...prev, airline: e.target.value, flightNumber: prev?.flightNumber || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="出發" value={newItineraryOutboundFlight?.departureAirport || ''} onChange={e => setNewItineraryOutboundFlight(prev => ({ ...prev, departureAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="抵達" value={newItineraryOutboundFlight?.arrivalAirport || ''} onChange={e => setNewItineraryOutboundFlight(prev => ({ ...prev, arrivalAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="起飛" value={newItineraryOutboundFlight?.departureTime || ''} onChange={e => setNewItineraryOutboundFlight(prev => ({ ...prev, departureTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="降落" value={newItineraryOutboundFlight?.arrivalTime || ''} onChange={e => setNewItineraryOutboundFlight(prev => ({ ...prev, arrivalTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                      </div>
                    </div>

                    {/* 回程航班 */}
                    <div className="p-2 rounded-lg border border-morandi-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">回程</span>
                          {newItineraryReturnFlight?.departureDate && (
                            <span className="text-xs text-morandi-gold font-medium">({newItineraryReturnFlight.departureDate})</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSearchReturnFlight}
                          disabled={loadingReturnFlight || !newItineraryReturnFlight?.flightNumber}
                          className="h-5 text-[10px] gap-1 px-2"
                        >
                          {loadingReturnFlight ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                          查詢
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        <Input placeholder="航班" value={newItineraryReturnFlight?.flightNumber || ''} onChange={e => setNewItineraryReturnFlight(prev => ({ ...prev, flightNumber: e.target.value, airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="航空" value={newItineraryReturnFlight?.airline || ''} onChange={e => setNewItineraryReturnFlight(prev => ({ ...prev, airline: e.target.value, flightNumber: prev?.flightNumber || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="出發" value={newItineraryReturnFlight?.departureAirport || ''} onChange={e => setNewItineraryReturnFlight(prev => ({ ...prev, departureAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="抵達" value={newItineraryReturnFlight?.arrivalAirport || ''} onChange={e => setNewItineraryReturnFlight(prev => ({ ...prev, arrivalAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="起飛" value={newItineraryReturnFlight?.departureTime || ''} onChange={e => setNewItineraryReturnFlight(prev => ({ ...prev, departureTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="降落" value={newItineraryReturnFlight?.arrivalTime || ''} onChange={e => setNewItineraryReturnFlight(prev => ({ ...prev, arrivalTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 按鈕 */}
                <div className="flex justify-end gap-2 pt-4 mt-2 relative">
                  <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-morandi-muted/40 to-transparent" />
                  <Button
                    variant="outline"
                    onClick={() => setIsTypeSelectOpen(false)}
                    disabled={isCreatingItinerary}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateItinerary}
                    disabled={isCreatingItinerary || !newItineraryTitle.trim() || !newItineraryDepartureDate || !newItineraryDays}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
                  >
                    {isCreatingItinerary ? (
                      <>建立中...</>
                    ) : (
                      <>
                        <Plane size={14} />
                        建立行程
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 中間分隔線 - 文青風格 */}
            <div className="flex items-center py-8">
              <div className="w-px h-full bg-gradient-to-b from-transparent via-morandi-muted/40 to-transparent" />
            </div>

            {/* 右側：每日行程預覽 */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <h3 className="text-sm font-bold text-morandi-primary mb-4">每日行程</h3>
              {newItineraryDays ? (
                <div className="space-y-3">
                  {Array.from({ length: parseInt(newItineraryDays) }, (_, i) => {
                    const dayNum = i + 1
                    const isFirst = dayNum === 1
                    const isLast = dayNum === parseInt(newItineraryDays)
                    // 計算日期
                    let dateLabel = ''
                    if (newItineraryDepartureDate) {
                      const date = new Date(newItineraryDepartureDate)
                      date.setDate(date.getDate() + i)
                      dateLabel = `${date.getMonth() + 1}/${date.getDate()}`
                    }
                    return (
                      <div key={dayNum} className="p-3 rounded-lg border border-morandi-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-morandi-gold text-white text-xs font-bold px-2 py-0.5 rounded">
                            Day {dayNum}
                          </span>
                          {dateLabel && <span className="text-xs text-slate-500">({dateLabel})</span>}
                        </div>
                        <Input
                          placeholder={isFirst ? '抵達目的地' : isLast ? '返回台灣' : '每日標題'}
                          className="h-8 text-sm mb-2"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder={isFirst ? '溫暖的家' : '早餐'}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="午餐"
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="晚餐"
                            className="h-8 text-xs"
                          />
                        </div>
                        {!isLast && (
                          <Input
                            placeholder="住宿飯店"
                            className="h-8 text-xs mt-2"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  請先選擇行程天數
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密碼解鎖對話框 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>編輯進行中行程</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-morandi-secondary mb-4">
              此行程已綁定旅遊團，為避免誤觸修改，請輸入公司密碼以解鎖編輯。
            </p>
            <Input
              type="password"
              placeholder="請輸入公司密碼"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handlePasswordSubmit}>
              確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 複製行程對話框 */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>複製行程</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-morandi-secondary">
              正在複製：<span className="font-medium text-morandi-primary">{stripHtml(duplicateSource?.title)}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="duplicateTourCode">行程編號 *</Label>
              <Input
                id="duplicateTourCode"
                placeholder="請輸入新的行程編號"
                value={duplicateTourCode}
                onChange={e => setDuplicateTourCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateTitle">行程名稱 *</Label>
              <Input
                id="duplicateTitle"
                placeholder="請輸入新的行程名稱"
                value={duplicateTitle}
                onChange={e => setDuplicateTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && duplicateTourCode.trim() && duplicateTitle.trim()) {
                    handleDuplicateSubmit()
                  }
                }}
              />
            </div>
            <p className="text-xs text-morandi-muted">
              封面、行程內容、圖片等將會完整複製。<br />
              關聯的報價單也會一併複製（客戶資料會清空，價格保留）。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDuplicateDialogOpen(false)}
              disabled={isDuplicating}
            >
              取消
            </Button>
            <Button
              onClick={handleDuplicateSubmit}
              disabled={isDuplicating || !duplicateTourCode.trim() || !duplicateTitle.trim()}
            >
              {isDuplicating ? '複製中...' : '確認複製'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns as TableColumn[]}
            data={filteredItineraries}
            onRowClick={(itinerary) => handleRowClick(itinerary as Itinerary)}
            rowClassName={(row) => {
              const itinerary = row as Itinerary
              if (itinerary.tour_id) {
                return 'bg-morandi-blue/5 hover:bg-morandi-blue/10'
              }
              return ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
