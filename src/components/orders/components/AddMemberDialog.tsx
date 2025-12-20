/**
 * AddMemberDialog - 新增成員對話框
 * 從 OrderMembersExpandable.tsx 拆分出來
 */

'use client'

import React from 'react'
import { Plus, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ProcessedFile } from '../order-member.types'

interface AddMemberDialogProps {
  isOpen: boolean
  memberCount: number | ''
  processedFiles: ProcessedFile[]
  isUploading: boolean
  isDragging: boolean
  isProcessing: boolean
  onClose: () => void
  onConfirm: () => void
  onCountChange: (count: number | '') => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (e: React.DragEvent<HTMLLabelElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLLabelElement>) => void
  onDrop: (e: React.DragEvent<HTMLLabelElement>) => void
  onRemoveFile: (index: number) => void
  onBatchUpload: () => void
}

export function AddMemberDialog({
  isOpen,
  memberCount,
  processedFiles,
  isUploading,
  isDragging,
  isProcessing,
  onClose,
  onConfirm,
  onCountChange,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveFile,
  onBatchUpload,
}: AddMemberDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新增成員</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 手動新增 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-morandi-primary">手動新增空白成員</h4>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="50"
                value={memberCount}
                onChange={(e) => {
                  const val = e.target.value
                  onCountChange(val === '' ? '' : parseInt(val, 10))
                }}
                className="w-24"
                placeholder="人數"
              />
              <span className="text-sm text-morandi-muted">人</span>
              <Button
                onClick={onConfirm}
                disabled={!memberCount || memberCount < 1}
                size="sm"
              >
                <Plus size={16} className="mr-1" />
                新增
              </Button>
            </div>
          </div>

          <div className="border-t border-morandi-border" />

          {/* 護照批次上傳 */}
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
                    className="text-morandi-muted hover:text-red-500"
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
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
