'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import { ArrowLeft, Edit3, Eye, Maximize2, Minimize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { GAME_OFFICE_LABELS } from './constants/labels'

const PhaserOffice = dynamic(
  () => import('@/features/game-office/components/PhaserOffice'),
  { ssr: false, loading: () => <div className="flex-1 bg-[#1a1a2e] animate-pulse" /> }
)

const LeftPanel = dynamic(
  () => import('@/features/game-office/components/LeftPanel'),
  { ssr: false }
)

export default function GameOfficePage() {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  return (
    <div className={`flex h-screen bg-[#0f0f1a] ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Left Panel */}
      {showPanel && (
        <div className="w-72 flex-shrink-0">
          <Suspense fallback={<div className="w-72 bg-[#0f0f1a]" />}>
            <LeftPanel />
          </Suspense>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f1a] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              {GAME_OFFICE_LABELS.返回ERP}
            </button>
            <span className="text-gray-700">|</span>
            <span className="text-sm font-bold text-emerald-400">🎮 {GAME_OFFICE_LABELS.遊戲辦公室}</span>
            <span className="text-gray-700">|</span>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                editMode ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:text-white'
              }`}
            >
              {editMode ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              {editMode ? GAME_OFFICE_LABELS.瀏覽模式 : GAME_OFFICE_LABELS.編輯模式}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPanel(!showPanel)}
              className={`p-1.5 rounded text-xs ${showPanel ? 'text-emerald-400' : 'text-gray-500'} hover:bg-gray-800`}
              title={showPanel ? '隱藏面板' : '顯示面板'}
            >
              {showPanel ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-gray-800 text-xs"
              title="全螢幕"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phaser Canvas */}
        <div className="flex-1">
          <PhaserOffice className="w-full h-full" editMode={editMode} workspaceId={user?.workspace_id} userId={user?.id} />
        </div>
      </div>
    </div>
  )
}
