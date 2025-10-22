'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Heading1,
  Heading2,
  Code,
  Quote,
  Image as ImageIcon,
  Undo,
  Redo,
  Strikethrough,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CanvasEditorProps {
  channelId: string;
}

export function CanvasEditor({ channelId }: CanvasEditorProps) {
  const storageKey = `canvas-${channelId}`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-morandi-gold hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: '開始編寫內容...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      localStorage.setItem(storageKey, html);
    },
  });

  // 載入已儲存的內容
  useEffect(() => {
    if (editor) {
      const savedContent = localStorage.getItem(storageKey);
      if (savedContent) {
        editor.commands.setContent(savedContent);
      } else {
        editor.commands.setContent('');
      }
    }
  }, [editor, storageKey]);

  const setLink = useCallback(() => {
    const url = window.prompt('輸入網址:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('輸入圖片網址:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }

    // 檢查檔案大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor?.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    
    // 清空 input
    event.target.value = '';
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 隱藏的檔案上傳 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 工具列 */}
      <div className="border-b border-border bg-morandi-container/5 px-4 py-2 flex items-center gap-1 flex-wrap">
        {/* 復原/重做 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 標題 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('heading', { level: 1 }) && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Heading1 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('heading', { level: 2 }) && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Heading2 size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 文字格式 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bold') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Bold size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('italic') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Italic size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('strike') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Strikethrough size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('code') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Code size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 列表 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bulletList') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <List size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('orderedList') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <ListOrdered size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('blockquote') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Quote size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 連結 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('link') && 'bg-morandi-gold/10 text-morandi-gold'
          )}
        >
          <Link2 size={16} />
        </Button>

        {/* 圖片 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1"
            >
              <ImageIcon size={16} />
              <span className="text-xs">圖片</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              上傳圖片
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addImage}>
              圖片網址
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 分隔線 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
        >
          <Minus size={16} />
        </Button>
      </div>

      {/* 編輯器內容 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} className="h-full" />
      </div>
      
      {/* 樣式 */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #fbbf24;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }
        .ProseMirror .is-empty::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror a {
          color: #d4af37;
          text-decoration: underline;
        }
        .ProseMirror a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}