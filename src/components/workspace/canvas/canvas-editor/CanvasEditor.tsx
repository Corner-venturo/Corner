/**
 * Canvas Editor - main rich text editor component
 */

'use client';

import { useCanvasEditor } from './useCanvasEditor';
import { EditorToolbar } from './EditorToolbar';
import { EditorContent } from './EditorContent';
import { CanvasEditorProps } from '../shared/types';

export function CanvasEditor({ channelId, canvasId }: CanvasEditorProps) {
  const storageKey = canvasId || `canvas-${channelId}`;

  const {
    editor,
    fileInputRef,
    isDragging,
    uploadProgress,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setLink,
    addImage,
  } = useCanvasEditor(storageKey);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        onSetLink={setLink}
        onAddImage={addImage}
        onUploadImage={() => fileInputRef.current?.click()}
      />

      {/* Editor content */}
      <EditorContent
        editor={editor}
        isDragging={isDragging}
        uploadProgress={uploadProgress}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    </div>
  );
}
