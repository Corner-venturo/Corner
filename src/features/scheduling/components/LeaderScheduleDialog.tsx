/**
 * LeaderScheduleDialog - 領隊調度新增/編輯對話框
 */

'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { LeaderScheduleFormData } from '@/types/fleet.types'
import type { TourLeader } from '@/types/tour-leader.types'

interface LeaderScheduleDialogProps {
  isOpen: boolean
  isEditMode: boolean
  onClose: () => void
  formData: LeaderScheduleFormData
  leaders: TourLeader[]
  onFormFieldChange: <K extends keyof LeaderScheduleFormData>(
    field: K,
    value: LeaderScheduleFormData[K]
  ) => void
  onSubmit: () => void
}

export const LeaderScheduleDialog: React.FC<LeaderScheduleDialogProps> = ({
  isOpen,
  isEditMode,
  onClose,
  formData,
  leaders,
  onFormFieldChange,
  onSubmit,
}) => {
  const selectedLeader = leaders.find(l => l.id === formData.leader_id)

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? '編輯領隊調度' : '新增領隊調度'}
      subtitle={selectedLeader ? `${selectedLeader.name}${selectedLeader.english_name ? ` (${selectedLeader.english_name})` : ''}` : '選擇領隊'}
      onSubmit={onSubmit}
      submitLabel={isEditMode ? '儲存變更' : '新增調度'}
      submitDisabled={!formData.leader_id || !formData.start_date || !formData.end_date}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* 領隊選擇 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">領隊資訊</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                選擇領隊 <span className="text-morandi-red">*</span>
              </label>
              <Select
                value={formData.leader_id}
                onValueChange={value => onFormFieldChange('leader_id', value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="選擇領隊" />
                </SelectTrigger>
                <SelectContent>
                  {leaders.filter(l => l.status === 'active').map(leader => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.name} {leader.english_name ? `(${leader.english_name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLeader && (
              <div className="flex items-center">
                <div className="text-sm text-morandi-secondary">
                  {selectedLeader.phone && <span>電話：{selectedLeader.phone}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 日期範圍 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">調度日期</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                開始日期 <span className="text-morandi-red">*</span>
              </label>
              <DatePicker
                value={formData.start_date}
                onChange={date => onFormFieldChange('start_date', date)}
                placeholder="選擇開始日期"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                結束日期 <span className="text-morandi-red">*</span>
              </label>
              <DatePicker
                value={formData.end_date}
                onChange={date => onFormFieldChange('end_date', date)}
                placeholder="選擇結束日期"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 團資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">團資訊</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">團號</label>
              <Input
                value={formData.tour_code}
                onChange={e => onFormFieldChange('tour_code', e.target.value)}
                placeholder="例如：CNX250121A"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">目的地</label>
              <Input
                value={formData.destination}
                onChange={e => onFormFieldChange('destination', e.target.value)}
                placeholder="例如：清邁"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-morandi-primary">行程名稱</label>
              <Input
                value={formData.tour_name}
                onChange={e => onFormFieldChange('tour_name', e.target.value)}
                placeholder="例如：清邁五日遊"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">備註</label>
          <Textarea
            value={formData.notes}
            onChange={e => onFormFieldChange('notes', e.target.value)}
            placeholder="其他備註資訊（選填）"
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
