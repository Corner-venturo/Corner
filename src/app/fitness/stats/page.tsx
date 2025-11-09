'use client'

import { BarChart3, TrendingUp, Trophy } from 'lucide-react'
import { FitnessLayout } from '../components/FitnessLayout'

export default function FitnessStatsPage() {
  // TODO: 從資料庫讀取統計數據

  return (
    <FitnessLayout activeTab="stats">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FEFEFE] border-b border-[#EDE8E0] px-4 py-4">
        <h1 className="text-xl font-bold text-[#3D2914]">訓練統計</h1>
      </div>

      <div className="px-4 pt-6">
        {/* 空狀態 */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#F5F0EB] rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-10 h-10 text-[#C9A961]" />
          </div>
          <h3 className="text-lg font-medium text-[#3D2914] mb-2">
            尚無統計數據
          </h3>
          <p className="text-sm text-[#9E8F81] mb-6">
            累積更多訓練記錄後，這裡會顯示你的進步曲線
          </p>
          <div className="text-xs text-[#AFA598] space-y-1">
            <div className="flex items-center gap-2 justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
              訓練容量趨勢
            </div>
            <div className="flex items-center gap-2 justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
              訓練頻率分析
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Trophy className="w-3.5 h-3.5" />
              個人紀錄 (PR)
            </div>
          </div>
        </div>
      </div>
    </FitnessLayout>
  )
}
