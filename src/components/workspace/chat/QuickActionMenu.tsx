'use client'

import { forwardRef } from 'react'
import { Receipt, DollarSign, Wallet, CheckSquare, Paperclip, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QuickAction {
  id: string
  icon: LucideIcon
  label: string
  color: string
  action: () => void
}

interface QuickActionMenuProps {
  isOpen: boolean
  actions: QuickAction[]
}

export const QuickActionMenu = forwardRef<HTMLDivElement, QuickActionMenuProps>(
  function QuickActionMenu({ isOpen, actions }, ref) {
    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className="absolute bottom-full left-0 mb-2 bg-white border border-morandi-gold/20 rounded-lg shadow-xl py-1.5 min-w-[220px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="px-3 py-1.5 border-b border-morandi-container/30">
          <p className="text-xs font-semibold text-morandi-secondary uppercase tracking-wider">
            快捷操作
          </p>
        </div>
        {actions.map((action, index) => {
          const Icon = action.icon
          const isLast = index === actions.length - 1
          return (
            <div key={action.id}>
              {isLast && <div className="my-1 border-t border-morandi-container/30" />}
              <button
                type="button"
                onClick={action.action}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-morandi-gold/10 transition-all text-left group"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center transition-all',
                    'bg-gradient-to-br from-morandi-container/20 to-morandi-container/5',
                    'group-hover:from-morandi-gold/10 group-hover:to-morandi-gold/5'
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(action.color, 'group-hover:scale-110 transition-transform')}
                  />
                </div>
                <span className="text-sm text-morandi-primary font-medium">{action.label}</span>
              </button>
            </div>
          )
        })}
      </div>
    )
  }
)

export const createQuickActions = (handlers: {
  onShareOrders: () => void
  onShareQuote: () => void
  onNewPayment: () => void
  onNewReceipt: () => void
  onShareAdvance: () => void
  onNewTask: () => void
  onUploadFile: () => void
}): QuickAction[] => [
  {
    id: 'share-order',
    icon: Receipt,
    label: '分享待收款',
    color: 'text-morandi-primary',
    action: handlers.onShareOrders,
  },
  {
    id: 'share-quote',
    icon: Receipt,
    label: '分享報價單',
    color: 'text-morandi-primary',
    action: handlers.onShareQuote,
  },
  {
    id: 'new-payment',
    icon: DollarSign,
    label: '新增請款單',
    color: 'text-morandi-gold',
    action: handlers.onNewPayment,
  },
  {
    id: 'new-receipt',
    icon: DollarSign,
    label: '新增收款單',
    color: 'text-morandi-gold',
    action: handlers.onNewReceipt,
  },
  {
    id: 'share-advance',
    icon: Wallet,
    label: '分享代墊清單',
    color: 'text-morandi-secondary',
    action: handlers.onShareAdvance,
  },
  {
    id: 'new-task',
    icon: CheckSquare,
    label: '新增任務',
    color: 'text-morandi-gold',
    action: handlers.onNewTask,
  },
  {
    id: 'upload-file',
    icon: Paperclip,
    label: '上傳檔案',
    color: 'text-morandi-secondary',
    action: handlers.onUploadFile,
  },
]
