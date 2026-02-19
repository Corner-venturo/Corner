import { PaymentRequest } from '@/stores/types'

export function getNextStatuses(currentStatus: PaymentRequest['status']): Array<'pending' | 'confirmed' | 'billed'> {
  switch (currentStatus) {
    case 'pending':
      return ['confirmed'];
    case 'confirmed':
      return ['billed'];
    case 'billed':
      return [];
    default:
      return [];
  }
}
