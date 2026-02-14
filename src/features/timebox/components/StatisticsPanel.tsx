'use client'

import { STATS_LABELS } from '../constants/labels'

import { memo, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useTimeboxBoxes,
  useTimeboxWeeks,
  useTimeboxScheduledBoxes,
  formatDateString,
  getWeekStart,
  type WorkoutData,
} from '../hooks/useTimeboxData'

interface StatisticsPanelProps {
  variant?: 'panel' | 'inline'
  selectedWeek?: Date
}

function StatisticsPanel({ variant = 'panel', selectedWeek = new Date() }: StatisticsPanelProps) {
  const user = useAuthStore(state => state.user)
  const userId = user?.id

  const { items: boxes } = useTimeboxBoxes()
  const { items: weeks } = useTimeboxWeeks()
  const { items: scheduledBoxes } = useTimeboxScheduledBoxes()

  // 計算統計資料
  const stats = useMemo(() => {
    if (!userId) {
      return {
        completionRate: 0,
        totalWorkoutTime: 0,
        completedByType: { workout: 0, reminder: 0, basic: 0 },
        totalWorkoutVolume: 0,
        totalWorkoutSessions: 0,
      }
    }

    const weekStartStr = formatDateString(getWeekStart(selectedWeek))
    const currentWeek = weeks.find(w => w.week_start === weekStartStr && w.user_id === userId)

    if (!currentWeek) {
      return {
        completionRate: 0,
        totalWorkoutTime: 0,
        completedByType: { workout: 0, reminder: 0, basic: 0 },
        totalWorkoutVolume: 0,
        totalWorkoutSessions: 0,
      }
    }

    const weekScheduled = scheduledBoxes.filter(sb => sb.week_id === currentWeek.id)
    const totalBoxes = weekScheduled.length
    const completedBoxes = weekScheduled.filter(sb => sb.completed)

    const completedByType = { workout: 0, reminder: 0, basic: 0 }
    let totalWorkoutTime = 0
    let totalWorkoutVolume = 0
    let totalWorkoutSessions = 0

    weekScheduled.forEach(sb => {
      if (sb.completed) {
        const box = boxes.find(b => b.id === sb.box_id)
        if (box) {
          const boxType = (box.type || 'basic') as 'workout' | 'reminder' | 'basic'
          completedByType[boxType]++
          totalWorkoutTime += sb.duration

          if (boxType === 'workout' && sb.data) {
            const workoutData = sb.data as unknown as WorkoutData
            if (workoutData.totalVolume) {
              totalWorkoutVolume += workoutData.totalVolume
            }
            totalWorkoutSessions++
          }
        }
      }
    })

    return {
      completionRate: totalBoxes > 0 ? completedBoxes.length / totalBoxes : 0,
      totalWorkoutTime,
      completedByType,
      totalWorkoutVolume,
      totalWorkoutSessions,
    }
  }, [userId, selectedWeek, weeks, scheduledBoxes, boxes])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小時${mins > 0 ? ` ${mins}分鐘` : ''}`
    }
    return `${mins}分鐘`
  }

  const hasWorkoutStats = stats.totalWorkoutSessions > 0 && stats.totalWorkoutVolume > 0

  if (variant === 'inline') {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-morandi-secondary">{STATS_LABELS.WEEKLY_COMPLETION}</p>
          <p className="text-xl font-semibold text-morandi-primary">
            {Math.round(stats.completionRate * 100)}%
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-morandi-secondary">{STATS_LABELS.EXERCISE_TIME}</p>
          <p className="text-xl font-semibold text-morandi-primary">
            {formatTime(stats.totalWorkoutTime)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-morandi-secondary">{STATS_LABELS.COMPLETED_ITEMS}</p>
          <p className="text-sm font-semibold text-morandi-primary">
            運動 {stats.completedByType.workout} / 保養 {stats.completedByType.reminder} / 其他 {stats.completedByType.basic}
          </p>
        </div>

        {hasWorkoutStats && (
          <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-morandi-secondary">{STATS_LABELS.TRAINING_VOLUME}</p>
            <p className="text-sm font-semibold text-morandi-primary">
              {stats.totalWorkoutVolume.toLocaleString()} kg · {stats.totalWorkoutSessions} 次
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${hasWorkoutStats ? '4' : '3'} gap-4`}>
        <div className="morandi-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary">{STATS_LABELS.WEEKLY_COMPLETION}</p>
              <p className="text-lg sm:text-2xl font-bold text-morandi-primary">
                {Math.round(stats.completionRate * 100)}%
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-morandi-container flex items-center justify-center">
              <div className="text-morandi-gold font-semibold text-xs sm:text-base">
                {Math.round(stats.completionRate * 100)}
              </div>
            </div>
          </div>
        </div>

        <div className="morandi-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary">{STATS_LABELS.EXERCISE_TIME}</p>
              <p className="text-lg sm:text-2xl font-bold text-morandi-primary">
                <span className="hidden sm:inline">{formatTime(stats.totalWorkoutTime)}</span>
                <span className="sm:hidden">{Math.floor(stats.totalWorkoutTime / 60)}h</span>
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-morandi-container flex items-center justify-center">
              <div className="text-status-success font-semibold text-xs sm:text-sm">
                {Math.floor(stats.totalWorkoutTime / 60)}h
              </div>
            </div>
          </div>
        </div>

        <div className="morandi-card p-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-morandi-secondary mb-2">{STATS_LABELS.COMPLETED_ITEMS}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">{STATS_LABELS.EXERCISE}</span>
                <span className="font-medium text-morandi-primary">{stats.completedByType.workout} 次</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">{STATS_LABELS.MAINTENANCE}</span>
                <span className="font-medium text-morandi-primary">{stats.completedByType.reminder} 次</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">{STATS_LABELS.OTHER}</span>
                <span className="font-medium text-morandi-primary">{stats.completedByType.basic} 次</span>
              </div>
            </div>
          </div>
        </div>

        {hasWorkoutStats && (
          <div className="morandi-card p-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary mb-2">{STATS_LABELS.WEIGHT_STATS}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">{STATS_LABELS.WEEKLY_VOLUME}</span>
                  <span className="font-medium text-morandi-primary">{stats.totalWorkoutVolume.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">{STATS_LABELS.TRAINING_COUNT}</span>
                  <span className="font-medium text-morandi-primary">{stats.totalWorkoutSessions} 次</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">{STATS_LABELS.AVG_PER_SESSION}</span>
                  <span className="font-medium text-morandi-primary">
                    {Math.round(stats.totalWorkoutVolume / (stats.totalWorkoutSessions || 1)).toLocaleString()} kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(StatisticsPanel)
