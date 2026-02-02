/**
 * 飯店卡片區塊
 */
import { Text } from '../primitives/Text'
import { Image } from '../primitives/Image'
import type { Theme, HotelInfo } from '../types'

interface HotelCardProps {
  theme: Theme
  hotel: HotelInfo
  showImage?: boolean
  compact?: boolean
}

export function HotelCard({
  theme,
  hotel,
  showImage = true,
  compact = false,
}: HotelCardProps) {
  if (compact) {
    return (
      <Text theme={theme} variant="caption">
        🏨 {hotel.name}
        {hotel.nights && ` (${hotel.nights}晚)`}
      </Text>
    )
  }

  return (
    <div>
      <Text theme={theme} variant="label" color="accent" style={{ marginBottom: '2mm' }}>
        ACCOMMODATION
      </Text>
      <Text theme={theme} variant="h2" style={{ marginBottom: '2mm' }}>
        {hotel.name}
      </Text>
      {hotel.nameEn && (
        <Text theme={theme} variant="caption" color="muted" style={{ marginBottom: '4mm' }}>
          {hotel.nameEn}
        </Text>
      )}

      {showImage && hotel.image && (
        <Image
          src={hotel.image}
          theme={theme}
          height="50mm"
          rounded
          style={{ marginBottom: '4mm' }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
        {hotel.address && (
          <Text theme={theme} variant="caption">
            📍 {hotel.address}
          </Text>
        )}
        {hotel.phone && (
          <Text theme={theme} variant="caption">
            📞 {hotel.phone}
          </Text>
        )}
        <div style={{ display: 'flex', gap: '4mm' }}>
          {hotel.checkIn && (
            <Text theme={theme} variant="caption">Check-in {hotel.checkIn}</Text>
          )}
          {hotel.checkOut && (
            <Text theme={theme} variant="caption">Check-out {hotel.checkOut}</Text>
          )}
        </div>
        {hotel.nights && (
          <div
            style={{
              display: 'inline-block',
              padding: '1mm 3mm',
              backgroundColor: theme.colors.accent,
              color: theme.colors.background,
              borderRadius: '2mm',
              fontSize: '8pt',
              fontWeight: 600,
              width: 'fit-content',
            }}
          >
            {hotel.nights} 晚
          </div>
        )}
      </div>
    </div>
  )
}
