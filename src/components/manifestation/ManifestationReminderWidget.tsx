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
} from '@/lib/manifestation/reminder'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
      accent: 'from-rose-200/70 to-amber-100/60',
      gradient: 'bg-gradient-to-br from-rose-100/80 via-white to-amber-50/70',
      icon: icons.empty,
      showAction: true,
    }
  }

  if (diff === null || diff <= 0) {
    return {
      title: '🌸 今日已完成顯化練習',
      message: '讓願望在靜心中成長。',
      accent: 'from-pink-200/60 to-amber-100/60',
      gradient: 'bg-gradient-to-br from-pink-50 via-white to-amber-50',
      icon: icons.complete,
      showAction: false,
    }
  }

  if (diff === 1) {
    return {
      title: '🍃 今天還沒與願望對話呢',
      message: '要不要花 3 分鐘？把心再次帶回自己。',
      accent: 'from-emerald-200/60 to-sky-100/60',
      gradient: 'bg-gradient-to-br from-emerald-50 via-white to-sky-50',
      icon: icons.day1,
      showAction: true,
    }
  }

  if (diff === 2) {
    return {
      title: '🌙 願望還在等你',
      message: '它還記得你昨天的心，也相信你會回來。',
      accent: 'from-indigo-200/60 to-purple-100/60',
      gradient: 'bg-gradient-to-br from-indigo-50 via-white to-purple-50',
      icon: icons.day2,
      showAction: true,
    }
  }

  return {
    title: '🔔 能量回呼',
    message: '距離上次顯化已過 3 日，請回到呼吸與心願。',
    accent: 'from-violet-200/60 to-blue-100/60',
    gradient: 'bg-gradient-to-br from-violet-100 via-white to-blue-50',
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

export function ManifestationReminderWidget() {
  const [snapshot, setSnapshot] = useState<ManifestationReminderSnapshot>({
    lastDate: null,
    streak: 0,
    history: [],
  })
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncFromStorage = () => {
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
  }, [])

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
    <div className="pointer-events-none fixed top-[96px] right-6 z-[250] w-80 max-w-full">
      <div
        className={cn(
          'pointer-events-auto rounded-2xl border border-white/60 shadow-lg backdrop-blur-md transition-all duration-300',
          view.gradient
        )}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2 text-white shadow-inner shadow-white/40',
                'bg-gradient-to-br',
                view.accent
              )}
            >
              {view.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-morandi-primary leading-tight">{view.title}</p>
              <p className="text-xs text-morandi-secondary mt-1 leading-relaxed">{view.message}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/60 p-3 shadow-inner">
            <div className="flex items-center justify-between text-xs text-morandi-secondary">
              <span>{lastDateDisplay}</span>
              <span>連續 {Math.max(snapshot.streak, 0)} 日</span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-morandi-secondary/80 mb-1">
                <span>這週顯化曲線</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {week.map(({ day, label, completed }) => (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'h-12 w-full rounded-full border border-morandi-secondary/20 transition-all duration-300',
                        completed ? 'bg-morandi-gold/70 border-morandi-gold/80' : 'bg-white/80'
                      )}
                    />
                    <span className="text-[10px] text-morandi-secondary/70">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-morandi-secondary leading-relaxed">
            {getWeeklyMessage(snapshot.history)}
          </p>

          {view.showAction && (
            <Button
              size="sm"
              className="w-full bg-morandi-gold text-white hover:bg-morandi-gold/90"
              onClick={handleAction}
            >
              前往顯化練習
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
