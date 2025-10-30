'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface WidgetConfig {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface StatConfig {
  id: string
  name: string
  enabled: boolean
}

interface WidgetSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widgets: WidgetConfig[]
  stats: StatConfig[]
  onToggleWidget: (widgetId: string) => void
  onToggleStat: (statId: string) => void
}

/**
 * 小工具與統計資料設定對話框
 */
export function WidgetSettingsDialog({
  open,
  onOpenChange,
  widgets,
  stats,
  onToggleWidget,
  onToggleStat,
}: WidgetSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>首頁設定</DialogTitle>
          <DialogDescription>自訂你的首頁顯示內容</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 小工具設定 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">顯示小工具</h3>
            <div className="space-y-3">
              {widgets.map(widget => (
                <div
                  key={widget.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-morandi-container/20 transition-colors"
                >
                  <Checkbox
                    id={`widget-${widget.id}`}
                    checked={widget.enabled}
                    onCheckedChange={() => onToggleWidget(widget.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`widget-${widget.id}`}
                      className="text-sm font-medium text-morandi-primary cursor-pointer"
                    >
                      {widget.name}
                    </Label>
                    <p className="text-xs text-morandi-secondary mt-1">{widget.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 統計資料設定 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">顯示統計資料</h3>
            <div className="grid grid-cols-2 gap-2">
              {stats.map(stat => (
                <div key={stat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stat-${stat.id}`}
                    checked={stat.enabled}
                    onCheckedChange={() => onToggleStat(stat.id)}
                  />
                  <Label htmlFor={`stat-${stat.id}`} className="text-sm font-normal cursor-pointer">
                    {stat.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
