/**
 * TourControlFormDialog - 團控表對話框
 *
 * 從行程表讀取資料，產生團控表預覽並可列印
 */

'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
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
import { Loader2, Bus, Printer, X, Plus, Trash2, Save } from 'lucide-react'
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={DIALOG_SIZES.full} nested>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus size={18} className="text-morandi-gold" />
            團控表
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="animate-spin text-morandi-gold" size={24} />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {/* Excel 風格表格 */}
            <table className="w-full border-collapse text-sm">
              <tbody>
                {/* 基本資訊 */}
                <tr>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-24">日期</td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      type="date"
                      className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                    />
                  </td>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-24">團號</td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      value={formData.tourCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tourCode: e.target.value }))}
                      className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                    />
                  </td>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-24">車條名稱</td>
                  <td className="border border-border px-1 py-1" colSpan={3}>
                    <Input
                      value={formData.tourName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tourName: e.target.value }))}
                      className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                    />
                  </td>
                </tr>

                {/* 聯絡人 */}
                <tr>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">標案聯絡人</td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      value={formData.bidContact?.name || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bidContact: { ...prev.bidContact, name: e.target.value },
                        }))
                      }
                      className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                    />
                  </td>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">電話</td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      value={formData.bidContact?.phone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bidContact: { ...prev.bidContact, name: prev.bidContact?.name || '', phone: e.target.value },
                        }))
                      }
                      className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                    />
                  </td>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">行程聯絡人</td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      value={formData.itineraryContact?.name || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          itineraryContact: { ...prev.itineraryContact, name: e.target.value },
                        }))
                      }
                      className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                    />
                  </td>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">電話</td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      value={formData.itineraryContact?.phone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          itineraryContact: { ...prev.itineraryContact, name: prev.itineraryContact?.name || '', phone: e.target.value },
                        }))
                      }
                      className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                    />
                  </td>
                </tr>

                {/* 人數 - 每車領隊 */}
                <tr>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium" rowSpan={2}>人數</td>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">每車領隊</td>
                  <td className="border border-border px-1 py-1" colSpan={2}>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">人=</span>
                      <Input
                        type="number"
                        value={formData.pax?.perBus?.total ?? formData.pax?.total ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              perBus: { ...prev.pax?.perBus, total: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-14 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                  <td className="border border-border px-1 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">公司業務:</span>
                      <Input
                        type="number"
                        value={formData.pax?.perBus?.business ?? formData.pax?.business ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              perBus: { ...prev.pax?.perBus, business: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-12 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                  <td className="border border-border px-1 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">總領:</span>
                      <Input
                        type="number"
                        value={formData.pax?.perBus?.leader ?? formData.pax?.leader ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              perBus: { ...prev.pax?.perBus, leader: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-12 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                  <td className="border border-border px-1 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">護士:</span>
                      <Input
                        type="number"
                        value={formData.pax?.perBus?.nurse ?? formData.pax?.nurse ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              perBus: { ...prev.pax?.perBus, nurse: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-12 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                  <td className="border border-border px-1 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">領隊:</span>
                      <Input
                        type="number"
                        value={formData.pax?.perBus?.tourLeader ?? formData.pax?.tourLeader ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              perBus: { ...prev.pax?.perBus, tourLeader: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-12 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                </tr>
                {/* 人數 - 公司領團 */}
                <tr>
                  <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">公司領團</td>
                  <td className="border border-border px-1 py-1" colSpan={2}></td>
                  <td className="border border-border px-1 py-1"></td>
                  <td className="border border-border px-1 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">總領:</span>
                      <Input
                        type="number"
                        value={formData.pax?.company?.leader ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              company: { ...prev.pax?.company, leader: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-12 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                  <td className="border border-border px-1 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">護士:</span>
                      <Input
                        type="number"
                        value={formData.pax?.company?.nurse ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              company: { ...prev.pax?.company, nurse: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-12 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                  <td className="border border-border px-1 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-morandi-secondary whitespace-nowrap">領隊:</span>
                      <Input
                        type="number"
                        value={formData.pax?.company?.tourLeader ?? 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pax: {
                              ...prev.pax,
                              total: prev.pax?.total || 0,
                              company: { ...prev.pax?.company, tourLeader: parseInt(e.target.value) || 0 },
                            },
                          }))
                        }
                        className="h-8 w-12 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-center"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 交通 */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-morandi-primary">交通</span>
                <Button variant="outline" size="sm" onClick={addBusCompany} className="h-7 text-sm gap-1">
                  <Plus size={14} />
                  新增遊覽車
                </Button>
              </div>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {/* 遊覽車 */}
                  <tr>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-24" rowSpan={(formData.busCompanies || []).length + 1}>遊覽車</td>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">公司名稱</td>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-32">聯絡人</td>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-32">確認時間</td>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 w-10"></td>
                  </tr>
                  {(formData.busCompanies || []).map((bus, index) => (
                    <tr key={`bus-${index}`}>
                      <td className="border border-border px-1 py-1">
                        <Input
                          value={bus.name}
                          onChange={(e) => updateBusCompany(index, 'name', e.target.value)}
                          className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                        />
                      </td>
                      <td className="border border-border px-1 py-1">
                        <Input
                          value={bus.contact || ''}
                          onChange={(e) => updateBusCompany(index, 'contact', e.target.value)}
                          className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                        />
                      </td>
                      <td className="border border-border px-1 py-1">
                        <Input
                          value={bus.confirmTime || ''}
                          onChange={(e) => updateBusCompany(index, 'confirmTime', e.target.value)}
                          className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                        />
                      </td>
                      <td className="border border-border px-2 py-1 text-center">
                        {(formData.busCompanies || []).length > 1 && (
                          <button
                            onClick={() => removeBusCompany(index)}
                            className="text-morandi-red/60 hover:text-morandi-red p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* 火車 */}
                  <tr>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-24" rowSpan={2}>火車</td>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">去程</td>
                    <td className="border border-border px-1 py-1" colSpan={3}>
                      <Input
                        value={formData.train?.outbound || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            train: { ...prev.train, outbound: e.target.value },
                          }))
                        }
                        className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">回程</td>
                    <td className="border border-border px-1 py-1" colSpan={3}>
                      <Input
                        value={formData.train?.return || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            train: { ...prev.train, return: e.target.value },
                          }))
                        }
                        className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                      />
                    </td>
                  </tr>
                  {/* 交通船 */}
                  <tr>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium w-24" rowSpan={2}>交通船</td>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">去程</td>
                    <td className="border border-border px-1 py-1" colSpan={3}>
                      <Input
                        value={formData.ship?.outbound || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            ship: { ...prev.ship, outbound: e.target.value },
                          }))
                        }
                        className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border bg-morandi-container/50 px-3 py-2 font-medium">回程</td>
                    <td className="border border-border px-1 py-1" colSpan={3}>
                      <Input
                        value={formData.ship?.return || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            ship: { ...prev.ship, return: e.target.value },
                          }))
                        }
                        className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 飯店明細 */}
            {(formData.hotels || []).length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-morandi-primary">飯店確認明細</span>
                <table className="w-full border-collapse text-sm mt-2">
                  <thead>
                    <tr>
                      <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-20">日期</th>
                      <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium">飯店名稱</th>
                      <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-32">聯絡人</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.hotels || []).map((hotel, index) => (
                      <Fragment key={index}>
                        {/* 第一行：日期/名稱/聯絡人 */}
                        <tr>
                          <td className="border border-border px-3 py-1 text-morandi-secondary">
                            {hotel.date ? new Date(hotel.date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) : '-'}
                          </td>
                          <td className="border border-border px-1 py-1">
                            <Input
                              value={hotel.hotelName}
                              onChange={(e) => updateHotel(index, 'hotelName', e.target.value)}
                              className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                            />
                          </td>
                          <td className="border border-border px-1 py-1">
                            <Input
                              value={hotel.contact || ''}
                              onChange={(e) => updateHotel(index, 'contact', e.target.value)}
                              className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                            />
                          </td>
                        </tr>
                        {/* 第二行：訂金/確認時間/說明資料 */}
                        <tr className="bg-morandi-container/20">
                          <td className="border border-border px-1 py-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-morandi-secondary whitespace-nowrap">訂金:</span>
                              <Input
                                value={hotel.deposit || ''}
                                onChange={(e) => updateHotel(index, 'deposit', e.target.value)}
                                className="h-7 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-sm"
                              />
                            </div>
                          </td>
                          <td className="border border-border px-1 py-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-morandi-secondary whitespace-nowrap">確認時間:</span>
                              <Input
                                value={hotel.confirmTime || ''}
                                onChange={(e) => updateHotel(index, 'confirmTime', e.target.value)}
                                className="h-7 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-sm"
                              />
                            </div>
                          </td>
                          <td className="border border-border px-1 py-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-morandi-secondary whitespace-nowrap">說明:</span>
                              <Input
                                value={hotel.remarks || ''}
                                onChange={(e) => updateHotel(index, 'remarks', e.target.value)}
                                className="h-7 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold text-sm"
                              />
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 預約景點門票 */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-morandi-primary">預約景點門票</span>
                <Button variant="outline" size="sm" onClick={addAttraction} className="h-7 text-sm gap-1">
                  <Plus size={14} />
                  新增
                </Button>
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-20">日期</th>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium">名稱</th>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-24">電話</th>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-20">聯絡人</th>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-20">預約狀況</th>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-20">價格</th>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-20">協議</th>
                    <th className="border border-border bg-morandi-container/50 px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.attractions || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-border px-3 py-4 text-center text-morandi-secondary">
                        尚無景點門票，點擊「新增」按鈕添加
                      </td>
                    </tr>
                  ) : (
                    (formData.attractions || []).map((attraction, index) => (
                      <tr key={index}>
                        <td className="border border-border px-1 py-1">
                          <Input
                            value={attraction.date}
                            onChange={(e) => updateAttraction(index, 'date', e.target.value)}
                            className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                          />
                        </td>
                        <td className="border border-border px-1 py-1">
                          <Input
                            value={attraction.name}
                            onChange={(e) => updateAttraction(index, 'name', e.target.value)}
                            className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                          />
                        </td>
                        <td className="border border-border px-1 py-1">
                          <Input
                            value={attraction.phone || ''}
                            onChange={(e) => updateAttraction(index, 'phone', e.target.value)}
                            className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                          />
                        </td>
                        <td className="border border-border px-1 py-1">
                          <Input
                            value={attraction.contact || ''}
                            onChange={(e) => updateAttraction(index, 'contact', e.target.value)}
                            className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                          />
                        </td>
                        <td className="border border-border px-1 py-1">
                          <Input
                            value={attraction.status || ''}
                            onChange={(e) => updateAttraction(index, 'status', e.target.value)}
                            className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                          />
                        </td>
                        <td className="border border-border px-1 py-1">
                          <Input
                            value={attraction.price || ''}
                            onChange={(e) => updateAttraction(index, 'price', e.target.value)}
                            className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                          />
                        </td>
                        <td className="border border-border px-1 py-1">
                          <Input
                            value={attraction.agreement || ''}
                            onChange={(e) => updateAttraction(index, 'agreement', e.target.value)}
                            className="h-8 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-morandi-gold"
                          />
                        </td>
                        <td className="border border-border px-2 py-1 text-center">
                          <button
                            onClick={() => removeAttraction(index)}
                            className="text-morandi-red/60 hover:text-morandi-red p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 餐食明細 */}
            {(formData.meals || []).length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-morandi-primary">餐食資訊</span>
                <table className="w-full border-collapse text-sm mt-2">
                  <thead>
                    <tr>
                      <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium w-20">日期</th>
                      <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium">午餐</th>
                      <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium">晚餐</th>
                      <th className="border border-border bg-morandi-container/50 px-3 py-2 text-left font-medium">本日行程</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.meals || []).map((meal, index) => (
                      <tr key={index}>
                        <td className="border border-border px-3 py-2 text-morandi-secondary">
                          {meal.date ? new Date(meal.date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) : '-'}
                        </td>
                        <td className="border border-border px-3 py-2">{meal.lunch || '-'}</td>
                        <td className="border border-border px-3 py-2">{meal.dinner || '-'}</td>
                        <td className="border border-border px-3 py-2">{meal.dailyItinerary || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X size={16} />
            關閉
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving}
            variant="outline"
            className="gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            儲存
          </Button>
          <Button
            onClick={handlePrint}
            disabled={loading}
            className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Printer size={16} />
            列印團控表
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
