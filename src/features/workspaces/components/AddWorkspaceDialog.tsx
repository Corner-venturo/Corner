/**
 * AddWorkspaceDialog - 新增公司對話框
 * 包含建立第一個管理員帳號
 */

'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DIALOG_SIZES,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Save, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import bcrypt from 'bcryptjs'
import type { WorkspaceType } from '../types'
import { WORKSPACE_TYPE_LABELS } from '../types'

interface AddWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddWorkspaceDialog({ open, onOpenChange, onSuccess }: AddWorkspaceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'travel_agency' as WorkspaceType,
    admin_name: '',
    admin_employee_number: '',
    admin_password: '',
  })

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      code: '',
      type: 'travel_agency',
      admin_name: '',
      admin_employee_number: '',
      admin_password: '',
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    // 驗證
    if (!formData.name.trim()) {
      await alert('請輸入公司名稱', 'error')
      return
    }
    if (!formData.code.trim()) {
      await alert('請輸入公司代號', 'error')
      return
    }
    if (!formData.admin_name.trim()) {
      await alert('請輸入管理員姓名', 'error')
      return
    }
    if (!formData.admin_employee_number.trim()) {
      await alert('請輸入管理員帳號', 'error')
      return
    }
    if (!formData.admin_password.trim()) {
      await alert('請輸入管理員密碼', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. 建立公司
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: formData.name.trim(),
          code: formData.code.toLowerCase().trim(),
          type: formData.type,
          is_active: true,
        })
        .select('id')
        .single()

      if (wsError) {
        if (wsError.code === '23505') {
          await alert('此公司代號已存在', 'error')
          return
        }
        throw wsError
      }

      // 2. 建立管理員帳號
      const passwordHash = await bcrypt.hash(formData.admin_password, 10)

      const { error: empError } = await supabase
        .from('employees')
        .insert({
          workspace_id: workspace.id,
          display_name: formData.admin_name.trim(),
          employee_number: formData.admin_employee_number.trim().toUpperCase(),
          password_hash: passwordHash,
          role: 'admin',
          status: 'active',
        })

      if (empError) {
        // 如果建立員工失敗，刪除剛建立的公司
        await supabase.from('workspaces').delete().eq('id', workspace.id)
        throw empError
      }

      await alert(`公司「${formData.name}」已建立，管理員帳號為 ${formData.admin_employee_number.toUpperCase()}`, 'success')
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      logger.error('建立公司失敗:', error)
      await alert('建立公司失敗，請稍後再試', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onOpenChange, onSuccess, resetForm])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SIZES.md}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={20} className="text-morandi-gold" />
            新增公司
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 公司資訊 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-morandi-primary border-b border-border pb-2">
              公司資訊
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label required>公司名稱</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="例：角落旅遊 台北"
                />
              </div>

              <div className="space-y-2">
                <Label required>公司代號</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => handleFieldChange('code', e.target.value)}
                  placeholder="例：corner（小寫）"
                  className="lowercase"
                />
                <p className="text-xs text-morandi-secondary">登入時使用，建議用英文小寫</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label required>公司類型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleFieldChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKSPACE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 管理員資訊 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-morandi-primary border-b border-border pb-2">
              第一位管理員
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label required>管理員姓名</Label>
                <Input
                  value={formData.admin_name}
                  onChange={(e) => handleFieldChange('admin_name', e.target.value)}
                  placeholder="例：王大明"
                />
              </div>

              <div className="space-y-2">
                <Label required>員工編號（帳號）</Label>
                <Input
                  value={formData.admin_employee_number}
                  onChange={(e) => handleFieldChange('admin_employee_number', e.target.value)}
                  placeholder="例：E001"
                  className="uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label required>登入密碼</Label>
              <Input
                type="password"
                value={formData.admin_password}
                onChange={(e) => handleFieldChange('admin_password', e.target.value)}
                placeholder="請設定密碼"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            建立公司
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
