'use client'

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { RepeatableSection } from '@/types/template'

interface RepeatableSectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (section: RepeatableSection) => void
  editingSection?: RepeatableSection | null
  maxRows: number
}

export function RepeatableSectionDialog({
  isOpen,
  onClose,
  onSave,
  editingSection,
  maxRows,
}: RepeatableSectionDialogProps) {
  const [name, setName] = useState('')
  const [startRow, setStartRow] = useState('')
  const [endRow, setEndRow] = useState('')
  const [maxInstances, setMaxInstances] = useState('')
  const [minInstances, setMinInstances] = useState('1')

  useEffect(() => {
    if (editingSection) {
      setName(editingSection.name)
      setStartRow(String(editingSection.range.start_row + 1)) // 顯示時轉為 1-based
      setEndRow(String(editingSection.range.end_row + 1))
      setMaxInstances(
        editingSection.repeat_config?.max ? String(editingSection.repeat_config.max) : ''
      )
      setMinInstances(
        editingSection.repeat_config?.min ? String(editingSection.repeat_config.min) : '1'
      )
    } else {
      setName('')
      setStartRow('')
      setEndRow('')
      setMaxInstances('')
      setMinInstances('1')
    }
  }, [editingSection, isOpen])

  const handleSave = () => {
    const startRowNum = parseInt(startRow) - 1 // 轉回 0-based
    const endRowNum = parseInt(endRow) - 1

    if (!name.trim()) {
      alert('請輸入區塊名稱')
      return
    }

    if (isNaN(startRowNum) || isNaN(endRowNum)) {
      alert('請輸入有效的列號')
      return
    }

    if (startRowNum < 0 || endRowNum >= maxRows) {
      alert(`列號必須在 1 到 ${maxRows} 之間`)
      return
    }

    if (startRowNum >= endRowNum) {
      alert('結束列必須大於起始列')
      return
    }

    const section: RepeatableSection = {
      id: editingSection?.id || crypto.randomUUID(),
      name: name.trim(),
      type: 'repeatable',
      range: {
        start_row: startRowNum,
        end_row: endRowNum,
        columns: 'A:Z',
      },
      repeat_config: {
        min: minInstances ? parseInt(minInstances) : 1,
        max: maxInstances ? parseInt(maxInstances) : 999,
        default_count: 1,
        auto_number: true,
        number_format: '[N]',
      },
      page_break: {
        enabled: false,
        after_count: 1,
      },
    }

    onSave(section)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-morandi-primary mb-4">
          {editingSection ? '編輯可重複區塊' : '新增可重複區塊'}
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="section-name" className="text-sm font-medium">
              區塊名稱
            </Label>
            <Input
              id="section-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：住宿資訊"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-row" className="text-sm font-medium">
                起始列
              </Label>
              <Input
                id="start-row"
                type="number"
                min="1"
                max={maxRows}
                value={startRow}
                onChange={e => setStartRow(e.target.value)}
                placeholder="1"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-row" className="text-sm font-medium">
                結束列
              </Label>
              <Input
                id="end-row"
                type="number"
                min="1"
                max={maxRows}
                value={endRow}
                onChange={e => setEndRow(e.target.value)}
                placeholder="5"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-instances" className="text-sm font-medium">
                最少數量
              </Label>
              <Input
                id="min-instances"
                type="number"
                min="1"
                value={minInstances}
                onChange={e => setMinInstances(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-instances" className="text-sm font-medium">
                最多數量（選填）
              </Label>
              <Input
                id="max-instances"
                type="number"
                min="1"
                value={maxInstances}
                onChange={e => setMaxInstances(e.target.value)}
                placeholder="不限制"
                className="mt-1"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 可重複區塊會在使用模板時允許業務人員動態新增或刪除該區塊的副本
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} className="bg-morandi-gold hover:bg-morandi-gold-hover">
            {editingSection ? '更新' : '新增'}
          </Button>
        </div>
      </div>
    </div>
  )
}
