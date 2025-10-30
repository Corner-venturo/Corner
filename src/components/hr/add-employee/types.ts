export interface EmployeeFormData {
  english_name: string
  display_name: string
  chinese_name: string
  defaultPassword: string
  roles: ('admin' | 'employee' | 'user' | 'tour_leader' | 'sales' | 'accountant' | 'assistant')[]
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
    allowances: any[]
    salaryHistory: any[]
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
