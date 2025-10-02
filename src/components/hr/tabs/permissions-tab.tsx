'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Employee, SYSTEM_PERMISSIONS } from '@/stores/types';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';
import { Shield, Check, X, Save, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionsTabProps {
  employee: Employee;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
}

export const PermissionsTab = forwardRef<{ handleSave: () => void }, PermissionsTabProps>(
  ({ employee, isEditing = false, setIsEditing }, ref) => {
    const { updateUserPermissions } = useUserStore();
    const { user, login } = useAuthStore();
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(employee.permissions);

    useEffect(() => {
      setSelectedPermissions(employee.permissions);
    }, [employee.permissions]);

    const handlePermissionToggle = (permissionId: string) => {
      if (!isEditing) return;

      // 如果勾選超級管理員，自動全選所有權限
      if (permissionId === 'super_admin') {
        const isSuperAdminSelected = selectedPermissions.includes('super_admin');
        if (!isSuperAdminSelected) {
          setSelectedPermissions(SYSTEM_PERMISSIONS.map(p => p.id));
        } else {
          setSelectedPermissions([]);
        }
        return;
      }

      setSelectedPermissions(prev => {
        const newPermissions = prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId];

        // 如果取消勾選任何權限，自動取消超級管理員
        if (prev.includes('super_admin') && !newPermissions.includes(permissionId)) {
          return newPermissions.filter(id => id !== 'super_admin');
        }

        return newPermissions;
      });
    };

    const handleSave = async () => {
      await updateUserPermissions(employee.id, selectedPermissions);
      console.log('✅ 權限已儲存:', selectedPermissions);

      // 如果修改的是當前登入用戶，更新 auth-store 的 user 資料
      if (user && user.id === employee.id) {
        console.log('🔄 更新當前用戶權限...');
        console.log('當前用戶 ID:', user.id, '修改的員工 ID:', employee.id);
        login({
          ...user,
          permissions: selectedPermissions
        });
        console.log('✅ 當前用戶權限已更新');
      } else {
        console.log('⚠️ 修改的不是當前用戶，不更新 auth-store');
        if (user) {
          console.log('當前用戶 ID:', user.id, '修改的員工 ID:', employee.id);
        }
      }

      setIsEditing?.(false);
    };

    // 暴露 handleSave 給父組件
    useImperativeHandle(ref, () => ({
      handleSave
    }));

    const handleCancel = () => {
      setSelectedPermissions(employee.permissions);
      setIsEditing?.(false);
    };

  // 按類別分組權限
  const permissionsByCategory = SYSTEM_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof SYSTEM_PERMISSIONS>);

  const categories = Object.keys(permissionsByCategory);

  return (
    <div className="space-y-6">

      {/* 權限分類列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div key={category} className="bg-morandi-container/10 rounded-lg p-4">
            <h4 className="font-medium text-morandi-primary mb-4 pb-2 border-b border-border/50">
              {category}
            </h4>

            <div className="space-y-3">
              {permissionsByCategory[category].map((permission) => {
                const isSelected = selectedPermissions.includes(permission.id);

                return (
                  <div
                    key={permission.id}
                    onClick={() => handlePermissionToggle(permission.id)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                      isEditing ? 'hover:bg-morandi-container/20' : 'cursor-default',
                      isSelected
                        ? 'border-morandi-gold bg-morandi-gold/10'
                        : 'border-border bg-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'border-morandi-gold bg-morandi-gold text-white'
                          : 'border-morandi-muted'
                      )}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div>
                        <p className="font-medium text-morandi-primary">
                          {permission.label}
                        </p>
                        <p className="text-xs text-morandi-muted">
                          {permission.id}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="text-morandi-gold">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 權限摘要 */}
      <div className="bg-morandi-container/10 rounded-lg p-4">
        <h4 className="font-medium text-morandi-primary mb-3">權限摘要</h4>

        {selectedPermissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedPermissions.map((permissionId) => {
              const permission = SYSTEM_PERMISSIONS.find(p => p.id === permissionId);
              if (!permission) return null;

              return (
                <span
                  key={permissionId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-morandi-gold/20 text-morandi-primary rounded text-sm"
                >
                  <Check size={12} />
                  {permission.label}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-morandi-muted text-sm">尚未授權任何功能</p>
        )}
      </div>

      {/* 快速設定 */}
      {isEditing && (
        <div className="bg-morandi-container/10 rounded-lg p-4">
          <h4 className="font-medium text-morandi-primary mb-3">快速設定</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-morandi-gold hover:bg-morandi-gold/90 text-white"
              onClick={() => setSelectedPermissions(SYSTEM_PERMISSIONS.map(p => p.id))}
            >
              超級管理員（全選）
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPermissions([])}
            >
              全部清除
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPermissions(
                SYSTEM_PERMISSIONS.filter(p => p.category === '業務').map(p => p.id)
              )}
            >
              僅業務功能
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPermissions(
                SYSTEM_PERMISSIONS.filter(p => p.category === '財務').map(p => p.id)
              )}
            >
              僅財務功能
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPermissions(['todos'])}
            >
              僅基本功能
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

PermissionsTab.displayName = 'PermissionsTab';