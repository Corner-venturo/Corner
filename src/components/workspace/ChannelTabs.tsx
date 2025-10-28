'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CanvasEditor } from './CanvasEditor';
import { Channel } from '@/stores/workspace-store';
import { Button } from '@/components/ui/button';

// 畫布操作按鈕組件
function CanvasActions({ channelId }: { channelId: string }) {
  const [canvases, setCanvases] = useState<string[]>(() => {
    // 從 localStorage 讀取該頻道的畫布列表
    const stored = localStorage.getItem(`canvases-${channelId}`);
    return stored ? JSON.parse(stored) : ['default'];
  });

  const [activeCanvas, setActiveCanvas] = useState('default');

  const handleAddCanvas = () => {
    const name = prompt('請輸入畫布名稱：');
    if (!name || !name.trim()) return;

    const newCanvasId = `canvas-${Date.now()}`;
    const updatedCanvases = [...canvases, newCanvasId];
    setCanvases(updatedCanvases);
    localStorage.setItem(`canvases-${channelId}`, JSON.stringify(updatedCanvases));
    localStorage.setItem(`canvas-name-${newCanvasId}`, name.trim());
    setActiveCanvas(newCanvasId);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 畫布切換下拉選單 */}
      {canvases.length > 1 && (
        <select
          value={activeCanvas}
          onChange={(e) => setActiveCanvas(e.target.value)}
          className="h-8 px-3 text-sm border border-border rounded-md bg-white hover:bg-morandi-container/5 transition-colors"
        >
          {canvases.map((canvasId) => {
            const name = canvasId === 'default'
              ? '預設畫布'
              : localStorage.getItem(`canvas-name-${canvasId}`) || '未命名';
            return (
              <option key={canvasId} value={canvasId}>
                {name}
              </option>
            );
          })}
        </select>
      )}

      {/* 新增畫布按鈕 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddCanvas}
        className="h-8 gap-1.5 text-xs"
      >
        <Plus size={14} />
        <span>新增空白畫布</span>
      </Button>
    </div>
  );
}

interface ChannelTabsProps {
  channel: Channel;
  children: React.ReactNode; // 對話內容
  headerActions?: React.ReactNode; // 右上角操作按鈕（選填）
}

export function ChannelTabs({ channel, children, headerActions }: ChannelTabsProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'canvas'>('chat');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 分頁標籤 */}
      <div className="h-[52px] border-b border-border bg-white px-6 flex items-center shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                'flex items-center gap-2 px-4 h-[52px] text-sm font-medium transition-colors relative',
                activeTab === 'chat'
                  ? 'text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
            >
              <MessageSquare size={16} />
              <span>對話</span>
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-morandi-gold transition-all"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('canvas')}
              className={cn(
                'flex items-center gap-2 px-4 h-[52px] text-sm font-medium transition-colors relative',
                activeTab === 'canvas'
                  ? 'text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
            >
              <FileText size={16} />
              <span>畫布</span>
              {activeTab === 'canvas' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-morandi-gold transition-all"></div>
              )}
            </button>
          </div>

          {/* 右側操作按鈕（包含畫布按鈕） */}
          <div className="flex items-center gap-1">
            {activeTab === 'canvas' && (
              <CanvasActions channelId={channel.id} />
            )}
            {headerActions}
          </div>
        </div>
      </div>

      {/* 分頁內容 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 對話分頁 - 使用絕對定位並根據 activeTab 控制顯示 */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col transition-opacity duration-150",
            activeTab === 'chat' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
        >
          {children}
        </div>

        {/* 畫布分頁 - 使用絕對定位並根據 activeTab 控制顯示 */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col transition-opacity duration-150",
            activeTab === 'canvas' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
        >
          {activeTab === 'canvas' && <CanvasView channelId={channel.id} />}
        </div>
      </div>
    </div>
  );
}

// 畫布視圖（支援多畫布切換）
function CanvasView({ channelId }: { channelId: string }) {
  const [canvases, setCanvases] = useState<string[]>(() => {
    const stored = localStorage.getItem(`canvases-${channelId}`);
    return stored ? JSON.parse(stored) : ['default'];
  });

  const [activeCanvas, setActiveCanvas] = useState(() => {
    const stored = localStorage.getItem(`active-canvas-${channelId}`);
    return stored || 'default';
  });

  // 監聽新增畫布事件（通過 localStorage 變化）
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(`canvases-${channelId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCanvases(parsed);

        // 如果當前活動畫布不在列表中，切換到最後一個
        if (!parsed.includes(activeCanvas)) {
          const newActive = parsed[parsed.length - 1];
          setActiveCanvas(newActive);
          localStorage.setItem(`active-canvas-${channelId}`, newActive);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 定期檢查（因為同一標籤頁的 storage 事件不會觸發）
    const interval = setInterval(() => {
      const stored = localStorage.getItem(`canvases-${channelId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const currentStr = JSON.stringify(canvases);
        const newStr = JSON.stringify(parsed);
        if (currentStr !== newStr) {
          setCanvases(parsed);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [channelId, canvases, activeCanvas]);

  // 切換畫布時更新 localStorage
  useEffect(() => {
    localStorage.setItem(`active-canvas-${channelId}`, activeCanvas);
  }, [activeCanvas, channelId]);

  const storageKey = activeCanvas === 'default'
    ? `canvas-${channelId}`
    : `canvas-${channelId}-${activeCanvas}`;

  return <CanvasEditor key={storageKey} channelId={channelId} canvasId={storageKey} />;
}
