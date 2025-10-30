import { UI_DELAYS } from '@/lib/constants/timeouts'
import { useState } from 'react'
import { useUserStore, userStoreHelpers } from '@/stores/user-store'
import { hashPassword } from '@/lib/auth'
import { EmployeeFormData, CreatedEmployeeInfo } from './types'

export function useEmployeeForm(onSubmit: () => void) {
  const { create: addUser } = useUserStore()

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
      const employee_number = userStoreHelpers.generateUserNumber(formData.english_name)
      const hashedPassword = await hashPassword(formData.defaultPassword)

      const dbEmployeeData = {
        employee_number: employee_number,
        english_name: formData.english_name,
        display_name: formData.display_name,
        chinese_name: formData.chinese_name,
        password_hash: hashedPassword,
        roles: formData.roles,
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
        permissions: [],
        status: 'active',
      }

      addUser(dbEmployeeData)

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
  }
}
