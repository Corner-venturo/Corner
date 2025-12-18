'use client'

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Upload, Loader2, X, Check, AlertTriangle, FileImage } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Visa } from '@/stores/types'

interface PassportOCRResult {
  fileName: string
  success: boolean
  imageBase64?: string
  customer?: {
    name: string
    passport_romanization: string
    passport_number: string
    passport_expiry_date: string
    date_of_birth: string
    gender: string
    national_id: string
  }
  error?: string
}

interface MatchedItem {
  ocrResult: PassportOCRResult
  matchedVisa: Visa | null
  manualVisaId: string | null // 手動選擇的簽證 ID
  updateCustomer: boolean // 是否更新顧客資訊
}

interface BatchPickupDialogProps {
  open: boolean
  onClose: () => void
  pendingVisas: Visa[] // 「已送件」狀態的簽證
  onComplete: (updatedVisaIds: string[]) => void
  updateVisa: (id: string, data: Partial<Visa>) => void
}

export function BatchPickupDialog({
  open,
  onClose,
  pendingVisas,
  onComplete,
  updateVisa,
}: BatchPickupDialogProps) {
  // 步驟：upload -> matching -> confirm
  const [step, setStep] = useState<'upload' | 'matching'>('upload')

  // 上傳相關
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 配對結果
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([])
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0])

  // 重置狀態
  const resetState = () => {
    setStep('upload')
    setFiles([])
    setMatchedItems([])
    setPickupDate(new Date().toISOString().split('T')[0])
    setIsProcessing(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  // 處理檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      setFiles(prev => [...prev, ...Array.from(selectedFiles)])
    }
  }

  // 拖曳處理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles) {
      const imageFiles = Array.from(droppedFiles).filter(file => file.type.startsWith('image/'))
      if (imageFiles.length > 0) {
        setFiles(prev => [...prev, ...imageFiles])
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 壓縮圖片
  const compressImage = async (file: File, quality = 0.6): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const maxDimension = 1200
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })

                if (compressedFile.size > 800 * 1024 && quality > 0.2) {
                  resolve(await compressImage(file, quality - 0.1))
                } else {
                  resolve(compressedFile)
                }
              } else {
                reject(new Error('壓縮失敗'))
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // 開始辨識
  const handleStartOCR = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    try {
      // 壓縮圖片
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file))
      )

      // 呼叫 OCR API
      const formData = new FormData()
      compressedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/ocr/passport', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('OCR 辨識失敗')
      }

      const result = await response.json()
      const ocrResults: PassportOCRResult[] = result.results

      // 進行配對
      const matched: MatchedItem[] = ocrResults.map(ocr => {
        let matchedVisa: Visa | null = null

        if (ocr.success && ocr.customer) {
          // 用護照拼音比對「已送件」的簽證
          const romanization = ocr.customer.passport_romanization?.toUpperCase()
          const name = ocr.customer.name

          // 先找完全匹配的
          matchedVisa = pendingVisas.find(v => {
            // 比對申請人姓名（中文）
            if (v.applicant_name === name) return true
            return false
          }) || null

          // 如果沒找到，試著用護照拼音的姓氏比對
          if (!matchedVisa && romanization) {
            // 護照拼音格式通常是 "WANG/XIAOMING"，取姓氏
            const surname = romanization.split('/')[0]
            if (surname) {
              matchedVisa = pendingVisas.find(v => {
                // 簡單的姓氏比對（中文姓氏通常在最前面）
                const applicantSurname = v.applicant_name?.charAt(0)
                // 這裡可以加入更複雜的拼音轉換邏輯
                return false // 暫時不用這個邏輯
              }) || null
            }
          }
        }

        return {
          ocrResult: ocr,
          matchedVisa,
          manualVisaId: matchedVisa?.id || null,
          updateCustomer: true, // 預設更新顧客資訊
        }
      })

      setMatchedItems(matched)
      setStep('matching')
    } catch (error) {
      logger.error('OCR 辨識錯誤:', error)
      toast.error('辨識失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsProcessing(false)
    }
  }

  // 更新手動選擇的簽證
  const handleManualSelect = (index: number, visaId: string | null) => {
    setMatchedItems(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        manualVisaId: visaId,
        matchedVisa: visaId ? pendingVisas.find(v => v.id === visaId) || null : null,
      }
      return updated
    })
  }

  // 更新是否更新顧客資訊
  const handleToggleUpdateCustomer = (index: number) => {
    setMatchedItems(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        updateCustomer: !updated[index].updateCustomer,
      }
      return updated
    })
  }

  // 確認下件
  const handleConfirmPickup = async () => {
    const itemsToProcess = matchedItems.filter(item => item.manualVisaId)

    if (itemsToProcess.length === 0) {
      toast.error('請至少選擇一筆簽證')
      return
    }

    setIsProcessing(true)
    try {
      const updatedVisaIds: string[] = []

      for (const item of itemsToProcess) {
        if (!item.manualVisaId) continue

        // 更新簽證狀態
        await updateVisa(item.manualVisaId, {
          status: 'collected',
          pickup_date: pickupDate,
          documents_returned_date: pickupDate,
        })
        updatedVisaIds.push(item.manualVisaId)

        // 如果勾選更新顧客資訊，更新 CRM
        if (item.updateCustomer && item.ocrResult.success && item.ocrResult.customer) {
          try {
            const { useCustomerStore } = await import('@/stores')
            const customers = useCustomerStore.getState().items
            const updateCustomer = useCustomerStore.getState().update

            // 找到對應的顧客（用姓名比對）
            const visa = pendingVisas.find(v => v.id === item.manualVisaId)
            if (visa) {
              const customer = customers.find(c => c.name === visa.applicant_name)
              if (customer) {
                await updateCustomer(customer.id, {
                  passport_number: item.ocrResult.customer.passport_number || customer.passport_number,
                  passport_romanization: item.ocrResult.customer.passport_romanization || customer.passport_romanization,
                  passport_expiry_date: item.ocrResult.customer.passport_expiry_date || customer.passport_expiry_date,
                  date_of_birth: item.ocrResult.customer.date_of_birth || customer.date_of_birth,
                  gender: item.ocrResult.customer.gender || customer.gender,
                  passport_image_url: item.ocrResult.imageBase64 || customer.passport_image_url,
                })
                logger.log(`✅ 已更新顧客護照資訊: ${customer.name}`)
              }
            }
          } catch (err) {
            logger.error('更新顧客資訊失敗:', err)
          }
        }
      }

      toast.success(`已完成 ${updatedVisaIds.length} 筆下件`)
      onComplete(updatedVisaIds)
      handleClose()
    } catch (error) {
      logger.error('批次下件失敗:', error)
      toast.error('下件失敗')
    } finally {
      setIsProcessing(false)
    }
  }

  // 取得已選擇的簽證 ID 列表（用於過濾下拉選單）
  const selectedVisaIds = matchedItems
    .map(item => item.manualVisaId)
    .filter((id): id is string => id !== null)

  // 計算可確認的數量
  const confirmableCount = matchedItems.filter(item => item.manualVisaId).length

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-morandi-gold" />
            批次下件
            {step === 'matching' && (
              <span className="text-sm font-normal text-morandi-secondary ml-2">
                - 配對結果
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload'
              ? '上傳護照照片，系統將自動辨識並配對待取件的簽證'
              : '確認配對結果，未配對的項目可手動選擇對應的簽證'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'upload' ? (
            /* 上傳步驟 */
            <div className="space-y-4">
              {/* 上傳區域 */}
              <label
                htmlFor="passport-batch-upload"
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragging
                    ? 'border-morandi-gold bg-morandi-gold/20 scale-[1.02]'
                    : 'border-morandi-secondary/30 bg-morandi-container/20 hover:bg-morandi-container/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <Upload className="w-10 h-10 mb-3 text-morandi-secondary" />
                  <p className="text-sm text-morandi-primary">
                    <span className="font-semibold">點擊上傳</span> 或拖曳護照照片
                  </p>
                  <p className="text-xs text-morandi-secondary mt-1">支援 JPG, PNG（可多選）</p>
                </div>
                <input
                  ref={fileInputRef}
                  id="passport-batch-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>

              {/* 已選檔案列表 */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-morandi-secondary">
                    已選擇 {files.length} 個檔案：
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-morandi-container/20 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileImage size={16} className="text-morandi-gold flex-shrink-0" />
                          <span className="text-sm text-morandi-primary truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-morandi-secondary flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-7 w-7 p-0 hover:bg-red-100"
                          disabled={isProcessing}
                        >
                          <X size={14} className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 待取件簽證提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  目前有 <span className="font-semibold">{pendingVisas.length}</span> 筆待取件簽證
                </p>
              </div>
            </div>
          ) : (
            /* 配對結果步驟 */
            <div className="space-y-4">
              {/* 取件日期 */}
              <div className="flex items-center gap-3 p-3 bg-morandi-container/20 rounded-lg">
                <label className="text-sm font-medium text-morandi-primary whitespace-nowrap">
                  取件日期
                </label>
                <DatePicker
                  value={pickupDate}
                  onChange={(date) => setPickupDate(date)}
                  className="w-40"
                  placeholder="選擇日期"
                />
              </div>

              {/* 配對結果列表 */}
              <div className="space-y-3">
                {matchedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      item.manualVisaId
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* 左側：護照圖片預覽 */}
                      <div className="flex-shrink-0 w-32">
                        {item.ocrResult.imageBase64 ? (
                          <img
                            src={item.ocrResult.imageBase64}
                            alt="護照"
                            className="w-full h-24 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center">
                            <FileImage size={24} className="text-gray-400" />
                          </div>
                        )}
                        <p className="text-xs text-morandi-secondary mt-1 truncate">
                          {item.ocrResult.fileName}
                        </p>
                      </div>

                      {/* 右側：OCR 結果與配對 */}
                      <div className="flex-1 min-w-0">
                        {item.ocrResult.success && item.ocrResult.customer ? (
                          <>
                            {/* OCR 辨識結果 */}
                            <div className="mb-3">
                              <div className="text-sm font-medium text-morandi-primary">
                                {item.ocrResult.customer.name || '(無法辨識姓名)'}
                              </div>
                              <div className="text-xs text-morandi-secondary">
                                {item.ocrResult.customer.passport_romanization}
                                {item.ocrResult.customer.passport_number && (
                                  <span className="ml-2">護照: {item.ocrResult.customer.passport_number}</span>
                                )}
                              </div>
                            </div>

                            {/* 配對狀態 */}
                            <div className="flex items-center gap-2 mb-2">
                              {item.matchedVisa ? (
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                  <Check size={14} />
                                  自動配對成功
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                  <AlertTriangle size={14} />
                                  請手動選擇
                                </span>
                              )}
                            </div>

                            {/* 簽證選擇下拉 */}
                            <Select
                              value={item.manualVisaId || ''}
                              onValueChange={value => handleManualSelect(index, value || null)}
                            >
                              <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="-- 選擇簽證 --" />
                              </SelectTrigger>
                              <SelectContent>
                                {pendingVisas.map(visa => {
                                  const isSelected = selectedVisaIds.includes(visa.id) && visa.id !== item.manualVisaId
                                  return (
                                    <SelectItem
                                      key={visa.id}
                                      value={visa.id}
                                      disabled={isSelected}
                                    >
                                      {visa.applicant_name} - {visa.country}
                                      {visa.order_number && ` (${visa.order_number})`}
                                      {isSelected && ' (已選)'}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>

                            {/* 更新顧客資訊選項 */}
                            {item.manualVisaId && (
                              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.updateCustomer}
                                  onChange={() => handleToggleUpdateCustomer(index)}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-xs text-morandi-secondary">
                                  同時更新顧客護照資訊
                                </span>
                              </label>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-red-600">
                            <AlertTriangle size={16} className="inline mr-1" />
                            辨識失敗：{item.ocrResult.error || '無法解析護照資訊'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          {step === 'upload' ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                取消
              </Button>
              <Button
                onClick={handleStartOCR}
                disabled={files.length === 0 || isProcessing}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    辨識中...
                  </>
                ) : (
                  `開始辨識 (${files.length})`
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                disabled={isProcessing}
              >
                返回上傳
              </Button>
              <Button
                onClick={handleConfirmPickup}
                disabled={confirmableCount === 0 || isProcessing}
                className="bg-morandi-green hover:bg-morandi-green/90 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    處理中...
                  </>
                ) : (
                  `確認下件 (${confirmableCount})`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
