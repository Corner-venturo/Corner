import { Employee } from '@/stores/types'

export interface BasicInfoFormData {
  display_name: string
  chinese_name: string
  english_name: string
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
    position: string
    supervisor: string
    hire_date: string
    probation_end_date: string
  }
}

export interface PasswordData {
  newPassword: string
  confirmPassword: string
}

export interface BasicInfoTabProps {
  employee: Employee
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
}
