'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Trash2, FileText, FileImage } from 'lucide-react'
import type { ProcessedFile } from '../hooks/useMemberView'

interface MemberDocumentsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  processedFiles: ProcessedFile[]
  isUploading: boolean
  isProcessing: boolean
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
  onBatchUpload: () => void
}

export function MemberDocuments({
  open,
  onOpenChange,
  processedFiles,
  isUploading,
  isProcessing,
  isDragging,
  setIsDragging,
  onFileChange,
  onRemoveFile,
  onBatchUpload,
}: MemberDocumentsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>上傳護照以批次新增成員</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-morandi-primary mb-2">⚠️ 重要提醒</h4>
            <ul className="text-xs text-morandi-secondary space-y-1">
              <li>• OCR 辨識的資料會自動標記為<strong>「待驗證」</strong></li>
              <li>• 請務必<strong>人工檢查護照資訊</strong></li>
              <li>• 支援所有國家護照（TWN、USA、JPN 等）</li>
            </ul>
          </div>
          <label
            htmlFor="member-passport-upload"
            className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              isDragging
                ? 'border-morandi-gold bg-morandi-gold/20 scale-105'
                : isProcessing
                ? 'border-morandi-blue bg-morandi-blue/10'
                : 'border-morandi-secondary/30 bg-morandi-container/20 hover:bg-morandi-container/40'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(false)
            }}
            onDrop={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(false)
              const files = e.dataTransfer.files
              if (!files || files.length === 0) return
              const event = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>
              await onFileChange(event)
            }}
          >
            <div className="flex flex-col items-center justify-center py-4">
              {isProcessing ? (
                <>
                  <div className="w-6 h-6 mb-2 border-2 border-morandi-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-morandi-primary">處理檔案中...</p>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 mb-2 text-morandi-secondary" />
                  <p className="text-sm text-morandi-primary">
                    <span className="font-semibold">點擊上傳</span> 或拖曳檔案
                  </p>
                  <p className="text-xs text-morandi-secondary">支援 JPG, PNG, PDF（可多選）</p>
                </>
              )}
            </div>
            <input
              id="member-passport-upload"
              type="file"
              className="hidden"
              accept="image/*,.pdf,application/pdf"
              multiple
              onChange={onFileChange}
              disabled={isUploading || isProcessing}
            />
          </label>
          {processedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-morandi-secondary mb-2">
                已選擇 {processedFiles.length} 張圖片：
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {processedFiles.map((pf, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-morandi-container/20 rounded"
                  >
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {pf.isPdf ? (
                          <FileText size={12} className="text-morandi-red flex-shrink-0" />
                        ) : (
                          <FileImage size={12} className="text-morandi-gold flex-shrink-0" />
                        )}
                        <span className="text-xs text-morandi-primary truncate">
                          {pf.file.name}
                        </span>
                      </div>
                      <span className="text-xs text-morandi-secondary">
                        {(pf.file.size / 1024).toFixed(1)} KB
                        {pf.isPdf && <span className="ml-1 text-morandi-red">(從 PDF 轉換)</span>}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(index)}
                      className="h-6 w-6 p-0 hover:bg-status-danger-bg flex-shrink-0"
                      disabled={isUploading}
                    >
                      <Trash2 size={12} className="text-morandi-red" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={onBatchUpload}
                disabled={isUploading}
                className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {isUploading ? '辨識中...' : `辨識並建立 ${processedFiles.length} 位成員`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
