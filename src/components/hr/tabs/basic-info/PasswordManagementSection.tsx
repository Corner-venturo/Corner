'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Employee } from '@/stores/types'
import { PasswordData } from './types'
import { COMP_HR_LABELS } from '../../constants/labels'

interface PasswordManagementSectionProps {
  employee: Employee
  showPasswordSection: boolean
  setShowPasswordSection: (show: boolean) => void
  passwordData: PasswordData
  setPasswordData: (data: PasswordData) => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  passwordUpdateLoading: boolean
  handlePasswordUpdate: () => void
}

export function PasswordManagementSection({
  employee,
  showPasswordSection,
  setShowPasswordSection,
  passwordData,
  setPasswordData,
  showPassword,
  setShowPassword,
  passwordUpdateLoading,
  handlePasswordUpdate,
}: PasswordManagementSectionProps) {
  return (
    <div className="bg-morandi-container/10 rounded-lg p-4 border-l-4 border-morandi-gold">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-morandi-primary flex items-center gap-2">
          <Lock size={16} />
          密碼管理
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="text-sm"
        >
          {showPasswordSection ? COMP_HR_LABELS.取消 : COMP_HR_LABELS.修改密碼}
        </Button>
      </div>

      {!showPasswordSection && (
        <p className="text-sm text-morandi-muted">
          點擊「修改密碼」為 {employee.display_name} 設定新密碼
        </p>
      )}

      {showPasswordSection && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">新密碼</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={e =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder={COMP_HR_LABELS.至少8個字元}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              確認新密碼
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={e =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              placeholder={COMP_HR_LABELS.再次輸入新密碼}
            />
          </div>

          {passwordData.newPassword && passwordData.confirmPassword && (
            <div className="text-sm">
              {passwordData.newPassword === passwordData.confirmPassword ? (
                <span className="text-morandi-gold">✓ 密碼確認一致</span>
              ) : (
                <span className="text-morandi-red">✗ 密碼確認不一致</span>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handlePasswordUpdate}
              disabled={
                passwordUpdateLoading ||
                !passwordData.newPassword ||
                passwordData.newPassword !== passwordData.confirmPassword ||
                passwordData.newPassword.length < 8
              }
              className="bg-morandi-gold hover:bg-morandi-gold-hover"
            >
              {passwordUpdateLoading ? COMP_HR_LABELS.更新中 : COMP_HR_LABELS.更新密碼}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowPasswordSection(false)
                setPasswordData({ newPassword: '', confirmPassword: '' })
              }}
            >
              取消
            </Button>
          </div>

          <div className="text-xs text-morandi-muted bg-morandi-container/30 p-2 rounded">
            <p>📝 密碼要求：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>至少8個字元</li>
              <li>建議包含數字和字母</li>
              <li>員工下次登入時需要使用新密碼</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
