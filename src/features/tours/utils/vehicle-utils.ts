import { COMP_TOURS_LABELS } from '../constants/labels'
/**
 * Vehicle type label mapping and utilities
 */

export const getVehicleTypeLabel = (vehicleType: string | null): string => {
  if (!vehicleType) return ''
  const labels: Record<string, string> = {
    large_bus: COMP_TOURS_LABELS.大巴,
    medium_bus: COMP_TOURS_LABELS.中巴,
    mini_bus: COMP_TOURS_LABELS.小巴,
    van: COMP_TOURS_LABELS.商務車,
    car: COMP_TOURS_LABELS.轎車,
  }
  return labels[vehicleType] || vehicleType
}
