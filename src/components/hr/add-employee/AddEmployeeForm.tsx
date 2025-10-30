'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useEmployeeForm } from './useEmployeeForm'
import { BasicInfoFields } from './BasicInfoFields'
import { ContactFields } from './ContactFields'
import { PasswordAndRoleFields } from './PasswordAndRoleFields'
import { JobInfoFields } from './JobInfoFields'
import { SuccessDialog } from './SuccessDialog'
import { AddEmployeeFormProps } from './types'

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
  } = useEmployeeForm(onSubmit)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoFields formData={formData} setFormData={setFormData} />
        <ContactFields formData={formData} setFormData={setFormData} />
        <PasswordAndRoleFields formData={formData} setFormData={setFormData} />
        <JobInfoFields formData={formData} setFormData={setFormData} />

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
