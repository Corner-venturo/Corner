/**
 * PassportSection - 護照圖片編輯區塊
 * 從 MemberEditDialog.tsx 拆分
 */

'use client'

import React from 'react'
import {
  Crop,
  FlipHorizontal,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { OrderMember } from '../../order-member.types'

interface ImageEditorState {
  zoom: number
  rotation: number
  flipH: boolean
  isCropMode: boolean
  isSaving: boolean
  position: { x: number; y: number }
  cropRect: { x: number; y: number; width: number; height: number }
  containerRef: React.RefObject<HTMLDivElement | null>
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  rotateLeft: () => void
  rotateRight: () => void
  toggleFlipH: () => void
  startCrop: () => void
  cancelCrop: () => void
  handleWheel: (e: React.WheelEvent) => void
  handleMouseDown: (e: React.MouseEvent, container: HTMLDivElement | null) => void
  handleMouseMove: (e: React.MouseEvent, container: HTMLDivElement | null) => void
  handleMouseUp: () => void
  handleMouseLeave: (e: React.MouseEvent, container: HTMLDivElement | null) => void
}

interface PassportSectionProps {
  editingMember: OrderMember | null
  editMode: 'edit' | 'verify'
  isRecognizing: boolean
  imageEditor: ImageEditorState
  onSaveTransform: () => Promise<void>
  onConfirmCrop: () => Promise<void>
  onUploadPassport: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRecognize: () => Promise<void>
}

export function PassportSection({
  editingMember,
  editMode,
  isRecognizing,
  imageEditor,
  onSaveTransform,
  onConfirmCrop,
  onUploadPassport,
  onRecognize,
}: PassportSectionProps) {
  return (
    <div className="space-y-3">
      {/* 標題與縮放工具 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-morandi-primary">護照照片</h3>
        {editingMember?.passport_image_url && !imageEditor.isCropMode && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => imageEditor.zoomOut()}
              className="p-1.5 hover:bg-muted rounded-md"
              title="縮小"
            >
              <ZoomOut size={16} className="text-morandi-secondary" />
            </button>
            <span className="text-xs text-morandi-secondary min-w-[3rem] text-center">
              {Math.round(imageEditor.zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => imageEditor.zoomIn()}
              className="p-1.5 hover:bg-muted rounded-md"
              title="放大"
            >
              <ZoomIn size={16} className="text-morandi-secondary" />
            </button>
            <button
              type="button"
              onClick={() => imageEditor.reset()}
              className="p-1.5 hover:bg-muted rounded-md ml-1"
              title="重置檢視"
            >
              <X size={16} className="text-morandi-secondary" />
            </button>
          </div>
        )}
      </div>

      {/* 工具列 */}
      {editingMember?.passport_image_url && !imageEditor.isCropMode && (
        <div className="flex items-center justify-between bg-muted rounded-lg p-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => imageEditor.rotateLeft()}
              className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
            >
              <RotateCcw size={16} className="text-morandi-gold" />
              <span className="text-morandi-secondary hidden sm:inline">左轉</span>
            </button>
            <button
              type="button"
              onClick={() => imageEditor.rotateRight()}
              className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
            >
              <RotateCw size={16} className="text-morandi-gold" />
              <span className="text-morandi-secondary hidden sm:inline">右轉</span>
            </button>
            <button
              type="button"
              onClick={() => imageEditor.toggleFlipH()}
              className={`p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs ${
                imageEditor.flipH ? 'bg-status-info-bg' : ''
              }`}
            >
              <FlipHorizontal size={16} className="text-morandi-gold" />
              <span className="text-morandi-secondary hidden sm:inline">翻轉</span>
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              type="button"
              onClick={() => imageEditor.startCrop()}
              className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
            >
              <Crop size={16} className="text-morandi-blue" />
              <span className="text-morandi-secondary hidden sm:inline">裁剪</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {(imageEditor.rotation !== 0 || imageEditor.flipH) && (
              <button
                type="button"
                onClick={onSaveTransform}
                disabled={imageEditor.isSaving}
                className="p-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
              >
                <Save size={16} />
                <span>{imageEditor.isSaving ? '儲存中...' : '儲存圖片'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRecognize}
              disabled={isRecognizing}
              className="p-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRecognizing ? 'animate-spin' : ''} />
              <span>{isRecognizing ? '辨識中...' : '再次辨識'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 裁剪模式工具列 */}
      {editingMember?.passport_image_url && imageEditor.isCropMode && (
        <div className="flex items-center justify-between bg-morandi-blue/10 rounded-lg p-2">
          <span className="text-xs text-morandi-blue">拖曳框選要保留的區域</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => imageEditor.cancelCrop()}
              className="px-3 py-1 text-xs text-morandi-secondary hover:bg-white rounded-md"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirmCrop}
              disabled={imageEditor.cropRect.width < 20 || imageEditor.isSaving}
              className="px-3 py-1 text-xs bg-morandi-blue text-white rounded-md hover:bg-morandi-blue/90 disabled:opacity-50"
            >
              {imageEditor.isSaving ? '處理中...' : '確認裁剪'}
            </button>
          </div>
        </div>
      )}

      {/* 圖片容器 */}
      {editingMember?.passport_image_url ? (
        <div
          ref={imageEditor.containerRef}
          className={`relative overflow-hidden rounded-lg border bg-muted ${
            imageEditor.isCropMode
              ? 'border-morandi-blue cursor-crosshair'
              : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ height: '320px' }}
          onWheel={imageEditor.handleWheel}
          onMouseDown={(e) => imageEditor.handleMouseDown(e, imageEditor.containerRef.current)}
          onMouseMove={(e) => imageEditor.handleMouseMove(e, imageEditor.containerRef.current)}
          onMouseUp={imageEditor.handleMouseUp}
          onMouseLeave={(e) => imageEditor.handleMouseLeave(e, imageEditor.containerRef.current)}
        >
          <img
            src={editingMember.passport_image_url}
            alt="護照照片"
            className="absolute w-full h-full object-contain transition-transform"
            style={{
              transform: `translate(${imageEditor.position.x}px, ${imageEditor.position.y}px) scale(${imageEditor.zoom}) rotate(${imageEditor.rotation}deg) ${imageEditor.flipH ? 'scaleX(-1)' : ''}`,
              transformOrigin: 'center center',
            }}
            draggable={false}
          />
          {/* 裁剪框 */}
          {imageEditor.isCropMode && imageEditor.cropRect.width > 0 && (
            <div
              className="absolute border-2 border-morandi-blue bg-morandi-blue/10"
              style={{
                left: imageEditor.cropRect.x,
                top: imageEditor.cropRect.y,
                width: imageEditor.cropRect.width,
                height: imageEditor.cropRect.height,
              }}
            />
          )}
        </div>
      ) : (
        <label
          htmlFor="edit-passport-upload"
          className="w-full h-48 bg-morandi-container/30 rounded-lg flex flex-col items-center justify-center text-morandi-primary border-2 border-dashed border-morandi-secondary/30 hover:border-morandi-gold hover:bg-morandi-gold/5 cursor-pointer transition-all"
        >
          <Upload size={32} className="mb-2 opacity-50" />
          <span className="text-sm">點擊上傳護照照片</span>
          <span className="text-xs mt-1 opacity-70">支援 JPG、PNG</span>
          <input
            id="edit-passport-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUploadPassport}
          />
        </label>
      )}

      {/* 驗證模式提示 */}
      {editMode === 'verify' && (
        <div className="bg-status-warning-bg border border-morandi-gold/30 rounded-lg p-3">
          <p className="text-xs text-morandi-gold">
            請仔細核對護照照片與右邊的資料是否一致。驗證完成後，此成員的資料將被標記為「已驗證」。
          </p>
        </div>
      )}
    </div>
  )
}
