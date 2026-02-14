'use client'

import { CONFIRM_HEADER_LABELS } from '../constants/labels'

/**
 * ConfirmationHeader - 出團確認表標題區
 *
 * 顯示團的基本資訊：
 * - 團號、團名、出發日期、回程日期
 * - 領隊、業務、助理、人數
 * - 航班資訊
 */

import { useState } from 'react'
import {
  Calendar,
  Users,
  Plane,
  User,
  Briefcase,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Tour } from '@/stores/types'
import type { TourConfirmationSheet } from '@/types/tour-confirmation-sheet.types'
import { CONFIRMATION_HEADER_LABELS } from '../constants/labels';
import { formatDateTW } from '@/lib/utils/format-date'

interface ConfirmationHeaderProps {
  sheet: TourConfirmationSheet | null
  tour: Tour
  onUpdate: (updates: Partial<TourConfirmationSheet>) => Promise<TourConfirmationSheet | undefined>
  saving: boolean
}

export function ConfirmationHeader({
  sheet,
  tour,
  onUpdate,
  saving,
}: ConfirmationHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    tour_leader_name: sheet?.tour_leader_name || '',
    sales_person: sheet?.sales_person || '',
    assistant: sheet?.assistant || '',
    pax: sheet?.pax || tour.current_participants || tour.max_participants || 0,
    flight_info: sheet?.flight_info || '',
  })

  const handleSave = async () => {
    await onUpdate(formData)
    setEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      tour_leader_name: sheet?.tour_leader_name || '',
      sales_person: sheet?.sales_person || '',
      assistant: sheet?.assistant || '',
      pax: sheet?.pax || tour.current_participants || tour.max_participants || 0,
      flight_info: sheet?.flight_info || '',
    })
    setEditing(false)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    return formatDateTW(dateStr) || '-'
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: CONFIRMATION_HEADER_LABELS.草稿, variant: 'secondary' },
      confirmed: { label: CONFIRMATION_HEADER_LABELS.已確認, variant: 'default' },
      in_progress: { label: CONFIRMATION_HEADER_LABELS.執行中, variant: 'outline' },
      completed: { label: CONFIRMATION_HEADER_LABELS.已完成, variant: 'default' },
    }
    return statusMap[status] || { label: status, variant: 'secondary' }
  }

  const status = getStatusLabel(sheet?.status || 'draft')

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-morandi-primary">
            出團確認表
          </h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="gap-1"
              >
                <X size={14} />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-morandi-gold hover:bg-morandi-gold-hover gap-1"
              >
                <Save size={14} />
                儲存
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-1"
            >
              <Edit2 size={14} />
              編輯
            </Button>
          )}
        </div>
      </div>

      {/* 資訊區 */}
      <div className="p-6">
        {/* 第一列：團號、團名、日期 */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.TOUR_CODE}</Label>
            <p className="text-base font-medium text-morandi-primary mt-1">
              {tour.code}
            </p>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.TOUR_NAME}</Label>
            <p className="text-base font-medium text-morandi-primary mt-1">
              {tour.name}
            </p>
          </div>
          <div>
            <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.DEPARTURE_RETURN}</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar size={14} className="text-morandi-secondary" />
              <span className="text-sm text-morandi-primary">
                {formatDate(tour.departure_date)} ~ {formatDate(tour.return_date)}
              </span>
            </div>
          </div>
        </div>

        {/* 第二列：人員資訊 */}
        <div className="grid grid-cols-5 gap-6">
          {editing ? (
            <>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.LEADER}</Label>
                <Input
                  value={formData.tour_leader_name}
                  onChange={(e) =>
                    setFormData({ ...formData, tour_leader_name: e.target.value })
                  }
                  placeholder={CONFIRMATION_HEADER_LABELS.領隊姓名}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.SALES}</Label>
                <Input
                  value={formData.sales_person}
                  onChange={(e) =>
                    setFormData({ ...formData, sales_person: e.target.value })
                  }
                  placeholder={CONFIRMATION_HEADER_LABELS.業務姓名}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.ASSISTANT}</Label>
                <Input
                  value={formData.assistant}
                  onChange={(e) =>
                    setFormData({ ...formData, assistant: e.target.value })
                  }
                  placeholder={CONFIRMATION_HEADER_LABELS.助理姓名}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.HEADCOUNT}</Label>
                <Input
                  type="number"
                  value={formData.pax}
                  onChange={(e) =>
                    setFormData({ ...formData, pax: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.FLIGHT}</Label>
                <Input
                  value={formData.flight_info}
                  onChange={(e) =>
                    setFormData({ ...formData, flight_info: e.target.value })
                  }
                  placeholder={CONFIRMATION_HEADER_LABELS.航班資訊}
                  className="mt-1 h-8"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.LEADER}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User size={14} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-primary">
                    {sheet?.tour_leader_name || '-'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.SALES}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase size={14} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-primary">
                    {sheet?.sales_person || '-'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.ASSISTANT}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User size={14} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-primary">
                    {sheet?.assistant || '-'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.HEADCOUNT}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users size={14} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-primary">
                    {sheet?.pax || tour.current_participants || tour.max_participants || '-'} 人
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-morandi-primary">{CONFIRM_HEADER_LABELS.FLIGHT}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Plane size={14} className="text-morandi-secondary" />
                  <span className="text-sm text-morandi-primary">
                    {sheet?.flight_info || '-'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
