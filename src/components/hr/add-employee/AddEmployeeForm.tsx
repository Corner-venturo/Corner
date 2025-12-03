'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEmployeeForm } from './useEmployeeForm'
import { BasicInfoFields } from './BasicInfoFields'
import { ContactFields } from './ContactFields'
import { PasswordAndRoleFields } from './PasswordAndRoleFields'
import { JobInfoFields } from './JobInfoFields'
import { SuccessDialog } from './SuccessDialog'
import { AddEmployeeFormProps } from './types'
import { getAvailableWorkspaces } from '@/lib/workspace-helpers'

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

  const availableWorkspaces = getAvailableWorkspaces()

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoFields formData={formData} setFormData={setFormData} />
        <ContactFields formData={formData} setFormData={setFormData} />
        <PasswordAndRoleFields formData={formData} setFormData={setFormData} />
        <JobInfoFields formData={formData} setFormData={setFormData} />

        {/* Workspace 選擇（僅 super_admin 可見） */}
        {isSuperAdmin && availableWorkspaces.length > 1 && (
          <div className="space-y-2">
            <Label>所屬辦公室</Label>
            <Select
              value={formData.workspace_id || ''}
              onValueChange={value => setFormData({ ...formData, workspace_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇辦公室" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkspaces.map((workspace: { id: string; name: string }) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" className="flex-1">
            建立員工
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
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
