/**
 * 每日行程區塊
 */
import { Text } from '../primitives/Text'
import type { Theme, DailyItinerary } from '../types'

interface DayScheduleProps {
  theme: Theme
  day: DailyItinerary
  compact?: boolean  // 緊湊模式（用於目錄）
}

export function DaySchedule({ theme, day, compact = false }: DayScheduleProps) {
  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '4mm', alignItems: 'flex-start' }}>
        <Text theme={theme} variant="h3" color="accent" style={{ width: '20mm' }}>
          DAY {day.dayNumber}
        </Text>
        <div style={{ flex: 1 }}>
          <Text theme={theme} variant="body" style={{ fontWeight: 600 }}>
            {day.title}
          </Text>
          {day.accommodation && (
            <Text theme={theme} variant="caption" color="muted">
              🏨 {day.accommodation}
            </Text>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 天數標題 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3mm', marginBottom: '4mm' }}>
        <Text theme={theme} variant="h1" color="accent">
          {String(day.dayNumber).padStart(2, '0')}
        </Text>
        <Text theme={theme} variant="body" color="muted">
          DAY {day.dayNumber}
        </Text>
        {day.date && (
          <Text theme={theme} variant="caption" color="muted">
            {day.date}
          </Text>
        )}
      </div>

      {/* 行程標題 */}
      <Text
        theme={theme}
        variant="h3"
        style={{
          marginBottom: theme.spacing.section,
          paddingBottom: '3mm',
          borderBottom: `2px solid ${theme.colors.accent}`,
        }}
      >
        {day.title}
      </Text>

      {/* 活動列表 */}
      {day.activities && day.activities.length > 0 && (
        <div style={{ marginBottom: theme.spacing.section }}>
          {day.activities.map((activity, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '2mm',
                marginBottom: '2mm',
              }}
            >
              <Text theme={theme} variant="body" color="accent">●</Text>
              <Text theme={theme} variant="body">{activity}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
