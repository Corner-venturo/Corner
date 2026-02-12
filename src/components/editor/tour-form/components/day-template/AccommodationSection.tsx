'use client'

import React from 'react'
import { Building2 } from 'lucide-react'
import { EditableText } from './EditableText'
import { COMP_EDITOR_LABELS } from '../../../constants/labels'

interface AccommodationSectionProps {
  accommodation?: string
  editingField: string | null
  setEditingField: (field: string | null) => void
  onUpdateAccommodation: (value: string) => void
  variant?: 'inline' | 'grid' | 'icon'
  themeColor?: string
}

export function AccommodationSection({
  accommodation = '',
  editingField,
  setEditingField,
  onUpdateAccommodation,
  variant = 'inline',
  themeColor = '#2C5F4D',
}: AccommodationSectionProps) {
  if (variant === 'grid') {
    return (
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: themeColor }}>住宿</div>
        <EditableText
          value={accommodation}
          fieldKey="accommodation"
          editingField={editingField}
          setEditingField={setEditingField}
          onChange={onUpdateAccommodation}
          className="text-sm text-morandi-primary"
          placeholder={COMP_EDITOR_LABELS.住宿飯店}
        />
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <div className="flex items-center gap-2">
        <Building2 size={14} style={{ color: themeColor }} />
        <EditableText
          value={accommodation}
          fieldKey="accommodation"
          editingField={editingField}
          setEditingField={setEditingField}
          onChange={onUpdateAccommodation}
          className="text-morandi-primary"
          placeholder={COMP_EDITOR_LABELS.住宿}
        />
      </div>
    )
  }

  // Default inline variant
  return (
    <div className="flex-1">
      <span className="text-morandi-muted">住宿：</span>
      <EditableText
        value={accommodation}
        fieldKey="accommodation"
        editingField={editingField}
        setEditingField={setEditingField}
        onChange={onUpdateAccommodation}
        className="inline text-morandi-primary"
        placeholder={COMP_EDITOR_LABELS.住宿}
      />
    </div>
  )
}
