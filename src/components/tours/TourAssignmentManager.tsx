'use client'

/**
 * TourAssignmentManager - 統一分配管理
 * 整合分房、分車、分桌功能於單一對話框中，使用 Tab 切換
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Hotel, Bus, UtensilsCrossed } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import type { OrderMember } from '@/features/orders/types/order-member.types'

// 只需要 OrderMember 的部分欄位
type MemberBasic = Pick<OrderMember, 'id' | 'chinese_name' | 'passport_name'>

interface TourInfo {
  id: string
  code?: string
  name?: string
  departure_date: string
  return_date: string
  daily_schedule?: DailyScheduleItem[]
}

interface DailyScheduleItem {
  day: number
  route: string
  meals: {
    breakfast: string
    lunch: string
    dinner: string
  }
  accommodation: string
}

interface TourAssignmentManagerProps {
  tourId: string
  tour?: TourInfo
  members: MemberBasic[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose?: () => void
  defaultTab?: 'room' | 'vehicle' | 'table'
}

// 子組件：分房 Tab
import { TourRoomTab } from './assignment-tabs/TourRoomTab'
// 子組件：分車 Tab
import { TourVehicleTab } from './assignment-tabs/TourVehicleTab'
// 子組件：分桌 Tab
import { TourTableTab } from './assignment-tabs/TourTableTab'
import { COMP_TOURS_LABELS } from './constants/labels'

export function TourAssignmentManager({
  tourId,
  tour,
  members,
  open,
  onOpenChange,
  onClose,
  defaultTab = 'room',
}: TourAssignmentManagerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  // 計算旅遊天數
  const tourNights = tour?.departure_date && tour?.return_date
    ? Math.ceil((new Date(tour.return_date).getTime() - new Date(tour.departure_date).getTime()) / (1000 * 60 * 60 * 24))
    : 1

  // 處理對話框關閉
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      onClose?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent level={2} className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-morandi-primary">
            {COMP_TOURS_LABELS.MANAGE_972}
            {tourNights > 0 && (
              <span className="text-sm font-normal text-morandi-muted">
                {tourNights + 1} 天 {tourNights} 夜
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="room" className="flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              {COMP_TOURS_LABELS.LABEL_9712}
            </TabsTrigger>
            <TabsTrigger value="vehicle" className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              {COMP_TOURS_LABELS.LABEL_3590}
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              {COMP_TOURS_LABELS.LABEL_2548}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="room" className="m-0 h-full">
              <TourRoomTab tourId={tourId} tour={tour} members={members} tourNights={tourNights} />
            </TabsContent>

            <TabsContent value="vehicle" className="m-0 h-full">
              <TourVehicleTab tourId={tourId} members={members} />
            </TabsContent>

            <TabsContent value="table" className="m-0 h-full">
              <TourTableTab tourId={tourId} tour={tour} members={members} />
            </TabsContent>
          </div>
        </Tabs>

        <div className="pt-3 border-t border-border text-xs text-morandi-muted flex-shrink-0">
          {COMP_TOURS_LABELS.LABEL_5972}
        </div>
      </DialogContent>
    </Dialog>
  )
}
