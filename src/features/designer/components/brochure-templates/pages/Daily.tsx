/**
 * 每日行程頁
 */
'use client'

import { Page } from '../primitives/Page'
import { Text } from '../primitives/Text'
import { Image } from '../primitives/Image'
import { DaySchedule } from '../blocks/DaySchedule'
import { MealInfo } from '../blocks/MealInfo'
import type { PageProps, DailyItinerary } from '../types'
import { PAGES_LABELS } from './constants/labels'

interface DailyProps extends PageProps {
  day: DailyItinerary
  image?: string
}

export function Daily({ data, theme, size, day, image, pageNumber, className }: DailyProps) {
  return (
    <Page theme={theme} size={size} className={className}>
      {/* 行程內容 */}
      <DaySchedule theme={theme} day={day} />

      {/* 圖片 */}
      {image && (
        <Image
          src={image}
          theme={theme}
          height="50mm"
          rounded
          style={{ marginTop: theme.spacing.section }}
        />
      )}

      {/* 餐食 */}
      <div
        style={{
          position: 'absolute',
          bottom: '25mm',
          left: theme.spacing.page,
          right: theme.spacing.page,
        }}
      >
        <MealInfo
          theme={theme}
          breakfast={day.meals?.breakfast}
          lunch={day.meals?.lunch}
          dinner={day.meals?.dinner}
        />
      </div>

      {/* 住宿 */}
      <div
        style={{
          position: 'absolute',
          bottom: '12mm',
          left: theme.spacing.page,
          right: theme.spacing.page,
        }}
      >
        <Text theme={theme} variant="caption" color="accent" style={{ fontWeight: 600, marginBottom: '1mm' }}>
          {PAGES_LABELS.LABEL_8766}
        </Text>
        <Text theme={theme} variant="caption">
          {day.accommodation || '敬請參閱確認單'}
        </Text>
      </div>

      {/* 頁碼 */}
      {pageNumber && (
        <Text
          theme={theme}
          variant="caption"
          color="muted"
          style={{ position: 'absolute', bottom: '6mm', right: theme.spacing.page }}
        >
          {String(pageNumber).padStart(2, '0')}
        </Text>
      )}
    </Page>
  )
}
