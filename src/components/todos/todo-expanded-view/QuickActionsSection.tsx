'use client'

import { logger } from '@/lib/utils/logger'
import React, { useEffect, useRef, lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { Receipt, FileText, Users, Plane, UserPlus } from 'lucide-react'
import { QuickActionsSectionProps, QuickActionContentProps, QuickActionTabConfig } from './types'
import { alert } from '@/lib/ui/alert-dialog'
// 使用懶加載避免打包問題
const QuickReceipt = lazy(() =>
  import('../quick-actions/quick-receipt').then(m => ({ default: m.QuickReceipt }))
)
const QuickDisbursement = lazy(() =>
  import('../quick-actions/quick-disbursement').then(m => ({ default: m.QuickDisbursement }))
)
const QuickGroup = lazy(() =>
  import('../quick-actions/quick-group').then(m => ({ default: m.QuickGroup }))
)
const QuickPNR = lazy(() =>
  import('../quick-actions/quick-pnr').then(m => ({ default: m.QuickPNR }))
)

const quickActionTabs: QuickActionTabConfig[] = [
  { key: 'receipt' as const, label: '收款', icon: Receipt },
  { key: 'invoice' as const, label: '請款', icon: FileText },
  { key: 'group' as const, label: '開團', icon: Users },
  { key: 'pnr' as const, label: 'PNR', icon: Plane },
  { key: 'share' as const, label: '共享', icon: UserPlus },
]

export function QuickActionsSection({ activeTab, onTabChange }: QuickActionsSectionProps) {
  return (
    <div className="mb-4 bg-card border border-border rounded-xl p-2 shadow-sm">
      <div className="flex gap-2">
        {quickActionTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all flex-1 rounded-lg',
                activeTab === tab.key
                  ? 'bg-morandi-container/30 text-morandi-primary'
                  : 'bg-transparent text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/10'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function QuickActionContent({ activeTab, todo, onUpdate }: QuickActionContentProps) {
  const { items: employees, fetchAll } = useUserStore()
  const { user: currentUser } = useAuthStore()
  const [shareData, setShareData] = React.useState({
    targetUserId: '',
    permission: 'view' as 'view' | 'edit',
    message: '',
  })
  const [isSharing, setIsSharing] = React.useState(false)

  // 收款功能的資料載入狀態
  const [isLoadingReceipt, setIsLoadingReceipt] = React.useState(false)

  // 共享待辦的處理函數
  const handleShareTodo = React.useCallback(async () => {
    if (!shareData.targetUserId) {
      void alert('請選擇要共享的成員', 'warning')
      return
    }

    setIsSharing(true)
    try {
      // 更新 assignee 和 visibility
      const currentVisibility = todo.visibility || []
      const newVisibility = currentVisibility.includes(shareData.targetUserId)
        ? currentVisibility
        : [...currentVisibility, shareData.targetUserId]

      if (onUpdate) {
        await onUpdate({
          assignee: shareData.permission === 'edit' ? shareData.targetUserId : todo.assignee,
          visibility: newVisibility,
        })
      }

      // 重置表單
      setShareData({ targetUserId: '', permission: 'view', message: '' })
      await alert('待辦事項已成功共享！', 'success')
    } catch (error) {
      void alert('共享失敗，請稍後再試', 'error')
    } finally {
      setIsSharing(false)
    }
  }, [shareData, todo, onUpdate])

  // 使用 ref 建立穩定的函數參考
  const fetchAllRef = useRef(fetchAll)

  // 更新 ref 當 fetchAll 改變時
  useEffect(() => {
    fetchAllRef.current = fetchAll
  }, [fetchAll])

  // 只在共享分頁時載入員工資料
  useEffect(() => {
    if (activeTab === 'share' && employees.length === 0) {
      fetchAllRef.current()
    }
  }, [activeTab, employees.length])

  // 只在收款分頁時載入團體和訂單資料
  useEffect(() => {
    const loadReceiptData = async () => {
      if (activeTab === 'receipt') {
        setIsLoadingReceipt(true)
        try {
          const { useTourStore, useOrderStore } = await import('@/stores')
          const tourStore = useTourStore.getState()
          const orderStore = useOrderStore.getState()

          // 只在資料為空時才載入
          if (tourStore.items.length === 0) {
            await tourStore.fetchAll()
          }
          if (orderStore.items.length === 0) {
            await orderStore.fetchAll()
          }
        } catch (error) {
          logger.error('載入收款資料失敗:', error)
        } finally {
          setIsLoadingReceipt(false)
        }
      }
    }

    loadReceiptData()
  }, [activeTab])

  // 過濾掉自己
  const otherEmployees = employees.filter(emp => emp.id !== currentUser?.id)

  // 加載中的元件
  const LoadingFallback = (
    <div className="flex items-center justify-center h-full">
      <div className="text-sm text-morandi-secondary">載入中...</div>
    </div>
  )

  switch (activeTab) {
    case 'receipt':
      if (isLoadingReceipt) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-morandi-secondary">載入團體和訂單資料中...</div>
          </div>
        )
      }
      return (
        <Suspense fallback={LoadingFallback}>
          <QuickReceipt />
        </Suspense>
      )

    case 'invoice':
      return (
        <Suspense fallback={LoadingFallback}>
          <QuickDisbursement />
        </Suspense>
      )

    case 'group':
      return (
        <Suspense fallback={LoadingFallback}>
          <QuickGroup />
        </Suspense>
      )

    case 'pnr':
      return (
        <Suspense fallback={LoadingFallback}>
          <QuickPNR todo={todo} onUpdate={onUpdate} />
        </Suspense>
      )

    case 'share':
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-morandi-container/20">
            <div className="p-1.5 bg-morandi-gold/10 rounded-lg">
              <UserPlus size={16} className="text-morandi-gold" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-morandi-primary">共享待辦</h5>
              <p className="text-xs text-morandi-secondary">分享這個任務給團隊成員</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">共享給</label>
              <Select
                value={shareData.targetUserId}
                onValueChange={value => setShareData(prev => ({ ...prev, targetUserId: value }))}
              >
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇成員" />
                </SelectTrigger>
                <SelectContent>
                  {otherEmployees.length > 0 ? (
                    otherEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.display_name || emp.english_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      尚無其他員工
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">權限</label>
              <Select
                value={shareData.permission}
                onValueChange={(value: 'view' | 'edit') =>
                  setShareData(prev => ({ ...prev, permission: value }))
                }
              >
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇權限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">僅檢視</SelectItem>
                  <SelectItem value="edit">可編輯</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">
                訊息（選填）
              </label>
              <Textarea
                placeholder="給成員的訊息..."
                rows={2}
                className="shadow-sm text-xs"
                value={shareData.message}
                onChange={e => setShareData(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <Button
              onClick={handleShareTodo}
              disabled={isSharing || !shareData.targetUserId}
              className="w-full bg-morandi-gold hover:bg-morandi-gold/90 shadow-md h-9 text-xs"
            >
              <UserPlus size={14} className="mr-1.5" />
              {isSharing ? '共享中...' : '共享待辦'}
            </Button>
          </div>
        </div>
      )

    default:
      return null
  }
}
