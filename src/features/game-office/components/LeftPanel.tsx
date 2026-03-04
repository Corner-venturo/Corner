'use client'

import { useState } from 'react'
import { MessageSquare, BarChart3, CheckSquare, Bell, Gamepad2 } from 'lucide-react'

const TABS = [
  { id: 'chat', label: '聊天', icon: MessageSquare },
  { id: 'stats', label: '數據', icon: BarChart3 },
  { id: 'todos', label: '待辦', icon: CheckSquare },
  { id: 'alerts', label: '通知', icon: Bell },
] as const

type TabId = typeof TABS[number]['id']

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('stats')

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a] border-r border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-800">
        <Gamepad2 className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold text-emerald-400">遊戲辦公室</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4 mb-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 text-sm text-gray-300">
        {activeTab === 'stats' && <StatsPanel />}
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'todos' && <TodosPanel />}
        {activeTab === 'alerts' && <AlertsPanel />}
      </div>
    </div>
  )
}

function StatsPanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase">今日概況</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '進行中的團', value: '7', color: 'text-blue-400' },
          { label: '待處理訂單', value: '3', color: 'text-yellow-400' },
          { label: '今日收款', value: '$125K', color: 'text-emerald-400' },
          { label: '待確認需求', value: '5', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/50 rounded-lg p-2">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-xs font-bold text-gray-500 uppercase mt-4">近期出團</h3>
      <div className="space-y-2">
        {['CNX250310A 清邁 (12人)', 'TYO250315A 東京 (8人)', 'HKT250320A 普吉 (20人)'].map(t => (
          <div key={t} className="bg-gray-900/50 rounded px-2 py-1.5 text-xs">{t}</div>
        ))}
      </div>
    </div>
  )
}

function ChatPanel() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase">辦公室聊天</h3>
      <div className="text-xs text-gray-500 text-center py-8">
        即將推出 💬
      </div>
    </div>
  )
}

function TodosPanel() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase">今日待辦</h3>
      {['確認越南簽證付款', '發送福岡報價單', '回覆北海道供應商', '檢查清邁團確單'].map((t, i) => (
        <label key={i} className="flex items-center gap-2 text-xs cursor-pointer hover:text-white">
          <input type="checkbox" className="rounded border-gray-600" />
          {t}
        </label>
      ))}
    </div>
  )
}

function AlertsPanel() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase">通知</h3>
      <div className="text-xs text-gray-500 text-center py-8">
        目前沒有新通知 ✅
      </div>
    </div>
  )
}
