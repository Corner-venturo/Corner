/**
 * Vehicle type label mapping and utilities
 */

export const getVehicleTypeLabel = (vehicleType: string | null): string => {
  if (!vehicleType) return ''
  const labels: Record<string, string> = {
    large_bus: '大巴',
    medium_bus: '中巴',
    mini_bus: '小巴',
    van: '商務車',
    car: '轎車',
  }
  return labels[vehicleType] || vehicleType
}
