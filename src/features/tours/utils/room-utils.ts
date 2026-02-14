import { COMP_TOURS_LABELS } from '../constants/labels'
/**
 * Room type label mapping and utilities
 */

export const getRoomTypeLabel = (roomType: string): string => {
  const labels: Record<string, string> = {
    single: COMP_TOURS_LABELS.單人房,
    double: COMP_TOURS_LABELS.雙人房,
    triple: COMP_TOURS_LABELS.三人房,
    quad: COMP_TOURS_LABELS.四人房,
    suite: COMP_TOURS_LABELS.套房,
  }
  return labels[roomType] || roomType
}
