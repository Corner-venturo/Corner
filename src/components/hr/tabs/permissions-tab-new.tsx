'use client'

import { UI_DELAYS } from '@/lib/constants/timeouts'
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Employee, SYSTEM_PERMISSIONS } from '@/stores/types'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { Check, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLES, type UserRole, getAllRoles, getRoleConfig } from '@/lib/rbac-config'

interface PermissionsTabProps {
  employee: Employee
}

export const PermissionsTabNew = forwardRef<{ handleSave: () => void }, PermissionsTabProps>(
  ({ employee }, ref) => {
    const { user, setUser } = useAuthStore()
    const { update: updateUser } = useUserStore()

    // 主要角色（單選）
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(
      (employee.roles?.[0] as UserRole) || null
    )

    // 額外權限（可複選，用於特殊需求）
    const [extraPermissions, setExtraPermissions] = useState<string[]>(
      employee.permissions || []
    )

    const [isSaving, setIsSaving] = useState(false)
    const [showSavedMessage, setShowSavedMessage] = useState(false)

    useEffect(() => {
      // 從 employee.roles 取第一個作為主要角色
      const mainRole = employee.roles?.[0] as UserRole || null
      setSelectedRole(mainRole)
      setExtraPermissions(employee.permissions || [])
    }, [employee.roles, employee.permissions])

    const handleRoleChange = async (newRole: UserRole) => {
      setSelectedRole(newRole)
      await saveRole(newRole)
    }

    const saveRole = async (role: UserRole) => {
      setIsSaving(true)
      try {
        // 取得角色預設權限
        const roleConfig = getRoleConfig(role)
        const defaultPermissions = roleConfig?.permissions || []

        // 更新 roles（單一角色）、permissions（角色預設權限）和 preferred_features（側邊欄顯示）
        // preferred_features 設為與 permissions 相同，確保有權限的功能會顯示在側邊欄
        await updateUser(employee.id, {
          roles: [role] as unknown as typeof employee.roles,
          permissions: defaultPermissions as unknown as typeof employee.permissions,
          preferred_features: defaultPermissions as unknown as typeof employee.preferred_features,
        })

        // 同步更新 IndexedDB
        try {
          const { localDB } = await import('@/lib/db')
          const { TABLES } = await import('@/lib/db/schemas')

          const existingEmployee = await localDB.read(TABLES.EMPLOYEES, employee.id)
          if (existingEmployee) {
            await localDB.put(TABLES.EMPLOYEES, {
              ...existingEmployee,
              roles: [role],
              permissions: defaultPermissions,
              preferred_features: defaultPermissions,
              updated_at: new Date().toISOString(),
            } as unknown as Parameters<typeof localDB.put>[1])
          }
        } catch (_error) {
          // Ignore error
        }

        // 如果修改的是當前登入用戶，更新 auth-store
        if (user && user.id === employee.id) {
          setUser({
            ...user,
            roles: [role] as unknown as typeof user.roles,
            permissions: defaultPermissions as unknown as typeof user.permissions,
            preferred_features: defaultPermissions as unknown as typeof user.preferred_features,
          })
        }

        // 重置額外權限
        setExtraPermissions(defaultPermissions)

        // 顯示儲存成功訊息
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        alert('儲存失敗，請稍後再試')
      } finally {
        setIsSaving(false)
      }
    }

    const handleExtraPermissionToggle = async (permissionId: string) => {
      const newPermissions = extraPermissions.includes(permissionId)
        ? extraPermissions.filter(id => id !== permissionId)
        : [...extraPermissions, permissionId]

      setExtraPermissions(newPermissions)
      await saveExtraPermissions(newPermissions)
    }

    const saveExtraPermissions = async (permissions: string[]) => {
      setIsSaving(true)
      try {
        // 同時更新 permissions 和 preferred_features，確保側邊欄會顯示
        await updateUser(employee.id, {
          permissions,
          preferred_features: permissions,
        })

        // 同步更新 IndexedDB
        try {
          const { localDB } = await import('@/lib/db')
          const { TABLES } = await import('@/lib/db/schemas')

          const existingEmployee = await localDB.read(TABLES.EMPLOYEES, employee.id)
          if (existingEmployee) {
            await localDB.put(TABLES.EMPLOYEES, {
              ...existingEmployee,
              permissions: permissions,
              preferred_features: permissions,
              updated_at: new Date().toISOString(),
            } as unknown as Parameters<typeof localDB.put>[1])
          }
        } catch (_error) {}

        // 如果修改的是當前登入用戶，更新 auth-store
        if (user && user.id === employee.id) {
          setUser({
            ...user,
            permissions: permissions as unknown as typeof user.permissions,
            preferred_features: permissions as unknown as typeof user.preferred_features,
          })
        }

        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        alert('儲存失敗，請稍後再試')
      } finally {
        setIsSaving(false)
      }
    }

    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        // 權限已自動儲存
      },
    }))

    const roleConfig = selectedRole ? getRoleConfig(selectedRole) : null
    const rolePermissions = roleConfig?.permissions || []

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
          <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-3 flex items-center gap-2 text-morandi-primary">
            <div className="animate-spin w-4 h-4 border-2 border-morandi-primary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">儲存中...</span>
          </div>
        )}

        {/* 角色選擇（單選） */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-semibold text-lg text-morandi-primary">選擇職位角色</h4>
            <div className="group relative">
              <Info size={16} className="text-morandi-secondary cursor-help" />
              <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                角色決定該員工的職位和預設權限。選擇角色後，系統會自動配置相應的功能權限。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAllRoles().map(role => {
              const isSelected = selectedRole === role.id
              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    isSelected
                      ? 'border-morandi-gold bg-morandi-gold/5'
                      : 'border-border bg-white hover:border-morandi-gold/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          isSelected
                            ? 'border-morandi-gold bg-morandi-gold'
                            : 'border-gray-300'
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <h5 className="font-medium text-morandi-primary">{role.label}</h5>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full border',
                        role.color
                      )}
                    >
                      {role.canCrossWorkspace ? '跨空間' : role.canManageWorkspace ? '管理員' : '一般'}
                    </span>
                  </div>
                  <p className="text-sm text-morandi-secondary">{role.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 角色預設權限（唯讀顯示） */}
        {roleConfig && (
          <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle size={18} className="text-morandi-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="font-medium text-morandi-primary mb-1">
                  {roleConfig.label} 擁有以下功能權限
                </h5>
                <p className="text-sm text-morandi-secondary mb-3">
                  這些權限由角色自動配置，如需調整請變更角色或在下方新增額外權限
                </p>
                <div className="flex flex-wrap gap-2">
                  {rolePermissions.includes('*') ? (
                    <span className="px-3 py-1 bg-morandi-primary/10 border border-morandi-primary/20 rounded-full text-sm text-morandi-primary font-medium">
                      ⭐ 所有權限
                    </span>
                  ) : (
                    rolePermissions.map(perm => {
                      const permConfig = SYSTEM_PERMISSIONS.find(p => p.id === perm)
                      return (
                        <span
                          key={perm}
                          className="px-3 py-1 bg-morandi-primary/10 border border-morandi-primary/20 rounded-full text-sm text-morandi-primary"
                        >
                          {permConfig?.label || perm}
                        </span>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 額外權限（進階，可選） */}
        <details className="bg-white rounded-lg border border-border">
          <summary className="p-4 cursor-pointer font-medium text-morandi-primary hover:bg-morandi-container/10">
            進階：新增額外功能權限（選填）
          </summary>
          <div className="p-4 pt-0 border-t border-border space-y-4">
            <p className="text-sm text-morandi-secondary mb-4">
              如需賦予該員工角色以外的特殊權限，可在此勾選。一般情況下不需要調整。
            </p>

            {categories.map(category => (
              <div key={category} className="bg-morandi-container/10 rounded-lg p-4">
                <h4 className="font-medium text-morandi-primary mb-3 pb-2 border-b border-border/50">
                  {category}
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {permissionsByCategory[category].map(permission => {
                    const isDefault = rolePermissions.includes('*') || rolePermissions.includes(permission.id)
                    const isExtra = extraPermissions.includes(permission.id)
                    const isSelected = isDefault || isExtra

                    return (
                      <div
                        key={permission.id}
                        onClick={() => !isDefault && handleExtraPermissionToggle(permission.id)}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-lg border transition-all',
                          isDefault
                            ? 'border-morandi-secondary/30 bg-morandi-secondary/5 cursor-not-allowed opacity-60'
                            : isExtra
                              ? 'border-morandi-gold bg-morandi-gold/10 cursor-pointer'
                              : 'border-border bg-white cursor-pointer hover:bg-morandi-container/20'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                            isSelected
                              ? isDefault
                                ? 'border-morandi-secondary/50 bg-morandi-secondary/50 text-white'
                                : 'border-morandi-gold bg-morandi-gold text-white'
                              : 'border-morandi-muted'
                          )}
                        >
                          {isSelected && <Check size={10} />}
                        </div>
                        <p className="text-sm font-medium text-morandi-primary truncate">
                          {permission.label}
                          {isDefault && <span className="text-xs ml-1">(預設)</span>}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    )
  }
)

PermissionsTabNew.displayName = 'PermissionsTabNew'
