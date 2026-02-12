'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, X } from 'lucide-react'
import { useEmployeeForm } from './useEmployeeForm'
import { BasicInfoFields } from './BasicInfoFields'
import { ContactFields } from './ContactFields'
import { PasswordAndRoleFields } from './PasswordAndRoleFields'
import { JobInfoFields } from './JobInfoFields'
import { SuccessDialog } from './SuccessDialog'
import { AddEmployeeFormProps } from './types'
import { getAvailableWorkspaces, isSuperAdmin as checkIsSuperAdmin, getCurrentWorkspaceCode } from '@/lib/workspace-helpers'
import { useWorkspaceStoreData } from '@/stores/workspace/workspace-store'
import { hasFullFeatures } from '@/lib/feature-restrictions'
import { COMP_HR_LABELS } from '../constants/labels'

export function AddEmployeeForm({ onSubmit, onCancel }: AddEmployeeFormProps) {
  const {
    formData,
    setFormData,
    showSuccessDialog,
    setShowSuccessDialog,
    createdEmployee,
    copiedField,
    handleSubmit,
    copyToClipboard,
    handleCloseSuccess,
    isSuperAdmin,
  } = useEmployeeForm(onSubmit)

  // 直接訂閱 workspace store，避免透過 facade 造成無限迴圈
  const workspaces = useWorkspaceStoreData(state => state.items)
  const fetchWorkspaces = useWorkspaceStoreData(state => state.fetchAll)
  const [availableWorkspaces, setAvailableWorkspaces] = useState<{ id: string; name: string }[]>([])
  const initializedRef = useRef(false)

  useEffect(() => {
    // 只執行一次
    if (!initializedRef.current) {
      initializedRef.current = true
      fetchWorkspaces()
    }
  }, [fetchWorkspaces])

  useEffect(() => {
    // workspaces 載入後更新可用選項
    if (workspaces.length > 0) {
      const available = getAvailableWorkspaces()
      setAvailableWorkspaces(available)
    }
  }, [workspaces])

  // 只有完整功能的公司（TP/TC）的 super_admin 才能選擇不同 workspace
  const currentWorkspaceCode = getCurrentWorkspaceCode()
  const showWorkspaceSelector = (isSuperAdmin || checkIsSuperAdmin()) &&
    availableWorkspaces.length > 1 &&
    hasFullFeatures(currentWorkspaceCode)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 所屬辦公室選擇（顯眼位置，僅 super_admin 可見） */}
        {showWorkspaceSelector && (
          <div className="bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={18} className="text-morandi-gold" />
              <Label className="text-morandi-primary font-semibold">所屬辦公室</Label>
            </div>
            <Select
              value={formData.workspace_id || ''}
              onValueChange={value => setFormData({ ...formData, workspace_id: value })}
            >
              <SelectTrigger className="bg-card">
                <SelectValue placeholder={COMP_HR_LABELS.請選擇辦公室} />
              </SelectTrigger>
              <SelectContent>
                {availableWorkspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-morandi-secondary mt-2">
              選擇此員工所屬的分公司，將影響其可見的資料範圍
            </p>
          </div>
        )}

        <BasicInfoFields formData={formData} setFormData={setFormData} />
        <ContactFields formData={formData} setFormData={setFormData} />
        <PasswordAndRoleFields formData={formData} setFormData={setFormData} />
        <JobInfoFields formData={formData} setFormData={setFormData} />

        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="submit"
            className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            建立員工
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
            <X size={16} />
            取消
          </Button>
        </div>
      </form>

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        createdEmployee={createdEmployee}
        copiedField={copiedField}
        onCopy={copyToClipboard}
        onClose={handleCloseSuccess}
      />
    </>
  )
}
