import { logger } from '@/lib/utils/logger'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { useState } from 'react'
import { useUserStore, userStoreHelpers } from '@/stores/user-store'
import { hashPassword } from '@/lib/auth'
import { EmployeeFormData, CreatedEmployeeInfo } from './types'
import { getCurrentWorkspaceId, isSuperAdmin } from '@/lib/workspace-helpers'

export function useEmployeeForm(onSubmit: () => void) {
  const { create: addUser } = useUserStore()
  const currentWorkspaceId = getCurrentWorkspaceId()
  const isSuper = isSuperAdmin()

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdEmployee, setCreatedEmployee] = useState<CreatedEmployeeInfo | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [formData, setFormData] = useState<EmployeeFormData>({
    english_name: '',
    display_name: '',
    chinese_name: '',
    defaultPassword: 'venturo123',
    roles: [],
    personal_info: {
      national_id: '',
      birthday: '',
      phone: [''],
      email: '',
      address: '',
      emergency_contact: {
        name: '',
        relationship: '',
        phone: '',
      },
    },
    job_info: {
      hire_date: new Date().toISOString().split('T')[0],
    },
    salary_info: {
      base_salary: 0,
      allowances: [],
      salaryHistory: [],
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.english_name.trim() || !formData.display_name.trim()) {
      alert('請填寫姓名')
      return
    }

    try {
      const employee_number = userStoreHelpers.generateUserNumber()
      const hashedPassword = await hashPassword(formData.defaultPassword)

      // 決定 workspace_id
      // super_admin 可以選擇，一般 admin 使用自己的 workspace
      const targetWorkspaceId = isSuper
        ? formData.workspace_id || currentWorkspaceId
        : currentWorkspaceId

      if (!targetWorkspaceId) {
        alert('無法取得 workspace，請重新登入')
        return
      }

      const dbEmployeeData = {
        employee_number: employee_number,
        english_name: formData.english_name,
        display_name: formData.display_name,
        chinese_name: formData.chinese_name,
        password_hash: hashedPassword,
        workspace_id: targetWorkspaceId,
        roles: formData.roles as ('admin' | 'employee' | 'user' | 'tour_leader' | 'sales' | 'accountant' | 'assistant' | 'super_admin')[],
        personal_info: {
          national_id: formData.personal_info.national_id,
          birthday: formData.personal_info.birthday,
          phone: formData.personal_info.phone.filter(p => p.trim() !== ''),
          email: formData.personal_info.email,
          address: formData.personal_info.address,
          emergency_contact: {
            name: formData.personal_info.emergency_contact.name,
            relationship: formData.personal_info.emergency_contact.relationship,
            phone: formData.personal_info.emergency_contact.phone,
          },
        },
        job_info: {
          hire_date: formData.job_info.hire_date,
        },
        salary_info: {
          base_salary: formData.salary_info.base_salary,
          allowances: [],
          salary_history: [
            {
              effective_date: formData.job_info.hire_date,
              base_salary: formData.salary_info.base_salary,
              reason: '入職起薪',
            },
          ],
        },
        attendance: {
          leave_records: [],
          overtime_records: [],
        },
        contracts: [],
        permissions: ['settings'],
        status: 'active' as const,
      }

      const newEmployee = await addUser(dbEmployeeData)

      // 建立 Supabase Auth 帳號（用於 RLS）
      try {
        const authResponse = await fetch('/api/auth/create-employee-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_number,
            password: formData.defaultPassword,
          }),
        })

        if (!authResponse.ok) {
          const error = await authResponse.json()
          logger.warn('⚠️ 建立 Auth 帳號失敗（不影響員工建立）:', error)
        } else {
          logger.log('✅ Auth 帳號已建立:', employee_number)
        }
      } catch (authError) {
        logger.warn('⚠️ 建立 Auth 帳號失敗（不影響員工建立）:', authError)
      }

      // 自動加入該 workspace 的所有頻道
      if (newEmployee?.id) {
        try {
          const { supabase } = await import('@/lib/supabase/client')

          // 取得該 workspace 的所有頻道
          const { data: channels } = await supabase
            .from('channels')
            .select('id')
            .eq('workspace_id', targetWorkspaceId)

          // 將新員工加入所有頻道
          if (channels && channels.length > 0) {
            const channelMembers = channels.map(channel => ({
              workspace_id: targetWorkspaceId,
              channel_id: channel.id,
              employee_id: newEmployee.id,
              role: 'member',
              status: 'active',
            }))

            await supabase.from('channel_members').insert(channelMembers)
            logger.log(`✅ 已將新員工加入 ${channels.length} 個頻道`)
          }
        } catch (channelError) {
          logger.error('⚠️ 加入頻道失敗（不影響員工建立）:', channelError)
        }
      }

      setCreatedEmployee({
        display_name: formData.display_name,
        employee_number: employee_number,
        password: formData.defaultPassword,
      })
      setShowSuccessDialog(true)
    } catch (error) {
      alert('創建員工失敗，請稍後再試')
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), UI_DELAYS.SUCCESS_MESSAGE)
  }

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false)
    setCreatedEmployee(null)
    onSubmit()
  }

  return {
    formData,
    setFormData,
    showSuccessDialog,
    setShowSuccessDialog,
    createdEmployee,
    copiedField,
    handleSubmit,
    copyToClipboard,
    handleCloseSuccess,
    isSuperAdmin: isSuper, // 供表單判斷是否顯示 workspace 選擇
  }
}
