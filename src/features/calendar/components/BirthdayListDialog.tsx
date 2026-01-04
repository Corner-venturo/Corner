'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cake, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { formatYearMonth } from '@/lib/utils/format-date'

interface BirthdayPerson {
  id: string
  name: string
  date_of_birth: string
  day: number
}

interface BirthdayListDialogProps {
  open: boolean
  onClose: () => void
  initialMonth?: Date
}

export function BirthdayListDialog({ open, onClose, initialMonth }: BirthdayListDialogProps) {
  const [currentMonth, setCurrentMonth] = useState(() => initialMonth || new Date())
  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([])
  const [loading, setLoading] = useState(false)

  // 取得月份字串
  const getMonthLabel = (date: Date) => {
    return formatYearMonth(date)
  }

  // 取得當月的 MM 格式（用於查詢）
  const getMonthString = (date: Date) => {
    return String(date.getMonth() + 1).padStart(2, '0')
  }

  // 查詢生日資料（只查客戶，因為團員都會導入客戶資料）
  const fetchBirthdays = useCallback(async () => {
    setLoading(true)
    try {
      const monthStr = getMonthString(currentMonth)
      const results: BirthdayPerson[] = []

      // 查詢客戶生日
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, date_of_birth')
        .not('date_of_birth', 'is', null)

      if (customers) {
        customers.forEach(customer => {
          if (customer.date_of_birth) {
            // date_of_birth 格式: YYYY-MM-DD
            const birthMonth = customer.date_of_birth.slice(5, 7)
            if (birthMonth === monthStr) {
              const day = parseInt(customer.date_of_birth.slice(8, 10), 10)
              results.push({
                id: customer.id,
                name: customer.name,
                date_of_birth: customer.date_of_birth,
                day,
              })
            }
          }
        })
      }

      // 按日期排序
      results.sort((a, b) => a.day - b.day)
      setBirthdays(results)
    } catch (error) {
      logger.error('查詢生日失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  // 當月份變更或對話框開啟時查詢
  useEffect(() => {
    if (open) {
      fetchBirthdays()
    }
  }, [open, fetchBirthdays])

  // 上一個月
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  // 下一個月
  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  // 回到本月
  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  // 格式化生日日期
  const formatBirthday = (dateStr: string) => {
    const month = parseInt(dateStr.slice(5, 7), 10)
    const day = parseInt(dateStr.slice(8, 10), 10)
    return `${month}/${day}`
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake size={20} className="text-morandi-gold" />
            生日名單
          </DialogTitle>
        </DialogHeader>

        {/* 月份切換 */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft size={18} />
          </Button>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-morandi-primary">
              {getMonthLabel(currentMonth)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-6 px-2 text-xs"
            >
              本月
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        {/* 生日名單 */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-morandi-secondary">
              載入中...
            </div>
          ) : birthdays.length === 0 ? (
            <div className="py-8 text-center text-morandi-secondary">
              這個月沒有生日
            </div>
          ) : (
            <div className="divide-y divide-border">
              {birthdays.map(person => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-morandi-container/20 rounded-lg transition-colors"
                >
                  {/* 日期 */}
                  <div className="w-12 text-center">
                    <div className="text-lg font-bold text-morandi-gold">
                      {person.day}
                    </div>
                    <div className="text-xs text-morandi-secondary">
                      {formatBirthday(person.date_of_birth)}
                    </div>
                  </div>

                  {/* 分隔線 */}
                  <div className="w-px h-10 bg-border" />

                  {/* 姓名 */}
                  <div className="flex-1">
                    <div className="font-medium text-morandi-primary flex items-center gap-2">
                      {person.name}
                      <Cake size={14} className="text-morandi-gold/60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 統計 */}
        {!loading && birthdays.length > 0 && (
          <div className="pt-2 border-t border-border text-sm text-morandi-secondary text-center">
            本月共 {birthdays.length} 位客戶生日
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
