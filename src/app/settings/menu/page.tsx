'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { MENU_ITEMS, MENU_CATEGORIES, getMenuItemsByCategory } from '@/constants/menu-items'
import type { MenuItem } from '@/constants/menu-items'

export default function MenuSettingsPage() {
  const { user } = useAuthStore()
  const { update: updateUser } = useUserStore()
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
      await updateUser(user.id, {
        hidden_menu_items: hiddenMenuItems,
      })
      alert('選單設定已儲存')
    } catch (error) {
      alert('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  // 重設為預設值（全部顯示）
  const handleReset = () => {
    if (confirm('確定要重設為預設值嗎？所有選單都會顯示。')) {
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
          <CardDescription>選擇要在側邊欄顯示的功能</CardDescription>
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
        <h1 className="text-3xl font-bold">選單設定</h1>
        <p className="text-muted-foreground mt-2">
          自訂側邊欄顯示的功能選單。隱藏不常用的功能，讓工作區更整潔。
        </p>
      </div>

      <div className="space-y-4">
        {/* 核心功能說明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">核心功能</CardTitle>
            <CardDescription>
              儀表板、工作區、設定等核心功能無法隱藏，確保系統正常運作。
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
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? '儲存中...' : '儲存設定'}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          重設為預設
        </Button>
      </div>

      {/* 統計資訊 */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            目前隱藏 <span className="font-bold text-foreground">{hiddenMenuItems.length}</span> 個選單項目
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
