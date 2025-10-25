'use client'

import { memo } from 'react'

import { useTimeboxStore } from '@/stores/timebox-store'

interface StatisticsPanelProps {
  variant?: 'panel' | 'inline'
}

function StatisticsPanel({ variant = 'panel' }: StatisticsPanelProps) {
  const { getWeekStatistics } = useTimeboxStore()
  const stats = getWeekStatistics()

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小時${mins > 0 ? ` ${mins}分鐘` : ''}`
    }
    return `${mins}分鐘`
  }

  const completionRate = stats?.completionRate ?? 0
  const totalWorkoutTime = stats?.totalWorkoutTime ?? 0
  const completedByType = stats?.completedByType ?? { workout: 0, reminder: 0, basic: 0 }
  const totalWorkoutVolume = stats?.totalWorkoutVolume ?? 0
  const totalWorkoutSessions = stats?.totalWorkoutSessions ?? 0

  const hasWorkoutStats = totalWorkoutSessions > 0 && totalWorkoutVolume > 0

  if (variant === 'inline') {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-morandi-secondary">本週完成率</p>
          <p className="text-xl font-semibold text-morandi-primary">
            {Math.round(completionRate * 100)}%
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-morandi-secondary">運動時間</p>
          <p className="text-xl font-semibold text-morandi-primary">
            {formatTime(totalWorkoutTime)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-morandi-secondary">完成項目</p>
          <p className="text-sm font-semibold text-morandi-primary">
            運動 {completedByType.workout} / 保養 {completedByType.reminder} / 其他 {completedByType.basic}
          </p>
        </div>

        {hasWorkoutStats && (
          <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-morandi-secondary">訓練量</p>
            <p className="text-sm font-semibold text-morandi-primary">
              {totalWorkoutVolume.toLocaleString()} kg · {totalWorkoutSessions} 次
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
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary">本週完成率</p>
              <p className="text-lg sm:text-2xl font-bold text-morandi-primary">
                {Math.round(completionRate * 100)}%
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-morandi-container flex items-center justify-center">
              <div className="text-morandi-gold font-semibold text-xs sm:text-base">
                {Math.round(completionRate * 100)}
              </div>
            </div>
          </div>
        </div>

        <div className="morandi-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary">運動時間</p>
              <p className="text-lg sm:text-2xl font-bold text-morandi-primary">
                <span className="hidden sm:inline">{formatTime(totalWorkoutTime)}</span>
                <span className="sm:hidden">{Math.floor(totalWorkoutTime / 60)}h</span>
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-morandi-container flex items-center justify-center">
              <div className="text-morandi-green font-semibold text-xs sm:text-sm">
                {Math.floor(totalWorkoutTime / 60)}h
              </div>
            </div>
          </div>
        </div>

        <div className="morandi-card p-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-morandi-secondary mb-2">完成項目</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">運動</span>
                <span className="font-medium text-morandi-primary">{completedByType.workout} 次</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">保養</span>
                <span className="font-medium text-morandi-primary">{completedByType.reminder} 次</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">其他</span>
                <span className="font-medium text-morandi-primary">{completedByType.basic} 次</span>
              </div>
            </div>
          </div>
        </div>

        {hasWorkoutStats && (
          <div className="morandi-card p-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary mb-2">重訓統計</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">本週訓練量</span>
                  <span className="font-medium text-morandi-primary">{totalWorkoutVolume.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">訓練次數</span>
                  <span className="font-medium text-morandi-primary">{totalWorkoutSessions} 次</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">平均每次</span>
                  <span className="font-medium text-morandi-primary">
                    {Math.round(totalWorkoutVolume / (totalWorkoutSessions || 1)).toLocaleString()} kg
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