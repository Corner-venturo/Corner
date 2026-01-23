import { getTodayString } from '@/lib/utils/format-date'
import { logger } from '@/lib/utils/logger'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { useState } from 'react'
import { useUserStore, userStoreHelpers } from '@/stores/user-store'
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
    defaultPassword: '00000000',
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
      hire_date: getTodayString(),
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

      // 決定 workspace_id
      // super_admin 可以選擇，一般 admin 使用自己的 workspace
      const targetWorkspaceId = isSuper
        ? formData.workspace_id || currentWorkspaceId
        : currentWorkspaceId

      if (!targetWorkspaceId) {
        alert('無法取得 workspace，請重新登入')
        return
      }

      // 取得 workspace code（用於 Auth email 格式）
      const { supabase } = await import('@/lib/supabase/client')
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('code')
        .eq('id', targetWorkspaceId)
        .single()

      // 🔧 統一 ID 架構：先建立 Auth 帳號，取得 ID 後作為員工 ID
      // 這樣 employee.id = auth.uid()，不需要額外的 supabase_user_id 映射
      let authUserId: string | null = null

      try {
        const authResponse = await fetch('/api/auth/create-employee-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_number,
            password: formData.defaultPassword,
            workspace_code: workspace?.code || null,
          }),
        })

        if (authResponse.ok) {
          const authResult = await authResponse.json()
          authUserId = authResult.data?.user?.id || null
          logger.log('✅ Auth 帳號已建立:', employee_number, 'ID:', authUserId)
        } else {
          const error = await authResponse.json()
          logger.warn('⚠️ 建立 Auth 帳號失敗:', error)
        }
      } catch (authError) {
        logger.warn('⚠️ 建立 Auth 帳號失敗:', authError)
      }

      // 建立員工資料
      // 如果有 Auth User ID，使用它作為員工 ID（統一 ID 架構）
      // 同時設定 supabase_user_id 確保向後相容
      const dbEmployeeData = {
        ...(authUserId ? { id: authUserId } : {}), // 使用 Auth User ID 作為員工 ID
        employee_number: employee_number,
        english_name: formData.english_name,
        display_name: formData.display_name,
        chinese_name: formData.chinese_name,
        workspace_id: targetWorkspaceId,
        supabase_user_id: authUserId, // 設定 supabase_user_id（向後相容）
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
        must_change_password: true, // 新員工首次登入需要修改密碼
      }

      const newEmployee = await addUser(dbEmployeeData)

      // 自動加入該 workspace 的所有頻道
      if (newEmployee?.id) {
        try {
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
