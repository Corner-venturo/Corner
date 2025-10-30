// src/components/ui/status-badge.tsx
import { cn } from '@/lib/utils'
import { STATUS_COLORS } from '@/constants'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
        STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
          'bg-morandi-container text-morandi-secondary',
        className
      )}
    >
      {status}
    </span>
  )
}
