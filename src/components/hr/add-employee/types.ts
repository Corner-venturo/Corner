import { type UserRole } from '@/lib/rbac-config'

export interface EmployeeFormData {
  english_name: string
  display_name: string
  chinese_name: string
  defaultPassword: string
  workspace_id?: string // super_admin 可以選擇 workspace
  roles: UserRole[]
  personal_info: {
    national_id: string
    birthday: string
    phone: string[]
    email: string
    address: string
    emergency_contact: {
      name: string
      relationship: string
      phone: string
    }
  }
  job_info: {
    hire_date: string
  }
  salary_info: {
    base_salary: number
    allowances: { name: string; amount: number }[]
    salaryHistory: { date: string; amount: number; reason?: string }[]
  }
}

export interface CreatedEmployeeInfo {
  display_name: string
  employee_number: string
  password: string
}

export interface AddEmployeeFormProps {
  onSubmit: () => void
  onCancel: () => void
}
