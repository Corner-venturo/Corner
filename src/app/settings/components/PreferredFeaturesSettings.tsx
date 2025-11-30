'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { Check, Star, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { User } from '@/stores/types'

// 定義所有可選功能
interface FeatureOption {
  id: string
  label: string
  description: string
  category: string
  icon?: string
}

const AVAILABLE_FEATURES: FeatureOption[] = [
  // 核心功能
  { id: 'calendar', label: '行事曆', description: '個人及團隊行程管理', category: '核心功能' },
  { id: 'workspace', label: '工作空間', description: '工作空間資訊與設定', category: '核心功能' },
  { id: 'todos', label: '待辦事項', description: '個人待辦清單', category: '核心功能' },

  // 業務功能
  { id: 'tours', label: '旅遊團', description: '旅遊團管理與行程規劃', category: '業務功能' },
  { id: 'orders', label: '訂單', description: '客戶訂單管理', category: '業務功能' },
  { id: 'quotes', label: '報價單', description: '報價單製作與管理', category: '業務功能' },
  { id: 'customers', label: '顧客管理', description: '客戶資料維護', category: '業務功能' },
  { id: 'itinerary', label: '行程管理', description: '旅遊行程規劃', category: '業務功能' },
  { id: 'confirmations', label: '確認單管理', description: '確認單製作與管理', category: '業務功能' },
  { id: 'contracts', label: '合約管理', description: '合約簽署與管理', category: '業務功能' },
  { id: 'visas', label: '簽證管理', description: '簽證申請追蹤', category: '業務功能' },

  // 財務功能
  { id: 'finance', label: '財務系統', description: '財務管理總覽', category: '財務功能' },
  { id: 'payments', label: '收款管理', description: '客戶付款追蹤', category: '財務功能' },
  { id: 'requests', label: '請款管理', description: '內部請款作業', category: '財務功能' },
  { id: 'disbursement', label: '出納管理', description: '款項支付管理', category: '財務功能' },
  { id: 'accounting', label: '記帳', description: '會計記帳作業', category: '財務功能' },
  { id: 'vouchers', label: '會計傳票', description: '會計憑證管理', category: '財務功能' },
  { id: 'reports', label: '報表管理', description: '財務報表產生', category: '財務功能' },

  // 資料管理
  { id: 'database', label: '資料管理', description: '系統資料維護', category: '資料管理' },

  // 管理功能
  { id: 'hr', label: '人資管理', description: '員工管理與權限設定', category: '管理功能' },
  { id: 'settings', label: '系統設定', description: '個人與系統設定', category: '管理功能' },
]

