import { PaymentRequest } from '@/stores/types'

export function getNextStatuses(currentStatus: PaymentRequest['status']): Array<'pending' | 'approved' | 'paid'> {
  switch (currentStatus) {
    case 'pending':
      return ['approved'];
    case 'approved':
      return ['paid'];
    case 'paid':
      return [];
    default:
      return [];
  }
}
