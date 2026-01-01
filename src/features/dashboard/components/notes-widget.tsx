'use client'

import { useState } from 'react'
import { Clipboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotes } from '../hooks'

const MAX_TABS = 5

export function NotesWidget() {
  const {
    tabs,
    updateContent,
    addTab: addTabHook,
    deleteTab: deleteTabHook,
    renameTab: renameTabHook,
  } = useNotes()
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '1')
  const [isEditingTab, setIsEditingTab] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // 新增分頁
  const addTab = () => {
    if (tabs.length >= MAX_TABS) return
    addTabHook(MAX_TABS)
    // 設置新分頁為活動分頁
    setTimeout(() => {
      if (tabs.length < MAX_TABS) {
        const newTab = tabs[tabs.length]
        if (newTab) setActiveTabId(newTab.id)
      }
    }, 0)
  }

  // 刪除分頁
  const deleteTab = (tabId: string) => {
    if (tabs.length === 1) return
    deleteTabHook(tabId)
    if (activeTabId === tabId && tabs.length > 0) {
      setActiveTabId(tabs[0].id)
    }
  }

  // 重新命名分頁
  const renameTab = (tabId: string, newName: string) => {
    renameTabHook(tabId, newName)
    setIsEditingTab(null)
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0]

  return (
    <div className="h-full">
      <div className="h-full rounded-2xl border border-white/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:border-white/80 bg-gradient-to-br from-morandi-gold/10 via-white to-status-warning-bg flex flex-col">
        <div className="p-5 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                  'bg-gradient-to-br from-morandi-gold/60 to-status-warning-bg/60',
                  'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
                )}
              >
                <Clipboard className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                  便條紙
                </p>
                <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                  隨手記錄，靈感不遺漏
                </p>
              </div>
            </div>
          </div>

          {/* 分頁標籤 */}
          <div className="flex items-center gap-2 flex-wrap">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={cn(
                  'group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTabId === tab.id
                    ? 'bg-white/80 text-morandi-gold shadow-md border border-white/60 scale-105'
                    : 'bg-white/50 text-morandi-muted hover:bg-white/70 hover:text-morandi-primary border border-white/40'
                )}
              >
                {isEditingTab === tab.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => renameTab(tab.id, editingName)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') renameTab(tab.id, editingName)
                      if (e.key === 'Escape') setIsEditingTab(null)
                    }}
                    className="w-20 px-2 py-0.5 bg-white border border-morandi-gold/30 rounded-md outline-none text-xs"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => setActiveTabId(tab.id)}
                    onDoubleClick={() => {
                      setIsEditingTab(tab.id)
                      setEditingName(tab.name)
                    }}
                    className="truncate max-w-[70px]"
                  >
                    {tab.name}
                  </span>
                )}

                {/* 刪除按鈕（只在多於一個分頁時顯示） */}
                {tabs.length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      deleteTab(tab.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-0.5 text-morandi-muted hover:text-status-danger transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* 新增分頁按鈕 */}
            {tabs.length < MAX_TABS && (
              <button
                onClick={addTab}
                className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-morandi-muted hover:bg-white/80 hover:text-morandi-gold hover:border-white/60 transition-all shadow-sm"
                title="新增分頁"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex-1 flex flex-col min-h-0">
          <textarea
            value={activeTab.content}
            onChange={e => updateContent(activeTab.id, e.target.value)}
            className="w-full h-full p-4 border border-white/60 rounded-xl resize-none bg-white/90 hover:bg-white hover:border-white/80 hover:shadow-md focus:bg-white transition-all outline-none font-mono text-sm leading-relaxed shadow-sm backdrop-blur-sm"
            placeholder="在這裡寫下你的筆記..."
          />
          <p className="text-xs text-morandi-secondary/90 mt-2.5 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
            自動儲存 • 雙擊分頁名稱可重新命名
          </p>
        </div>
      </div>
    </div>
  )
}
