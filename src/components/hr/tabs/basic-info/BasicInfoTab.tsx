'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { useBasicInfoForm } from './useBasicInfoForm';
import { PersonalInfoSection } from './PersonalInfoSection';
import { ContactInfoSection } from './ContactInfoSection';
import { EmploymentInfoSection } from './EmploymentInfoSection';
import { EmergencyContactSection } from './EmergencyContactSection';
import { PasswordManagementSection } from './PasswordManagementSection';
import { BasicInfoTabProps } from './types';

export const BasicInfoTab = forwardRef<{ handleSave: () => void }, BasicInfoTabProps>(
  ({ employee, isEditing, setIsEditing }, ref) => {
    const {
      formData,
      setFormData,
      showPasswordSection,
      setShowPasswordSection,
      passwordData,
      setPasswordData,
      showPassword,
      setShowPassword,
      passwordUpdateLoading,
      handleSave,
      handlePasswordUpdate
    } = useBasicInfoForm(employee, setIsEditing);

    useImperativeHandle(ref, () => ({
      handleSave
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：個人基本資料 */}
          <div className="space-y-6">
            <PersonalInfoSection
              employee={employee}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />

            <ContactInfoSection
              employee={employee}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          {/* 右側：職務資料與緊急聯絡人 */}
          <div className="space-y-6">
            <EmploymentInfoSection
              employee={employee}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />

            <EmergencyContactSection
              employee={employee}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />

            <PasswordManagementSection
              employee={employee}
              showPasswordSection={showPasswordSection}
              setShowPasswordSection={setShowPasswordSection}
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              passwordUpdateLoading={passwordUpdateLoading}
              handlePasswordUpdate={handlePasswordUpdate}
            />
          </div>
        </div>
      </div>
    );
  }
);

BasicInfoTab.displayName = 'BasicInfoTab';
