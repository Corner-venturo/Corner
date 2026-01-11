'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart3, Settings } from 'lucide-react'
import { useStatsData, useStatsConfig, saveStatsConfig } from '../hooks/use-stats-data'
import type { StatType } from '../types'

export function StatsWidget() {
  const allStats = useStatsData()
  const [activeStats, setActiveStats] = useState<StatType[]>(useStatsConfig())
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // 儲存設定
  const toggleStat = (statId: StatType) => {
    const newStats = activeStats.includes(statId)
      ? activeStats.filter(id => id !== statId)
      : [...activeStats, statId]
    setActiveStats(newStats)
    saveStatsConfig(newStats)
  }

  // 只顯示使用者選擇的統計
  const stats = allStats.filter(stat => activeStats.includes(stat.id as StatType))

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-morandi-gold/20 shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/20 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-morandi-gold/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-morandi-gold" />
            <h3 className="font-semibold text-sm text-morandi-primary">統計資訊</h3>
          </div>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="p-1 rounded-lg text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-gold/10 transition-all"
            title="統計設定"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 設定面板 */}
        {isConfigOpen && (
          <div className="mt-3 pt-3 border-t border-morandi-gold/20">
            <div className="text-xs text-morandi-secondary mb-2">選擇要顯示的統計項目</div>
            <div className="grid grid-cols-2 gap-2">
              {allStats.map(stat => (
                <label
                  key={stat.id}
                  className="flex items-center gap-2 cursor-pointer text-xs p-2 rounded-lg hover:bg-card/50 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={activeStats.includes(stat.id as StatType)}
                    onChange={() => toggleStat(stat.id as StatType)}
                    className="w-3 h-3 rounded border-morandi-gold/20 text-morandi-gold focus:ring-morandi-gold/20"
                  />
                  <span className="text-morandi-primary">{stat.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 overflow-auto min-h-0">
        {stats.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-morandi-muted text-sm">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>尚未選擇任何統計項目</p>
              <p className="text-xs mt-1">點擊右上角設定圖示選擇</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map(stat => {
              const Icon = stat.icon as React.ComponentType<{ className?: string }>
              return (
                <div
                  key={stat.id}
                  className="bg-card rounded-xl p-4 border border-morandi-gold/20 hover:border-morandi-gold/20 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-xs text-morandi-secondary mb-1">{stat.label}</div>
                  <div className="text-lg font-bold text-morandi-primary">{stat.value}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
