'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clipboard } from 'lucide-react';
import type { NoteTab } from '../types';

const STORAGE_KEY = 'homepage-notes-tabs';
const MAX_TABS = 5;

export function NotesWidget() {
  // 載入分頁資料
  const loadTabs = (): NoteTab[] => {
    if (typeof window === 'undefined') return [{ id: '1', name: '筆記', content: '' }];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return [{ id: '1', name: '筆記', content: '' }];
  };

  const [tabs, setTabs] = useState<NoteTab[]>(loadTabs);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [isEditingTab, setIsEditingTab] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 儲存到 localStorage
  const saveTabs = (newTabs: NoteTab[]) => {
    setTabs(newTabs);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs));
    }
  };

  // 更新內容
  const updateContent = (tabId: string, content: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, content } : tab
    );
    saveTabs(newTabs);
  };

  // 新增分頁
  const addTab = () => {
    if (tabs.length >= MAX_TABS) return;
    const newTab = {
      id: Date.now().toString(),
      name: `筆記 ${tabs.length + 1}`,
      content: ''
    };
    const newTabs = [...tabs, newTab];
    saveTabs(newTabs);
    setActiveTabId(newTab.id);
  };

  // 刪除分頁
  const deleteTab = (tabId: string) => {
    if (tabs.length === 1) return; // 至少保留一個
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    saveTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  // 重新命名分頁
  const renameTab = (tabId: string, newName: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName.trim() || tab.name } : tab
    );
    saveTabs(newTabs);
    setIsEditingTab(null);
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-morandi-gold/20 shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/20 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-morandi-gold/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4 text-morandi-gold" />
            <h3 className="font-semibold text-sm text-morandi-primary">便條紙</h3>
          </div>

          {/* 分頁標籤 */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`group relative flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTabId === tab.id
                    ? 'bg-[#B5986A]/10 text-morandi-gold scale-105'
                    : 'text-morandi-muted hover:bg-morandi-gold/5 hover:text-morandi-primary'
                }`}
              >
                {isEditingTab === tab.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => renameTab(tab.id, editingName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameTab(tab.id, editingName);
                      if (e.key === 'Escape') setIsEditingTab(null);
                    }}
                    className="w-16 px-1 bg-white border border-morandi-gold/20 rounded outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => setActiveTabId(tab.id)}
                    onDoubleClick={() => {
                      setIsEditingTab(tab.id);
                      setEditingName(tab.name);
                    }}
                    className="truncate max-w-[60px]"
                  >
                    {tab.name}
                  </span>
                )}

                {/* 刪除按鈕（只在多於一個分頁時顯示） */}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-0.5 text-morandi-muted hover:text-red-500 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* 新增分頁按鈕 */}
            {tabs.length < MAX_TABS && (
              <button
                onClick={addTab}
                className="p-1 rounded-lg text-morandi-muted hover:bg-morandi-gold/10 hover:text-morandi-gold transition-all"
                title="新增分頁"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col min-h-0">
        <textarea
          value={activeTab.content}
          onChange={(e) => updateContent(activeTab.id, e.target.value)}
          className="w-full h-full p-4 border border-morandi-gold/20 rounded-xl resize-none bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none font-mono text-sm leading-relaxed"
          placeholder="在這裡寫下你的筆記..."
        />
        <p className="text-xs text-morandi-muted mt-2">自動儲存 • 雙擊分頁名稱可重新命名</p>
      </div>
    </Card>
  );
}
