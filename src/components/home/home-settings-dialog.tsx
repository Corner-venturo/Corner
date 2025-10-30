'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface HomeSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableWidgets: { id: string; name: string }[]
  availableStats: { id: string; name: string }[]
  selectedWidgets: string[]
  selectedStats: string[]
  onSave: (widgets: string[], stats: string[]) => void
}

/**
 * 首頁設定對話框
 */
export const HomeSettingsDialog = ({
  open,
  onOpenChange,
  availableWidgets,
  availableStats,
  selectedWidgets,
  selectedStats,
  onSave,
}: HomeSettingsDialogProps) => {
  const [tempWidgets, setTempWidgets] = useState<string[]>(selectedWidgets)
  const [tempStats, setTempStats] = useState<string[]>(selectedStats)

  const handleWidgetToggle = (widgetId: string) => {
    setTempWidgets(prev =>
      prev.includes(widgetId) ? prev.filter(id => id !== widgetId) : [...prev, widgetId]
    )
  }

  const handleStatToggle = (statId: string) => {
    setTempStats(prev =>
      prev.includes(statId) ? prev.filter(id => id !== statId) : [...prev, statId]
    )
  }

  const handleSave = () => {
    onSave(tempWidgets, tempStats)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTempWidgets(selectedWidgets)
    setTempStats(selectedStats)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>首頁設定</DialogTitle>
          <DialogDescription>自訂你的首頁顯示內容</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 小工具選擇 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">顯示小工具</h3>
            <div className="space-y-2">
              {availableWidgets.map(widget => (
                <div key={widget.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`widget-${widget.id}`}
                    checked={tempWidgets.includes(widget.id)}
                    onCheckedChange={() => handleWidgetToggle(widget.id)}
                  />
                  <Label
                    htmlFor={`widget-${widget.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {widget.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 統計資料選擇 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">顯示統計資料</h3>
            <div className="space-y-2">
              {availableStats.map(stat => (
                <div key={stat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stat-${stat.id}`}
                    checked={tempStats.includes(stat.id)}
                    onCheckedChange={() => handleStatToggle(stat.id)}
                  />
                  <Label htmlFor={`stat-${stat.id}`} className="text-sm font-normal cursor-pointer">
                    {stat.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 按鈕區 */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave} className="bg-morandi-gold hover:bg-morandi-gold/80">
            儲存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
