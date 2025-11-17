import { logger } from '@/lib/utils/logger'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface TourContactSectionProps {
  data: any
  viewMode: 'desktop' | 'mobile'
}

interface SalesEmployee {
  id: string
  name: string
  phone: string | null
}

export function TourContactSection({ data, viewMode }: TourContactSectionProps) {
  const [salesEmployees, setSalesEmployees] = useState<SalesEmployee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<SalesEmployee | null>(null)

  // 載入業務人員列表
  useEffect(() => {
    const fetchSalesEmployees = async () => {
      try {
        // 先從 IndexedDB 嘗試讀取所有員工
        const { localDB } = await import('@/lib/db')
        const allEmployees = await localDB.getAll('employees')

        // 篩選出有電話號碼的員工作為業務
        const sales = allEmployees
          .filter((emp: any) => emp.is_active && emp.phone)
          .map((emp: any) => ({
            id: emp.id,
            name: emp.name,
            phone: emp.phone,
          }))

        if (sales.length > 0) {
          setSalesEmployees(sales)
          // 預設選擇第一個業務
          setSelectedEmployee(sales[0])
        }
      } catch (error) {
        logger.error('載入業務人員失敗:', error)
      }
    }

    fetchSalesEmployees()
  }, [])

  return (
    <section
      id="contact"
      className={
        viewMode === 'mobile'
          ? 'bg-gradient-to-br from-morandi-primary/95 via-morandi-secondary/90 to-morandi-primary/95 py-12'
          : 'bg-gradient-to-br from-morandi-primary/95 via-morandi-secondary/90 to-morandi-primary/95 py-20'
      }
    >
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className={
              viewMode === 'mobile'
                ? 'text-2xl font-bold text-white mb-3'
                : 'text-4xl font-bold text-white mb-4'
            }
          >
            聯絡我們
          </h2>
          <p
            className={viewMode === 'mobile' ? 'text-base text-white/90' : 'text-xl text-white/90'}
          >
            有任何問題歡迎隨時聯繫
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-morandi-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-morandi-primary mb-2">業務</h3>
            {salesEmployees.length > 0 ? (
              <select
                value={selectedEmployee?.id || ''}
                onChange={e => {
                  const employee = salesEmployees.find(emp => emp.id === e.target.value)
                  if (employee) setSelectedEmployee(employee)
                }}
                className="w-full px-3 py-2 text-center border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold text-morandi-secondary font-medium bg-white"
              >
                {salesEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-morandi-secondary font-medium">{data.leader?.name || '待定'}</p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-morandi-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-morandi-primary mb-2">聯絡電話</h3>
            <p className="text-morandi-secondary font-medium">
              {selectedEmployee?.phone || data.leader?.domesticPhone || '待定'}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
