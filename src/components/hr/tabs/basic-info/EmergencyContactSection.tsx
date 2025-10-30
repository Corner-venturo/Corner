'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Employee } from '@/stores/types'
import { BasicInfoFormData } from './types'

interface EmergencyContactSectionProps {
  employee: Employee
  isEditing: boolean
  formData: BasicInfoFormData
  setFormData: (data: BasicInfoFormData) => void
}

export function EmergencyContactSection({
  employee,
  isEditing,
  formData,
  setFormData,
}: EmergencyContactSectionProps) {
  return (
    <div className="bg-morandi-container/10 rounded-lg p-4">
      <h4 className="font-medium text-morandi-primary mb-3">緊急聯絡人</h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">姓名</label>
          {isEditing ? (
            <Input
              value={formData.personal_info.emergency_contact.name}
              onChange={e =>
                setFormData({
                  ...formData,
                  personal_info: {
                    ...formData.personal_info,
                    emergency_contact: {
                      ...formData.personal_info.emergency_contact,
                      name: e.target.value,
                    },
                  },
                })
              }
            />
          ) : (
            <p className="text-morandi-primary py-2">
              {employee.personal_info?.emergency_contact?.name || '-'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">關係</label>
          {isEditing ? (
            <Input
              value={formData.personal_info.emergency_contact.relationship}
              onChange={e =>
                setFormData({
                  ...formData,
                  personal_info: {
                    ...formData.personal_info,
                    emergency_contact: {
                      ...formData.personal_info.emergency_contact,
                      relationship: e.target.value,
                    },
                  },
                })
              }
            />
          ) : (
            <p className="text-morandi-primary py-2">
              {employee.personal_info?.emergency_contact?.relationship || '-'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">電話</label>
          {isEditing ? (
            <Input
              value={formData.personal_info.emergency_contact.phone}
              onChange={e =>
                setFormData({
                  ...formData,
                  personal_info: {
                    ...formData.personal_info,
                    emergency_contact: {
                      ...formData.personal_info.emergency_contact,
                      phone: e.target.value,
                    },
                  },
                })
              }
            />
          ) : (
            <p className="text-morandi-primary py-2">
              {employee.personal_info?.emergency_contact?.phone || '-'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
