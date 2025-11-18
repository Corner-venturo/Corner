'use client'

import { memo, useEffect, useState } from 'react'

import { useTimeboxStore } from '@/stores/timebox-store'

interface StatisticsPanelProps {
  variant?: 'panel' | 'inline'
}

function StatisticsPanel({ variant = 'panel' }: StatisticsPanelProps) {
  const { getWeekStatistics, currentWeekId } = useTimeboxStore()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (currentWeekId) {
      getWeekStatistics(currentWeekId).then(setStats)
    }
  }, [currentWeekId, getWeekStatistics])

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
      <div className="hidden lg:flex items-center gap-3">
        <div className="rounded-lg border border-border/40 bg-morandi-container/30 px-3 py-1.5">
          <p className="text-[10px] font-medium text-morandi-muted mb-0.5">本週完成率</p>
          <p className="text-xs font-semibold text-morandi-primary">
            {Math.round(completionRate * 100)}%
          </p>
        </div>

        <div className="rounded-lg border border-border/40 bg-morandi-container/30 px-3 py-1.5">
          <p className="text-[10px] font-medium text-morandi-muted mb-0.5">運動時間</p>
          <p className="text-xs font-semibold text-morandi-primary">
            {formatTime(totalWorkoutTime)}
          </p>
        </div>

        <div className="rounded-lg border border-border/40 bg-morandi-container/30 px-3 py-1.5">
          <p className="text-[10px] font-medium text-morandi-muted mb-0.5">完成項目</p>
          <p className="text-xs font-medium text-morandi-secondary">
            運動 {completedByType.workout} / 保養 {completedByType.reminder} / 其他{' '}
            {completedByType.basic}
          </p>
        </div>

        {hasWorkoutStats && (
          <div className="rounded-lg border border-border/40 bg-morandi-container/30 px-3 py-1.5">
            <p className="text-[10px] font-medium text-morandi-muted mb-0.5">訓練量</p>
            <p className="text-xs font-medium text-morandi-secondary">
              {totalWorkoutVolume.toLocaleString()} kg · {totalWorkoutSessions} 次
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`grid gap-4 ${hasWorkoutStats ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}
    >
      {/* 完成率卡片 */}
      <div className="morandi-card p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-morandi-secondary mb-1">本週完成率</p>
            <p className="text-3xl font-bold text-morandi-primary">
              {Math.round(completionRate * 100)}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-morandi-gold/10 flex items-center justify-center">
            <span className="text-morandi-gold font-bold text-lg">
              {Math.round(completionRate * 100)}
            </span>
          </div>
        </div>
        <div className="w-full bg-morandi-container rounded-full h-2 mt-3">
          <div
            className="bg-morandi-gold h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(completionRate * 100)}%` }}
          />
        </div>
      </div>

      {/* 運動時間卡片 */}
      <div className="morandi-card p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-morandi-secondary mb-1">運動時間</p>
            <p className="text-3xl font-bold text-morandi-primary">
              {formatTime(totalWorkoutTime)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 font-bold text-sm">
              {Math.floor(totalWorkoutTime / 60)}h
            </span>
          </div>
        </div>
        <p className="text-xs text-morandi-muted mt-3">保持健康的生活習慣</p>
      </div>

      {/* 完成項目卡片 */}
      <div className="morandi-card p-5 hover:shadow-md transition-shadow">
        <p className="text-sm font-medium text-morandi-secondary mb-3">完成項目</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-morandi-secondary">運動</span>
            </div>
            <span className="text-lg font-semibold text-morandi-primary">
              {completedByType.workout}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-sm text-morandi-secondary">保養</span>
            </div>
            <span className="text-lg font-semibold text-morandi-primary">
              {completedByType.reminder}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-sm text-morandi-secondary">其他</span>
            </div>
            <span className="text-lg font-semibold text-morandi-primary">
              {completedByType.basic}
            </span>
          </div>
        </div>
      </div>

      {/* 重訓統計卡片 */}
      {hasWorkoutStats && (
        <div className="morandi-card p-5 hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-morandi-secondary mb-3">重訓統計</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-morandi-muted">本週訓練量</p>
              <p className="text-2xl font-bold text-morandi-primary">
                {totalWorkoutVolume.toLocaleString()}{' '}
                <span className="text-base font-normal">kg</span>
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <p className="text-xs text-morandi-muted">訓練次數</p>
                <p className="text-lg font-semibold text-morandi-primary">
                  {totalWorkoutSessions} 次
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-morandi-muted">平均每次</p>
                <p className="text-lg font-semibold text-morandi-primary">
                  {Math.round(totalWorkoutVolume / (totalWorkoutSessions || 1))} kg
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(StatisticsPanel)
