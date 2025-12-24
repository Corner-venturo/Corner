/**
 * Room type label mapping and utilities
 */

export const getRoomTypeLabel = (roomType: string): string => {
  const labels: Record<string, string> = {
    single: '單人房',
    double: '雙人房',
    triple: '三人房',
    quad: '四人房',
    suite: '套房',
  }
  return labels[roomType] || roomType
}
