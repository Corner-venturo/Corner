/**
 * LeaderAvailabilityDialog - 領隊檔期管理對話框
 *
 * 用於管理單一領隊的可用檔期
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DIALOG_SIZES } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Pencil, Trash2, X, Save, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { formatDate, parseLocalDate } from '@/lib/utils/format-date'
import {
  useLeaderAvailability,
  LEADER_AVAILABILITY_STATUS_CONFIG,
  type LeaderAvailability,
  type LeaderAvailabilityStatus,
} from '@/stores/leader-availability-store'
import type { TourLeader } from '@/types/tour-leader.types'

interface LeaderAvailabilityDialogProps {
  isOpen: boolean
  onClose: () => void
  leader: TourLeader | null
}

interface AvailabilityFormData {
  id?: string
  available_start_date: string
  available_end_date: string
  status: LeaderAvailabilityStatus
  notes: string
}

const emptyFormData: AvailabilityFormData = {
  available_start_date: '',
  available_end_date: '',
  status: 'available',
  notes: '',
}

export const LeaderAvailabilityDialog: React.FC<LeaderAvailabilityDialogProps> = ({
  isOpen,
  onClose,
  leader,
}) => {
  const [isAddMode, setIsAddMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AvailabilityFormData>(emptyFormData)

  const {
    items: allAvailability,
    isLoading,
    create,
    update,
    delete: deleteItem,
  } = useLeaderAvailability()

  // 過濾出該領隊的檔期
  const leaderAvailability = useMemo(() => {
    if (!leader) return []
    return allAvailability
      .filter(a => a.leader_id === leader.id)
      .sort((a, b) => a.available_start_date.localeCompare(b.available_start_date))
  }, [allAvailability, leader])

  const handleOpenAdd = useCallback(() => {
    setIsAddMode(true)
    setEditingId(null)
    setFormData(emptyFormData)
  }, [])

  const handleEdit = useCallback((item: LeaderAvailability) => {
    setIsAddMode(true)
    setEditingId(item.id)
    setFormData({
      id: item.id,
      available_start_date: item.available_start_date,
      available_end_date: item.available_end_date,
      status: item.status as LeaderAvailabilityStatus,
      notes: item.notes || '',
    })
  }, [])

  const handleCancelForm = useCallback(() => {
    setIsAddMode(false)
    setEditingId(null)
    setFormData(emptyFormData)
  }, [])

  const handleDelete = useCallback(async (item: LeaderAvailability) => {
    const confirmed = await confirm('確定要刪除此檔期嗎？', {
      title: '刪除檔期',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      await deleteItem(item.id)
      await alert('檔期已刪除', 'success')
    } catch (error) {
      logger.error('Delete availability error:', error)
      await alert('刪除失敗', 'error')
    }
  }, [deleteItem])

  const handleSubmit = useCallback(async () => {
    if (!leader) return
    if (!formData.available_start_date || !formData.available_end_date) {
      await alert('請填寫開始和結束日期', 'warning')
      return
    }

    // 驗證日期順序
    if (formData.available_start_date > formData.available_end_date) {
      await alert('結束日期必須在開始日期之後', 'warning')
      return
    }

    try {
      const data = {
        leader_id: leader.id,
        available_start_date: formData.available_start_date,
        available_end_date: formData.available_end_date,
        status: formData.status,
        notes: formData.notes || null,
      }

      if (editingId) {
        await update(editingId, data)
        await alert('檔期已更新', 'success')
      } else {
        await create(data as Parameters<typeof create>[0])
        await alert('檔期已新增', 'success')
      }

      handleCancelForm()
    } catch (error) {
      logger.error('Save availability error:', error)
      await alert('儲存失敗', 'error')
    }
  }, [leader, formData, editingId, create, update, handleCancelForm])

  const handleFieldChange = useCallback(<K extends keyof AvailabilityFormData>(
    field: K,
    value: AvailabilityFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  if (!leader) return null

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className={cn(DIALOG_SIZES.lg, 'max-h-[85vh] overflow-hidden flex flex-col')}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-morandi-gold" />
            {leader.name} - 檔期管理
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 新增/編輯表單 */}
          {isAddMode ? (
            <div className="p-4 bg-morandi-container/30 rounded-lg border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-morandi-primary">
                  {editingId ? '編輯檔期' : '新增檔期'}
                </h4>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={handleCancelForm}
                  className="text-morandi-secondary"
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">
                    開始日期 <span className="text-morandi-red">*</span>
                  </label>
                  <DatePicker
                    value={formData.available_start_date}
                    onChange={(date) => handleFieldChange('available_start_date', date)}
                    placeholder="選擇開始日期"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">
                    結束日期 <span className="text-morandi-red">*</span>
                  </label>
                  <DatePicker
                    value={formData.available_end_date}
                    onChange={(date) => handleFieldChange('available_end_date', date)}
                    placeholder="選擇結束日期"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">狀態</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleFieldChange('status', value as LeaderAvailabilityStatus)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEADER_AVAILABILITY_STATUS_CONFIG).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">備註</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="選填備註"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelForm} className="gap-2">
                  <X size={16} />
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                >
                  <Save size={16} />
                  {editingId ? '儲存' : '新增'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleOpenAdd}
              className="w-full gap-2 border-dashed"
            >
              <Plus size={16} />
              新增檔期
            </Button>
          )}

          {/* 檔期列表 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-morandi-secondary">
              已設定的檔期 ({leaderAvailability.length})
            </h4>

            {isLoading ? (
              <div className="text-center py-8 text-morandi-secondary">載入中...</div>
            ) : leaderAvailability.length === 0 ? (
              <div className="text-center py-8 text-morandi-secondary flex flex-col items-center gap-2">
                <AlertCircle size={24} className="text-morandi-muted" />
                <span>尚無設定任何檔期</span>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderAvailability.map((item) => {
                  const statusConfig = LEADER_AVAILABILITY_STATUS_CONFIG[item.status as LeaderAvailabilityStatus]
                  const startDate = parseLocalDate(item.available_start_date)
                  const endDate = parseLocalDate(item.available_end_date)

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-morandi-gold/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={cn('text-xs', statusConfig?.color)}>
                          {statusConfig?.label || item.status}
                        </Badge>
                        <div>
                          <div className="font-medium text-morandi-primary">
                            {startDate ? formatDate(startDate) : item.available_start_date}
                            {' ~ '}
                            {endDate ? formatDate(endDate) : item.available_end_date}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-morandi-secondary">{item.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleEdit(item)}
                          className="text-morandi-blue hover:bg-morandi-blue/10"
                          title="編輯"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleDelete(item)}
                          className="text-morandi-red hover:bg-morandi-red/10"
                          title="刪除"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X size={16} />
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
