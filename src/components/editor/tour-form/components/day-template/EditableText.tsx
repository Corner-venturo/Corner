'use client'

import React from 'react'

interface EditableTextProps {
  value: string
  fieldKey: string
  editingField: string | null
  setEditingField: (field: string | null) => void
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
  inputClassName?: string
}

export function EditableText({
  value,
  fieldKey,
  editingField,
  setEditingField,
  onChange,
  className = '',
  placeholder = '點擊編輯...',
  multiline = false,
  inputClassName = '',
}: EditableTextProps) {
  const isEditing = editingField === fieldKey

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') setEditingField(null)
          }}
          className={`w-full px-2 py-1 border-2 border-[#2C5F4D] rounded resize-none outline-none ${inputClassName} ${className}`}
          rows={3}
          placeholder={placeholder}
        />
      )
    }
    return (
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditingField(null)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Escape') setEditingField(null)
        }}
        className={`w-full px-2 py-1 border-2 border-[#2C5F4D] rounded outline-none ${inputClassName} ${className}`}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div
      onClick={() => setEditingField(fieldKey)}
      className={`cursor-pointer hover:bg-[#2C5F4D]/10 rounded px-1 py-0.5 transition-all border border-transparent hover:border-[#2C5F4D]/30 ${className}`}
      title="點擊編輯"
    >
      {value || <span className="text-morandi-muted italic">{placeholder}</span>}
    </div>
  )
}
