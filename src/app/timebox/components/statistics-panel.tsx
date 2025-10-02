'use client'

import { memo } from 'react'
import { useTimeboxStore } from '@/stores/timebox-store'
import { Card } from '@/components/ui/card'

function StatisticsPanel() {
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

  const hasWorkoutStats = stats.totalWorkoutSessions > 0 && stats.totalWorkoutVolume && stats.totalWorkoutVolume > 0

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${hasWorkoutStats ? '4' : '3'} gap-4`}>
        {/* 完成率 */}
        <div className="morandi-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary">本週完成率</p>
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

        {/* 運動時間 */}
        <div className="morandi-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary">運動時間</p>
              <p className="text-lg sm:text-2xl font-bold text-morandi-primary">
                <span className="hidden sm:inline">{formatTime(stats.totalWorkoutTime)}</span>
                <span className="sm:hidden">{Math.floor(stats.totalWorkoutTime / 60)}h</span>
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-morandi-container flex items-center justify-center">
              <div className="text-morandi-green font-semibold text-xs sm:text-sm">
                {Math.floor(stats.totalWorkoutTime / 60)}h
              </div>
            </div>
          </div>
        </div>

        {/* 完成項目分布 */}
        <div className="morandi-card p-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-morandi-secondary mb-2">完成項目</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">運動</span>
                <span className="font-medium text-morandi-primary">{stats.completedByType.workout} 次</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">保養</span>
                <span className="font-medium text-morandi-primary">{stats.completedByType.reminder} 次</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-morandi-secondary">其他</span>
                <span className="font-medium text-morandi-primary">{stats.completedByType.basic} 次</span>
              </div>
            </div>
          </div>
        </div>

        {/* 重訓統計 */}
        {hasWorkoutStats && (
          <div className="morandi-card p-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-morandi-secondary mb-2">重訓統計</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">本週訓練量</span>
                  <span className="font-medium text-morandi-primary">{stats.totalWorkoutVolume?.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">訓練次數</span>
                  <span className="font-medium text-morandi-primary">{stats.totalWorkoutSessions} 次</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-morandi-secondary">平均每次</span>
                  <span className="font-medium text-morandi-primary">
                    {Math.round((stats.totalWorkoutVolume || 0) / stats.totalWorkoutSessions).toLocaleString()} kg
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