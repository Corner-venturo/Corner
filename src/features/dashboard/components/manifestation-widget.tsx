'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Sparkles, Moon, BellRing, Feather, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  MANIFESTATION_EVENT,
  ManifestationReminderSnapshot,
  getDayDifferenceFromToday,
  getManifestationReminderSnapshot,
  getWeekRange,
  loadManifestationFromSupabase,
  MANIFESTATION_LAST_DATE_KEY,
  MANIFESTATION_STREAK_KEY,
  MANIFESTATION_HISTORY_KEY,
} from '@/lib/manifestation/reminder'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface ReminderView {
  title: string
  message: string
  accent: string
  gradient: string
  icon: ReactNode
  showAction: boolean
}

const icons = {
  complete: <Sparkles className="w-5 h-5" />,
  day1: <Feather className="w-5 h-5" />,
  day2: <Moon className="w-5 h-5" />,
  recall: <BellRing className="w-5 h-5" />,
  empty: <Heart className="w-5 h-5" />,
}

const getReminderView = (snapshot: ManifestationReminderSnapshot): ReminderView => {
  const diff = getDayDifferenceFromToday(snapshot.lastDate)

  if (snapshot.lastDate === null) {
    return {
      title: '開啟你的顯化旅程',
      message: '今天就與願望對話，為內在點亮第一束光。',
      accent: 'from-morandi-red/30 to-morandi-gold/20',
      gradient: 'bg-gradient-to-br from-morandi-red/10 via-white to-morandi-gold/10',
      icon: icons.empty,
      showAction: true,
    }
  }

  if (diff === null || diff <= 0) {
    return {
      title: '🌸 今日已完成顯化練習',
      message: '讓願望在靜心中成長。',
      accent: 'from-morandi-gold/40 to-morandi-gold/20',
      gradient: 'bg-gradient-to-br from-morandi-gold/10 via-white to-morandi-container/20',
      icon: icons.complete,
      showAction: false,
    }
  }

  if (diff === 1) {
    return {
      title: '🍃 今天還沒與願望對話呢',
      message: '要不要花 3 分鐘？把心再次帶回自己。',
      accent: 'from-morandi-green/40 to-morandi-container/40',
      gradient: 'bg-gradient-to-br from-morandi-green/10 via-white to-morandi-container/20',
      icon: icons.day1,
      showAction: true,
    }
  }

  if (diff === 2) {
    return {
      title: '🌙 願望還在等你',
      message: '它還記得你昨天的心，也相信你會回來。',
      accent: 'from-morandi-secondary/40 to-morandi-muted/40',
      gradient: 'bg-gradient-to-br from-morandi-secondary/10 via-white to-morandi-muted/10',
      icon: icons.day2,
      showAction: true,
    }
  }

  return {
    title: '🔔 能量回呼',
    message: '距離上次顯化已過 3 日，請回到呼吸與心願。',
    accent: 'from-morandi-primary/30 to-morandi-secondary/30',
    gradient: 'bg-gradient-to-br from-morandi-primary/5 via-white to-morandi-secondary/10',
    icon: icons.recall,
    showAction: true,
  }
}

const getWeeklyMessage = (history: string[]): string => {
  const week = getWeekRange()
  const completions = week.filter(day => history.includes(day)).length

  if (completions >= 5) {
    return '這週你的顯化節奏：穩定而柔軟，請繼續信任流動。'
  }
  if (completions >= 3) {
    return '這週你的顯化節奏：有起伏也有溫度，允許自己慢慢調頻。'
  }
  if (completions >= 1) {
    return '這週你的顯化節奏：願望聽見你了，再靠近一點點。'
  }
  return '這週你的顯化節奏：靜靜等待，你隨時都可以重新開始。'
}

const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

export function ManifestationWidget() {
  const [snapshot, setSnapshot] = useState<ManifestationReminderSnapshot>({
    lastDate: null,
    streak: 0,
    history: [],
  })
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncFromStorage = async () => {
      // 如果有用戶，先從 Supabase 載入
      if (user?.id) {
        const supabaseData = await loadManifestationFromSupabase(user.id)
        if (supabaseData) {
          setSnapshot(supabaseData)
          // 同步到 localStorage 作為備份
          if (supabaseData.lastDate) {
            localStorage.setItem(MANIFESTATION_LAST_DATE_KEY, supabaseData.lastDate)
          }
          localStorage.setItem(MANIFESTATION_STREAK_KEY, String(supabaseData.streak))
          localStorage.setItem(MANIFESTATION_HISTORY_KEY, JSON.stringify(supabaseData.history))
          return
        }
      }

      // 降級到 localStorage
      setSnapshot(getManifestationReminderSnapshot())
    }

    const handleUpdate = (event: Event) => {
      const custom = event as CustomEvent<ManifestationReminderSnapshot>
      if (custom.detail) {
        setSnapshot(custom.detail)
      } else {
        syncFromStorage()
      }
    }

    syncFromStorage()

    window.addEventListener(MANIFESTATION_EVENT, handleUpdate)
    window.addEventListener('focus', syncFromStorage)

    return () => {
      window.removeEventListener(MANIFESTATION_EVENT, handleUpdate)
      window.removeEventListener('focus', syncFromStorage)
    }
  }, [user?.id])

  const view = useMemo(() => getReminderView(snapshot), [snapshot])

  const week = useMemo(() => {
    const range = getWeekRange()
    return range.map((day, index) => ({
      day,
      label: dayLabels[index],
      completed: snapshot.history.includes(day),
    }))
  }, [snapshot.history])

  const diff = getDayDifferenceFromToday(snapshot.lastDate)
  const lastDateDisplay = useMemo(() => {
    if (!snapshot.lastDate) return '尚未開始練習'
    return `上次練習：${snapshot.lastDate}（${diff === 0 ? '今天' : diff === 1 ? '昨天' : `${diff} 天前`}）`
  }, [snapshot.lastDate, diff])

  const handleAction = () => {
    router.push('/manifestation')
  }

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80',
          view.gradient
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br',
                view.accent,
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              {view.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                {view.title}
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                {view.message}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40">
            <div className="flex items-center justify-between text-xs text-morandi-secondary font-medium">
              <span>{lastDateDisplay}</span>
              <span className="px-2.5 py-1 bg-morandi-gold/10 text-morandi-gold rounded-full font-semibold">
                連續 {Math.max(snapshot.streak, 0)} 日
              </span>
            </div>

            <div className="mt-3.5">
              <div className="flex items-center justify-between text-[10px] text-morandi-secondary/90 mb-2 font-semibold">
                <span>這週顯化曲線</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {week.map(({ day, label, completed }) => (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'h-12 w-full rounded-full border transition-all duration-300 shadow-sm',
                        completed
                          ? 'bg-gradient-to-b from-morandi-gold via-morandi-gold/80 to-morandi-gold/70 border-morandi-gold/90 shadow-morandi-gold/30 scale-105'
                          : 'bg-white/90 border-morandi-secondary/20 hover:border-morandi-secondary/30'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-medium transition-colors',
                        completed ? 'text-morandi-gold' : 'text-morandi-secondary/70'
                      )}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/50 p-3 border border-white/30">
            <p className="text-xs text-morandi-secondary/90 leading-relaxed font-medium">
              {getWeeklyMessage(snapshot.history)}
            </p>
          </div>

          <div className="mt-auto">
            {view.showAction && (
              <Button
                size="sm"
                className="w-full bg-morandi-gold text-white hover:bg-morandi-gold-hover shadow-md hover:shadow-lg transition-all font-semibold"
                onClick={handleAction}
              >
                前往顯化練習
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
