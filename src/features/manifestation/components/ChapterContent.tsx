'use client'

import { UI_DELAYS, SYNC_DELAYS } from '@/lib/constants/timeouts'

import { useState, useEffect } from 'react'
import { Chapter } from '@/types/manifestation.types'
import { useManifestationStore } from '@/stores/manifestation-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react'
import { recordManifestationCompletion } from '@/lib/manifestation/reminder'
import { MANIFESTATION_LABELS } from '@/features/manifestation/constants/labels'

interface ChapterContentProps {
  chapter: Chapter
  onPrevious?: () => void
  onNext?: () => void
}

/** 顯化日記表單資料 */
interface ManifestationFormData {
  desire?: string
  body_sensations?: string[]
  dialogue?: string
  small_action?: string
  gratitude?: string
  magic_phrases?: string[]
  shared_wish?: string
  notes?: string
}

export function ChapterContent({ chapter, onPrevious, onNext }: ChapterContentProps) {
  const { currentEntry, createEntry, updateEntry, fetchEntryByChapter } = useManifestationStore()
  const [formData, setFormData] = useState<ManifestationFormData>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 載入章節記錄
  useEffect(() => {
    fetchEntryByChapter(chapter.id)
  }, [chapter.id, fetchEntryByChapter])

  // 載入現有數據
  useEffect(() => {
    if (currentEntry && currentEntry.chapter_number === chapter.id) {
      setFormData({
        desire: currentEntry.desire || '',
        body_sensations: currentEntry.body_sensations || [],
        dialogue: currentEntry.dialogue || '',
        small_action: currentEntry.small_action || '',
        gratitude: currentEntry.gratitude || '',
        magic_phrases: currentEntry.magic_phrases || [],
        shared_wish: currentEntry.shared_wish || '',
        notes: currentEntry.notes || '',
      })
    } else {
      setFormData({})
    }
  }, [currentEntry, chapter.id])

  // 處理輸入變化
  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 處理陣列輸入（用換行分隔）
  const handleArrayChange = (field: string, value: string) => {
    const array = value.split('\n').filter(line => line.trim())
    handleChange(field, array)
  }

  // 儲存記錄
  const handleSave = async (markAsCompleted: boolean = false) => {
    setIsSaving(true)
    setSaveSuccess(false)

    const entryData = {
      chapter_number: chapter.id,
      ...formData,
      is_completed: markAsCompleted,
      completed_at: markAsCompleted ? new Date().toISOString() : undefined,
    }

    try {
      let success = false
      if (currentEntry) {
        success = await updateEntry(currentEntry.id, entryData)
      } else {
        const newEntry = await createEntry(entryData)
        success = !!newEntry
      }

      if (success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), UI_DELAYS.SUCCESS_MESSAGE)
        if (markAsCompleted) {
          recordManifestationCompletion()
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  // 渲染表單欄位
  const renderField = (field: string) => {
    switch (field) {
      case 'desire':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">{MANIFESTATION_LABELS.LABEL_2987}</label>
            <Textarea
              value={formData.desire || ''}
              onChange={e => handleChange('desire', e.target.value)}
              placeholder={MANIFESTATION_LABELS.LABEL_732}
              className="min-h-[120px]"
            />
          </div>
        )

      case 'body_sensations':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              {MANIFESTATION_LABELS.LABEL_5133}
            </label>
            <Textarea
              value={formData.body_sensations?.join('\n') || ''}
              onChange={e => handleArrayChange('body_sensations', e.target.value)}
              placeholder={MANIFESTATION_LABELS.EXAMPLE_4283}
              className="min-h-[100px]"
            />
          </div>
        )

      case 'dialogue':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              {MANIFESTATION_LABELS.LABEL_3165}
            </label>
            <Textarea
              value={formData.dialogue || ''}
              onChange={e => handleChange('dialogue', e.target.value)}
              placeholder={MANIFESTATION_LABELS.LABEL_6130}
              className="min-h-[150px]"
            />
          </div>
        )

      case 'small_action':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              {MANIFESTATION_LABELS.LABEL_6012}
            </label>
            <Input
              value={formData.small_action || ''}
              onChange={e => handleChange('small_action', e.target.value)}
              placeholder={MANIFESTATION_LABELS.LABEL_5005}
            />
          </div>
        )

      case 'gratitude':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">{MANIFESTATION_LABELS.LABEL_1605}</label>
            <Textarea
              value={formData.gratitude || ''}
              onChange={e => handleChange('gratitude', e.target.value)}
              placeholder={MANIFESTATION_LABELS.LABEL_9331}
              className="min-h-[120px]"
            />
          </div>
        )

      case 'magic_phrases':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              {MANIFESTATION_LABELS.LABEL_3585}
            </label>
            <Textarea
              value={formData.magic_phrases?.join('\n') || ''}
              onChange={e => handleArrayChange('magic_phrases', e.target.value)}
              placeholder={MANIFESTATION_LABELS.EXAMPLE_153}
              className="min-h-[120px]"
            />
          </div>
        )

      case 'shared_wish':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              {MANIFESTATION_LABELS.LABEL_6109}
            </label>
            <Textarea
              value={formData.shared_wish || ''}
              onChange={e => handleChange('shared_wish', e.target.value)}
              placeholder={MANIFESTATION_LABELS.LABEL_6480}
              className="min-h-[100px]"
            />
            <p className="text-xs text-morandi-secondary mt-1">{MANIFESTATION_LABELS.LABEL_9411}</p>
          </div>
        )

      case 'notes':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">{MANIFESTATION_LABELS.LABEL_9343}</label>
            <Textarea
              value={formData.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder={MANIFESTATION_LABELS.LABEL_9465}
              className="min-h-[100px]"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* 章節標題 */}
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: `${chapter.color}10`,
          borderColor: `${chapter.color}40`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: chapter.color }}
          >
            {chapter.id}
          </div>
          <div>
            <h2 className="text-xl font-medium text-morandi-primary">{chapter.title}</h2>
            {chapter.subtitle && (
              <p className="text-sm text-morandi-secondary">{chapter.subtitle}</p>
            )}
          </div>
        </div>

        <blockquote
          className="text-sm italic text-morandi-secondary border-l-2 pl-4 mt-4"
          style={{ borderColor: chapter.color }}
        >
          {chapter.quote}
        </blockquote>
      </div>

      {/* 章節內容 */}
      <div className="prose prose-sm max-w-none">
        <div className="text-morandi-primary whitespace-pre-line">{chapter.content}</div>
      </div>

      {/* 練習說明 */}
      <div className="bg-morandi-container rounded-lg p-6">
        <h3 className="text-lg font-medium text-morandi-primary mb-4">{MANIFESTATION_LABELS.LABEL_7254}</h3>
        <ol className="space-y-2">
          {chapter.exercise.instructions.map((instruction, index) => (
            <li key={index} className="text-sm text-morandi-secondary">
              {index + 1}. {instruction}
            </li>
          ))}
        </ol>
      </div>

      {/* 練習表單 */}
      <div className="space-y-4">{chapter.exercise.fields.map(field => renderField(field))}</div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrevious} disabled={!onPrevious} className="gap-2">
          <ArrowLeft size={16} />
          {MANIFESTATION_LABELS.LABEL_951}
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving} className="gap-2">
            {isSaving ? (
              '儲存中...'
            ) : saveSuccess ? (
              <>
                <Check size={16} />
                {MANIFESTATION_LABELS.SAVING_4294}
              </>
            ) : (
              <>
                <Save size={16} />
                {MANIFESTATION_LABELS.SAVE}
              </>
            )}
          </Button>

          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            {MANIFESTATION_LABELS.LABEL_221}
          </Button>
        </div>

        <Button variant="outline" onClick={onNext} disabled={!onNext} className="gap-2">
          {MANIFESTATION_LABELS.LABEL_3875}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
