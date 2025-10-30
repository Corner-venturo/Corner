/**
 * 行事曆設定 Dialog
 * 控制要顯示哪些類型的事件
 */

'use client'

import { Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCalendarStore } from '@/stores'

export function CalendarSettingsDialog() {
  const { settings, updateSettings } = useCalendarStore()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-morandi-gold/30 bg-card text-morandi-secondary hover:bg-morandi-gold/10 hover:text-morandi-gold hover:border-morandi-gold transition-all shadow-sm"
        >
          <Settings size={16} />
          顯示設定
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>行事曆顯示設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 個人行事曆 */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="show-personal"
              checked={settings.showPersonal}
              onCheckedChange={checked => updateSettings({ showPersonal: checked as boolean })}
            />
            <div className="space-y-0.5">
              <Label htmlFor="show-personal" className="text-base cursor-pointer">
                個人行事曆
              </Label>
              <p className="text-sm text-muted-foreground">只有您能看到的個人事項</p>
            </div>
          </div>

          {/* 公司行事曆 */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="show-company"
              checked={settings.showCompany}
              onCheckedChange={checked => updateSettings({ showCompany: checked as boolean })}
            />
            <div className="space-y-0.5">
              <Label htmlFor="show-company" className="text-base cursor-pointer">
                公司行事曆
              </Label>
              <p className="text-sm text-muted-foreground">全公司共享的會議與活動</p>
            </div>
          </div>

          {/* 旅遊團 */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="show-tours"
              checked={settings.showTours}
              onCheckedChange={checked => updateSettings({ showTours: checked as boolean })}
            />
            <div className="space-y-0.5">
              <Label htmlFor="show-tours" className="text-base cursor-pointer">
                旅遊團
              </Label>
              <p className="text-sm text-muted-foreground">自動顯示旅遊團出發與返回日期</p>
            </div>
          </div>

          {/* 生日提醒 */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="show-birthdays"
              checked={settings.showBirthdays}
              onCheckedChange={checked => updateSettings({ showBirthdays: checked as boolean })}
            />
            <div className="space-y-0.5">
              <Label htmlFor="show-birthdays" className="text-base cursor-pointer">
                生日提醒
              </Label>
              <p className="text-sm text-muted-foreground">自動顯示團員生日</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          💡 提示：可以同時顯示多種類型，用不同顏色區分
        </div>
      </DialogContent>
    </Dialog>
  )
}
