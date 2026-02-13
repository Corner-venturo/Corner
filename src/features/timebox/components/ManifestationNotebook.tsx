'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Sparkles, Heart, Star, Zap, Check, BookOpen, PenLine, ChevronLeft, ChevronRight, Book, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase/client'
import { chapters, getChapter } from '@/data/manifestation-chapters'
import { useManifestationStore } from '@/stores/manifestation-store'
import {
  loadManifestationFromSupabase,
  recordManifestationCompletion,
  getTodayKey,
  getDayDifferenceFromToday,
  getWeekRange,
  type ManifestationReminderSnapshot,
} from '@/lib/manifestation/reminder'
import { logger } from '@/lib/utils/logger'
import { MANIFESTATION_NOTEBOOK_LABELS } from '@/constants/labels'

interface ManifestationRecord {
  id: string
  user_id: string
  record_date: string
  content: string
  created_at: string
  updated_at: string
}

interface ParsedContent {
  intention?: string
  gratitudes?: string[]
  magicPhrase?: string
  timestamp?: string
}

type TabType = 'daily' | 'chapters' | 'history'

export default function ManifestationNotebook() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('daily')

  // 每日顯化狀態
  const [snapshot, setSnapshot] = useState<ManifestationReminderSnapshot>({
    lastDate: null,
    streak: 0,
    history: [],
  })
  const [intention, setIntention] = useState('')
  const [gratitudes, setGratitudes] = useState(['', '', ''])
  const [magicPhrase, setMagicPhrase] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // 章節狀態
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const { entries, fetchEntries, createEntry, updateEntry } = useManifestationStore()

  // 章節練習表單
  const [chapterForm, setChapterForm] = useState<Record<string, string | string[]>>({})

  // 歷史紀錄狀態
  const [records, setRecords] = useState<ManifestationRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const recordsPerPage = 5

  // 判斷今天是否已完成
  const diff = getDayDifferenceFromToday(snapshot.lastDate)
  const isCompletedToday = diff !== null && diff <= 0

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        const data = await loadManifestationFromSupabase(user.id)
        if (data) {
          setSnapshot(data)
        }
        fetchEntries()
      }
    }
    loadData()
  }, [user?.id, fetchEntries])

  // 載入歷史紀錄
  const loadHistory = useCallback(async () => {
    if (!user?.id) return
    setIsLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('manifestation_records')
        .select('*')
        .eq('user_id', user.id)
        .order('record_date', { ascending: false })
        .limit(100)

      if (!error && data) {
        setRecords(data as ManifestationRecord[])
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }, [user?.id])

  // 切換到歷史分頁時載入
  useEffect(() => {
    if (activeTab === 'history' && records.length === 0) {
      loadHistory()
    }
  }, [activeTab, records.length, loadHistory])

  // 處理感恩輸入
  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitudes = [...gratitudes]
    newGratitudes[index] = value
    setGratitudes(newGratitudes)
  }

  // 保存每日顯化
  const handleSaveDaily = useCallback(async () => {
    if (!user?.id) return

    setIsSaving(true)
    try {
      const content = JSON.stringify({
        intention,
        gratitudes: gratitudes.filter(g => g.trim()),
        magicPhrase,
        timestamp: new Date().toISOString(),
      })

      const result = await recordManifestationCompletion(user.id, new Date(), content)
      if (result) {
        setSnapshot(result)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        setIntention('')
        setGratitudes(['', '', ''])
        setMagicPhrase('')
        loadHistory()
      }
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, intention, gratitudes, magicPhrase, loadHistory])

  // 檢查是否可以保存
  const canSaveDaily = intention.trim() || gratitudes.some(g => g.trim()) || magicPhrase.trim()

  // 選擇章節
  const handleSelectChapter = (chapterId: number) => {
    setSelectedChapter(chapterId)
    // 載入現有記錄
    const existingEntry = entries.find(e => e.chapter_number === chapterId)
    if (existingEntry) {
      setChapterForm({
        desire: existingEntry.desire || '',
        body_sensations: existingEntry.body_sensations || [],
        dialogue: existingEntry.dialogue || '',
        small_action: existingEntry.small_action || '',
        gratitude: existingEntry.gratitude || '',
        magic_phrases: existingEntry.magic_phrases || [],
        notes: existingEntry.notes || '',
      })
    } else {
      setChapterForm({})
    }
  }

  // 保存章節練習
  const handleSaveChapter = async () => {
    if (!user?.id) {
      alert('請先登入')
      return
    }
    if (!selectedChapter) {
      alert('請選擇章節')
      return
    }

    try {
      const existingEntry = entries.find(e => e.chapter_number === selectedChapter)

      if (existingEntry) {
        await updateEntry(existingEntry.id, {
          ...chapterForm,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
      } else {
        await createEntry({
          chapter_number: selectedChapter,
          ...chapterForm,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
      }

      setSelectedChapter(null)
      setChapterForm({})
    } catch (error) {
      logger.error('[ManifestationNotebook] 保存章節失敗:', error)
      alert(error instanceof Error ? error.message : '保存失敗，請稍後再試')
    }
  }

  // 分頁邏輯
  const paginatedRecords = useMemo(() => {
    const start = currentPage * recordsPerPage
    return records.slice(start, start + recordsPerPage)
  }, [records, currentPage])

  const totalPages = Math.ceil(records.length / recordsPerPage)

  // 解析紀錄內容
  const parseContent = (content: string): ParsedContent => {
    try {
      return JSON.parse(content)
    } catch {
      return {}
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[date.getDay()]
    return `${month}/${day} (${weekday})`
  }

  // 週顯化曲線
  const weekData = useMemo(() => {
    const range = getWeekRange()
    const dayLabels = ['一', '二', '三', '四', '五', '六', '日']
    return range.map((day, index) => ({
      day,
      label: dayLabels[index],
      completed: snapshot.history.includes(day),
    }))
  }, [snapshot.history])

  // 章節完成狀態
  const getChapterStatus = (chapterId: number) => {
    return entries.find(e => e.chapter_number === chapterId && e.is_completed)
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* 分頁標籤 */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => { setActiveTab('daily'); setSelectedChapter(null) }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'daily'
              ? 'text-morandi-gold border-morandi-gold'
              : 'text-morandi-secondary border-transparent hover:text-morandi-primary'
          )}
        >
          <PenLine className="w-4 h-4" />
          {MANIFESTATION_NOTEBOOK_LABELS.今日顯化}
          {isCompletedToday && <Check className="w-3 h-3 text-morandi-green" />}
        </button>
        <button
          onClick={() => { setActiveTab('chapters'); setSelectedChapter(null) }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'chapters'
              ? 'text-morandi-gold border-morandi-gold'
              : 'text-morandi-secondary border-transparent hover:text-morandi-primary'
          )}
        >
          <Book className="w-4 h-4" />
          {MANIFESTATION_NOTEBOOK_LABELS.章節練習}
          <span className="text-xs bg-morandi-container px-1.5 py-0.5 rounded-full">
            {entries.filter(e => e.is_completed).length}/15
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedChapter(null) }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'history'
              ? 'text-morandi-gold border-morandi-gold'
              : 'text-morandi-secondary border-transparent hover:text-morandi-primary'
          )}
        >
          <BookOpen className="w-4 h-4" />
          {MANIFESTATION_NOTEBOOK_LABELS.歷史紀錄}
        </button>
      </div>

      {/* 連續天數和週曲線 */}
      {activeTab === 'daily' && (
        <div className="mb-4 p-3 bg-morandi-container/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-morandi-secondary">{MANIFESTATION_NOTEBOOK_LABELS.這週顯化曲線}</span>
            {snapshot.streak > 0 && (
              <span className="text-xs font-medium text-morandi-gold bg-morandi-gold/10 px-2 py-0.5 rounded-full">
                {MANIFESTATION_NOTEBOOK_LABELS.連續} {snapshot.streak} {MANIFESTATION_NOTEBOOK_LABELS.天}
              </span>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekData.map(({ day, label, completed }) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-6 w-full rounded-full border transition-all',
                    completed
                      ? 'bg-morandi-gold border-morandi-gold'
                      : 'bg-card border-morandi-container'
                  )}
                />
                <span className={cn(
                  'text-[10px]',
                  completed ? 'text-morandi-gold font-medium' : 'text-morandi-secondary'
                )}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 內容區域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 今日顯化 */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            {showSuccess && (
              <div className="p-3 bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg text-center">
                <p className="text-sm text-morandi-gold font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {MANIFESTATION_NOTEBOOK_LABELS.太棒了今日顯化已記錄}
                </p>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-morandi-primary mb-2">
                <Star className="w-3.5 h-3.5 text-morandi-gold" />
                {MANIFESTATION_NOTEBOOK_LABELS.今日意念}
              </label>
              <Input
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder={MANIFESTATION_NOTEBOOK_LABELS.今天我想要專注在}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-morandi-primary mb-2">
                <Heart className="w-3.5 h-3.5 text-morandi-red" />
                {MANIFESTATION_NOTEBOOK_LABELS.感恩三件事}
              </label>
              <div className="space-y-2">
                {gratitudes.map((gratitude, index) => (
                  <Input
                    key={index}
                    type="text"
                    value={gratitude}
                    onChange={(e) => handleGratitudeChange(index, e.target.value)}
                    placeholder={`${MANIFESTATION_NOTEBOOK_LABELS.感恩} ${index + 1}...`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-morandi-primary mb-2">
                <Zap className="w-3.5 h-3.5 text-morandi-gold" />
                {MANIFESTATION_NOTEBOOK_LABELS.魔法語句}
              </label>
              <Input
                type="text"
                value={magicPhrase}
                onChange={(e) => setMagicPhrase(e.target.value)}
                placeholder={MANIFESTATION_NOTEBOOK_LABELS.我值得擁有美好的一切}
              />
            </div>

            <Button
              onClick={handleSaveDaily}
              disabled={!canSaveDaily || isSaving}
              className={cn(
                'w-full gap-2',
                canSaveDaily
                  ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                  : 'bg-morandi-container text-morandi-muted cursor-not-allowed'
              )}
            >
              <Sparkles className="w-4 h-4" />
              {isSaving ? MANIFESTATION_NOTEBOOK_LABELS.保存中 : MANIFESTATION_NOTEBOOK_LABELS.完成今日顯化}
            </Button>
          </div>
        )}

        {/* 章節練習 */}
        {activeTab === 'chapters' && !selectedChapter && (
          <div className="space-y-2">
            {chapters.map((chapter) => {
              const completed = getChapterStatus(chapter.id)
              return (
                <button
                  key={chapter.id}
                  onClick={() => handleSelectChapter(chapter.id)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-all hover:shadow-md',
                    completed
                      ? 'bg-morandi-gold/5 border-morandi-gold/30'
                      : 'bg-card border-border hover:border-morandi-gold/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                        completed
                          ? 'bg-morandi-gold text-white'
                          : 'bg-morandi-container text-morandi-secondary'
                      )}
                    >
                      {completed ? <Check className="w-4 h-4" /> : chapter.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-morandi-primary truncate">
                        {chapter.title}
                      </h4>
                      <p className="text-xs text-morandi-secondary mt-0.5 line-clamp-1">
                        {chapter.quote}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* 章節詳情 */}
        {activeTab === 'chapters' && selectedChapter && (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedChapter(null)}
              className="flex items-center gap-1 text-sm text-morandi-secondary hover:text-morandi-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              {MANIFESTATION_NOTEBOOK_LABELS.返回章節列表}
            </button>

            {(() => {
              const chapter = getChapter(selectedChapter)
              if (!chapter) return null

              return (
                <>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${chapter.color}20` }}>
                    <h3 className="font-semibold text-morandi-primary">
                      {MANIFESTATION_NOTEBOOK_LABELS.第} {chapter.id} {MANIFESTATION_NOTEBOOK_LABELS.章}{chapter.title}
                    </h3>
                    <p className="text-sm text-morandi-secondary mt-1 italic">
                      「{chapter.quote}」
                    </p>
                  </div>

                  <div className="text-sm text-morandi-primary whitespace-pre-line">
                    {chapter.content}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm text-morandi-primary mb-2">
                      {MANIFESTATION_NOTEBOOK_LABELS.練習指引}
                    </h4>
                    <ul className="text-sm text-morandi-secondary space-y-1">
                      {chapter.exercise.instructions.map((instruction, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-morandi-gold">{i + 1}.</span>
                          {instruction}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    {chapter.exercise.fields.includes('desire') && (
                      <div>
                        <label className="text-xs font-medium text-morandi-primary mb-1 block">
                          {MANIFESTATION_NOTEBOOK_LABELS.我的渴望}
                        </label>
                        <Textarea
                          value={(chapterForm.desire as string) || ''}
                          onChange={(e) => setChapterForm({ ...chapterForm, desire: e.target.value })}
                          placeholder={MANIFESTATION_NOTEBOOK_LABELS.我想要}
                          rows={3}
                        />
                      </div>
                    )}

                    {chapter.exercise.fields.includes('dialogue') && (
                      <div>
                        <label className="text-xs font-medium text-morandi-primary mb-1 block">
                          {MANIFESTATION_NOTEBOOK_LABELS.與渴望的對話}
                        </label>
                        <Textarea
                          value={(chapterForm.dialogue as string) || ''}
                          onChange={(e) => setChapterForm({ ...chapterForm, dialogue: e.target.value })}
                          placeholder={MANIFESTATION_NOTEBOOK_LABELS.記錄你與內在的對話}
                          rows={4}
                        />
                      </div>
                    )}

                    {chapter.exercise.fields.includes('small_action') && (
                      <div>
                        <label className="text-xs font-medium text-morandi-primary mb-1 block">
                          {MANIFESTATION_NOTEBOOK_LABELS.小行動}
                        </label>
                        <Input
                          value={(chapterForm.small_action as string) || ''}
                          onChange={(e) => setChapterForm({ ...chapterForm, small_action: e.target.value })}
                          placeholder={MANIFESTATION_NOTEBOOK_LABELS.今天我要做的一個小行動}
                        />
                      </div>
                    )}

                    {chapter.exercise.fields.includes('gratitude') && (
                      <div>
                        <label className="text-xs font-medium text-morandi-primary mb-1 block">
                          {MANIFESTATION_NOTEBOOK_LABELS.感恩}
                        </label>
                        <Textarea
                          value={(chapterForm.gratitude as string) || ''}
                          onChange={(e) => setChapterForm({ ...chapterForm, gratitude: e.target.value })}
                          placeholder={MANIFESTATION_NOTEBOOK_LABELS.我感謝}
                          rows={3}
                        />
                      </div>
                    )}

                    {chapter.exercise.fields.includes('notes') && (
                      <div>
                        <label className="text-xs font-medium text-morandi-primary mb-1 block">
                          {MANIFESTATION_NOTEBOOK_LABELS.筆記}
                        </label>
                        <Textarea
                          value={(chapterForm.notes as string) || ''}
                          onChange={(e) => setChapterForm({ ...chapterForm, notes: e.target.value })}
                          placeholder={MANIFESTATION_NOTEBOOK_LABELS.其他想記錄的}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSaveChapter}
                    className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {MANIFESTATION_NOTEBOOK_LABELS.完成練習}
                  </Button>
                </>
              )
            })()}
          </div>
        )}

        {/* 歷史紀錄 */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="text-center py-8 text-morandi-secondary">{MANIFESTATION_NOTEBOOK_LABELS.載入中}</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-morandi-secondary">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{MANIFESTATION_NOTEBOOK_LABELS.還沒有任何紀錄}</p>
                <p className="text-xs mt-1">{MANIFESTATION_NOTEBOOK_LABELS.開始你的第一次顯化吧}</p>
              </div>
            ) : (
              <>
                {paginatedRecords.map((record) => {
                  const content = parseContent(record.content)
                  const today = getTodayKey()
                  const isToday = record.record_date === today

                  return (
                    <div
                      key={record.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        isToday ? 'bg-morandi-gold/5 border-morandi-gold/30' : 'bg-card border-border'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          'text-sm font-medium',
                          isToday ? 'text-morandi-gold' : 'text-morandi-primary'
                        )}>
                          {formatDate(record.record_date)}
                          {isToday && <span className="ml-1 text-xs">{MANIFESTATION_NOTEBOOK_LABELS.今天}</span>}
                        </span>
                      </div>

                      {content.intention && (
                        <div className="mb-2">
                          <span className="text-xs text-morandi-secondary flex items-center gap-1">
                            <Star className="w-3 h-3" /> {MANIFESTATION_NOTEBOOK_LABELS.意念}
                          </span>
                          <p className="text-sm text-morandi-primary">{content.intention}</p>
                        </div>
                      )}

                      {content.gratitudes && content.gratitudes.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs text-morandi-secondary flex items-center gap-1">
                            <Heart className="w-3 h-3" /> 感恩
                          </span>
                          <ul className="text-sm text-morandi-primary list-disc list-inside">
                            {content.gratitudes.map((g, i) => (
                              <li key={i}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {content.magicPhrase && (
                        <div>
                          <span className="text-xs text-morandi-secondary flex items-center gap-1">
                            <Zap className="w-3 h-3" /> 魔法語句
                          </span>
                          <p className="text-sm text-morandi-primary italic">&ldquo;{content.magicPhrase}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )
                })}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="p-1 text-morandi-secondary hover:text-morandi-primary disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-morandi-secondary">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="p-1 text-morandi-secondary hover:text-morandi-primary disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
