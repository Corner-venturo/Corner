'use client'

import { Calendar } from 'lucide-react'
import { FitnessLayout } from '../components/FitnessLayout'

export default function FitnessHistoryPage() {
  // TODO: 從資料庫讀取訓練歷史

  return (
    <FitnessLayout activeTab="history">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FEFEFE] border-b border-[#EDE8E0] px-4 py-4">
        <h1 className="text-xl font-bold text-[#3D2914]">訓練歷史</h1>
      </div>

      <div className="px-4 pt-6">
        {/* 空狀態 */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#F5F0EB] rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-[#C9A961]" />
          </div>
          <h3 className="text-lg font-medium text-[#3D2914] mb-2">
            尚無訓練記錄
          </h3>
          <p className="text-sm text-[#9E8F81] mb-6">
            完成第一次訓練後，這裡會顯示你的訓練歷史
          </p>
          <div className="text-xs text-[#AFA598]">
            提示：訓練記錄會自動儲存到雲端
          </div>
        </div>
      </div>
    </FitnessLayout>
  )
}
