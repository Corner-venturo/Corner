'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link,
  Type,
  Palette,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave?: (title: string, content: string, formatData: Record<string, unknown>) => void;
  onCancel?: () => void;
  className?: string;
}

export function RichTextEditor({
  initialTitle = '',
  initialContent = '',
  onSave,
  onCancel,
  className
}: RichTextEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [fontSize, setFontSize] = useState('14');

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const execCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value as string);
    editorRef.current?.focus();
  };

  const setTextAlign = (align: string) => {
    execCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1));
  };

  const setTextColor = (color: string) => {
    setSelectedColor(color);
    execCommand('foreColor', color);
  };

  const setTextSize = (size: string) => {
    setFontSize(size);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        try {
          range.surroundContents(span);
        } catch {
          // If selection spans multiple elements, wrap content differently
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
        selection.removeAllRanges();
      }
    }
  };

  const insertLink = () => {
    const url = prompt('請輸入網址：');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertList = (ordered: boolean = false) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('請輸入文件標題');
      return;
    }

    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<br>') {
      alert('請輸入文件內容');
      return;
    }

    setIsSaving(true);
    try {
      // Extract format data from the content
      const formatData = {
        wordCount: editorRef.current?.textContent?.length || 0,
        hasFormatting: content.includes('<') && content.includes('>'),
        lastModified: new Date().toISOString()
      };

      await onSave?.(title, content, formatData);
    } catch (error) {
      console.error('儲存文件失敗:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
    '#FF0000', '#FF6600', '#FFCC00', '#CCFF00', '#66FF00',
    '#00FF00', '#00FF66', '#00FFCC', '#00CCFF', '#0066FF',
    '#0000FF', '#6600FF', '#CC00FF', '#FF00CC', '#FF0066'
  ];

  const fontSizes = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36'];

  return (
    <div className={cn("bg-white border border-border rounded-lg shadow-sm", className)}>
      {/* 標題輸入 */}
      <div className="p-4 border-b border-border">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文件標題"
          className="text-lg font-medium"
        />
      </div>

      {/* 工具列 */}
      <div className="p-3 border-b border-border bg-morandi-container/10">
        <div className="flex flex-wrap gap-1 items-center">
          {/* 基本格式化 */}
          <div className="flex gap-1 mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => execCommand('bold')}
              title="粗體"
            >
              <Bold size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => execCommand('italic')}
              title="斜體"
            >
              <Italic size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => execCommand('underline')}
              title="底線"
            >
              <Underline size={14} />
            </Button>
          </div>

          {/* 對齊方式 */}
          <div className="flex gap-1 mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setTextAlign('left')}
              title="靠左對齊"
            >
              <AlignLeft size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setTextAlign('center')}
              title="置中對齊"
            >
              <AlignCenter size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setTextAlign('right')}
              title="靠右對齊"
            >
              <AlignRight size={14} />
            </Button>
          </div>

          {/* 列表 */}
          <div className="flex gap-1 mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => insertList(false)}
              title="項目符號列表"
            >
              <List size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => insertList(true)}
              title="編號列表"
            >
              <ListOrdered size={14} />
            </Button>
          </div>

          {/* 引用 */}
          <div className="flex gap-1 mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => formatBlock('blockquote')}
              title="引用"
            >
              <Quote size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={insertLink}
              title="插入連結"
            >
              <Link size={14} />
            </Button>
          </div>

          {/* 字體大小 */}
          <div className="flex items-center gap-2 mr-4">
            <Type size={14} />
            <select
              value={fontSize}
              onChange={(e) => setTextSize(e.target.value)}
              className="px-2 py-1 border border-border rounded text-xs"
            >
              {fontSizes.map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>

          {/* 文字顏色 */}
          <div className="flex items-center gap-2">
            <Palette size={14} />
            <div className="flex gap-1">
              {colors.slice(0, 10).map(color => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className={cn(
                    "w-5 h-5 rounded border border-gray-300",
                    selectedColor === color && "ring-2 ring-morandi-gold"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 第二行顏色 */}
        <div className="flex gap-1 mt-2 ml-8">
          {colors.slice(10).map(color => (
            <button
              key={color}
              onClick={() => setTextColor(color)}
              className={cn(
                "w-5 h-5 rounded border border-gray-300",
                selectedColor === color && "ring-2 ring-morandi-gold"
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 編輯區域 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[400px] p-6 outline-none prose max-w-none"
        style={{
          lineHeight: '1.6',
          fontSize: `${fontSize}px`,
          color: selectedColor
        }}
        onPaste={(e) => {
          // Handle paste events to clean up formatting if needed
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
      />

      {/* 操作按鈕 */}
      <div className="flex justify-end gap-2 p-4 border-t border-border bg-morandi-container/5">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            <X size={16} className="mr-2" />
            取消
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="bg-morandi-gold hover:bg-morandi-gold-hover"
        >
          <Save size={16} className="mr-2" />
          {isSaving ? '儲存中...' : '儲存'}
        </Button>
      </div>

      {/* 字數統計 */}
      <div className="px-4 pb-2 text-xs text-morandi-secondary text-right">
        字數：{editorRef.current?.textContent?.length || 0}
      </div>
    </div>
  );
}

// 簡化版的富文本顯示器
export function RichTextViewer({
  title,
  content,
  className
}: {
  title: string;
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-white border border-border rounded-lg", className)}>
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-morandi-primary">{title}</h3>
      </div>
      <div
        className="p-6 prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{ lineHeight: '1.6' }}
      />
    </div>
  );
}