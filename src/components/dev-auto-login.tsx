'use client'

/**
 * 開發模式自動登入
 * 開發環境下自動設定管理員身份
 */

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'

export function DevAutoLogin() {
  const router = useRouter()
  const { user, login } = useAuthStore()

  useEffect(() => {
    // 開發模式 + 沒有登入 = 自動登入
    if (process.env.NODE_ENV === 'development' && !user) {
      // 設定開發用戶
      const devUser = {
        id: '1',
        employee_number: 'william01',
        english_name: 'William',
        display_name: 'William',
        personal_info: {},
        job_info: {
          department: 'Management',
          position: 'Administrator',
        },
        salary_info: {},
        permissions: ['admin'], // 管理員權限，所有功能都能看到
        attendance: { leave_records: [], overtime_records: [] },
        contracts: [],
        status: 'active' as const,
      }

      // 登入
      login(devUser)

      // 導向旅遊團頁面
      router.push('/tours')
    }
  }, [user, login, router])

  return null
}
