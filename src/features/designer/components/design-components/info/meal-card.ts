import type { DesignComponent, ComponentGenerateOptions } from '../types'
import type { CanvasElement, TextElement, ShapeElement } from '../../types'

const COLORS = { gold: '#c9aa7c', black: '#181511', gray: '#666666', lightBg: '#faf8f5' }

export const mealCard: DesignComponent = {
  id: 'meal-card',
  name: '餐食卡片',
  category: 'info',
  icon: 'UtensilsCrossed',
  description: '早中晚餐資訊',
  defaultWidth: 495,
  defaultHeight: 80,
  generate: (options: ComponentGenerateOptions): CanvasElement[] => {
    const { x, y, width } = options
    const ts = Date.now()
    const data = options.data || {}
    const elements: CanvasElement[] = []

    // 背景
    elements.push({
      id: `comp-ml-bg-${ts}`, type: 'shape', name: '餐食背景', variant: 'rectangle',
      x, y, width, height: 70,
      zIndex: 0, rotation: 0, opacity: 1, locked: false, visible: true,
      fill: COLORS.lightBg, stroke: 'transparent', strokeWidth: 0, cornerRadius: 6,
    } as ShapeElement)

    // 標題
    elements.push({
      id: `comp-ml-title-${ts}`, type: 'text', name: '餐食標題',
      x: x + 12, y: y + 8, width: 100, height: 16,
      zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
      content: '🍽 餐食安排',
      style: { fontFamily: 'Noto Sans TC', fontSize: 12, fontWeight: '600', fontStyle: 'normal', color: COLORS.gold, textAlign: 'left', lineHeight: 1, letterSpacing: 0.5 },
    } as TextElement)

    // 三餐
    const mealWidth = (width - 48) / 3
    const meals = [
      { label: '早餐', value: (data.breakfast as string) || '飯店內' },
      { label: '午餐', value: (data.lunch as string) || '日式定食' },
      { label: '晚餐', value: (data.dinner as string) || '敬請自理' },
    ]

    meals.forEach((meal, i) => {
      elements.push({
        id: `comp-ml-meal-${i}-${ts}`, type: 'text', name: meal.label,
        x: x + 12 + i * (mealWidth + 12), y: y + 32, width: mealWidth, height: 28,
        zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true,
        content: `${meal.label}｜${meal.value}`,
        style: { fontFamily: 'Noto Sans TC', fontSize: 10, fontWeight: '400', fontStyle: 'normal', color: COLORS.black, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.3 },
      } as TextElement)
    })

    return elements
  },
}
