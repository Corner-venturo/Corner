/**
 * PassportUploadZone - 護照上傳區域組件
 * 從 AddMemberDialog 拆分出來
 *
 * 功能：
 * - 檔案拖放上傳
 * - 檔案預覽
 * - 批次辨識按鈕
 */

'use client'

import React from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProcessedFile } from '../order-member.types'

interface PassportUploadZoneProps {
  processedFiles: ProcessedFile[]
  isUploading: boolean
  isDragging: boolean
  isProcessing: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (e: React.DragEvent<HTMLLabelElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLLabelElement>) => void
  onDrop: (e: React.DragEvent<HTMLLabelElement>) => void
  onRemoveFile: (index: number) => void
  onBatchUpload: () => void
}

export function PassportUploadZone({
  processedFiles,
  isUploading,
  isDragging,
  isProcessing,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveFile,
  onBatchUpload,
}: PassportUploadZoneProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-morandi-primary">
        護照批次辨識 (OCR)
      </h4>
      <p className="text-xs text-morandi-muted">
        上傳護照照片或 PDF，系統將自動辨識並建立成員資料
      </p>

      {/* 拖放區域 */}
      <label
        className={`
          flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragging ? 'border-morandi-blue bg-morandi-blue/5' : 'border-morandi-border hover:border-morandi-blue/50'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={onFileChange}
          className="hidden"
          disabled={isProcessing}
        />
        <Upload size={24} className="text-morandi-muted mb-2" />
        <span className="text-sm text-morandi-muted">
          {isProcessing ? '處理中...' : '拖放或點擊選擇護照照片/PDF'}
        </span>
        <span className="text-xs text-morandi-muted mt-1">
          支援 JPG、PNG、PDF 格式
        </span>
      </label>

      {/* 已選擇的檔案預覽 */}
      {processedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-morandi-secondary">
              已選擇 {processedFiles.length} 個檔案
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => processedFiles.forEach((_, i) => onRemoveFile(i))}
              className="text-morandi-muted hover:text-status-danger"
            >
              清空全部
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {processedFiles.map((pf, index) => (
              <div key={index} className="relative group">
                <img
                  src={pf.preview}
                  alt={pf.originalName}
                  className="w-full h-16 object-cover rounded border border-morandi-border"
                />
                <button
                  onClick={() => onRemoveFile(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-status-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
                {pf.isPdf && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">
                    PDF
                  </span>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={onBatchUpload}
            disabled={isUploading || processedFiles.length === 0}
            className="w-full"
          >
            {isUploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                辨識中...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                開始辨識並建立成員 ({processedFiles.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
