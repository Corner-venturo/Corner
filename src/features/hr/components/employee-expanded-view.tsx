'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUserStore } from '@/stores/user-store'
import { cn } from '@/lib/utils'
import { User, DollarSign, Shield, X, Edit, Save, Check } from 'lucide-react'
import { CurrencyCell } from '@/components/table-cells'
import { alert } from '@/lib/ui/alert-dialog'

// 導入分頁組件
import { BasicInfoTab } from './tabs/basic-info'
import { SalaryTab } from './tabs/salary-tab'
import { PermissionsTabNew } from './tabs/permissions-tab-new'
import { SYSTEM_PERMISSIONS } from '@/stores/types'
import { getRoleConfig, type UserRole } from '@/lib/rbac-config'
import { COMP_HR_LABELS } from '@/features/hr/constants/labels'

interface EmployeeExpandedViewProps {
  employee_id: string
  onClose: () => void
}

type EmployeeTab = 'basic' | 'salary' | 'permissions'

export function EmployeeExpandedView({ employee_id, onClose }: EmployeeExpandedViewProps) {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('basic')
  const [isEditing, setIsEditing] = useState(false)
  const basicInfoTabRef = useRef<{ handleSave: () => void }>(null)
  const salaryTabRef = useRef<{ handleSave: () => void }>(null)

  // ✨ 使用 Zustand selector 來自動訂閱員工資料更新
  const employee = useUserStore(state => state.items.find(u => u.id === employee_id))

  if (!employee) {
    return null
  }

  const tabs = [
    { key: 'basic' as const, label: COMP_HR_LABELS.基本資料, icon: User },
    { key: 'salary' as const, label: COMP_HR_LABELS.薪資, icon: DollarSign },
    { key: 'permissions' as const, label: COMP_HR_LABELS.權限, icon: Shield },
  ]

  const renderTabStats = () => {
    switch (activeTab) {
      case 'basic':
        return null
      case 'salary':
        const allowances = employee.salary_info?.allowances || []
        const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0)
        const baseSalary = employee.salary_info?.base_salary || 0
        return (
          <div className="flex items-center gap-4 text-morandi-muted">
            <span className="flex items-center gap-1">底薪：<CurrencyCell amount={baseSalary} /></span>
            <span className="flex items-center gap-1">津貼：<CurrencyCell amount={totalAllowances} /></span>
            <span className="text-morandi-primary font-medium flex items-center gap-1">
              總薪資：<CurrencyCell amount={baseSalary + totalAllowances} />
            </span>
          </div>
        )
      case 'permissions':
        const userRole = employee.roles?.[0]
        const roleConfig = userRole ? getRoleConfig(userRole as UserRole) : null
        const roleLabel = roleConfig?.label || COMP_HR_LABELS.未設定
        const permissionCount = roleConfig?.permissions.includes('*')
          ? SYSTEM_PERMISSIONS.length
          : (employee.permissions?.length || 0)

        return (
          <div className="flex items-center gap-4 text-morandi-muted">
            <span>角色：<span className="font-medium text-morandi-primary">{roleLabel}</span></span>
            <span>{COMP_HR_LABELS.LABEL_4949}{permissionCount} / {SYSTEM_PERMISSIONS.length} 項功能</span>
          </div>
        )
      default:
        return null
    }
  }

  const handleSave = async () => {
    try {
      // 根據不同頁面調用對應的儲存函數
      if (activeTab === 'basic' && basicInfoTabRef.current) {
        await basicInfoTabRef.current.handleSave()
      } else if (activeTab === 'salary' && salaryTabRef.current) {
        await salaryTabRef.current.handleSave()
      }

      // 重新載入員工資料以確保顯示最新內容
      const { fetchAll } = useUserStore.getState()
      await fetchAll()

      setIsEditing(false)
    } catch (error) {
      void alert(COMP_HR_LABELS.儲存失敗_請稍後再試, 'error')
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <BasicInfoTab
            ref={basicInfoTabRef}
            employee={employee}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        )
      case 'salary':
        return (
          <SalaryTab
            ref={salaryTabRef}
            employee={employee}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        )
      case 'permissions':
        return <PermissionsTabNew ref={null} employee={employee} />
      default:
        return null
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent level={1} className="max-w-6xl h-[90vh] flex flex-col overflow-hidden p-0">
        {/* 標題列 */}
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-morandi-container/30 flex items-center justify-center">
              {employee.avatar ? (
                <img src={employee.avatar}
                  alt={employee.display_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User size={24} className="text-morandi-secondary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-morandi-primary">
                {employee.display_name || employee.chinese_name || COMP_HR_LABELS.未命名員工}
              </DialogTitle>
              <p className="text-morandi-secondary">{employee.employee_number}</p>
            </div>
          </div>
        </DialogHeader>

        {/* 分頁導航 */}
        <div className="flex items-center justify-between border-b border-border px-6 flex-shrink-0">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                    activeTab === tab.key
                      ? 'text-morandi-primary border-b-2 border-morandi-gold'
                      : 'text-morandi-secondary hover:text-morandi-primary'
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* 中間統計資訊區域 */}
          <div className="flex items-center gap-6 text-sm">{renderTabStats()}</div>

          {/* 編輯按鈕區域（權限分頁不顯示） */}
          {activeTab !== 'permissions' && (
            <div className="py-3">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="gap-1">
                    <Check size={14} />
                    {COMP_HR_LABELS.SAVE}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="gap-1">
                    <X size={14} />
                    {COMP_HR_LABELS.取消}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1">
                  <Edit size={14} />
                  {COMP_HR_LABELS.EDIT}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 分頁內容 */}
        <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
