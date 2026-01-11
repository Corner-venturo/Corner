'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Heart, Star, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import {
  loadManifestationFromSupabase,
  recordManifestationCompletion,
  getTodayKey,
  getDayDifferenceFromToday,
  type ManifestationReminderSnapshot,
} from '@/lib/manifestation/reminder'

interface DailyManifestationPanelProps {
  className?: string
}

export default function DailyManifestationPanel({ className }: DailyManifestationPanelProps) {
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(true)
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
      }
    }
    loadData()
  }, [user?.id])

  // 處理感恩輸入
  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitudes = [...gratitudes]
    newGratitudes[index] = value
    setGratitudes(newGratitudes)
  }

  // 保存每日顯化
  const handleSave = useCallback(async () => {
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
        // 清空輸入
        setIntention('')
        setGratitudes(['', '', ''])
        setMagicPhrase('')
      }
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, intention, gratitudes, magicPhrase])

  // 檢查是否可以保存
  const canSave = intention.trim() || gratitudes.some(g => g.trim()) || magicPhrase.trim()

  return (
    <div className={cn('bg-card border border-border rounded-xl shadow-sm overflow-hidden', className)}>
      {/* 標題列 - 始終顯示 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-morandi-container/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-full',
            isCompletedToday
              ? 'bg-morandi-gold/20 text-morandi-gold'
              : 'bg-morandi-container/50 text-morandi-secondary'
          )}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-morandi-primary">每日顯化</h3>
            <p className="text-xs text-morandi-secondary">
              {isCompletedToday ? (
                <span className="text-morandi-gold flex items-center gap-1">
                  <Check className="w-3 h-3" /> 今日已完成
                </span>
              ) : (
                '花 3 分鐘與願望對話'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {snapshot.streak > 0 && (
            <span className="text-xs font-medium text-morandi-gold bg-morandi-gold/10 px-2 py-1 rounded-full">
              連續 {snapshot.streak} 天
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-morandi-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-morandi-secondary" />
          )}
        </div>
      </button>

      {/* 展開的內容 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50">
          {showSuccess && (
            <div className="mt-4 p-3 bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg text-center">
              <p className="text-sm text-morandi-gold font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                太棒了！今日顯化已記錄
              </p>
            </div>
          )}

          {/* 今日意念 */}
          <div className="mt-4">
            <label className="flex items-center gap-2 text-xs font-medium text-morandi-primary mb-2">
              <Star className="w-3.5 h-3.5 text-morandi-gold" />
              今日意念
            </label>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="今天我想要專注在..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold outline-none transition-all"
            />
          </div>

          {/* 三件感恩的事 */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-morandi-primary mb-2">
              <Heart className="w-3.5 h-3.5 text-morandi-red" />
              感恩三件事
            </label>
            <div className="space-y-2">
              {gratitudes.map((gratitude, index) => (
                <input
                  key={index}
                  type="text"
                  value={gratitude}
                  onChange={(e) => handleGratitudeChange(index, e.target.value)}
                  placeholder={`感恩 ${index + 1}...`}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold outline-none transition-all"
                />
              ))}
            </div>
          </div>

          {/* 魔法語句 */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-morandi-primary mb-2">
              <Zap className="w-3.5 h-3.5 text-morandi-gold" />
              魔法語句
            </label>
            <input
              type="text"
              value={magicPhrase}
              onChange={(e) => setMagicPhrase(e.target.value)}
              placeholder="我值得擁有美好的一切..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold outline-none transition-all"
            />
          </div>

          {/* 保存按鈕 */}
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={cn(
              'w-full gap-2',
              canSave
                ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                : 'bg-morandi-container text-morandi-muted cursor-not-allowed'
            )}
          >
            <Sparkles className="w-4 h-4" />
            {isSaving ? '保存中...' : '完成今日顯化'}
          </Button>

          {/* 提示文字 */}
          <p className="text-xs text-morandi-secondary text-center">
            想要完整的顯化練習？
            <a href="/manifestation" className="text-morandi-gold hover:underline ml-1">
              前往顯化魔法
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
