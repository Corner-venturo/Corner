/**
 * 航班資訊區塊
 */
import { Text } from '../primitives/Text'
import type { Theme, FlightInfo as FlightInfoType } from '../types'
import { BLOCKS_LABELS } from './constants/labels'

interface FlightInfoProps {
  theme: Theme
  flights?: FlightInfoType[]
  outbound?: string   // 簡易模式
  returnFlight?: string
}

export function FlightInfo({
  theme,
  flights,
  outbound,
  returnFlight,
}: FlightInfoProps) {
  // 簡易模式
  if (!flights && (outbound || returnFlight)) {
    return (
      <div>
        <Text theme={theme} variant="caption" color="accent" style={{ fontWeight: 600, marginBottom: '2mm' }}>
          {BLOCKS_LABELS.LABEL_1719}
        </Text>
        {outbound && (
          <Text theme={theme} variant="caption" style={{ marginBottom: '2mm' }}>
            {outbound}
          </Text>
        )}
        {returnFlight && (
          <Text theme={theme} variant="caption">
            {returnFlight}
          </Text>
        )}
      </div>
    )
  }

  // 詳細模式
  if (flights && flights.length > 0) {
    return (
      <div>
        <Text theme={theme} variant="caption" color="accent" style={{ fontWeight: 600, marginBottom: '2mm' }}>
          {BLOCKS_LABELS.LABEL_1719}
        </Text>
        {flights.map((flight, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '3mm',
              alignItems: 'center',
              marginBottom: '2mm',
              padding: '2mm',
              backgroundColor: theme.colors.surface,
              borderRadius: '2mm',
            }}
          >
            <Text theme={theme} variant="caption" style={{ fontWeight: 600, width: '15mm' }}>
              {flight.direction === 'outbound' ? '去程' : '回程'}
            </Text>
            <Text theme={theme} variant="caption">
              {flight.airline} {flight.flightNo}
            </Text>
            <Text theme={theme} variant="caption" color="muted">
              {flight.departure} → {flight.arrival}
            </Text>
            <Text theme={theme} variant="caption">
              {flight.departureTime} - {flight.arrivalTime}
            </Text>
          </div>
        ))}
      </div>
    )
  }

  return null
}
