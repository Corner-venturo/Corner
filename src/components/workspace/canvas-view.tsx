'use client';

import { useState } from 'react';

import { FileText, CheckSquare, Folder, Plus } from 'lucide-react';

import { WorkspaceTaskList } from './workspace-task-list';
import { Button } from '@/components/ui/button';
import type { Channel } from '@/stores/workspace-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

import { cn } from '@/lib/utils';

interface CanvasViewProps {
  channel: Channel;
}

export function CanvasView({ channel }: CanvasViewProps) {
  const { personalCanvases, createPersonalCanvas } = useWorkspaceStore();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // 獲取該頻道的 Canvas 文件
  const channelDocs = personalCanvases
    .filter((doc) => doc.channelId === channel.id)
    .sort((a: any, b: any) => a.order - b.order);
  
  // 如果沒有選擇文件，自動選擇第一個
  const activeDoc = activeDocId
    ? channelDocs.find((doc) => doc.id === activeDocId)
    : channelDocs[0];
  
  const getDocIcon = (type: string) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'tasks':
        return CheckSquare;
      case 'files':
        return Folder;
      default:
        return FileText;
    }
  };
  
  const handleCreateDoc = (type: 'document' | 'tools' | 'custom') => {
    const typeNames = {
      document: '新文件',
      tools: '待辦清單',
      custom: '檔案庫',
    };

    createPersonalCanvas({
      employee_id: '1', // 從 auth store 獲取
      workspace_id: channel.workspace_id,
      canvas_number: channelDocs.length + 1,
      title: typeNames[type],
      type,
      content: {},
      layout: {},
    } as any);
  };
  
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左側：Canvas 文件列表 */}
      <div className="w-48 border-r border-border bg-morandi-container/5 flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="text-xs font-semibold text-morandi-secondary mb-2">Canvas</div>
          <Button
            onClick={() => handleCreateDoc('document')}
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <Plus size={12} className="mr-1" />
            新增文件
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {channelDocs.map((doc) => {
            const Icon = getDocIcon(doc.type);
            const is_active = activeDoc?.id === doc.id;

            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                  is_active
                    ? 'bg-morandi-gold/10 text-morandi-primary font-medium'
                    : 'text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary'
                )}
              >
                <Icon size={14} className="flex-shrink-0" />
                <span className="flex-1 truncate">{doc.title}</span>
              </button>
            );
          })}
          
          {channelDocs.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-morandi-secondary">
              <p>尚無 Canvas 文件</p>
              <p className="mt-1">點擊上方按鈕建立</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 右側：Canvas 內容 */}
      <div className="flex-1 overflow-y-auto">
        {activeDoc ? (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-morandi-primary mb-2">
                {activeDoc.title}
              </h3>
              <div className="text-sm text-morandi-secondary">
                {activeDoc.type === 'tools' && '管理團隊待辦事項'}
                {activeDoc.type === 'document' && '共同編輯文件'}
                {activeDoc.type === 'custom' && '共享檔案庫'}
              </div>
            </div>
            
            {/* 根據類型渲染不同內容 */}
            {activeDoc.type === 'tools' && (
              <WorkspaceTaskList
                channelId={channel.id}
                tour_id={(channel as any).tour_id}
              />
            )}
            
            {activeDoc.type === 'document' && (
              <div className="border border-border rounded-lg p-4 bg-white">
                <p className="text-sm text-morandi-secondary">
                  富文本編輯器開發中...
                </p>
              </div>
            )}
            
            {activeDoc.type === 'custom' && (
              <div className="border border-border rounded-lg p-4 bg-white">
                <p className="text-sm text-morandi-secondary">
                  檔案庫功能開發中...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-morandi-secondary">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">尚無 Canvas 文件</p>
              <p className="text-xs mt-1">從左側建立新文件</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
