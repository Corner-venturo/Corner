// src/hooks/useStatusBadge.ts
import { STATUS_COLORS } from '@/constants'

export function useStatusBadge() {
  const getStatusColor = (status: string) => {
    return (
      STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
      'bg-morandi-container text-morandi-secondary'
    )
  }

  return { getStatusColor }
}
