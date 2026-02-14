'use client'
/**
 * Editor Toolbar - formatting controls for rich text editor
 */


import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Minus,
} from 'lucide-react'
import { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { CANVAS_EDITOR_LABELS } from './constants/labels'

interface EditorToolbarProps {
  editor: Editor
  onSetLink: () => void
  onAddImage: () => void
  onUploadImage: () => void
}

export function EditorToolbar({
  editor,
  onSetLink,
  onAddImage,
  onUploadImage,
}: EditorToolbarProps) {
  return (
    <div className="border-b border-border bg-morandi-container/5 px-4 py-2 flex items-center gap-1 flex-wrap">
      {/* Undo/Redo */}
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

      {/* Headings */}
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

      {/* Text formatting */}
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

      {/* Lists */}
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

      {/* Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSetLink}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('link') && 'bg-morandi-gold/10 text-morandi-gold'
        )}
      >
        <Link2 size={16} />
      </Button>

      {/* Image */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <ImageIcon size={16} />
            <span className="text-xs">{CANVAS_EDITOR_LABELS.LABEL_5261}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onUploadImage}>{CANVAS_EDITOR_LABELS.UPLOADING_201}</DropdownMenuItem>
          <DropdownMenuItem onClick={onAddImage}>{CANVAS_EDITOR_LABELS.LABEL_5883}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Horizontal rule */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="h-8 w-8 p-0"
      >
        <Minus size={16} />
      </Button>
    </div>
  )
}
