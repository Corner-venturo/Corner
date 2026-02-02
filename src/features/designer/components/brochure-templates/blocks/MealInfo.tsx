/**
 * 餐食資訊區塊
 */
import { Text } from '../primitives/Text'
import type { Theme } from '../types'

interface MealInfoProps {
  theme: Theme
  breakfast?: string
  lunch?: string
  dinner?: string
  layout?: 'row' | 'column'
}

export function MealInfo({
  theme,
  breakfast,
  lunch,
  dinner,
  layout = 'row',
}: MealInfoProps) {
  const meals = [
    { label: '早', value: breakfast },
    { label: '午', value: lunch },
    { label: '晚', value: dinner },
  ]

  return (
    <div>
      <Text theme={theme} variant="caption" color="accent" style={{ fontWeight: 600, marginBottom: '2mm' }}>
        餐食
      </Text>
      <div
        style={{
          display: 'flex',
          flexDirection: layout === 'column' ? 'column' : 'row',
          gap: layout === 'column' ? '1mm' : '4mm',
        }}
      >
        {meals.map((meal, i) => (
          <Text key={i} theme={theme} variant="caption">
            <span style={{ fontWeight: 600 }}>{meal.label}｜</span>
            {meal.value || '敬請自理'}
          </Text>
        ))}
      </div>
    </div>
  )
}
