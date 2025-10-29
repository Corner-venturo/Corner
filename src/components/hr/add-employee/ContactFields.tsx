'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { EmployeeFormData } from './types';

interface ContactFieldsProps {
  formData: EmployeeFormData;
  setFormData: (data: EmployeeFormData) => void;
}

export function ContactFields({ formData, setFormData }: ContactFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center justify-between">
          <span>聯絡電話</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setFormData({
                ...formData,
                personal_info: {
                  ...formData.personal_info,
                  phone: [...formData.personal_info.phone, '']
                }
              });
            }}
            className="h-6 text-xs"
          >
            <Plus size={12} className="mr-1" />
            新增電話
          </Button>
        </label>
        <div className="space-y-2">
          {formData.personal_info.phone.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => {
                  const phones = [...formData.personal_info.phone];
                  phones[index] = e.target.value;
                  setFormData({
                    ...formData,
                    personal_info: { ...formData.personal_info, phone: phones }
                  });
                }}
                placeholder={`電話 ${index + 1}`}
              />
              {formData.personal_info.phone.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const phones = formData.personal_info.phone.filter((_, i) => i !== index);
                    setFormData({
                      ...formData,
                      personal_info: { ...formData.personal_info, phone: phones }
                    });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">Email</label>
        <Input
          type="email"
          value={formData.personal_info.email}
          onChange={(e) => setFormData({
            ...formData,
            personal_info: { ...formData.personal_info, email: e.target.value }
          })}
        />
      </div>
    </>
  );
}
