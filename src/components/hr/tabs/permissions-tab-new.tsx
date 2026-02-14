'use client'

import { UI_DELAYS } from '@/lib/constants/timeouts'
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Employee, SYSTEM_PERMISSIONS } from '@/stores/types'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { Check, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLES, type UserRole, getAllRoles, getRoleConfig } from '@/lib/rbac-config'
import { alert } from '@/lib/ui/alert-dialog'
import { COMP_HR_LABELS } from '../constants/labels'

interface PermissionsTabProps {
  employee: Employee
}

export const PermissionsTabNew = forwardRef<{ handleSave: () => void }, PermissionsTabProps>(
  ({ employee }, ref) => {
    const { user, setUser } = useAuthStore()
    const { update: updateUser } = useUserStore()

    // 角色（複選）
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
      (employee.roles as UserRole[]) || []
    )

    // 額外權限（可複選，用於特殊需求）
    const [extraPermissions, setExtraPermissions] = useState<string[]>(
      employee.permissions || []
    )

    const [isSaving, setIsSaving] = useState(false)
    const [showSavedMessage, setShowSavedMessage] = useState(false)

    useEffect(() => {
      setSelectedRoles((employee.roles as UserRole[]) || [])
      setExtraPermissions(employee.permissions || [])
    }, [employee.roles, employee.permissions])

    const handleRoleToggle = async (role: UserRole) => {
      const newRoles = selectedRoles.includes(role)
        ? selectedRoles.filter(r => r !== role)
        : [...selectedRoles, role]

      // 至少要有一個角色
      if (newRoles.length === 0) {
        return
      }

      setSelectedRoles(newRoles)
      await saveRoles(newRoles)
    }

    const saveRoles = async (roles: UserRole[]) => {
      setIsSaving(true)
      try {
        // 合併所有角色的預設權限
        const allPermissions = new Set<string>()
        roles.forEach(role => {
          const roleConfig = getRoleConfig(role)
          if (roleConfig?.permissions.includes('*')) {
            allPermissions.add('*')
          } else {
            roleConfig?.permissions.forEach(p => allPermissions.add(p))
          }
        })
        const defaultPermissions = Array.from(allPermissions)

        // 更新 roles（複選）、permissions（合併權限）和 preferred_features
        await updateUser(employee.id, {
          roles: roles as unknown as typeof employee.roles,
          permissions: defaultPermissions as unknown as typeof employee.permissions,
          preferred_features: defaultPermissions as unknown as typeof employee.preferred_features,
        })

        // 如果修改的是當前登入用戶，更新 auth-store
        if (user && user.id === employee.id) {
          setUser({
            ...user,
            roles: roles as unknown as typeof user.roles,
            permissions: defaultPermissions as unknown as typeof user.permissions,
            preferred_features: defaultPermissions as unknown as typeof user.preferred_features,
          })
        }

        // 更新額外權限
        setExtraPermissions(defaultPermissions)

        // 顯示儲存成功訊息
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        void alert(COMP_HR_LABELS.儲存失敗_請稍後再試, 'error')
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
        void alert(COMP_HR_LABELS.儲存失敗_請稍後再試, 'error')
      } finally {
        setIsSaving(false)
      }
    }

    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        // 權限已自動儲存
      },
    }))

    // 取得第一個角色的配置（用於顯示）
    const primaryRole = selectedRoles[0] || null
    const roleConfig = primaryRole ? getRoleConfig(primaryRole) : null

    // 合併所有已選角色的權限
    const rolePermissions = (() => {
      const allPerms = new Set<string>()
      selectedRoles.forEach(role => {
        const config = getRoleConfig(role)
        config?.permissions.forEach(p => allPerms.add(p))
      })
      return Array.from(allPerms)
    })()

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
          <div className="bg-status-success-bg border border-status-success rounded-lg p-3 flex items-center gap-2 text-status-success">
            <Check size={16} />
            <span className="text-sm font-medium">✓ 已自動儲存</span>
          </div>
        )}

        {/* 儲存中提示 */}
        {isSaving && (
          <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-3 flex items-center gap-2 text-morandi-primary">
            <div className="animate-spin w-4 h-4 border-2 border-morandi-primary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">{COMP_HR_LABELS.SAVING_4983}</span>
          </div>
        )}

        {/* 角色選擇（複選） */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-semibold text-lg text-morandi-primary">{COMP_HR_LABELS.SELECT_1620}</h4>
            <span className="text-xs text-morandi-secondary bg-morandi-container/30 px-2 py-1 rounded">{COMP_HR_LABELS.LABEL_9521}</span>
            <div className="group relative">
              <Info size={16} className="text-morandi-secondary cursor-help" />
              <div className="absolute left-0 top-6 w-64 bg-foreground text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {COMP_HR_LABELS.MANAGE_5279}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAllRoles()
              .filter(role => {
                // 非超級管理員不能看到 super_admin 角色選項
                const currentUserRoles = user?.roles || []
                const currentUserIsSuperAdmin = currentUserRoles.includes('super_admin')
                if (role.id === 'super_admin' && !currentUserIsSuperAdmin) {
                  return false
                }
                return true
              })
              .map(role => {
              const isSelected = selectedRoles.includes(role.id)
              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleToggle(role.id)}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    isSelected
                      ? 'border-morandi-gold bg-morandi-gold/5'
                      : 'border-border bg-card hover:border-morandi-gold/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center',
                          isSelected
                            ? 'border-morandi-gold bg-morandi-gold'
                            : 'border-border'
                        )}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <h5 className="font-medium text-morandi-primary">{role.label}</h5>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full border',
                        role.color
                      )}
                    >
                      {role.canCrossWorkspace ? COMP_HR_LABELS.跨空間 : role.canManageWorkspace ? COMP_HR_LABELS.管理員 : COMP_HR_LABELS.一般}
                    </span>
                  </div>
                  <p className="text-sm text-morandi-secondary">{role.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 已選角色的權限（唯讀顯示） */}
        {selectedRoles.length > 0 && (
          <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle size={18} className="text-morandi-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="font-medium text-morandi-primary mb-1">
                  已選角色：{selectedRoles.map(r => getRoleConfig(r)?.label).join('、')}
                </h5>
                <p className="text-sm text-morandi-secondary mb-3">
                  {COMP_HR_LABELS.ADD_9036}
                </p>
                <div className="flex flex-wrap gap-2">
                  {rolePermissions.includes('*') ? (
                    <span className="px-3 py-1 bg-morandi-primary/10 border border-morandi-primary/20 rounded-full text-sm text-morandi-primary font-medium">
                      {COMP_HR_LABELS.LABEL_7322}
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
        <details className="bg-card rounded-lg border border-border">
          <summary className="p-4 cursor-pointer font-medium text-morandi-primary hover:bg-morandi-container/10">
            {COMP_HR_LABELS.ADD_223}
          </summary>
          <div className="p-4 pt-0 border-t border-border space-y-4">
            <p className="text-sm text-morandi-secondary mb-4">
              {COMP_HR_LABELS.LABEL_8504}
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
                              : 'border-border bg-card cursor-pointer hover:bg-morandi-container/20'
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
