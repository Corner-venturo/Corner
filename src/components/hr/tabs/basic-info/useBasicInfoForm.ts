import { useState } from 'react'
import { Employee } from '@/stores/types'
import { useUserStore, userStoreHelpers } from '@/stores/user-store'
import { BasicInfoFormData, PasswordData } from './types'

export function useBasicInfoForm(employee: Employee, setIsEditing: (editing: boolean) => void) {
  const { update: updateUser } = useUserStore()

  const [formData, setFormData] = useState<BasicInfoFormData>({
    display_name: employee.display_name || '',
    chinese_name: employee.chinese_name || '',
    english_name: employee.english_name || '',
    personal_info: {
      national_id: employee.personal_info?.national_id || '',
      birthday: employee.personal_info?.birthday || '',
      phone: Array.isArray(employee.personal_info?.phone)
        ? employee.personal_info.phone
        : employee.personal_info?.phone
          ? [employee.personal_info.phone]
          : [''],
      email: employee.personal_info?.email || '',
      address: employee.personal_info?.address || '',
      emergency_contact: {
        name: employee.personal_info?.emergency_contact?.name || '',
        relationship: employee.personal_info?.emergency_contact?.relationship || '',
        phone: employee.personal_info?.emergency_contact?.phone || '',
      },
    },
    job_info: {
      supervisor: employee.job_info?.supervisor || '',
      hire_date: employee.job_info?.hire_date || '',
      probation_end_date: employee.job_info?.probation_end_date || '',
    },
  })

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordData, setPasswordData] = useState<PasswordData>({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false)

  const handleSave = async () => {
    const updates: any = { ...formData }

    if (formData.english_name !== employee.english_name) {
      updates.employee_number = userStoreHelpers.generateUserNumber(formData.english_name)
    }

    try {
      await updateUser(employee.id, updates)
      setIsEditing(false)
    } catch (error) {
      alert('儲存失敗：' + (error as Error).message)
    }
  }

  const handleCancel = () => {
    setFormData({
      display_name: employee.display_name || '',
      chinese_name: employee.chinese_name || '',
      english_name: employee.english_name || '',
      personal_info: {
        national_id: employee.personal_info?.national_id || '',
        birthday: employee.personal_info?.birthday || '',
        phone: Array.isArray(employee.personal_info?.phone)
          ? employee.personal_info.phone
          : employee.personal_info?.phone
            ? [employee.personal_info.phone]
            : [''],
        email: employee.personal_info?.email || '',
        address: employee.personal_info?.address || '',
        emergency_contact: {
          name: employee.personal_info?.emergency_contact?.name || '',
          relationship: employee.personal_info?.emergency_contact?.relationship || '',
          phone: employee.personal_info?.emergency_contact?.phone || '',
        },
      },
      job_info: {
        supervisor: employee.job_info?.supervisor || '',
        hire_date: employee.job_info?.hire_date || '',
        probation_end_date: employee.job_info?.probation_end_date || '',
      },
    })
    setIsEditing(false)
  }

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('新密碼與確認密碼不符！')
      return
    }

    if (passwordData.newPassword.length < 8) {
      alert('密碼長度至少需要8個字元！')
      return
    }

    setPasswordUpdateLoading(true)

    try {
      const { hashPassword } = await import('@/lib/auth')
      const hashedPassword = await hashPassword(passwordData.newPassword)

      const { supabase } = await import('@/lib/supabase/client')

      const result: any = await supabase
        .from('employees')
        .update({ password_hash: hashedPassword })
        .eq('employee_number', employee.employee_number)

      const { error } = result

      if (error) {
        alert('密碼更新失敗：' + error.message)
        return
      }

      alert(`成功更新 ${employee.display_name} 的密碼！`)
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
    } catch (error) {
      alert('密碼更新失敗，請稍後再試')
    } finally {
      setPasswordUpdateLoading(false)
    }
  }

  return {
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
    handleCancel,
    handlePasswordUpdate,
  }
}
