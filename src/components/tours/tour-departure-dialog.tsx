'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tour } from '@/types/tour.types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, X, FileText } from 'lucide-react'
import type {
  TourDepartureData,
  TourDepartureMeal,
  TourDepartureAccommodation,
  TourDepartureActivity,
  TourDepartureOther,
} from '@/types/tour-departure.types'

interface TourDepartureDialogProps {
  tour: Tour
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TourDepartureDialog({ tour, open, onOpenChange }: TourDepartureDialogProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TourDepartureData | null>(null)
  const [meals, setMeals] = useState<TourDepartureMeal[]>([])
  const [accommodations, setAccommodations] = useState<TourDepartureAccommodation[]>([])
  const [activities, setActivities] = useState<TourDepartureActivity[]>([])
  const [others, setOthers] = useState<TourDepartureOther[]>([])

  // 載入出團資料
  useEffect(() => {
    if (open) {
      loadDepartureData()
    }
  }, [open, tour.id])

  const loadDepartureData = async () => {
    try {
      setLoading(true)

      // 載入主表資料
      const { data: mainData, error: mainError } = await supabase
        .from('tour_departure_data')
        .select('*')
        .eq('tour_id', tour.id)
        .single()

      if (mainError && mainError.code !== 'PGRST116') {
        throw mainError
      }

      if (mainData) {
        setData(mainData as unknown as TourDepartureData)

        // 載入餐食
        const { data: mealsData } = await supabase
          .from('tour_departure_meals')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setMeals((mealsData || []) as TourDepartureMeal[])

        // 載入住宿
        const { data: accomData } = await supabase
          .from('tour_departure_accommodations')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setAccommodations((accomData || []) as TourDepartureAccommodation[])

        // 載入活動
        const { data: activData } = await supabase
          .from('tour_departure_activities')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setActivities((activData || []) as TourDepartureActivity[])

        // 載入其他
        const { data: othersData } = await supabase
          .from('tour_departure_others')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setOthers((othersData || []) as TourDepartureOther[])
      } else {
        // 初始化空資料
        setData({
          id: '',
          tour_id: tour.id,
          service_fee_per_person: 1500,
          petty_cash: 0,
        } as unknown as TourDepartureData)
      }
    } catch (error) {
      logger.error('載入出團資料失敗:', error)
      toast.error('載入失敗')
    } finally {
      setLoading(false)
    }
  }

  // 儲存資料
  const handleSave = async () => {
    if (!data) return

    setLoading(true)
    try {
      // 儲存主表資料
      let departureDataId = data.id

      if (!departureDataId) {
        // 新建
        const { data: newData, error } = await supabase
          .from('tour_departure_data')
          .insert({
            ...data,
            tour_id: tour.id,
          })
          .select()
          .single()

        if (error) throw error
        departureDataId = newData.id
      } else {
        // 更新
        const { error } = await supabase
          .from('tour_departure_data')
          .update(data)
          .eq('id', departureDataId)

        if (error) throw error
      }

      toast.success('儲存成功')
      onOpenChange(false)
    } catch (error) {
      logger.error('儲存失敗:', error)
      toast.error('儲存失敗')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="py-8 text-center text-morandi-secondary">載入中...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>出團資料表 - {tour.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-morandi-container/20 rounded-lg p-4">
            <h3 className="font-semibold mb-3">基本資訊</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>隨團領隊</Label>
                <Input
                  value={data.tour_leader || ''}
                  onChange={e => setData({ ...data, tour_leader: e.target.value })}
                  placeholder="例：池帥生／Ike"
                />
              </div>
              <div>
                <Label>領隊聯絡方式</Label>
                <Input
                  value={data.tour_leader_contact || ''}
                  onChange={e => setData({ ...data, tour_leader_contact: e.target.value })}
                  placeholder="電話或 Email"
                />
              </div>
              <div>
                <Label>承辦業務</Label>
                <Input
                  value={data.sales_person || ''}
                  onChange={e => setData({ ...data, sales_person: e.target.value })}
                  placeholder="例：Jess／02-7756051#12"
                />
              </div>
              <div>
                <Label>助理人員</Label>
                <Input
                  value={data.assistant_person || ''}
                  onChange={e => setData({ ...data, assistant_person: e.target.value })}
                  placeholder="例：Carson／02-7756051#20"
                />
              </div>
              <div className="col-span-2">
                <Label>航班資訊</Label>
                <Input
                  value={data.flight_info || ''}
                  onChange={e => setData({ ...data, flight_info: e.target.value })}
                  placeholder="例：BR-112 06:55-09:15／BR-113 10:15-10:55"
                />
              </div>
            </div>
          </div>

          {/* 其他費用設定 */}
          <div className="bg-morandi-container/20 rounded-lg p-4">
            <h3 className="font-semibold mb-3">其他費用設定</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>領隊服務費（每人）</Label>
                <Input
                  type="number"
                  value={data.service_fee_per_person || 1500}
                  onChange={e =>
                    setData({ ...data, service_fee_per_person: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>零用金</Label>
                <Input
                  type="number"
                  value={data.petty_cash || 0}
                  onChange={e => setData({ ...data, petty_cash: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* 提示訊息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p>
              <strong>提示：</strong>
              基本資訊儲存後，可在下一步編輯餐食、住宿、活動等詳細資訊。
            </p>
            <p className="mt-1">交通表會從行程表自動帶入，無需手動填寫。</p>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '儲存中...' : '儲存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
