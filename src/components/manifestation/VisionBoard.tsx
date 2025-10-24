'use client';

import { useState } from 'react';
import { Plus, Image, Type, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisionBoardData, VisionBoardText } from '@/types/manifestation';
import { cn } from '@/lib/utils';

interface VisionBoardProps {
  data?: VisionBoardData;
  onChange: (data: VisionBoardData) => void;
}

export function VisionBoard({ data, onChange }: VisionBoardProps) {
  const [mode, setMode] = useState<'view' | 'add-text'>('view');
  const [newText, setNewText] = useState('');

  const texts = data?.texts || [];

  const handleAddText = () => {
    if (!newText.trim()) return;

    const newTextItem: VisionBoardText = {
      id: Date.now().toString(),
      content: newText,
      position: { x: 50, y: 50 },
      style: {
        fontSize: 16,
        color: '#8b7355',
        fontWeight: 'normal'
      }
    };

    onChange({
      ...data,
      texts: [...texts, newTextItem]
    });

    setNewText('');
    setMode('view');
  };

  const handleDeleteText = (id: string) => {
    onChange({
      ...data,
      texts: texts.filter(t => t.id !== id)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-morandi-primary">願景板</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode('add-text')}
          >
            <Type className="mr-2" size={16} />
            添加文字
          </Button>
        </div>
      </div>

      {/* 願景板畫布 */}
      <div
        className="relative w-full h-96 bg-gradient-to-br from-morandi-container to-morandi-gold/5 rounded-lg border border-border overflow-hidden"
        style={{ backgroundColor: data?.background || '#faf8f5' }}
      >
        {texts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-morandi-secondary">
              <Sparkles className="mx-auto mb-2" size={32} />
              <p className="text-sm">添加文字或圖片，創造你的願景</p>
            </div>
          </div>
        )}

        {/* 渲染文字 */}
        {texts.map((text) => (
          <div
            key={text.id}
            className="absolute group"
            style={{
              left: `${text.position.x}%`,
              top: `${text.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative">
              <p
                style={{
                  fontSize: text.style?.fontSize || 16,
                  color: text.style?.color || '#8b7355',
                  fontWeight: text.style?.fontWeight || 'normal'
                }}
              >
                {text.content}
              </p>
              <button
                onClick={() => handleDeleteText(text.id)}
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加文字模式 */}
      {mode === 'add-text' && (
        <div className="p-4 bg-morandi-container rounded-lg space-y-3">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="輸入你想顯化的文字..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
          />
          <div className="flex gap-2">
            <Button onClick={handleAddText} size="sm">
              確認
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMode('view');
                setNewText('');
              }}
              size="sm"
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 已添加的元素列表 */}
      {texts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-morandi-primary">已添加的元素</h4>
          <div className="space-y-1">
            {texts.map((text) => (
              <div
                key={text.id}
                className="flex items-center justify-between p-2 bg-morandi-container rounded text-sm"
              >
                <span className="text-morandi-primary">{text.content}</span>
                <button
                  onClick={() => handleDeleteText(text.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Sparkles({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}
