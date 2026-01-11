/**
 * TourControlFormDialog - 團控表對話框
 *
 * 從行程表讀取資料，產生團控表預覽並可列印
 * 版面配置參考原始 Word 團控表格式
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DIALOG_SIZES,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Printer, X, Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/components/ui/use-toast'
import { openTourControlForm } from './TourControlFormGenerator'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'
import type {
  TourControlFormData,
  TourControlHotel,
  TourControlMeal,
  TourControlBusCompany,
  TourControlFlight,
  TourControlAttraction,
} from '@/types/tour-control-form.types'

interface TourControlFormDialogProps {
  isOpen: boolean
  onClose: () => void
  pkg: ProposalPackage | null
  proposal: Proposal | null
}

// 行程表資料類型
interface ItineraryData {
  departure_date: string | null
  daily_itinerary: Array<{
    date: string
    accommodation?: string
    meals?: {
      breakfast?: string
      lunch?: string
      dinner?: string
    }
  }> | null
  outbound_flight: TourControlFlight | null
  return_flight: TourControlFlight | null
}

export function TourControlFormDialog({
  isOpen,
  onClose,
  pkg,
  proposal,
}: TourControlFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingFormId, setExistingFormId] = useState<string | null>(null)

  // 表單資料
  const [formData, setFormData] = useState<TourControlFormData>({
    date: '',
    tourCode: '',
    tourName: '',
    pax: { total: 0 },
    busCompanies: [{ name: '', contact: '', confirmTime: '' }],
    hotels: [],
    attractions: [],
    meals: [],
  })

  // 從行程表載入資料
  useEffect(() => {
    if (!isOpen || !pkg) return

    const loadData = async () => {
      setLoading(true)
      setExistingFormId(null)

      try {
        // 先檢查是否已有儲存的團控表資料
        const { data: savedForm } = await supabase
          .from('tour_control_forms')
          .select('id, form_data')
          .eq('package_id', pkg.id)
          .single()

        if (savedForm && savedForm.form_data) {
          // 使用已儲存的資料
          setExistingFormId(savedForm.id)
          setFormData(savedForm.form_data as unknown as TourControlFormData)
          setLoading(false)
          return
        }

        // 沒有儲存的資料，從行程表載入
        if (pkg.itinerary_id) {
          const { data: itinerary } = await supabase
            .from('itineraries')
            .select('departure_date, daily_itinerary, outbound_flight, return_flight')
            .eq('id', pkg.itinerary_id)
            .single()

          if (itinerary) {
            const itineraryData = itinerary as unknown as ItineraryData
            const dailyItinerary = itineraryData.daily_itinerary || []

            // 產生飯店列表（從每日住宿）
            const hotels: TourControlHotel[] = dailyItinerary
              .filter((day) => day.accommodation && day.accommodation !== '自理' && day.accommodation !== '-')
              .map((day) => ({
                date: day.date,
                hotelName: day.accommodation || '',
                phone: '',
                contact: '',
                confirmTime: '',
                remarks: '',
              }))

            // 產生餐食列表
            const meals: TourControlMeal[] = dailyItinerary
              .filter((day) => day.meals && (day.meals.lunch || day.meals.dinner))
              .map((day) => ({
                date: day.date,
                lunch: day.meals?.lunch && day.meals.lunch !== '自理' ? day.meals.lunch : '',
                dinner: day.meals?.dinner && day.meals.dinner !== '自理' ? day.meals.dinner : '',
              }))
              .filter((meal) => meal.lunch || meal.dinner)

            setFormData({
              date: itineraryData.departure_date || pkg.start_date || '',
              tourCode: proposal?.code || '',
              tourName: proposal?.title || '',
              bidContact: { name: '', phone: '' },
              itineraryContact: { name: '', phone: '' },
              pax: {
                total: pkg.group_size || proposal?.group_size || 0,
                business: 0,
                leader: 0,
                nurse: 0,
                tourLeader: 0,
              },
              outboundFlight: itineraryData.outbound_flight || undefined,
              returnFlight: itineraryData.return_flight || undefined,
              busCompanies: [{ name: '', contact: '', confirmTime: '' }],
              hotels,
              meals,
            })
          }
        } else if (pkg.itinerary_type === 'timeline' && pkg.timeline_data) {
          // 從時間軸行程表載入資料
          const timelineData = pkg.timeline_data as {
            title?: string
            days?: Array<{
              date: string
              title?: string
              meals?: {
                lunch?: boolean
                dinner?: boolean
                lunchMenu?: string
                dinnerMenu?: string
              }
              attractions?: Array<{
                name: string
                mealType?: string
                menu?: string
              }>
            }>
            startDate?: string
          }

          const timelineDays = timelineData.days || []

          // 從時間軸資料產生餐食列表
          const meals: TourControlMeal[] = timelineDays
            .filter((day) => day.meals && (day.meals.lunch || day.meals.dinner))
            .map((day) => ({
              date: day.date,
              lunch: day.meals?.lunch ? (day.meals.lunchMenu || '含午餐') : '',
              dinner: day.meals?.dinner ? (day.meals.dinnerMenu || '含晚餐') : '',
              dailyItinerary: day.title || '',
            }))
            .filter((meal) => meal.lunch || meal.dinner)

          setFormData({
            date: timelineData.startDate || pkg.start_date || '',
            tourCode: proposal?.code || '',
            tourName: timelineData.title || proposal?.title || '',
            bidContact: { name: '', phone: '' },
            itineraryContact: { name: '', phone: '' },
            pax: {
              total: pkg.group_size || proposal?.group_size || 0,
              business: 0,
              leader: 0,
              nurse: 0,
              tourLeader: 0,
            },
            busCompanies: [{ name: '', contact: '', confirmTime: '' }],
            hotels: [],
            meals,
          })
        } else {
          // 沒有行程表，使用預設值
          setFormData({
            date: pkg.start_date || '',
            tourCode: proposal?.code || '',
            tourName: proposal?.title || '',
            pax: {
              total: pkg.group_size || proposal?.group_size || 0,
            },
            busCompanies: [{ name: '', contact: '', confirmTime: '' }],
            hotels: [],
            meals: [],
          })
        }
      } catch (error) {
        logger.error('載入團控表資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, pkg, proposal])

  // 儲存團控表資料
  const handleSave = useCallback(async () => {
    if (!pkg) return

    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsonFormData = JSON.parse(JSON.stringify(formData)) as any

      if (existingFormId) {
        // 更新現有記錄
        const { error } = await supabase
          .from('tour_control_forms')
          .update({
            form_data: jsonFormData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFormId)

        if (error) throw error
      } else {
        // 新增記錄
        const { data, error } = await supabase
          .from('tour_control_forms')
          .insert({
            package_id: pkg.id,
            workspace_id: proposal?.workspace_id || '',
            form_data: jsonFormData,
          })
          .select('id')
          .single()

        if (error) throw error
        if (data) setExistingFormId(data.id)
      }

      toast({
        title: '儲存成功',
        description: '團控表資料已儲存',
      })
    } catch (error) {
      logger.error('儲存團控表失敗:', error)
      toast({
        title: '儲存失敗',
        description: error instanceof Error ? error.message : '無法儲存團控表資料',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [pkg, proposal, formData, existingFormId, toast])

  // 更新遊覽車公司
  const updateBusCompany = useCallback((index: number, field: keyof TourControlBusCompany, value: string) => {
    setFormData((prev) => {
      const busCompanies = [...(prev.busCompanies || [])]
      busCompanies[index] = { ...busCompanies[index], [field]: value }
      return { ...prev, busCompanies }
    })
  }, [])

  // 新增遊覽車公司
  const addBusCompany = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      busCompanies: [...(prev.busCompanies || []), { name: '', contact: '', confirmTime: '' }],
    }))
  }, [])

  // 移除遊覽車公司
  const removeBusCompany = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      busCompanies: (prev.busCompanies || []).filter((_, i) => i !== index),
    }))
  }, [])

  // 更新飯店資料
  const updateHotel = useCallback((index: number, field: keyof TourControlHotel, value: string) => {
    setFormData((prev) => {
      const hotels = [...(prev.hotels || [])]
      hotels[index] = { ...hotels[index], [field]: value }
      return { ...prev, hotels }
    })
  }, [])

  // 新增飯店
  const addHotel = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      hotels: [...(prev.hotels || []), { date: '', hotelName: '', phone: '', contact: '', confirmTime: '' }],
    }))
  }, [])

  // 移除飯店
  const removeHotel = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      hotels: (prev.hotels || []).filter((_, i) => i !== index),
    }))
  }, [])

  // 更新景點門票資料
  const updateAttraction = useCallback((index: number, field: keyof TourControlAttraction, value: string) => {
    setFormData((prev) => {
      const attractions = [...(prev.attractions || [])]
      attractions[index] = { ...attractions[index], [field]: value }
      return { ...prev, attractions }
    })
  }, [])

  // 新增景點門票
  const addAttraction = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      attractions: [...(prev.attractions || []), { date: '', name: '' }],
    }))
  }, [])

  // 移除景點門票
  const removeAttraction = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      attractions: (prev.attractions || []).filter((_, i) => i !== index),
    }))
  }, [])

  // 更新餐食資料
  const updateMeal = useCallback((index: number, field: keyof TourControlMeal, value: string) => {
    setFormData((prev) => {
      const meals = [...(prev.meals || [])]
      meals[index] = { ...meals[index], [field]: value }
      return { ...prev, meals }
    })
  }, [])

  // 新增餐食
  const addMeal = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      meals: [...(prev.meals || []), { date: '', lunch: '', dinner: '' }],
    }))
  }, [])

  // 移除餐食
  const removeMeal = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      meals: (prev.meals || []).filter((_, i) => i !== index),
    }))
  }, [])

  // 列印團控表
  const handlePrint = useCallback(() => {
    try {
      openTourControlForm(formData)
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : '無法開啟列印視窗',
        variant: 'destructive',
      })
    }
  }, [formData, toast])

  if (!pkg) return null

  // 樣式類
  const labelClass = "border border-black bg-morandi-container px-2 py-1.5 font-medium text-center text-sm whitespace-nowrap"
  const valueClass = "border border-black px-1 py-0.5 bg-card"
  const headerClass = "border border-black bg-background px-2 py-1.5 text-center font-medium text-sm"
  const inputClass = "h-7 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-sm"
  const sectionLabelClass = "border border-black bg-morandi-container px-2 py-1.5 font-bold text-center text-sm align-middle whitespace-nowrap"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={DIALOG_SIZES.full} nested>
        {/* 標題區 */}
        <div className="text-center pb-3 border-b-2 border-black mb-3">
          <h2 className="text-lg font-bold tracking-widest">勁揚國際／原昇旅行社有限公司</h2>
          <h3 className="text-base font-bold mt-1 tracking-[0.5em]">團 控 表</h3>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="animate-spin text-morandi-gold" size={24} />
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto space-y-2">
            {/* 第一區：日期/團號/車條名稱 + 確定/尾款 */}
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '27%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '27%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '6%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className={labelClass}>日期</td>
                  <td className={valueClass}>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))} className={inputClass} />
                  </td>
                  <td className={labelClass}>車條名稱</td>
                  <td className={valueClass}>
                    <Input value={formData.tourName || ''} onChange={(e) => setFormData((prev) => ({ ...prev, tourName: e.target.value }))} className={inputClass} placeholder="車條/團名" />
                  </td>
                  <td className={labelClass}>確定</td>
                  <td className={valueClass}>
                    <Input value={formData.confirmed || ''} onChange={(e) => setFormData((prev) => ({ ...prev, confirmed: e.target.value }))} className={inputClass} />
                  </td>
                  <td className={labelClass} rowSpan={2}>尾款</td>
                  <td className={valueClass} rowSpan={2}>
                    <Input value={formData.balance || ''} onChange={(e) => setFormData((prev) => ({ ...prev, balance: e.target.value }))} className={inputClass} />
                  </td>
                </tr>
                <tr>
                  <td className={labelClass}>團號</td>
                  <td className={valueClass} colSpan={3}>
                    <Input value={formData.tourCode} onChange={(e) => setFormData((prev) => ({ ...prev, tourCode: e.target.value }))} className={inputClass} placeholder="團號" />
                  </td>
                  <td className={labelClass}>訂金</td>
                  <td className={valueClass}>
                    <Input value={formData.deposit || ''} onChange={(e) => setFormData((prev) => ({ ...prev, deposit: e.target.value }))} className={inputClass} />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 第二區：計劃窗口 + 聯絡人 */}
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '27%' }} />
                <col style={{ width: '65%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className={labelClass} rowSpan={2}>計劃窗口</td>
                  <td className={valueClass}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-morandi-secondary shrink-0">名稱:</span>
                      <Input value={formData.planningContact?.name || ''} onChange={(e) => setFormData((prev) => ({ ...prev, planningContact: { ...prev.planningContact, name: e.target.value } }))} className={inputClass + " flex-1"} placeholder="名稱" />
                    </div>
                  </td>
                  <td className={valueClass}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-morandi-secondary shrink-0">地址:</span>
                      <Input value={formData.planningContact?.address || ''} onChange={(e) => setFormData((prev) => ({ ...prev, planningContact: { ...prev.planningContact, address: e.target.value } }))} className={inputClass + " flex-1"} placeholder="地址" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={valueClass}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-morandi-secondary shrink-0">標案聯絡人:</span>
                      <Input value={formData.bidContact?.name || ''} onChange={(e) => setFormData((prev) => ({ ...prev, bidContact: { ...prev.bidContact, name: e.target.value } }))} className={inputClass + " flex-1"} placeholder="姓名" />
                    </div>
                  </td>
                  <td className={valueClass}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-morandi-secondary shrink-0">行程聯絡人:</span>
                      <Input value={formData.itineraryContact?.name || ''} onChange={(e) => setFormData((prev) => ({ ...prev, itineraryContact: { ...prev.itineraryContact, name: e.target.value } }))} className={inputClass + " flex-1"} placeholder="姓名" />
                      <Input value={formData.itineraryContact?.phone || ''} onChange={(e) => setFormData((prev) => ({ ...prev, itineraryContact: { ...prev.itineraryContact, name: prev.itineraryContact?.name || '', phone: e.target.value } }))} className={inputClass + " w-28"} placeholder="電話" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 第三區：人數配置 */}
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '92%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className={labelClass}>人數</td>
                  <td className={valueClass}>
                    <div className="flex items-center gap-2 text-sm flex-wrap py-0.5">
                      <span className="font-medium">每車領隊</span>
                      <div className="flex items-center gap-1">
                        <Input type="number" value={formData.pax?.perBus?.total ?? formData.pax?.total ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, perBus: { ...prev.pax?.perBus, total: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-12 border border-border bg-card text-center rounded text-sm" />
                        <span className="text-morandi-secondary text-xs">人 =</span>
                      </div>
                      <div className="flex items-center gap-0.5"><span className="text-morandi-secondary text-xs">公司業務:</span><Input type="number" value={formData.pax?.perBus?.business ?? formData.pax?.business ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, perBus: { ...prev.pax?.perBus, business: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-10 border border-border bg-card text-center rounded text-sm" /></div>
                      <div className="flex items-center gap-0.5"><span className="text-morandi-secondary text-xs">總領:</span><Input type="number" value={formData.pax?.perBus?.leader ?? formData.pax?.leader ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, perBus: { ...prev.pax?.perBus, leader: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-10 border border-border bg-card text-center rounded text-sm" /></div>
                      <div className="flex items-center gap-0.5"><span className="text-morandi-secondary text-xs">護士:</span><Input type="number" value={formData.pax?.perBus?.nurse ?? formData.pax?.nurse ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, perBus: { ...prev.pax?.perBus, nurse: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-10 border border-border bg-card text-center rounded text-sm" /></div>
                      <div className="flex items-center gap-0.5"><span className="text-morandi-secondary text-xs">領隊:</span><Input type="number" value={formData.pax?.perBus?.tourLeader ?? formData.pax?.tourLeader ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, perBus: { ...prev.pax?.perBus, tourLeader: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-10 border border-border bg-card text-center rounded text-sm" /></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelClass}>領隊</td>
                  <td className={valueClass}>
                    <div className="flex items-center gap-2 text-sm flex-wrap py-0.5">
                      <span className="font-medium">公司領團:</span>
                      <div className="flex items-center gap-0.5"><span className="text-morandi-secondary text-xs">總領:</span><Input type="number" value={formData.pax?.company?.leader ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, company: { ...prev.pax?.company, leader: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-10 border border-border bg-card text-center rounded text-sm" /></div>
                      <div className="flex items-center gap-0.5"><span className="text-morandi-secondary text-xs">護士:</span><Input type="number" value={formData.pax?.company?.nurse ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, company: { ...prev.pax?.company, nurse: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-10 border border-border bg-card text-center rounded text-sm" /></div>
                      <div className="flex items-center gap-0.5"><span className="text-morandi-secondary text-xs">領隊:</span><Input type="number" value={formData.pax?.company?.tourLeader ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, pax: { ...prev.pax, total: prev.pax?.total || 0, company: { ...prev.pax?.company, tourLeader: e.target.value ? parseInt(e.target.value) : undefined } } }))} className="h-6 w-10 border border-border bg-card text-center rounded text-sm" /></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 第四區：車輛（遊覽車+航班） */}
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '27%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '5%' }} />
              </colgroup>
              <tbody>
                {/* 遊覽車 */}
                {(formData.busCompanies || []).map((bus, index) => (
                  <tr key={`bus-${index}`}>
                    {index === 0 && (
                      <td className={sectionLabelClass} rowSpan={(formData.busCompanies?.length || 1) + 2}>車輛</td>
                    )}
                    <td className={valueClass} colSpan={2}>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-morandi-secondary shrink-0">遊覽車{index + 1}:</span>
                        <Input value={bus.name} onChange={(e) => updateBusCompany(index, 'name', e.target.value)} className={inputClass + " flex-1"} placeholder="車行名稱" />
                      </div>
                    </td>
                    <td className={valueClass}>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-morandi-secondary shrink-0">聯絡人:</span>
                        <Input value={bus.contact || ''} onChange={(e) => updateBusCompany(index, 'contact', e.target.value)} className={inputClass + " flex-1"} />
                      </div>
                    </td>
                    <td className={valueClass}>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-morandi-secondary shrink-0">確認時間:</span>
                        <Input value={bus.confirmTime || ''} onChange={(e) => updateBusCompany(index, 'confirmTime', e.target.value)} className={inputClass + " flex-1"} />
                      </div>
                    </td>
                    <td className={valueClass}>
                      <Button variant="ghost" size="sm" onClick={addBusCompany} className="h-6 text-xs gap-1 text-morandi-gold hover:text-morandi-gold-hover">
                        <Plus size={12} />新增
                      </Button>
                    </td>
                    <td className="border border-black text-center bg-card">
                      {(formData.busCompanies || []).length > 1 && (
                        <button onClick={() => removeBusCompany(index)} className="text-red-400 hover:text-red-600 p-0.5">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {/* 航班 */}
                <tr>
                  <td className={valueClass} colSpan={6}>
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="text-xs text-morandi-secondary shrink-0">航班:</span>
                      <span className="text-xs shrink-0">去</span>
                      <Input value={formData.outboundFlight?.flightNumber || ''} onChange={(e) => setFormData((prev) => ({ ...prev, outboundFlight: { ...prev.outboundFlight, flightNumber: e.target.value } }))} className={inputClass + " w-16"} placeholder="航班" />
                      <span className="text-xs">/</span>
                      <Input value={formData.outboundFlight?.departureTime || ''} onChange={(e) => setFormData((prev) => ({ ...prev, outboundFlight: { ...prev.outboundFlight, departureTime: e.target.value } }))} className={inputClass + " w-14"} placeholder="起飛" />
                      <span className="text-xs">=</span>
                      <span className="text-xs">抵</span>
                      <Input value={formData.outboundFlight?.arrivalTime || ''} onChange={(e) => setFormData((prev) => ({ ...prev, outboundFlight: { ...prev.outboundFlight, arrivalTime: e.target.value } }))} className={inputClass + " w-14"} placeholder="抵達" />
                      <span className="text-xs">:</span>
                      <Input value={formData.outboundFlight?.departure || ''} onChange={(e) => setFormData((prev) => ({ ...prev, outboundFlight: { ...prev.outboundFlight, departure: e.target.value } }))} className={inputClass + " w-20"} placeholder="出發地" />
                      <span className="text-morandi-muted">/</span>
                      <Input value={formData.outboundFlight?.arrival || ''} onChange={(e) => setFormData((prev) => ({ ...prev, outboundFlight: { ...prev.outboundFlight, arrival: e.target.value } }))} className={inputClass + " w-20"} placeholder="目的地" />
                      <span className="text-morandi-muted mx-1">|</span>
                      <span className="text-xs shrink-0">回</span>
                      <Input value={formData.returnFlight?.flightNumber || ''} onChange={(e) => setFormData((prev) => ({ ...prev, returnFlight: { ...prev.returnFlight, flightNumber: e.target.value } }))} className={inputClass + " w-16"} placeholder="航班" />
                      <span className="text-xs">/</span>
                      <Input value={formData.returnFlight?.departureTime || ''} onChange={(e) => setFormData((prev) => ({ ...prev, returnFlight: { ...prev.returnFlight, departureTime: e.target.value } }))} className={inputClass + " w-14"} placeholder="起飛" />
                      <span className="text-xs">=</span>
                      <span className="text-xs">抵</span>
                      <Input value={formData.returnFlight?.arrivalTime || ''} onChange={(e) => setFormData((prev) => ({ ...prev, returnFlight: { ...prev.returnFlight, arrivalTime: e.target.value } }))} className={inputClass + " w-14"} placeholder="抵達" />
                    </div>
                  </td>
                </tr>
                {/* 外團遊覽車聯繫 */}
                <tr>
                  <td className={valueClass} colSpan={2}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-morandi-secondary shrink-0">外團:</span>
                      <Input value={formData.externalTour || ''} onChange={(e) => setFormData((prev) => ({ ...prev, externalTour: e.target.value }))} className={inputClass + " flex-1"} placeholder="外團資訊" />
                    </div>
                  </td>
                  <td className={valueClass} colSpan={4}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-morandi-secondary shrink-0">遊覽車聯繫:</span>
                      <Input value={formData.busContact || ''} onChange={(e) => setFormData((prev) => ({ ...prev, busContact: e.target.value }))} className={inputClass + " flex-1"} placeholder="聯繫資訊" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 第五區：飯店確認 */}
            <div className="flex items-center justify-between mt-2">
              <span className="font-medium text-sm">飯店確認</span>
              <Button variant="outline" size="sm" onClick={addHotel} className="h-6 text-xs gap-1">
                <Plus size={12} />新增飯店
              </Button>
            </div>
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '5%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className={headerClass}>日期</th>
                  <th className={headerClass}>名稱</th>
                  <th className={headerClass}>電話</th>
                  <th className={headerClass}>聯絡人</th>
                  <th className={headerClass}>確認時間</th>
                  <th className={headerClass}>訂金</th>
                  <th className={headerClass}>備註</th>
                  <th className={headerClass}></th>
                </tr>
              </thead>
              <tbody>
                {(formData.hotels || []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-black px-3 py-3 text-center text-morandi-muted text-sm">
                      尚無飯店資料，請點擊「新增飯店」
                    </td>
                  </tr>
                ) : (
                  (formData.hotels || []).map((hotel, index) => (
                    <tr key={index}>
                      <td className={valueClass}>
                        <Input type="date" value={hotel.date} onChange={(e) => updateHotel(index, 'date', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={hotel.hotelName} onChange={(e) => updateHotel(index, 'hotelName', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={hotel.phone || ''} onChange={(e) => updateHotel(index, 'phone', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={hotel.contact || ''} onChange={(e) => updateHotel(index, 'contact', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={hotel.confirmTime || ''} onChange={(e) => updateHotel(index, 'confirmTime', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={hotel.deposit || ''} onChange={(e) => updateHotel(index, 'deposit', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={hotel.remarks || ''} onChange={(e) => updateHotel(index, 'remarks', e.target.value)} className={inputClass} />
                      </td>
                      <td className="border border-black text-center bg-card">
                        <button onClick={() => removeHotel(index)} className="text-red-400 hover:text-red-600 p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 第六區：預約景點門票 */}
            <div className="flex items-center justify-between mt-2">
              <span className="font-medium text-sm">預約景點門票</span>
              <Button variant="outline" size="sm" onClick={addAttraction} className="h-6 text-xs gap-1">
                <Plus size={12} />新增景點
              </Button>
            </div>
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '5%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className={headerClass}>日期</th>
                  <th className={headerClass}>名稱</th>
                  <th className={headerClass}>電話</th>
                  <th className={headerClass}>聯絡人</th>
                  <th className={headerClass}>預約狀況</th>
                  <th className={headerClass}>價格</th>
                  <th className={headerClass}>備註</th>
                  <th className={headerClass}></th>
                </tr>
              </thead>
              <tbody>
                {(formData.attractions || []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-black px-3 py-3 text-center text-morandi-muted text-sm">
                      尚無景點門票
                    </td>
                  </tr>
                ) : (
                  (formData.attractions || []).map((attraction, index) => (
                    <tr key={index}>
                      <td className={valueClass}>
                        <Input value={attraction.date} onChange={(e) => updateAttraction(index, 'date', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={attraction.name} onChange={(e) => updateAttraction(index, 'name', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={attraction.phone || ''} onChange={(e) => updateAttraction(index, 'phone', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={attraction.contact || ''} onChange={(e) => updateAttraction(index, 'contact', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={attraction.status || ''} onChange={(e) => updateAttraction(index, 'status', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={attraction.price || ''} onChange={(e) => updateAttraction(index, 'price', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={attraction.remarks || ''} onChange={(e) => updateAttraction(index, 'remarks', e.target.value)} className={inputClass} />
                      </td>
                      <td className="border border-black text-center bg-card">
                        <button onClick={() => removeAttraction(index)} className="text-red-400 hover:text-red-600 p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 第七區：餐食 */}
            <div className="flex items-center justify-between mt-2">
              <span className="font-medium text-sm">餐食</span>
              <Button variant="outline" size="sm" onClick={addMeal} className="h-6 text-xs gap-1">
                <Plus size={12} />新增餐食
              </Button>
            </div>
            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '27%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '5%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className={headerClass}>日期</th>
                  <th className={headerClass}>本日行程</th>
                  <th className={headerClass}>午餐</th>
                  <th className={headerClass}>晚餐</th>
                  <th className={headerClass}></th>
                </tr>
              </thead>
              <tbody>
                {(formData.meals || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-black px-3 py-3 text-center text-morandi-muted text-sm">
                      尚無餐食資料
                    </td>
                  </tr>
                ) : (
                  (formData.meals || []).map((meal, index) => (
                    <tr key={index}>
                      <td className={valueClass}>
                        <Input type="date" value={meal.date} onChange={(e) => updateMeal(index, 'date', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={meal.dailyItinerary || ''} onChange={(e) => updateMeal(index, 'dailyItinerary', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={meal.lunch || ''} onChange={(e) => updateMeal(index, 'lunch', e.target.value)} className={inputClass} />
                      </td>
                      <td className={valueClass}>
                        <Input value={meal.dinner || ''} onChange={(e) => updateMeal(index, 'dinner', e.target.value)} className={inputClass} />
                      </td>
                      <td className="border border-black text-center bg-card">
                        <button onClick={() => removeMeal(index)} className="text-red-400 hover:text-red-600 p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 備註 */}
            <table className="w-full border-collapse text-sm mt-2">
              <tbody>
                <tr>
                  <td className={labelClass} style={{ width: '8%' }}>備註</td>
                  <td className={valueClass}>
                    <textarea
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                      className="w-full h-14 border-0 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-morandi-gold resize-none p-1 text-sm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose} className="gap-1.5 h-8 text-sm">
            <X size={14} />關閉
          </Button>
          <Button onClick={handleSave} disabled={loading || saving} variant="outline" className="gap-1.5 h-8 text-sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}儲存
          </Button>
          <Button onClick={handlePrint} disabled={loading} className="gap-1.5 h-8 text-sm bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            <Printer size={14} />列印團控表
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
