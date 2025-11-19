'use client'

import { UI_DELAYS, SYNC_DELAYS } from '@/lib/constants/timeouts'

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Employee, SYSTEM_PERMISSIONS } from '@/stores/types'
import { useUserStore, userStoreHelpers } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PermissionsTabProps {
  employee: Employee
}

export const PermissionsTab = forwardRef<{ handleSave: () => void }, PermissionsTabProps>(
  ({ employee }, ref) => {
    const { user, login } = useAuthStore()
    const { update: updateUser } = useUserStore()
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(employee.permissions)
    const [selectedRoles, setSelectedRoles] = useState<string[]>(employee.roles || [])
    const [isSaving, setIsSaving] = useState(false)
    const [showSavedMessage, setShowSavedMessage] = useState(false)

    useEffect(() => {
      setSelectedPermissions(employee.permissions)
      setSelectedRoles(employee.roles || [])
    }, [employee.permissions, employee.roles])

    const handlePermissionToggle = async (permissionId: string) => {
      // 切換權限（移除自動全選邏輯）
      const newPermissions = selectedPermissions.includes(permissionId)
        ? selectedPermissions.filter(id => id !== permissionId)
        : [...selectedPermissions, permissionId]

      setSelectedPermissions(newPermissions)

      // 自動儲存
      await autoSave(newPermissions)
    }

    const handleRoleToggle = async (
      role: 'admin' | 'employee' | 'user' | 'tour_leader' | 'sales' | 'accountant' | 'assistant'
    ) => {
      const newRoles = selectedRoles.includes(role)
        ? selectedRoles.filter(r => r !== role)
        : [...selectedRoles, role]

      setSelectedRoles(newRoles)
      await saveRoles(
        newRoles as (
          | 'admin'
          | 'employee'
          | 'user'
          | 'tour_leader'
          | 'sales'
          | 'accountant'
          | 'assistant'
        )[]
      )
    }

    const saveRoles = async (
      roles: (
        | 'admin'
        | 'employee'
        | 'user'
        | 'tour_leader'
        | 'sales'
        | 'accountant'
        | 'assistant'
      )[]
    ) => {
      setIsSaving(true)
      try {
        await updateUser(employee.id, { roles })

        // 同步更新 IndexedDB
        try {
          const { localDB } = await import('@/lib/db')
          const { TABLES } = await import('@/lib/db/schemas')

          const existingEmployee = await localDB.read(TABLES.EMPLOYEES, employee.id)
          if (existingEmployee) {
            await localDB.put(TABLES.EMPLOYEES, {
              ...existingEmployee,
              roles: roles as any,
              updated_at: new Date().toISOString(),
            })
          }
        } catch (error) {
          // Ignore error
        }

        // 如果修改的是當前登入用戶，更新 auth-store 和 LocalProfile
        if (user && user.id === employee.id) {
          // 更新 auth-store
          login({
            ...user,
            roles,
          })

          // 同步更新 LocalProfile（角色卡）
          try {
            const { useLocalAuthStore } = await import('@/lib/auth/local-auth-manager')
            const localAuthStore = useLocalAuthStore.getState()
            const currentProfile = localAuthStore.currentProfile

            if (currentProfile && currentProfile.id === employee.id && 'updateProfile' in localAuthStore) {
              (localAuthStore.updateProfile as (id: string, data: Partial<Employee>) => void)(employee.id, {
                roles,
              })
            }
          } catch (error) {
            // Ignore error
          }
        }

        // 顯示儲存成功訊息
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        alert('儲存失敗，請稍後再試')
      } finally {
        setIsSaving(false)
      }
    }

    const autoSave = async (permissions: string[]) => {
      setIsSaving(true)
      try {
        await userStoreHelpers.updateUserPermissions(employee.id, permissions)

        // 同步更新 IndexedDB
        try {
          const { localDB } = await import('@/lib/db')
          const { TABLES } = await import('@/lib/db/schemas')

          const existingEmployee = await localDB.read(TABLES.EMPLOYEES, employee.id)
          if (existingEmployee) {
            await localDB.put(TABLES.EMPLOYEES, {
              ...existingEmployee,
              permissions,
              updated_at: new Date().toISOString(),
            })
          }
        } catch (error) {}

        // 如果修改的是當前登入用戶，更新 auth-store
        if (user && user.id === employee.id) {
          login({
            ...user,
            permissions,
          })
        }

        // 顯示儲存成功訊息
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        alert('儲存失敗，請稍後再試')
      } finally {
        setIsSaving(false)
      }
    }

    // 暴露空的 handleSave（保持相容性）
    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        // 權限已自動儲存，這裡不需要做任何事
      },
    }))

    // 按類別分組權限
    const permissionsByCategory = SYSTEM_PERMISSIONS.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = []
        }
        acc[permission.category].push(permission)
        return acc
      },
      {} as Record<string, typeof SYSTEM_PERMISSIONS>
    )

    const categories = Object.keys(permissionsByCategory)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _roleLabels = {
      admin: '管理員',
      employee: '員工',
      user: '普通使用者',
      tour_leader: '領隊',
      sales: '業務',
      accountant: '會計',
      assistant: '助理',
    }

    return (
      <div className="space-y-6">
        {/* 自動儲存提示 */}
        {showSavedMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
            <Check size={16} />
            <span className="text-sm font-medium">✓ 已自動儲存</span>
          </div>
        )}

        {/* 儲存中提示 */}
        {isSaving && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-blue-700">
            <div className="animate-spin w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">儲存中...</span>
          </div>
        )}

        {/* 角色選擇 */}
        <div className="bg-morandi-container/10 rounded-lg p-4">
          <h4 className="font-medium text-morandi-primary mb-3">附加身份標籤（可複選）</h4>
          <p className="text-xs text-morandi-muted mb-3">
            此標籤僅用於篩選，不影響實際權限功能。可勾選多個身份
          </p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="user"
                checked={selectedRoles.includes('user')}
                onChange={() => handleRoleToggle('user')}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">普通使用者</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="employee"
                checked={selectedRoles.includes('employee')}
                onChange={() => handleRoleToggle('employee')}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">員工</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="admin"
                checked={selectedRoles.includes('admin')}
                onChange={() => handleRoleToggle('admin')}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">管理員</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="tour_leader"
                checked={selectedRoles.includes('tour_leader')}
                onChange={() => handleRoleToggle('tour_leader')}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">領隊</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="sales"
                checked={selectedRoles.includes('sales')}
                onChange={() => handleRoleToggle('sales')}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">業務</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="accountant"
                checked={selectedRoles.includes('accountant')}
                onChange={() => handleRoleToggle('accountant')}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">會計</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="assistant"
                checked={selectedRoles.includes('assistant')}
                onChange={() => handleRoleToggle('assistant')}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">助理</span>
            </label>
          </div>
        </div>

        {/* 權限分類列表 */}
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="bg-morandi-container/10 rounded-lg p-4">
              <h4 className="font-medium text-morandi-primary mb-4 pb-2 border-b border-border/50">
                {category}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {permissionsByCategory[category].map(permission => {
                  // 如果有 admin 權限，視為全選
                  const hasAdmin = selectedPermissions.includes('admin')
                  const isSelected = hasAdmin || selectedPermissions.includes(permission.id)

                  return (
                    <div
                      key={permission.id}
                      onClick={() => handlePermissionToggle(permission.id)}
                      className={cn(
                        'flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer hover:bg-morandi-container/20',
                        isSelected
                          ? 'border-morandi-gold bg-morandi-gold/10'
                          : 'border-border bg-white'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                          isSelected
                            ? 'border-morandi-gold bg-morandi-gold text-white'
                            : 'border-morandi-muted'
                        )}
                      >
                        {isSelected && <Check size={10} />}
                      </div>
                      <p className="text-sm font-medium text-morandi-primary truncate">
                        {permission.label}
                      </p>
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
)

PermissionsTab.displayName = 'PermissionsTab'
