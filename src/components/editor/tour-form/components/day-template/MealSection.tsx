'use client'

import React from 'react'
import { Utensils } from 'lucide-react'
import { EditableText } from './EditableText'

interface MealData {
  breakfast?: string
  lunch?: string
  dinner?: string
}

interface MealSectionProps {
  meals?: MealData
  editingField: string | null
  setEditingField: (field: string | null) => void
  onUpdateMeals: (meals: MealData) => void
  variant?: 'inline' | 'grid' | 'icons'
  themeColor?: string
}

export function MealSection({
  meals = {},
  editingField,
  setEditingField,
  onUpdateMeals,
  variant = 'inline',
  themeColor = '#2C5F4D',
}: MealSectionProps) {
  if (variant === 'grid') {
    return (
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: themeColor }}>餐食安排</div>
        <div className="flex gap-4 text-sm">
          <span>
            早：<EditableText
              value={meals.breakfast || ''}
              fieldKey="meals-breakfast"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => onUpdateMeals({ ...meals, breakfast: v })}
              className="inline text-morandi-primary"
              placeholder="飯店內"
            />
          </span>
          <span>
            午：<EditableText
              value={meals.lunch || ''}
              fieldKey="meals-lunch"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => onUpdateMeals({ ...meals, lunch: v })}
              className="inline text-morandi-primary"
              placeholder="午餐"
            />
          </span>
          <span>
            晚：<EditableText
              value={meals.dinner || ''}
              fieldKey="meals-dinner"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => onUpdateMeals({ ...meals, dinner: v })}
              className="inline text-morandi-primary"
              placeholder="晚餐"
            />
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'icons') {
    return (
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Utensils size={14} style={{ color: themeColor }} />
          <EditableText
            value={meals.lunch || ''}
            fieldKey="meals-lunch"
            editingField={editingField}
            setEditingField={setEditingField}
            onChange={v => onUpdateMeals({ ...meals, lunch: v })}
            className="text-morandi-primary"
            placeholder="午餐"
          />
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <div className="flex gap-4 text-sm">
      <div className="flex-1">
        <span className="text-morandi-muted">午餐：</span>
        <EditableText
          value={meals.lunch || ''}
          fieldKey="meals-lunch"
          editingField={editingField}
          setEditingField={setEditingField}
          onChange={v => onUpdateMeals({ ...meals, lunch: v })}
          className="inline text-morandi-primary"
          placeholder="午餐"
        />
      </div>
    </div>
  )
}
