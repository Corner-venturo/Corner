'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import { Grid3X3, Edit3, Eye } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

const PhaserOffice = dynamic(
  () => import('@/features/game-office/components/PhaserOffice'),
  { ssr: false, loading: () => <div className="flex-1 bg-[#1a1a2e] animate-pulse" /> }
)

const RightPanel = dynamic(
  () => import('@/features/game-office/components/RightPanel'),
  { ssr: false }
)

export default function GameOfficePage() {
  const { user } = useAuthStore()
  const [editMode, setEditMode] = useState(true)
  const [showGrid, setShowGrid] = useState(true)

  return (
    <div className="flex flex-col h-screen bg-[#0d1117]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏢</span>
          <span className="text-sm font-bold text-white tracking-wider">VENTURO OFFICE</span>
        </div>
        <span className="text-xs text-gray-600">Prototype v0.4</span>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Game Area */}
        <div className="flex-1 relative">
          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-3 py-1.5 text-xs rounded border transition-colors ${
              showGrid ? 'border-gray-600 text-white bg-gray-800/80' : 'border-gray-700 text-gray-500 bg-gray-900/80'
            }`}
          >
            <Grid3X3 className="w-3 h-3" />
            格線 ON/OFF
          </button>

          <PhaserOffice
            className="w-full h-full"
            editMode={editMode}
            workspaceId={user?.workspace_id}
            userId={user?.id}
          />
        </div>

        {/* Right Panel - Dashboard */}
        <div className="w-80 flex-shrink-0">
          <Suspense fallback={<div className="w-80 bg-[#0d1117]" />}>
            <RightPanel />
          </Suspense>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            editMode ? 'text-amber-400 bg-amber-400/10' : 'text-gray-400 hover:text-white'
          }`}
        >
          {editMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {editMode ? '✏️ 編輯中' : '👁️ 瀏覽中'}
        </button>
        <span className="text-gray-700">|</span>
        <span>🏢 辦公室模式</span>
        <span className="text-gray-700">|</span>
        <span>點擊物件互動</span>
        <span className="text-gray-700">|</span>
        <span className="text-yellow-500/70">💡 提示：點電腦打開訂單管理</span>
      </div>
    </div>
  )
}
