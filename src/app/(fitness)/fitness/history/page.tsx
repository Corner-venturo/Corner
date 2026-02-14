'use client'

import { Calendar } from 'lucide-react'
import { FitnessLayout } from '../components/FitnessLayout'
import { FITNESS_LABELS } from '../constants/labels'

export default function FitnessHistoryPage() {
  // [Feature] 訓練歷史功能待整合 fitness_records 資料表

  return (
    <FitnessLayout activeTab="history">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFFFFF] border-b border-[#E8E4E0] px-4 py-4">
        <h1 className="text-xl font-bold text-[#333333]">{FITNESS_LABELS.HISTORY_TITLE}</h1>
      </div>

      <div className="px-4 pt-6">
        {/* 空狀態 */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#F9F8F6] rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-[#B8A99A]" />
          </div>
          <h3 className="text-lg font-medium text-[#333333] mb-2">
            {FITNESS_LABELS.HISTORY_EMPTY_TITLE}
          </h3>
          <p className="text-sm text-[#8C8C8C] mb-6">
            {FITNESS_LABELS.HISTORY_EMPTY_DESC}
          </p>
          <div className="text-xs text-[#8C8C8C]">
            {FITNESS_LABELS.HISTORY_EMPTY_HINT}
          </div>
        </div>
      </div>
    </FitnessLayout>
  )
}