export function PreferredFeaturesSettings() {
  const { user, login } = useAuthStore()
  const { update: updateUser } = useUserStore()

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showSavedMessage, setShowSavedMessage] = useState(false)

  // 初始化：載入使用者的 preferred_features
  useEffect(() => {
    if (user?.preferred_features) {
      setSelectedFeatures(user.preferred_features)
    } else {
      // 沒有設定時，使用所有有權限的功能
      const userPermissions = user?.permissions || []
      const defaultFeatures = AVAILABLE_FEATURES
        .filter(f => userPermissions.includes(f.id) || userPermissions.includes('*'))
        .map(f => f.id)
      setSelectedFeatures(defaultFeatures)
    }
  }, [user])

  const handleToggleFeature = async (featureId: string) => {
    const newFeatures = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter(id => id !== featureId)
      : [...selectedFeatures, featureId]

    setSelectedFeatures(newFeatures)
    await savePreferences(newFeatures)
  }

  const savePreferences = async (features: string[]) => {
    if (!user) return

    setIsSaving(true)
    try {
      // 更新資料庫
      await updateUser(user.id, { preferred_features: features })

      // 同步更新 IndexedDB
      try {
        const { localDB } = await import('@/lib/db')
        const { TABLES } = await import('@/lib/db/schemas')

        const existingEmployee = await localDB.read(TABLES.EMPLOYEES, user.id) as User | undefined
        if (existingEmployee) {
          const updatedEmployee: User = {
            ...existingEmployee,
            preferred_features: features,
            updated_at: new Date().toISOString(),
          }
          await localDB.put(TABLES.EMPLOYEES, updatedEmployee)
        }
      } catch (error) {
        // Ignore error
      }

      // 更新 auth-store 中的 user
      const updatedUser: User = {
        ...user,
        preferred_features: features,
      }
      login(updatedUser)

      // 顯示儲存成功訊息
      setShowSavedMessage(true)
      setTimeout(() => setShowSavedMessage(false), 2000)
    } catch (error) {
      alert('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToDefaults = async () => {
    if (!user) return

    // 根據角色重置為預設功能
    const role = user.roles?.[0]
    let defaultFeatures: string[] = []

    switch (role) {
      case 'admin':
        defaultFeatures = ['tours', 'orders', 'quotes', 'customers', 'calendar', 'hr']
        break
      case 'tour_leader':
        defaultFeatures = ['tours', 'orders', 'calendar']
        break
      case 'sales':
        defaultFeatures = ['quotes', 'customers', 'orders', 'tours', 'calendar']
        break
      case 'accountant':
        defaultFeatures = ['finance', 'payments', 'orders', 'tours', 'calendar']
        break
      case 'assistant':
        defaultFeatures = ['orders', 'customers', 'calendar', 'todos']
        break
      default:
        defaultFeatures = ['calendar', 'todos', 'workspace']
    }

    setSelectedFeatures(defaultFeatures)
    await savePreferences(defaultFeatures)
  }

  // 按類別分組功能
  const featuresByCategory = AVAILABLE_FEATURES.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = []
    }
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, FeatureOption[]>)

  const categories = Object.keys(featuresByCategory)

  // 檢查使用者是否有該功能的權限
  const hasPermission = (featureId: string) => {
    const userPermissions = user?.permissions || []
    return userPermissions.includes('*') || userPermissions.includes(featureId)
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border bg-morandi-container/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-morandi-primary mb-1">
              常用功能設定
            </h3>
            <p className="text-sm text-morandi-secondary">
              選擇你常用的功能，側邊欄將只顯示這些項目，讓介面更簡潔
            </p>
          </div>
          {showSavedMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <Check size={14} />
              <span className="text-sm font-medium">已儲存</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 提示資訊 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">說明</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>選擇的功能會顯示在側邊欄，未選擇的會被隱藏</li>
              <li>此設定不影響你的實際權限，只是個人化介面顯示</li>
              <li>你只能選擇有權限的功能</li>
              <li>變更會立即儲存並生效</li>
            </ul>
          </div>
        </div>

        {/* 快速操作按鈕 */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            disabled={isSaving}
          >
            <Star size={14} className="mr-1" />
            恢復角色預設
          </Button>
          <span className="text-xs text-morandi-secondary">
            已選擇 {selectedFeatures.length} 個功能
          </span>
        </div>

        {/* 功能選項（按類別） */}
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-morandi-primary border-b border-border pb-2">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuresByCategory[category].map(feature => {
                const isSelected = selectedFeatures.includes(feature.id)
                const canSelect = hasPermission(feature.id)

                return (
                  <div
                    key={feature.id}
                    onClick={() => canSelect && handleToggleFeature(feature.id)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all',
                      canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                      isSelected
                        ? 'border-morandi-gold bg-morandi-gold/10'
                        : 'border-border bg-white hover:border-morandi-gold/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                          isSelected
                            ? 'border-morandi-gold bg-morandi-gold text-white'
                            : 'border-morandi-muted'
                        )}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-morandi-primary text-sm mb-0.5">
                          {feature.label}
                          {!canSelect && <span className="text-xs ml-1 text-morandi-secondary">(無權限)</span>}
                        </p>
                        <p className="text-xs text-morandi-secondary line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
