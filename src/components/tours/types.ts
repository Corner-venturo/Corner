/**
 * Types for tour members advanced component
 */

export interface OrderMember {
  id: string
  order_id: string
  customer_id: string | null
  chinese_name: string | null
  passport_name: string | null
  birth_date: string | null
  gender: string | null
  id_number: string | null
  passport_number: string | null
  passport_expiry: string | null
  special_meal: string | null
  pnr: string | null
}

export type CustomerDietaryMap = Record<string, string>
export type OrderCodeMap = Record<string, string>

export interface MemberFieldValue {
  [memberId: string]: {
    [fieldName: string]: string
  }
}

export interface VisibleColumns {
  passport_name: boolean
  birth_date: boolean
  gender: boolean
  passport_number: boolean
  dietary: boolean
  notes: boolean
  room: boolean
  vehicle: boolean
}
