'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user-store'
import { cn } from '@/lib/utils'
import { User, DollarSign, Shield, X, Edit, Save } from 'lucide-react'

// 導入分頁組件
import { BasicInfoTab } from './tabs/basic-info'
import { SalaryTab } from './tabs/salary-tab'
import { PermissionsTab } from './tabs/permissions-tab'
import { SYSTEM_PERMISSIONS } from '@/stores/types'

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
    { key: 'basic' as const, label: '基本資料', icon: User },
    { key: 'salary' as const, label: '薪資', icon: DollarSign },
    { key: 'permissions' as const, label: '權限', icon: Shield },
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
            <span>底薪：NT$ {baseSalary.toLocaleString()}</span>
            <span>津貼：NT$ {totalAllowances.toLocaleString()}</span>
            <span className="text-morandi-primary font-medium">
              總薪資：NT$ {(baseSalary + totalAllowances).toLocaleString()}
            </span>
          </div>
        )
      case 'permissions':
        // 如果有 admin 權限，視為全選
        const hasAdmin = employee.permissions.includes('admin')
        const permissionCount = hasAdmin ? SYSTEM_PERMISSIONS.length : employee.permissions.length

        return (
          <div className="text-morandi-muted">
            已授權 {permissionCount} / {SYSTEM_PERMISSIONS.length} 項功能
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
      alert('儲存失敗，請稍後再試')
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
        return <PermissionsTab employee={employee} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-border">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-morandi-container/30 flex items-center justify-center">
              {employee.avatar ? (
                <img
                  src={employee.avatar}
                  alt={employee.display_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User size={24} className="text-morandi-secondary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-morandi-primary">
                {employee.display_name || (employee as unknown).chinese_name || '未命名員工'}
              </h2>
              <p className="text-morandi-secondary">{employee.employee_number}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

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
                  <Button size="sm" onClick={handleSave}>
                    <Save size={14} className="mr-1" />
                    儲存
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X size={14} className="mr-1" />
                    取消
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit size={14} className="mr-1" />
                  編輯
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 分頁內容 */}
        <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
      </div>
    </div>
  )
}
