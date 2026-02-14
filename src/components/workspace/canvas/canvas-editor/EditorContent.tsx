'use client'
/**
 * Editor Content - rich text editing area with drag & drop support
 */


import { EditorContent as TiptapEditorContent } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import { Image as ImageIcon } from 'lucide-react'
import { CANVAS_EDITOR_LABELS } from './constants/labels'

interface EditorContentProps {
  editor: Editor
  isDragging: boolean
  uploadProgress: number | null
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function EditorContent({
  editor,
  isDragging,
  uploadProgress,
  onDragOver,
  onDragLeave,
  onDrop,
}: EditorContentProps) {
  return (
    <div
      className="flex-1 overflow-y-auto bg-card relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <TiptapEditorContent editor={editor} className="h-full" />

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-morandi-gold/10 border-2 border-dashed border-morandi-gold flex items-center justify-center z-50">
          <div className="text-center">
            <ImageIcon size={48} className="mx-auto mb-2 text-morandi-gold" />
            <p className="text-lg font-medium text-morandi-primary">{CANVAS_EDITOR_LABELS.UPLOADING_115}</p>
            <p className="text-sm text-morandi-secondary mt-1">{CANVAS_EDITOR_LABELS.LABEL_7307}</p>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="absolute bottom-4 right-4 bg-card rounded-lg shadow-lg p-4 border border-border z-50">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <ImageIcon size={20} className="text-morandi-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-morandi-primary">{CANVAS_EDITOR_LABELS.UPLOADING_2213}</p>
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

      {/* Global styles */}
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
  )
}
