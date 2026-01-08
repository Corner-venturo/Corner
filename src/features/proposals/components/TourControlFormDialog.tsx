/**
 * TourControlFormDialog - 團控表對話框
 *
 * 從行程表讀取資料，產生團控表預覽並可列印
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { Loader2, Bus, Printer, X, Plus, Trash2 } from 'lucide-react'
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

      try {
        // 載入行程表資料
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
      <DialogContent className={DIALOG_SIZES['2xl']}>
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
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {/* 基本資訊 - 單行表格式 */}
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">日期</td>
                  <td className="px-1 py-0.5 w-28">
                    <Input
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      type="date"
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">團號</td>
                  <td className="px-1 py-0.5 w-32">
                    <Input
                      value={formData.tourCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tourCode: e.target.value }))}
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">車條</td>
                  <td className="px-1 py-0.5">
                    <Input
                      value={formData.tourName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tourName: e.target.value }))}
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 聯絡人 - 單行表格式 */}
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-20">標案聯絡人</td>
                  <td className="px-1 py-0.5 w-24">
                    <Input
                      placeholder="姓名"
                      value={formData.bidContact?.name || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bidContact: { ...prev.bidContact, name: e.target.value },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-1 py-0.5 w-28">
                    <Input
                      placeholder="電話"
                      value={formData.bidContact?.phone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bidContact: { ...prev.bidContact, name: prev.bidContact?.name || '', phone: e.target.value },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-20">行程聯絡人</td>
                  <td className="px-1 py-0.5 w-24">
                    <Input
                      placeholder="姓名"
                      value={formData.itineraryContact?.name || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          itineraryContact: { ...prev.itineraryContact, name: e.target.value },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-1 py-0.5">
                    <Input
                      placeholder="電話"
                      value={formData.itineraryContact?.phone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          itineraryContact: { ...prev.itineraryContact, name: prev.itineraryContact?.name || '', phone: e.target.value },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 人數 - 單行表格式 */}
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">總人數</td>
                  <td className="px-1 py-0.5 w-14">
                    <Input
                      type="number"
                      value={formData.pax?.total || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pax: { ...prev.pax, total: parseInt(e.target.value) || 0 },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0 text-center"
                    />
                  </td>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">公司</td>
                  <td className="px-1 py-0.5 w-14">
                    <Input
                      type="number"
                      value={formData.pax?.business || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pax: { ...prev.pax, total: prev.pax?.total || 0, business: parseInt(e.target.value) || 0 },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0 text-center"
                    />
                  </td>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">總領</td>
                  <td className="px-1 py-0.5 w-14">
                    <Input
                      type="number"
                      value={formData.pax?.leader || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pax: { ...prev.pax, total: prev.pax?.total || 0, leader: parseInt(e.target.value) || 0 },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0 text-center"
                    />
                  </td>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">護士</td>
                  <td className="px-1 py-0.5 w-14">
                    <Input
                      type="number"
                      value={formData.pax?.nurse || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pax: { ...prev.pax, total: prev.pax?.total || 0, nurse: parseInt(e.target.value) || 0 },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0 text-center"
                    />
                  </td>
                  <td className="px-1 py-0.5 text-xs text-morandi-secondary w-14">領隊</td>
                  <td className="px-1 py-0.5 w-14">
                    <Input
                      type="number"
                      value={formData.pax?.tourLeader || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pax: { ...prev.pax, total: prev.pax?.total || 0, tourLeader: parseInt(e.target.value) || 0 },
                        }))
                      }
                      className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0 text-center"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 遊覽車公司 */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-morandi-secondary">遊覽車公司</Label>
                <Button variant="ghost" size="sm" onClick={addBusCompany} className="h-5 text-xs gap-1 text-morandi-gold">
                  <Plus size={12} />
                  新增
                </Button>
              </div>
              <table className="w-full text-sm mt-1">
                <thead>
                  <tr className="text-xs text-morandi-secondary border-b border-border/30">
                    <th className="px-1 py-1 text-left font-normal w-6">#</th>
                    <th className="px-1 py-1 text-left font-normal">公司名稱</th>
                    <th className="px-1 py-1 text-left font-normal w-24">聯絡人</th>
                    <th className="px-1 py-1 text-left font-normal w-24">確認時間</th>
                    <th className="px-1 py-1 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.busCompanies || []).map((bus, index) => (
                    <tr key={index} className="hover:bg-morandi-container/20">
                      <td className="px-1 py-0.5 text-xs text-morandi-secondary">{index + 1}</td>
                      <td className="px-1 py-0.5">
                        <Input
                          placeholder="公司名稱"
                          value={bus.name}
                          onChange={(e) => updateBusCompany(index, 'name', e.target.value)}
                          className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                        />
                      </td>
                      <td className="px-1 py-0.5">
                        <Input
                          placeholder="聯絡人"
                          value={bus.contact || ''}
                          onChange={(e) => updateBusCompany(index, 'contact', e.target.value)}
                          className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                        />
                      </td>
                      <td className="px-1 py-0.5">
                        <Input
                          placeholder="確認時間"
                          value={bus.confirmTime || ''}
                          onChange={(e) => updateBusCompany(index, 'confirmTime', e.target.value)}
                          className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                        />
                      </td>
                      <td className="px-1 py-0.5">
                        {(formData.busCompanies || []).length > 1 && (
                          <button
                            onClick={() => removeBusCompany(index)}
                            className="text-morandi-red/60 hover:text-morandi-red"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 飯店明細 */}
            {(formData.hotels || []).length > 0 && (
              <div>
                <Label className="text-xs text-morandi-secondary">飯店確認明細</Label>
                <table className="w-full text-sm mt-1">
                  <thead>
                    <tr className="text-xs text-morandi-secondary border-b border-border/30">
                      <th className="px-1 py-1 text-left font-normal w-14">日期</th>
                      <th className="px-1 py-1 text-left font-normal">飯店</th>
                      <th className="px-1 py-1 text-left font-normal w-20">聯絡人</th>
                      <th className="px-1 py-1 text-left font-normal w-20">訂金</th>
                      <th className="px-1 py-1 text-left font-normal w-20">協議</th>
                      <th className="px-1 py-1 text-left font-normal w-20">確認時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.hotels || []).map((hotel, index) => (
                      <tr key={index} className="hover:bg-morandi-container/20">
                        <td className="px-1 py-0.5 text-xs">
                          {hotel.date ? new Date(hotel.date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) : '-'}
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={hotel.hotelName}
                            onChange={(e) => updateHotel(index, 'hotelName', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={hotel.contact || ''}
                            onChange={(e) => updateHotel(index, 'contact', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="聯絡人"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={hotel.deposit || ''}
                            onChange={(e) => updateHotel(index, 'deposit', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="訂金"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={hotel.agreement || ''}
                            onChange={(e) => updateHotel(index, 'agreement', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="協議"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={hotel.confirmTime || ''}
                            onChange={(e) => updateHotel(index, 'confirmTime', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="確認時間"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 預約景點門票 */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-morandi-secondary">預約景點門票</Label>
                <Button variant="ghost" size="sm" onClick={addAttraction} className="h-5 text-xs gap-1 text-morandi-gold">
                  <Plus size={12} />
                  新增
                </Button>
              </div>
              {(formData.attractions || []).length > 0 && (
                <table className="w-full text-sm mt-1">
                  <thead>
                    <tr className="text-xs text-morandi-secondary border-b border-border/30">
                      <th className="px-1 py-1 text-left font-normal w-16">日期</th>
                      <th className="px-1 py-1 text-left font-normal">名稱</th>
                      <th className="px-1 py-1 text-left font-normal w-20">電話</th>
                      <th className="px-1 py-1 text-left font-normal w-16">聯絡人</th>
                      <th className="px-1 py-1 text-left font-normal w-16">預約</th>
                      <th className="px-1 py-1 text-left font-normal w-16">價格</th>
                      <th className="px-1 py-1 text-left font-normal w-16">協議</th>
                      <th className="px-1 py-1 w-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.attractions || []).map((attraction, index) => (
                      <tr key={index} className="hover:bg-morandi-container/20">
                        <td className="px-1 py-0.5">
                          <Input
                            value={attraction.date}
                            onChange={(e) => updateAttraction(index, 'date', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="日期"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={attraction.name}
                            onChange={(e) => updateAttraction(index, 'name', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="景點名稱"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={attraction.phone || ''}
                            onChange={(e) => updateAttraction(index, 'phone', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="電話"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={attraction.contact || ''}
                            onChange={(e) => updateAttraction(index, 'contact', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="聯絡人"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={attraction.status || ''}
                            onChange={(e) => updateAttraction(index, 'status', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="狀況"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={attraction.price || ''}
                            onChange={(e) => updateAttraction(index, 'price', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="價格"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <Input
                            value={attraction.agreement || ''}
                            onChange={(e) => updateAttraction(index, 'agreement', e.target.value)}
                            className="h-6 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                            placeholder="協議"
                          />
                        </td>
                        <td className="px-1 py-0.5">
                          <button
                            onClick={() => removeAttraction(index)}
                            className="text-morandi-red/60 hover:text-morandi-red"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 餐食明細 */}
            {(formData.meals || []).length > 0 && (
              <div>
                <Label className="text-xs text-morandi-secondary">餐食資訊</Label>
                <div className="mt-1 text-sm">
                  {(formData.meals || []).map((meal, index) => (
                    <div key={index} className="flex gap-4 py-0.5 text-xs">
                      <span className="w-12 text-morandi-secondary">
                        {meal.date ? new Date(meal.date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) : '-'}
                      </span>
                      {meal.lunch && <span>午：{meal.lunch}</span>}
                      {meal.dinner && <span>晚：{meal.dinner}</span>}
                    </div>
                  ))}
                </div>
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
