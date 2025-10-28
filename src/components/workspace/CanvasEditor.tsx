'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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
  canvasId?: string; // 可選的畫布 ID，用於支援多畫布
}

export function CanvasEditor({ channelId, canvasId }: CanvasEditorProps) {
  const storageKey = canvasId || `canvas-${channelId}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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

  // 阻止整個頁面的拖曳預設行為
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 阻止整個視窗的拖曳預設行為
    window.addEventListener('dragover', preventDefaults, false);
    window.addEventListener('drop', preventDefaults, false);

    return () => {
      window.removeEventListener('dragover', preventDefaults, false);
      window.removeEventListener('drop', preventDefaults, false);
    };
  }, []);

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

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 設定最大寬度/高度為 1920px
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('無法取得 canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // 壓縮品質：如果檔案大於 1MB，使用較低品質
          const quality = file.size > 1024 * 1024 ? 0.7 : 0.85;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('圖片壓縮失敗'));
                return;
              }

              const compressedReader = new FileReader();
              compressedReader.onload = (e) => {
                resolve(e.target?.result as string);
              };
              compressedReader.onerror = reject;
              compressedReader.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = reject;
        img.src = e.target?.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const processImageFile = useCallback(async (file: File) => {
    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }

    // 檢查檔案大小（20MB 上限，超過的話直接拒絕）
    if (file.size > 20 * 1024 * 1024) {
      alert('圖片大小不能超過 20MB');
      return;
    }

    setUploadProgress(10);

    try {
      // 如果檔案大於 500KB，自動壓縮
      let src: string;
      if (file.size > 500 * 1024) {
        setUploadProgress(30);
        src = await compressImage(file);

        // 計算壓縮後的大小
        const compressedSize = (src.length * 3) / 4; // Base64 大小估算
        setUploadProgress(80);
      } else {
        // 小檔案直接讀取
        src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setUploadProgress(80);
      }

      setUploadProgress(90);
      editor?.chain().focus().setImage({ src }).run();
      setUploadProgress(100);

      // 延遲隱藏進度條
      setTimeout(() => {
        setUploadProgress(null);
      }, 500);

    } catch (error) {
      console.error('圖片處理失敗:', error);
      alert('圖片處理失敗，請重試');
      setUploadProgress(null);
    }
  }, [editor, compressImage]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processImageFile(file);

    // 清空 input
    event.target.value = '';
  }, [processImageFile]);

  // 拖曳事件處理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    // 只處理圖片檔案
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('請拖曳圖片檔案');
      return;
    }

    // 處理第一張圖片
    processImageFile(imageFiles[0]);

    // 如果有多張圖片，依序處理
    if (imageFiles.length > 1) {
      imageFiles.slice(1).forEach((file, index) => {
        setTimeout(() => {
          processImageFile(file);
        }, (index + 1) * 500); // 每張圖片間隔 500ms
      });
    }
  }, [processImageFile]);

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
      <div
        className="flex-1 overflow-y-auto bg-white relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <EditorContent editor={editor} className="h-full" />

        {/* 拖曳覆蓋層 */}
        {isDragging && (
          <div className="absolute inset-0 bg-morandi-gold/10 border-2 border-dashed border-morandi-gold flex items-center justify-center z-50">
            <div className="text-center">
              <ImageIcon size={48} className="mx-auto mb-2 text-morandi-gold" />
              <p className="text-lg font-medium text-morandi-primary">放開以上傳圖片</p>
              <p className="text-sm text-morandi-secondary mt-1">支援拖曳多張圖片</p>
            </div>
          </div>
        )}

        {/* 上傳進度 */}
        {uploadProgress !== null && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-border z-50">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <ImageIcon size={20} className="text-morandi-gold" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-morandi-primary">上傳中...</p>
                <div className="w-48 h-1.5 bg-morandi-container/20 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-morandi-gold transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
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