/**
 * PNR 旅客比對工具
 */

import type { OrderMember } from '@/components/orders/order-member.types'
import type { ParsedPNR, EnhancedSSR } from '@/lib/pnr-parser'
import { SSRCategory } from '@/lib/pnr-parser'

export interface PassengerMatch {
  pnrIndex: number
  pnrName: string
  passengerType: 'ADT' | 'CHD' | 'INF' | 'INS'
  birthDate?: string
  infant?: { name: string; birthDate: string }
  memberId: string | null
  memberName: string | null
  memberPassportName: string | null
  baggage: string[]
  meal: string[]
  ticketPrice: number | null
  ticketNumber: string | null
  existingPnr: string | null
}

export interface SegmentEditData {
  departureTerminal: string
  arrivalTerminal: string
  meal: string
  isDirect: boolean
  duration: string
}

export function normalizeNameForMatch(name: string): string {
  return name.toUpperCase().replace(/[\s\-\/]/g, '')
}

export function matchPassengerToMember(
  pnrName: string,
  members: OrderMember[]
): OrderMember | null {
  const normalizedPnr = normalizeNameForMatch(pnrName)

  // 精確比對 passport_name
  for (const member of members) {
    if (member.passport_name) {
      if (normalizedPnr === normalizeNameForMatch(member.passport_name)) {
        return member
      }
    }
  }

  // 部分比對（姓氏相同）
  const pnrSurname = pnrName.split('/')[0]?.toUpperCase() || ''
  for (const member of members) {
    if (member.passport_name) {
      const memberSurname = member.passport_name.split('/')[0]?.toUpperCase() || ''
      if (pnrSurname && memberSurname && pnrSurname === memberSurname) {
        return member
      }
    }
  }

  return null
}

function extractPassengerSSR(
  ssrList: EnhancedSSR[] | undefined,
  passengerIndex: number
): { baggage: string[]; meal: string[] } {
  const baggage: string[] = []
  const meal: string[] = []

  if (!ssrList) return { baggage, meal }

  for (const ssr of ssrList) {
    if (ssr.passenger !== undefined && ssr.passenger !== passengerIndex + 1) continue
    if (ssr.category === SSRCategory.BAGGAGE) baggage.push(ssr.description || ssr.code)
    else if (ssr.category === SSRCategory.MEAL) meal.push(ssr.description || ssr.code)
  }

  return { baggage, meal }
}

/**
 * 從解析結果自動比對旅客與團員
 */
export function buildPassengerMatches(
  result: ParsedPNR,
  members: OrderMember[]
): PassengerMatch[] {
  return result.passengers.map((passenger, index) => {
    const matchedMember = matchPassengerToMember(passenger.name, members)
    const { baggage, meal } = extractPassengerSSR(result.specialRequests, index)

    let ticketNumber: string | null = null
    const ticketByName = result.ticketNumbers.find(t =>
      t.passenger && normalizeNameForMatch(t.passenger) === normalizeNameForMatch(passenger.name)
    )
    if (ticketByName) {
      ticketNumber = ticketByName.number
    } else if (result.ticketNumbers[index]) {
      ticketNumber = result.ticketNumbers[index].number
    }

    return {
      pnrIndex: index,
      pnrName: passenger.name,
      passengerType: passenger.type,
      birthDate: passenger.birthDate,
      infant: passenger.infant,
      memberId: matchedMember?.id || null,
      memberName: matchedMember?.chinese_name || null,
      memberPassportName: matchedMember?.passport_name || null,
      baggage,
      meal,
      ticketPrice: matchedMember?.flight_cost || null,
      ticketNumber,
      existingPnr: matchedMember?.pnr || null,
    }
  })
}

export const DEFAULT_SEGMENT_EDIT: SegmentEditData = {
  departureTerminal: '',
  arrivalTerminal: '',
  meal: '',
  isDirect: false,
  duration: '',
}
