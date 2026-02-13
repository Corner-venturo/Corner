'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { updateEmployee } from '@/data'
import { MENU_ITEMS, MENU_CATEGORIES, getMenuItemsByCategory } from '@/lib/constants/menu-items'
import type { MenuItem } from '@/lib/constants/menu-items'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { Save, RotateCcw } from 'lucide-react'
import { LABELS } from '../constants/labels'

export default function MenuSettingsPage() {
  const { user } = useAuthStore()
  const [hiddenMenuItems, setHiddenMenuItems] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // 載入當前使用者的隱藏選單設定
  useEffect(() => {
    if (user?.hidden_menu_items) {
      setHiddenMenuItems(user.hidden_menu_items)
    }
  }, [user])

  // 切換選單項目顯示/隱藏
  const toggleMenuItem = (itemId: string) => {
    setHiddenMenuItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  // 儲存設定
  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    try {
      await updateEmployee(user.id, {
        hidden_menu_items: hiddenMenuItems,
      })
      await alert(LABELS.MENU_SETTINGS_SAVED, 'success')
    } catch (error) {
      await alert(LABELS.SAVE_FAILED, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 重設為預設值（全部顯示）
  const handleReset = async () => {
    const confirmed = await confirm(LABELS.RESET_CONFIRM_MESSAGE, {
      title: LABELS.RESET_MENU_TITLE,
      type: 'warning',
    })
    if (confirmed) {
      setHiddenMenuItems([])
    }
  }

  // 按分類渲染選單項目
  const renderMenuCategory = (category: MenuItem['category']) => {
    const items = getMenuItemsByCategory(category).filter(item => item.canHide)

    if (items.length === 0) return null

    return (
      <Card key={category}>
        <CardHeader>
          <CardTitle className="text-lg">{MENU_CATEGORIES[category]}</CardTitle>
          <CardDescription>{LABELS.SELECT_SIDEBAR_FEATURES}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map(item => {
            const isHidden = hiddenMenuItems.includes(item.id)
            return (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor={item.id} className="text-sm font-medium">
                    {item.label}
                  </Label>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <Switch
                  id={item.id}
                  checked={!isHidden}
                  onCheckedChange={() => toggleMenuItem(item.id)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{LABELS.MENU_SETTINGS}</h1>
        <p className="text-muted-foreground mt-2">
          {LABELS.MENU_SETTINGS_DESC}
        </p>
      </div>

      <div className="space-y-4">
        {/* 核心功能說明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{LABELS.CORE_FEATURES}</CardTitle>
            <CardDescription>
              {LABELS.CORE_FEATURES_DESC}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 業務管理 */}
        {renderMenuCategory('business')}

        {/* 財務管理 */}
        {renderMenuCategory('finance')}

        {/* 人力資源 */}
        {renderMenuCategory('hr')}

        {/* 系統設定 */}
        {renderMenuCategory('settings')}
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
          <Save size={16} />
          {isSaving ? LABELS.SAVING : LABELS.SAVE_SETTINGS}
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw size={16} />
          {LABELS.RESET_TO_DEFAULT}
        </Button>
      </div>

      {/* 統計資訊 */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {LABELS.HIDDEN_ITEMS_COUNT.replace('{count}', hiddenMenuItems.length.toString())}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
