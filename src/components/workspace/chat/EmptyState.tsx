'use client'

import { Hash, Bot, MessageCircle } from 'lucide-react'
import { useEmployees } from '@/data'
import { useMemo } from 'react'

// 系統機器人 ID
const SYSTEM_BOT_ID = '00000000-0000-0000-0000-000000000001'

interface EmptyStateProps {
  channelName: string
  channelType?: string
  currentUserId?: string
}

export function EmptyState({ channelName, channelType, currentUserId }: EmptyStateProps) {
  const { items: employees } = useEmployees()

  // 解析 DM 頻道名稱，取得對方名字
  const displayInfo = useMemo(() => {
    // 檢查是否為 DM 頻道 (格式: dm:userId1:userId2)
    if (channelName.startsWith('dm:') || channelType === 'DIRECT' || channelType === 'direct') {
      const parts = channelName.replace('dm:', '').split(':').filter(id => id !== '')

      // 檢查是否是機器人
      if (parts.includes(SYSTEM_BOT_ID)) {
        return {
          isDm: true,
          isBot: true,
          name: 'VENTURO 機器人',
          icon: Bot,
        }
      }

      // 找到對方的 ID（排除自己）
      const otherUserId = parts.find(id => id !== currentUserId) || ''

      // 查找對方員工名字
      const employee = employees.find(e => e.id === otherUserId)
      if (employee) {
        return {
          isDm: true,
          isBot: false,
          name: employee.chinese_name || employee.display_name || '同事',
          icon: MessageCircle,
        }
      }

      return {
        isDm: true,
        isBot: false,
        name: '私訊',
        icon: MessageCircle,
      }
    }

    return {
      isDm: false,
      isBot: false,
      name: channelName,
      icon: Hash,
    }
  }, [channelName, channelType, employees, currentUserId])

  const Icon = displayInfo.icon

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`p-4 rounded-full mb-4 ${displayInfo.isBot ? 'bg-morandi-gold/20' : 'bg-morandi-container/50'}`}>
        <Icon size={48} className={displayInfo.isBot ? 'text-morandi-gold' : 'text-morandi-secondary/50'} />
      </div>
      <h3 className="text-lg font-medium text-morandi-primary mb-2">
        {displayInfo.isDm ? `與 ${displayInfo.name} 的對話` : `歡迎來到 #${displayInfo.name}`}
      </h3>
      <p className="text-morandi-secondary">
        {displayInfo.isBot
          ? 'VENTURO 機器人會在這裡通知你重要的系統訊息'
          : '這裡還沒有任何訊息。開始對話吧！'}
      </p>
    </div>
  )
}
