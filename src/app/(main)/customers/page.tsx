/**
 * 顧客管理頁面（完整重構版）
 *
 * 整合功能：
 * 1. cornerERP 的護照資訊管理（拼音、效期）
 * 2. Venturo 的 VIP 系統和客戶來源
 * 3. 進階搜尋對話框
 * 4. 搜尋條件持久化
 */

'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Mail, Phone, MapPin, CreditCard, Search, X, Plus, Edit, Upload, FileImage, Trash2, AlertTriangle, Check, ZoomIn, ZoomOut, RotateCcw, RotateCw, Crop, RefreshCw, Save, FlipHorizontal, Key } from 'lucide-react'
import { formatPassportExpiryWithStatus } from '@/lib/utils/passport-expiry'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Input } from '@/components/ui/input'
import {
  CustomerSearchDialog,
  CustomerSearchParams,
} from '@/components/customers/customer-search-dialog'
import { useCustomers } from '@/hooks/cloud-hooks'
import type { Customer, UpdateCustomerData, CreateCustomerData } from '@/types/customer.types'
import { toast } from 'sonner'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'customerSearchParams'

export default function CustomersPage() {
  const router = useRouter()
  const { items: customers, create: addCustomer, delete: deleteCustomer, update: updateCustomer } = useCustomers()

  // 搜尋狀態
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>(() => {
    // 從 localStorage 讀取儲存的搜尋參數
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // 新增顧客對話框
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    passport_number: '',
    passport_romanization: '',
    passport_expiry_date: '',
    national_id: '',
    date_of_birth: '',
  })

  // 批次上傳護照
  const [passportFiles, setPassportFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 驗證彈窗相關狀態
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [verifyingCustomer, setVerifyingCustomer] = useState<Customer | null>(null)
  const [verifyFormData, setVerifyFormData] = useState<Partial<UpdateCustomerData>>({})
  const [isSavingVerify, setIsSavingVerify] = useState(false)

  // 護照圖片縮放相關狀態
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isImageDragging, setIsImageDragging] = useState(false)
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 })
  const [imageRotation, setImageRotation] = useState(0) // 旋轉角度 (0, 90, 180, 270)
  const [imageFlipH, setImageFlipH] = useState(false) // 水平翻轉
  const [isSavingImage, setIsSavingImage] = useState(false) // 儲存圖片中

  // 裁剪相關狀態
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 })
  const [isCropping, setIsCropping] = useState(false)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [isReOcring, setIsReOcring] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // 顧客詳情對話框
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // 重置密碼對話框
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // 當搜尋參數改變時，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searchParams))
    }
  }, [searchParams])

  // 進階搜尋篩選
  const filteredCustomers = useMemo(() => {
    let result = customers

    // 基本搜尋（姓名、身份證號、護照號碼）
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase()
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.national_id?.toLowerCase().includes(query) ||
          c.passport_number?.toLowerCase().includes(query)
      )
    }

    // 電話
    if (searchParams.phone) {
      result = result.filter(c => c.phone?.includes(searchParams.phone!))
    }

    // Email
    if (searchParams.email) {
      result = result.filter(c =>
        c.email?.toLowerCase().includes(searchParams.email!.toLowerCase())
      )
    }

    // 護照拼音
    if (searchParams.passport_romanization) {
      result = result.filter(c =>
        c.passport_romanization
          ?.toLowerCase()
          .includes(searchParams.passport_romanization!.toLowerCase())
      )
    }

    // 城市
    if (searchParams.city) {
      result = result.filter(c => c.city?.toLowerCase().includes(searchParams.city!.toLowerCase()))
    }

    // VIP 狀態
    if (searchParams.is_vip !== undefined) {
      result = result.filter(c => c.is_vip === searchParams.is_vip)
    }

    // VIP 等級
    if (searchParams.vip_level) {
      result = result.filter(c => c.vip_level === searchParams.vip_level)
    }

    // 客戶來源
    if (searchParams.source) {
      result = result.filter(c => c.source === searchParams.source)
    }

    // 護照效期範圍
    if (searchParams.passport_expiry_start) {
      result = result.filter(
        c => c.passport_expiry_date && c.passport_expiry_date >= searchParams.passport_expiry_start!
      )
    }
    if (searchParams.passport_expiry_end) {
      result = result.filter(
        c => c.passport_expiry_date && c.passport_expiry_date <= searchParams.passport_expiry_end!
      )
    }

    // 排序：未驗證的在最上面，其他按編號降序
    result = result.sort((a, b) => {
      // 先按驗證狀態排序：unverified 優先
      const aUnverified = a.verification_status !== 'verified'
      const bUnverified = b.verification_status !== 'verified'
      if (aUnverified && !bUnverified) return -1
      if (!aUnverified && bUnverified) return 1
      // 同狀態下按編號降序（新的在前面）
      return (b.code || '').localeCompare(a.code || '')
    })

    return result
  }, [customers, searchParams])

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 handlePassportFileChange triggered', e.target.files)
    const files = e.target.files
    if (files && files.length > 0) {
      console.log('📁 Adding files:', Array.from(files).map(f => f.name))
      setPassportFiles(prev => [...prev, ...Array.from(files)])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files) {
      // 接受圖片和 PDF 檔案
      const validFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/') || file.type === 'application/pdf'
      )
      if (validFiles.length > 0) {
        setPassportFiles(prev => [...prev, ...validFiles])
      }
    }
  }

  const handleRemovePassportFile = (index: number) => {
    setPassportFiles(prev => prev.filter((_, i) => i !== index))
  }

  // PDF 轉圖片（每頁轉成一張圖）
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    // pdfjs-dist v4 需要使用 legacy build 才能在瀏覽器正常運作
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    // 設定 worker（使用 CDN 避免 webpack 打包問題）
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`

    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const images: File[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2.0 }) // 高解析度

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: context, viewport }).promise

      // 轉成 Blob 再轉成 File
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
      })

      const fileName = pdfFile.name.replace('.pdf', `_page${i}.jpg`)
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' })
      images.push(imageFile)
    }

    return images
  }

  // 壓縮圖片（確保小於 1MB）
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

          // 護照 OCR 只需要看底部文字，可以大幅縮小尺寸
          // 降低到 1200px 以確保檔案大小
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

          // 使用較低的壓縮品質確保檔案小於 800 KB
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })

                // 如果還是太大，遞迴降低品質（目標 800 KB）
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

  const handleBatchUpload = async () => {
    if (passportFiles.length === 0) return

    setIsUploading(true)
    try {
      // 先處理 PDF：轉成圖片
      const allImageFiles: File[] = []
      for (const file of passportFiles) {
        if (file.type === 'application/pdf') {
          toast.info(`正在轉換 PDF: ${file.name}`)
          const pdfImages = await convertPdfToImages(file)
          allImageFiles.push(...pdfImages)
        } else {
          allImageFiles.push(file)
        }
      }

      // 壓縮所有圖片（確保小於 800 KB）
      const compressedFiles = await Promise.all(
        allImageFiles.map(async (file) => {
          // 所有圖片都壓縮，確保符合 OCR.space 限制
          return await compressImage(file)
        })
      )

      // 建立 FormData
      const formData = new FormData()
      compressedFiles.forEach(file => {
        formData.append('files', file)
      })

      // 呼叫 OCR API
      const response = await fetch('/api/ocr/passport', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('OCR 辨識失敗')
      }

      const result = await response.json()

      // 批次建立客戶（含重複檢測）
      let successCount = 0
      let duplicateCount = 0
      const failedItems: string[] = []
      const processedPassports = new Set<string>() // 記錄本次批次已處理的護照號碼

      // 🔥 Debug: 顯示現有客戶數量和護照號碼
      console.log(`🔍 現有客戶數量: ${customers.length}`)
      console.log(`🔍 現有護照號碼:`, customers.map(c => c.passport_number).filter(Boolean))

      let updateCount = 0 // 記錄更新的客戶數量

      for (const item of result.results) {
        if (item.success && item.customer && item.customer.name && item.customer.name.trim()) {
          const ocrData = item.customer
          const passportNumber = ocrData.passport_number
          const nationalId = ocrData.national_id
          const dateOfBirth = ocrData.date_of_birth
          // 取得乾淨的中文名（移除警告符號）
          // eslint-disable-next-line no-misleading-character-class
          const chineseName = ocrData.name?.replace(/[⚠️()（）]/g, '').split('/')[0]?.trim()

          console.log(`🔍 處理護照: ${passportNumber}, 身分證: ${nationalId}, 生日: ${dateOfBirth}, 姓名: ${chineseName}`)

          // 檢查本次批次內是否重複（同一份 PDF 多頁）
          if (passportNumber && processedPassports.has(passportNumber)) {
            console.log(`⚠️ 跳過重複護照 (本次批次): ${passportNumber}`)
            duplicateCount++
            continue
          }

          // 🔥 多重比對邏輯：身分證字號 → 生日 → 中文名
          let existingCustomer: Customer | undefined

          // 1. 優先用身分證字號比對（最精準）
          if (nationalId) {
            existingCustomer = customers.find(c => c.national_id === nationalId)
            if (existingCustomer) {
              console.log(`✅ 身分證字號比對成功: ${nationalId} → ${existingCustomer.name}`)
            }
          }

          // 2. 其次用生日比對（需要配合其他條件）
          if (!existingCustomer && dateOfBirth) {
            const sameBirthday = customers.filter(c => c.date_of_birth === dateOfBirth)
            if (sameBirthday.length === 1) {
              // 只有一個同生日的客戶，直接認定
              existingCustomer = sameBirthday[0]
              console.log(`✅ 生日比對成功 (唯一): ${dateOfBirth} → ${existingCustomer.name}`)
            } else if (sameBirthday.length > 1 && chineseName) {
              // 多個同生日，再用名字比對
              existingCustomer = sameBirthday.find(c =>
                c.name?.includes(chineseName) || chineseName.includes(c.name || '')
              )
              if (existingCustomer) {
                console.log(`✅ 生日+姓名比對成功: ${dateOfBirth} + ${chineseName} → ${existingCustomer.name}`)
              }
            }
          }

          // 3. 最後用中文名比對（最不精準，需嚴格匹配）
          if (!existingCustomer && chineseName && chineseName.length >= 2) {
            existingCustomer = customers.find(c => c.name === chineseName)
            if (existingCustomer) {
              console.log(`✅ 姓名完全比對成功: ${chineseName} → ${existingCustomer.name}`)
            }
          }

          // 4. 護照號碼比對（檢查是否完全重複）
          if (!existingCustomer && passportNumber) {
            existingCustomer = customers.find(c => c.passport_number === passportNumber)
            if (existingCustomer) {
              console.log(`⚠️ 護照號碼已存在: ${passportNumber} → ${existingCustomer.name}`)
              failedItems.push(`${item.fileName} (護照已存在: ${existingCustomer.name})`)
              duplicateCount++
              processedPassports.add(passportNumber)
              continue
            }
          }

          console.log(`🔍 比對結果:`, existingCustomer ? `找到現有客戶 ${existingCustomer.name}` : '新客戶')

          try {
            if (existingCustomer) {
              // 🔄 顯示比對確認對話框（左右對照）
              const matchReason = nationalId ? `身分證 ${nationalId}` : dateOfBirth ? `生日 ${dateOfBirth}` : `姓名 ${chineseName}`

              // 建立比對 HTML 內容
              const compareHtml = `
                <div style="display: flex; gap: 20px; margin-top: 12px;">
                  <div style="flex: 1;">
                    <div style="font-weight: 500; margin-bottom: 8px; color: #6b7280; font-size: 13px; text-align: center;">現有資料</div>
                    ${existingCustomer.passport_image_url ?
                      `<img src="${existingCustomer.passport_image_url}" style="width: 100%; height: 120px; object-fit: contain; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 8px; background: #f9fafb;" />` :
                      `<div style="height: 120px; background: #f9fafb; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #9ca3af; margin-bottom: 8px; border: 1px solid #e5e7eb;">無照片</div>`
                    }
                    <div style="font-size: 12px; line-height: 1.6; background: #f9fafb; padding: 10px; border-radius: 6px;">
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">姓名</span> <span style="color: #374151; margin-left: 8px;">${existingCustomer.name || '-'}</span></div>
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">護照</span> <span style="color: #374151; margin-left: 8px;">${existingCustomer.passport_number || '-'}</span></div>
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">效期</span> <span style="color: #374151; margin-left: 8px;">${existingCustomer.passport_expiry_date || '-'}</span></div>
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">身分證</span> <span style="color: #374151; margin-left: 8px;">${existingCustomer.national_id || '-'}</span></div>
                      <div><span style="color: #6b7280;">生日</span> <span style="color: #374151; margin-left: 8px;">${existingCustomer.date_of_birth || '-'}</span></div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; color: #b59d7b; font-size: 20px;">→</div>
                  <div style="flex: 1;">
                    <div style="font-weight: 500; margin-bottom: 8px; color: #b59d7b; font-size: 13px; text-align: center;">新護照資料</div>
                    ${item.imageBase64 ?
                      `<img src="${item.imageBase64}" style="width: 100%; height: 120px; object-fit: contain; border-radius: 6px; border: 1px solid #b59d7b; margin-bottom: 8px; background: #fefcf8;" />` :
                      `<div style="height: 120px; background: #fefcf8; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #9ca3af; margin-bottom: 8px; border: 1px solid #b59d7b;">無照片</div>`
                    }
                    <div style="font-size: 12px; line-height: 1.6; background: #fefcf8; padding: 10px; border-radius: 6px; border: 1px solid #e8dcc8;">
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">姓名</span> <span style="color: #374151; margin-left: 8px;">${ocrData.name || '-'}</span></div>
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">護照</span> <span style="color: #374151; margin-left: 8px;">${passportNumber || '-'}</span></div>
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">效期</span> <span style="color: #374151; margin-left: 8px;">${ocrData.passport_expiry_date || '-'}</span></div>
                      <div style="margin-bottom: 4px;"><span style="color: #6b7280;">身分證</span> <span style="color: #374151; margin-left: 8px;">${nationalId || '-'}</span></div>
                      <div><span style="color: #6b7280;">生日</span> <span style="color: #374151; margin-left: 8px;">${dateOfBirth || '-'}</span></div>
                    </div>
                  </div>
                </div>
                <div style="margin-top: 12px; padding: 8px 12px; background: #fef3c7; border-radius: 6px; font-size: 12px; color: #92400e;">
                  比對依據：${matchReason}
                </div>
              `

              const shouldUpdate = await confirm(
                `找到現有客戶「${existingCustomer.name}」，是否更新護照資訊？`,
                'warning',
                compareHtml
              )

              if (shouldUpdate) {
                await updateCustomer(existingCustomer.id, {
                  passport_number: passportNumber || existingCustomer.passport_number,
                  passport_romanization: ocrData.passport_romanization || existingCustomer.passport_romanization,
                  passport_expiry_date: ocrData.passport_expiry_date || existingCustomer.passport_expiry_date,
                  passport_image_url: item.imageBase64 || existingCustomer.passport_image_url,
                  national_id: nationalId || existingCustomer.national_id,
                  date_of_birth: dateOfBirth || existingCustomer.date_of_birth,
                  verification_status: 'unverified', // 更新後需重新驗證
                } as UpdateCustomerData)
                updateCount++
                console.log(`✅ 已更新客戶護照: ${existingCustomer.name}`)
              } else {
                console.log(`⏭️ 使用者跳過更新: ${existingCustomer.name}`)
                failedItems.push(`${item.fileName} (使用者跳過: ${existingCustomer.name})`)
              }
            } else {
              // ➕ 建立新客戶
               
              await (addCustomer as (data: CreateCustomerData) => Promise<Customer>)({
                ...ocrData,
                is_vip: false,
                is_active: true,
                total_spent: 0,
                total_orders: 0,
                passport_image_url: item.imageBase64 || null,
                verification_status: 'unverified',
              })
              successCount++
            }

            if (passportNumber) {
              processedPassports.add(passportNumber)
            }
          } catch (error) {
            console.error(`處理客戶失敗 (${item.fileName}):`, error)
            failedItems.push(`${item.fileName} (處理失敗)`)
          }
        } else {
          failedItems.push(`${item.fileName} (辨識失敗)`)
        }
      }

      // 顯示結果
      let message = `成功辨識 ${result.successful}/${result.total} 張護照`
      if (successCount > 0) {
        message += `\n新增 ${successCount} 位客戶`
      }
      if (updateCount > 0) {
        message += `\n更新 ${updateCount} 位客戶護照`
      }
      if (duplicateCount > 0) {
        message += `\n跳過 ${duplicateCount} 筆重複護照`
      }
      message += `\n\n重要提醒：\n• 所有 OCR 辨識的資料已標記為「待驗證」\n• 請務必點進客戶詳情頁人工檢查護照資訊\n• 確認無誤後，請將驗證狀態改為「已驗證」`
      if (failedItems.length > 0) {
        message += `\n\n失敗項目：\n${failedItems.join('\n')}`
      }
      await alert(message, failedItems.length > 0 ? 'warning' : 'success')

      // 清空上傳的檔案
      setPassportFiles([])
    } catch (error) {
      console.error('批次上傳失敗:', error)
      await alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return

     
    await (addCustomer as (data: CreateCustomerData) => Promise<Customer>)({
      ...newCustomer,
      // code 由 Store 自動生成（不要傳入空字串）
      is_vip: false,
      is_active: true,
      total_spent: 0,
      verification_status: 'unverified',
    })

    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      passport_number: '',
      passport_romanization: '',
      passport_expiry_date: '',
      national_id: '',
      date_of_birth: '',
    })
    setIsAddDialogOpen(false)
  }

  const handleSearch = (params: CustomerSearchParams) => {
    setSearchParams(params)
  }

  const handleClearSearch = () => {
    setSearchParams({})
  }

  const handleRowClick = async (customer: Customer) => {
    // 如果顧客沒有護照圖片，嘗試從關聯的 order_members 取得
    let passportImageUrl = customer.passport_image_url
    if (!passportImageUrl) {
      try {
        const { data: member } = await supabase
          .from('order_members')
          .select('passport_image_url')
          .eq('customer_id', customer.id)
          .not('passport_image_url', 'is', null)
          .limit(1)
          .single()

        if (member?.passport_image_url) {
          passportImageUrl = member.passport_image_url
          // 同時更新顧客的護照圖片（背景執行，不等待）
          void supabase
            .from('customers')
            .update({ passport_image_url: passportImageUrl })
            .eq('id', customer.id)
        }
      } catch {
        // 找不到關聯的訂單成員，忽略錯誤
      }
    }

    setSelectedCustomer({
      ...customer,
      passport_image_url: passportImageUrl,
    })
    setIsDetailDialogOpen(true)
  }

  // 旋轉/翻轉圖片並轉換為 base64
  const transformImage = useCallback((imageUrl: string, rotation: number, flipH: boolean): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Cannot get canvas context'))
          return
        }
        // 90 或 270 度旋轉時，寬高需要交換
        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        if (flipH) {
          ctx.scale(-1, 1)
        }
        ctx.drawImage(img, -img.width / 2, -img.height / 2)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }, [])

  // 儲存旋轉/翻轉後的圖片（不儲存其他資料）
  const handleSaveImageTransform = async () => {
    if (!verifyingCustomer?.passport_image_url) return
    if (imageRotation === 0 && !imageFlipH) {
      toast.info('圖片沒有變更')
      return
    }

    setIsSavingImage(true)
    try {
      const transformedUrl = await transformImage(verifyingCustomer.passport_image_url, imageRotation, imageFlipH)
      await updateCustomer(verifyingCustomer.id, {
        passport_image_url: transformedUrl,
      } as UpdateCustomerData)

      // 更新本地狀態
      setVerifyingCustomer(prev => prev ? { ...prev, passport_image_url: transformedUrl } : null)
      setImageRotation(0)
      setImageFlipH(false)
      toast.success('圖片已儲存')
    } catch (error) {
      console.error('儲存圖片失敗:', error)
      toast.error('儲存圖片失敗')
    } finally {
      setIsSavingImage(false)
    }
  }

  // 裁剪圖片
  const handleCropImage = useCallback(async () => {
    if (!verifyingCustomer?.passport_image_url || !imageContainerRef.current) return
    if (cropRect.width < 20 || cropRect.height < 20) {
      toast.error('請框選較大的區域')
      return
    }

    try {
      const container = imageContainerRef.current
      const img = container.querySelector('img')
      if (!img) return

      // 創建 canvas 進行裁剪
      const sourceImg = new Image()
      sourceImg.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        sourceImg.onload = () => resolve()
        sourceImg.onerror = reject
        sourceImg.src = verifyingCustomer.passport_image_url!
      })

      // 取得圖片在容器中的顯示尺寸和位置
      // object-contain 會保持比例，所以需要計算實際顯示區域
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const imgAspect = sourceImg.width / sourceImg.height
      const containerAspect = containerWidth / containerHeight

      let displayWidth, displayHeight, offsetX, offsetY

      if (imgAspect > containerAspect) {
        // 圖片較寬，以寬度為準
        displayWidth = containerWidth
        displayHeight = containerWidth / imgAspect
        offsetX = 0
        offsetY = (containerHeight - displayHeight) / 2
      } else {
        // 圖片較高，以高度為準
        displayHeight = containerHeight
        displayWidth = containerHeight * imgAspect
        offsetX = (containerWidth - displayWidth) / 2
        offsetY = 0
      }

      // 計算裁剪區域在原圖上的比例
      const scaleX = sourceImg.width / displayWidth
      const scaleY = sourceImg.height / displayHeight

      // 裁剪區域相對於圖片顯示區域的位置
      const cropX = Math.max(0, (cropRect.x - offsetX) * scaleX)
      const cropY = Math.max(0, (cropRect.y - offsetY) * scaleY)
      const cropWidth = Math.min(cropRect.width * scaleX, sourceImg.width - cropX)
      const cropHeight = Math.min(cropRect.height * scaleY, sourceImg.height - cropY)

      const canvas = document.createElement('canvas')
      canvas.width = cropWidth
      canvas.height = cropHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(
        sourceImg,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      )

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.9)
      setCroppedImageUrl(croppedUrl)
      setIsCropMode(false)
      setCropRect({ x: 0, y: 0, width: 0, height: 0 })
      toast.success('裁剪完成，可以點擊「再次辨識」')
    } catch (error) {
      console.error('裁剪失敗:', error)
      toast.error('裁剪失敗')
    }
  }, [verifyingCustomer?.passport_image_url, cropRect])

  // 重置會員密碼
  const handleResetPassword = async () => {
    if (!selectedCustomer?.email || !newPassword) {
      toast.error('請輸入新密碼')
      return
    }

    if (newPassword.length < 6) {
      toast.error('密碼至少需要 6 個字元')
      return
    }

    const confirmed = await confirm({
      title: '確認重置密碼',
      message: `確定要將 ${selectedCustomer.name} 的密碼重置為新密碼嗎？`,
      confirmText: '確認重置',
      cancelText: '取消',
    })

    if (!confirmed) return

    setIsResettingPassword(true)
    try {
      const res = await fetch('/api/auth/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedCustomer.email,
          new_password: newPassword,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || '重置密碼失敗')
      }

      toast.success('密碼已重置成功')
      setIsResetPasswordDialogOpen(false)
      setNewPassword('')
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error(error instanceof Error ? error.message : '重置密碼失敗')
    } finally {
      setIsResettingPassword(false)
    }
  }

  // 再次 OCR 辨識（使用裁剪後的圖片）
  const handleReOcr = async () => {
    if (!croppedImageUrl || !verifyingCustomer) return

    setIsReOcring(true)
    try {
      // 將 base64 轉換為 File
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'cropped_passport.jpg', { type: 'image/jpeg' })

      // 呼叫 OCR API
      const formData = new FormData()
      formData.append('files', file)

      const ocrResponse = await fetch('/api/ocr/passport', {
        method: 'POST',
        body: formData,
      })

      if (!ocrResponse.ok) {
        throw new Error('OCR 辨識失敗')
      }

      const result = await ocrResponse.json()

      if (result.results?.[0]?.success && result.results[0].customer) {
        const ocrData = result.results[0].customer

        // 性別判斷：優先用 OCR 結果，再用身分證字號第二碼備援
        let gender = ocrData.sex || ocrData.gender
        if (!gender && ocrData.national_id) {
          const secondChar = ocrData.national_id.charAt(1)
          if (secondChar === '1') gender = '男'
          else if (secondChar === '2') gender = '女'
        }

        // 更新表單資料（不覆蓋已有的資料，只填充空白欄位或提供新值）
        setVerifyFormData(prev => ({
          ...prev,
          name: ocrData.name || prev.name,
          passport_romanization: ocrData.passport_romanization || prev.passport_romanization,
          date_of_birth: ocrData.date_of_birth || prev.date_of_birth,
          gender: gender || prev.gender,
          passport_number: ocrData.passport_number || prev.passport_number,
          passport_expiry_date: ocrData.passport_expiry_date || prev.passport_expiry_date,
          national_id: ocrData.national_id || prev.national_id,
        }))
        toast.success('重新辨識成功！請檢查更新的資料')
      } else {
        toast.error('無法辨識護照資訊，請手動輸入')
      }
    } catch (error) {
      console.error('重新 OCR 失敗:', error)
      toast.error('重新辨識失敗')
    } finally {
      setIsReOcring(false)
    }
  }

  // 再次 OCR 辨識（使用原圖）
  const handleReOcrOriginal = async () => {
    if (!verifyingCustomer?.passport_image_url) return

    setIsReOcring(true)
    try {
      // 將 base64 轉換為 File
      const response = await fetch(verifyingCustomer.passport_image_url)
      const blob = await response.blob()
      const file = new File([blob], 'passport.jpg', { type: 'image/jpeg' })

      // 呼叫 OCR API
      const formData = new FormData()
      formData.append('files', file)

      const ocrResponse = await fetch('/api/ocr/passport', {
        method: 'POST',
        body: formData,
      })

      if (!ocrResponse.ok) {
        throw new Error('OCR 辨識失敗')
      }

      const result = await ocrResponse.json()

      if (result.results?.[0]?.success && result.results[0].customer) {
        const ocrData = result.results[0].customer

        // 性別判斷：優先用 OCR 結果，再用身分證字號第二碼備援
        let gender = ocrData.sex || ocrData.gender
        if (!gender && ocrData.national_id) {
          const secondChar = ocrData.national_id.charAt(1)
          if (secondChar === '1') gender = '男'
          else if (secondChar === '2') gender = '女'
        }

        // 更新表單資料
        setVerifyFormData(prev => ({
          ...prev,
          name: ocrData.name || prev.name,
          passport_romanization: ocrData.passport_romanization || prev.passport_romanization,
          date_of_birth: ocrData.date_of_birth || prev.date_of_birth,
          gender: gender || prev.gender,
          passport_number: ocrData.passport_number || prev.passport_number,
          passport_expiry_date: ocrData.passport_expiry_date || prev.passport_expiry_date,
          national_id: ocrData.national_id || prev.national_id,
        }))
        toast.success('重新辨識成功！請檢查更新的資料')
      } else {
        toast.error('無法辨識護照資訊，請手動輸入')
      }
    } catch (error) {
      console.error('重新 OCR 失敗:', error)
      toast.error('重新辨識失敗')
    } finally {
      setIsReOcring(false)
    }
  }

  // 取消裁剪
  const handleCancelCrop = () => {
    setIsCropMode(false)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
    setCroppedImageUrl(null)
  }

  // 儲存裁剪後的圖片
  const handleSaveCroppedImage = async () => {
    if (!croppedImageUrl || !verifyingCustomer) return

    setIsSavingImage(true)
    try {
      await updateCustomer(verifyingCustomer.id, {
        passport_image_url: croppedImageUrl,
      } as UpdateCustomerData)

      // 更新本地狀態
      setVerifyingCustomer(prev => prev ? { ...prev, passport_image_url: croppedImageUrl } : null)
      setCroppedImageUrl(null)
      toast.success('裁剪後的圖片已儲存')
    } catch (error) {
      console.error('儲存裁剪圖片失敗:', error)
      toast.error('儲存圖片失敗')
    } finally {
      setIsSavingImage(false)
    }
  }

  // 打開驗證彈窗
  const openVerifyDialog = (customer: Customer) => {
    setVerifyingCustomer(customer)
    setVerifyFormData({
      name: customer.name || '',
      passport_romanization: customer.passport_romanization || '',
      date_of_birth: customer.date_of_birth || '',
      gender: customer.gender || '',
      national_id: customer.national_id || '',
      passport_number: customer.passport_number || '',
      passport_expiry_date: customer.passport_expiry_date || '',
    })
    // 重置圖片縮放狀態
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
    setImageRotation(0)
    setImageFlipH(false)
    // 重置裁剪狀態
    setIsCropMode(false)
    setCropRect({ x: 0, y: 0, width: 0, height: 0 })
    setCroppedImageUrl(null)
    setIsVerifyDialogOpen(true)
  }

  // 儲存驗證（只儲存表單資料，不處理圖片旋轉）
  const handleSaveVerify = async () => {
    if (!verifyingCustomer) return
    setIsSavingVerify(true)

    try {
      await updateCustomer(verifyingCustomer.id, {
        ...verifyFormData,
        verification_status: 'verified', // 標記為已驗證
      } as UpdateCustomerData)
      toast.success('顧客資料已驗證')
      setIsVerifyDialogOpen(false)
      setVerifyingCustomer(null)
    } catch (error) {
      toast.error('驗證失敗')
      console.error('Failed to verify customer:', error)
    } finally {
      setIsSavingVerify(false)
    }
  }

  const hasActiveFilters = Object.keys(searchParams).length > 0

  // 表格欄位定義
  const tableColumns: TableColumn<Customer>[] = useMemo(
    () => [
      {
        key: 'code',
        label: '編號',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="flex items-center gap-2">
            <span className="text-xs text-morandi-secondary font-mono">{customer.code}</span>
            {customer.verification_status === 'unverified' && (
              <span className="text-xs text-amber-600 font-medium">⚠️</span>
            )}
          </div>
        ),
      },
      {
        key: 'name',
        label: '中文姓名',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="text-sm font-medium text-morandi-primary">{customer.name}</div>
        ),
      },
      {
        key: 'passport_romanization',
        label: '護照拼音',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary font-mono">
            {customer.passport_romanization || '-'}
          </div>
        ),
      },
      {
        key: 'phone',
        label: '電話',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary">
            {customer.phone || '-'}
          </div>
        ),
      },
      {
        key: 'passport_number',
        label: '護照號碼',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary font-mono">
            {customer.passport_number || '-'}
          </div>
        ),
      },
      {
        key: 'passport_expiry_date',
        label: '護照效期',
        sortable: false,
        render: (_value, customer: Customer) => {
          const expiryInfo = formatPassportExpiryWithStatus(customer.passport_expiry_date)
          return (
            <div className={`text-xs ${expiryInfo.className || 'text-morandi-secondary'}`}>
              {customer.passport_expiry_date
                ? new Date(customer.passport_expiry_date).toLocaleDateString('zh-TW')
                : '-'}
              {expiryInfo.statusLabel && (
                <span className="ml-1 text-[10px] font-medium">
                  ({expiryInfo.statusLabel})
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'national_id',
        label: '身分證號',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-primary font-mono">
            {customer.national_id || '-'}
          </div>
        ),
      },
      {
        key: 'date_of_birth',
        label: '生日',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-secondary">
            {customer.date_of_birth
              ? new Date(customer.date_of_birth).toLocaleDateString('zh-TW')
              : '-'}
          </div>
        ),
      },
      {
        key: 'vip',
        label: 'VIP',
        sortable: true,
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-secondary">
            {customer.is_vip ? (
              <span className="text-morandi-gold font-medium">VIP</span>
            ) : (
              '一般'
            )}
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader title="顧客管理">
        <div className="flex items-center gap-2">
          {/* 搜尋按鈕區域 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedSearchOpen(true)}
            className="gap-2"
          >
            <Search size={16} />
            <span className="hidden sm:inline">進階搜尋</span>
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSearch}
              className="gap-2 text-morandi-red"
            >
              <X size={16} />
              <span className="hidden sm:inline">清除條件</span>
            </Button>
          )}

          {/* 新增顧客按鈕 */}
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            size="sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">新增顧客</span>
          </Button>
        </div>
      </ResponsiveHeader>

      {/* 搜尋條件提示 */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-morandi-container/20 border-b border-border">
          <div className="text-xs text-morandi-secondary">
            已套用 {Object.keys(searchParams).length} 個篩選條件 | 顯示 {filteredCustomers.length} /{' '}
            {customers.length} 位顧客
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns}
            data={filteredCustomers}
            onRowClick={handleRowClick}
            actions={(customer: Customer) => (
              <div className="flex items-center gap-1">
                {/* 驗證按鈕 - 只有待驗證且有護照圖片的顧客才顯示 */}
                {customer.verification_status === 'unverified' && customer.passport_image_url && (
                  <button
                    className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    title="驗證顧客資料"
                    onClick={(e) => {
                      e.stopPropagation()
                      openVerifyDialog(customer)
                    }}
                  >
                    <AlertTriangle size={14} />
                  </button>
                )}
                {/* 編輯顧客 */}
                <button
                  className="p-1 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
                  title="編輯顧客"
                  onClick={(e) => {
                    e.stopPropagation()
                    openVerifyDialog(customer)
                  }}
                >
                  <Edit size={14} />
                </button>
                {/* 刪除顧客 */}
                <button
                  className="p-1 text-morandi-secondary hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="刪除顧客"
                  onClick={async (e) => {
                    e.stopPropagation()

                    // 先檢查是否有訂單成員關聯
                    const { data: linkedMembers } = await supabase
                      .from('order_members')
                      .select('id, order_id, orders!inner(code, tour_name)')
                      .eq('customer_id', customer.id)
                      .limit(5)

                    if (linkedMembers && linkedMembers.length > 0) {
                      // 有關聯的訂單成員，顯示警告並提供跳轉
                      const orderInfo = linkedMembers.map(m => {
                        const order = m.orders as { code?: string; tour_name?: string } | null
                        return order?.code || order?.tour_name || '未知訂單'
                      }).join('、')

                      const goToOrder = await confirm(
                        `此顧客已被以下訂單使用：${orderInfo}\n\n請先到訂單中移除該成員後，再刪除顧客。`,
                        {
                          title: '無法刪除顧客',
                          type: 'warning',
                          confirmText: '前往訂單',
                          cancelText: '取消',
                        }
                      )

                      if (goToOrder && linkedMembers[0]?.order_id) {
                        router.push(`/orders/${linkedMembers[0].order_id}`)
                      }
                      return
                    }

                    // 沒有關聯，正常刪除流程
                    const confirmed = await confirm(`確定要刪除顧客「${customer.name}」嗎？`, {
                      title: '刪除顧客',
                      type: 'warning',
                    })
                    if (confirmed) {
                      deleteCustomer(customer.id)
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {/* 進階搜尋對話框 */}
      <CustomerSearchDialog
        open={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSearch={handleSearch}
        initialValues={searchParams}
      />

      {/* 新增顧客對話框 - 左右分欄 */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          setPassportFiles([])
          setIsUploading(false)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增顧客</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* 左邊：手動輸入表單 */}
            <div className="space-y-4 border-r border-border pr-6">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Edit size={18} />
                <span>手動輸入</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                手動填寫顧客基本資訊與護照資料
              </p>

              {/* 基本資訊 */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-morandi-primary">姓名 *</label>
                  <Input
                    value={newCustomer.name}
                    onChange={e => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="輸入顧客姓名"
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-morandi-primary">電話 *</label>
                  <Input
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="輸入聯絡電話"
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-morandi-primary">Email</label>
                    <Input
                      type="email"
                      value={newCustomer.email}
                      onChange={e => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary">身份證字號</label>
                    <Input
                      value={newCustomer.national_id}
                      onChange={e => setNewCustomer(prev => ({ ...prev, national_id: e.target.value }))}
                      placeholder="身份證字號"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-morandi-primary">護照拼音</label>
                  <Input
                    value={newCustomer.passport_romanization}
                    onChange={e =>
                      setNewCustomer(prev => ({
                        ...prev,
                        passport_romanization: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="例如：WANG/XIAOMING"
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-morandi-primary">護照號碼</label>
                    <Input
                      value={newCustomer.passport_number}
                      onChange={e => setNewCustomer(prev => ({ ...prev, passport_number: e.target.value }))}
                      placeholder="護照號碼"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary">護照效期</label>
                    <Input
                      type="date"
                      value={newCustomer.passport_expiry_date}
                      onChange={e => setNewCustomer(prev => ({ ...prev, passport_expiry_date: e.target.value }))}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-morandi-primary">出生日期</label>
                  <Input
                    type="date"
                    value={newCustomer.date_of_birth}
                    onChange={e => setNewCustomer(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddCustomer}
                disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
                className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                手動新增顧客
              </Button>
            </div>

            {/* 右邊：上傳護照 OCR 辨識 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Upload size={18} />
                <span>上傳護照辨識</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                上傳護照圖片，自動辨識並建立顧客資料
              </p>

              {/* 重要提醒 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">⚠️ 重要提醒</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• OCR 辨識的資料會自動標記為<strong>「待驗證」</strong></li>
                  <li>• 請務必<strong>人工檢查護照資訊</strong></li>
                  <li>• 支援所有國家護照（TWN、USA、JPN 等）</li>
                </ul>
              </div>

              {/* 拍攝提示 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-amber-900 mb-2">📸 拍攝建議</h4>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>✓ 確保護照<strong>最下方兩排文字</strong>清晰可見</li>
                  <li>✓ 光線充足，避免反光或陰影</li>
                  <li>✓ 拍攝角度正面，避免傾斜</li>
                </ul>
              </div>

              {/* 上傳區域 */}
              <label
                htmlFor="passport-upload"
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragging
                    ? 'border-morandi-gold bg-morandi-gold/20 scale-105'
                    : 'border-morandi-secondary/30 bg-morandi-container/20 hover:bg-morandi-container/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <Upload className="w-6 h-6 mb-2 text-morandi-secondary" />
                  <p className="text-sm text-morandi-primary">
                    <span className="font-semibold">點擊上傳</span> 或拖曳檔案
                  </p>
                  <p className="text-xs text-morandi-secondary">支援 JPG, PNG, PDF（可多選）</p>
                </div>
                <input
                  id="passport-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,application/pdf"
                  multiple
                  onChange={handlePassportFileChange}
                  disabled={isUploading}
                />
              </label>

              {/* 已選檔案列表 */}
              {passportFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-morandi-secondary mb-2">
                    已選擇 {passportFiles.length} 個檔案：
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {passportFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-morandi-container/20 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileImage size={14} className="text-morandi-gold flex-shrink-0" />
                          <span className="text-xs text-morandi-primary truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-morandi-secondary flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemovePassportFile(index)
                          }}
                          className="h-6 w-6 p-0 flex items-center justify-center hover:bg-red-100 rounded transition-colors"
                          disabled={isUploading}
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleBatchUpload}
                    disabled={isUploading}
                    className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                  >
                    {isUploading ? '辨識中...' : `辨識並建立 ${passportFiles.length} 位顧客`}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setPassportFiles([]) // 關閉時清空檔案列表
            }}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 驗證顧客資料彈窗 */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={(open) => {
        setIsVerifyDialogOpen(open)
        if (!open) {
          setVerifyingCustomer(null)
          setVerifyFormData({})
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {verifyingCustomer?.verification_status === 'verified' ? (
                <>
                  <Check className="text-green-500" size={20} />
                  顧客資料（已驗證）
                </>
              ) : (
                <>
                  <AlertTriangle className="text-amber-500" size={20} />
                  驗證顧客資料
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4 flex-1 overflow-y-auto">
            {/* 左邊：護照照片 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-morandi-primary">護照照片</h3>
                {verifyingCustomer?.passport_image_url && !isCropMode && (
                  <div className="flex items-center gap-1">
                    {/* 縮放控制 */}
                    <button
                      type="button"
                      onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="縮小"
                    >
                      <ZoomOut size={16} className="text-gray-600" />
                    </button>
                    <span className="text-xs text-gray-500 min-w-[3rem] text-center">
                      {Math.round(imageZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="放大"
                    >
                      <ZoomIn size={16} className="text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageZoom(1)
                        setImagePosition({ x: 0, y: 0 })
                        setImageRotation(0)
                        setImageFlipH(false)
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors ml-1"
                      title="重置檢視"
                    >
                      <X size={16} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* 工具列：旋轉、翻轉、裁剪、儲存、再次辨識 */}
              {verifyingCustomer?.passport_image_url && !isCropMode && !croppedImageUrl && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setImageRotation(r => (r - 90 + 360) % 360)}
                      className="p-2 hover:bg-white rounded-md transition-colors flex items-center gap-1 text-xs"
                      title="逆時針旋轉 90°"
                    >
                      <RotateCcw size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">左轉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageRotation(r => (r + 90) % 360)}
                      className="p-2 hover:bg-white rounded-md transition-colors flex items-center gap-1 text-xs"
                      title="順時針旋轉 90°"
                    >
                      <RotateCw size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">右轉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFlipH(f => !f)}
                      className={`p-2 hover:bg-white rounded-md transition-colors flex items-center gap-1 text-xs ${imageFlipH ? 'bg-blue-100' : ''}`}
                      title="水平翻轉"
                    >
                      <FlipHorizontal size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">翻轉</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCropMode(true)
                        setCropRect({ x: 0, y: 0, width: 0, height: 0 })
                        setImageZoom(1)
                        setImagePosition({ x: 0, y: 0 })
                      }}
                      className="p-2 hover:bg-white rounded-md transition-colors flex items-center gap-1 text-xs"
                      title="裁剪圖片"
                    >
                      <Crop size={16} className="text-purple-600" />
                      <span className="text-gray-600 hidden sm:inline">裁剪</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 儲存圖片按鈕 */}
                    {(imageRotation !== 0 || imageFlipH) && (
                      <button
                        type="button"
                        onClick={handleSaveImageTransform}
                        disabled={isSavingImage}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1 text-xs disabled:opacity-50"
                        title="儲存圖片變更"
                      >
                        <Save size={16} />
                        <span>{isSavingImage ? '儲存中...' : '儲存圖片'}</span>
                      </button>
                    )}
                    {/* 再次辨識按鈕 */}
                    <button
                      type="button"
                      onClick={handleReOcrOriginal}
                      disabled={isReOcring}
                      className="p-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md transition-colors flex items-center gap-1 text-xs disabled:opacity-50"
                      title="重新辨識護照"
                    >
                      <RefreshCw size={16} className={isReOcring ? 'animate-spin' : ''} />
                      <span>{isReOcring ? '辨識中...' : '再次辨識'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 裁剪模式工具列 */}
              {isCropMode && (
                <div className="flex items-center justify-between bg-morandi-container/30 rounded-lg p-2">
                  <div className="text-xs text-morandi-primary">
                    請在圖片上框選要保留的區域（只保留護照部分）
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelCrop}
                      className="px-3 py-1.5 text-xs text-morandi-secondary hover:bg-white rounded-md transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleCropImage}
                      disabled={cropRect.width < 20 || cropRect.height < 20}
                      className="px-3 py-1.5 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      確認裁剪
                    </button>
                  </div>
                </div>
              )}

              {/* 護照圖片區域 */}
              {verifyingCustomer?.passport_image_url ? (
                <div
                  ref={imageContainerRef}
                  className={`relative overflow-hidden rounded-lg border bg-gray-50 ${
                    isCropMode
                      ? 'border-blue-400 cursor-crosshair'
                      : 'border-morandi-gold/20 cursor-grab active:cursor-grabbing'
                  }`}
                  style={{ height: '320px' }}
                  onWheel={(e) => {
                    if (isCropMode) return
                    e.preventDefault()
                    const delta = e.deltaY > 0 ? -0.1 : 0.1
                    setImageZoom(z => Math.min(3, Math.max(0.5, z + delta)))
                  }}
                  onMouseDown={(e) => {
                    if (isCropMode) {
                      // 裁剪模式：開始框選
                      const rect = imageContainerRef.current?.getBoundingClientRect()
                      if (!rect) return
                      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
                      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
                      setCropStart({ x, y })
                      setCropRect({ x, y, width: 0, height: 0 })
                      setIsCropping(true)
                    } else if (imageZoom > 1) {
                      // 一般模式：拖曳圖片
                      e.preventDefault()
                      setIsImageDragging(true)
                      setImageDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isCropMode && isCropping) {
                      // 裁剪模式：更新框選區域（限制在容器內）
                      const rect = imageContainerRef.current?.getBoundingClientRect()
                      if (!rect) return
                      const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
                      const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height))

                      const newX = Math.min(cropStart.x, currentX)
                      const newY = Math.min(cropStart.y, currentY)
                      const newWidth = Math.abs(currentX - cropStart.x)
                      const newHeight = Math.abs(currentY - cropStart.y)

                      setCropRect({ x: newX, y: newY, width: newWidth, height: newHeight })
                    } else if (isImageDragging && imageZoom > 1) {
                      // 一般模式：移動圖片
                      e.preventDefault()
                      const newX = e.clientX - imageDragStart.x
                      const newY = e.clientY - imageDragStart.y
                      setImagePosition({ x: newX, y: newY })
                    }
                  }}
                  onMouseUp={() => {
                    setIsCropping(false)
                    setIsImageDragging(false)
                  }}
                  onMouseLeave={(e) => {
                    // 滑鼠離開時，如果還在裁剪，繼續更新到邊界
                    if (isCropMode && isCropping) {
                      const rect = imageContainerRef.current?.getBoundingClientRect()
                      if (rect) {
                        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
                        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
                        const newX = Math.min(cropStart.x, currentX)
                        const newY = Math.min(cropStart.y, currentY)
                        const newWidth = Math.abs(currentX - cropStart.x)
                        const newHeight = Math.abs(currentY - cropStart.y)
                        setCropRect({ x: newX, y: newY, width: newWidth, height: newHeight })
                      }
                    }
                    setIsCropping(false)
                    setIsImageDragging(false)
                  }}
                  onClick={(e) => {
                    if (!isCropMode && imageZoom === 1 && !isImageDragging) {
                      setImageZoom(2)
                    }
                  }}
                >
                  <img
                    src={croppedImageUrl || verifyingCustomer.passport_image_url}
                    alt="護照照片"
                    className="w-full h-full object-contain transition-transform duration-100 select-none"
                    style={{
                      transform: isCropMode
                        ? 'none'
                        : `scale(${imageZoom}) rotate(${imageRotation}deg) ${imageFlipH ? 'scaleX(-1)' : ''} translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                      transformOrigin: 'center center',
                    }}
                    draggable={false}
                  />

                  {/* 裁剪選取框 */}
                  {isCropMode && cropRect.width > 0 && cropRect.height > 0 && (
                    <>
                      {/* 遮罩層 */}
                      <div
                        className="absolute inset-0 bg-black/40 pointer-events-none"
                        style={{
                          clipPath: `polygon(
                            0% 0%,
                            0% 100%,
                            ${cropRect.x}px 100%,
                            ${cropRect.x}px ${cropRect.y}px,
                            ${cropRect.x + cropRect.width}px ${cropRect.y}px,
                            ${cropRect.x + cropRect.width}px ${cropRect.y + cropRect.height}px,
                            ${cropRect.x}px ${cropRect.y + cropRect.height}px,
                            ${cropRect.x}px 100%,
                            100% 100%,
                            100% 0%
                          )`,
                        }}
                      />
                      {/* 選取框邊框 - morandi gold 色系 */}
                      <div
                        className="absolute border-2 border-white pointer-events-none"
                        style={{
                          left: cropRect.x,
                          top: cropRect.y,
                          width: cropRect.width,
                          height: cropRect.height,
                          boxShadow: '0 0 0 2px rgba(181, 157, 123, 0.9), 0 0 12px rgba(181, 157, 123, 0.5)',
                        }}
                      >
                        {/* 四角標記 - morandi gold */}
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-morandi-gold rounded-sm" />
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-morandi-gold rounded-sm" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-morandi-gold rounded-sm" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-morandi-gold rounded-sm" />
                      </div>
                    </>
                  )}

                  {/* 提示文字 */}
                  {!isCropMode && imageZoom === 1 && !croppedImageUrl && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                      點擊放大 / 滾輪縮放 / 拖曳移動
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-morandi-container/30 rounded-lg flex items-center justify-center text-morandi-secondary">
                  <FileImage size={48} className="opacity-30" />
                </div>
              )}

              {/* 裁剪後的操作區 */}
              {croppedImageUrl && !isCropMode && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    <span className="text-xs text-green-700">已裁剪，只顯示選取區域</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCroppedImageUrl(null)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-white rounded-md transition-colors"
                    >
                      還原
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCroppedImage}
                      disabled={isSavingImage}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Save size={14} />
                      {isSavingImage ? '儲存中...' : '儲存圖片'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReOcr}
                      disabled={isReOcring}
                      className="px-3 py-1.5 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isReOcring ? 'animate-spin' : ''} />
                      {isReOcring ? '辨識中...' : '再次辨識'}
                    </button>
                  </div>
                </div>
              )}

              {/* 提示訊息 */}
              {verifyingCustomer?.verification_status !== 'verified' && !croppedImageUrl && !isCropMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    請仔細核對護照照片與右邊的資料是否一致。如果檔案包含其他文件（如身分證），請用裁剪功能只保留護照再重新辨識。
                  </p>
                </div>
              )}
            </div>

            {/* 右邊：表單 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-morandi-primary">顧客資料</h3>

              {/* 中文姓名 + 外號 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">中文姓名</label>
                  <input
                    type="text"
                    value={verifyFormData.name || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">外號/稱謂</label>
                  <input
                    type="text"
                    value={verifyFormData.nickname || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, nickname: e.target.value })}
                    placeholder="如：小王、王姐"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  />
                </div>
              </div>

              {/* 護照拼音 + 護照號碼 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">護照拼音</label>
                  <input
                    type="text"
                    value={verifyFormData.passport_romanization || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, passport_romanization: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">護照號碼</label>
                  <input
                    type="text"
                    value={verifyFormData.passport_number || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, passport_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  />
                </div>
              </div>

              {/* 護照效期 + 身分證號 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">護照效期</label>
                  <input
                    type="date"
                    value={verifyFormData.passport_expiry_date || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, passport_expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">身分證號</label>
                  <input
                    type="text"
                    value={verifyFormData.national_id || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, national_id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  />
                </div>
              </div>

              {/* 出生年月日 + 性別 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">出生年月日</label>
                  <input
                    type="date"
                    value={verifyFormData.date_of_birth || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-morandi-secondary mb-1">性別</label>
                  <select
                    value={verifyFormData.gender || ''}
                    onChange={e => setVerifyFormData({ ...verifyFormData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  >
                    <option value="">請選擇</option>
                    <option value="M">男</option>
                    <option value="F">女</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 按鈕區域 - 固定在底部 */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 pb-2 border-t bg-white">
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)} disabled={isSavingVerify}>
              取消
            </Button>
            <Button
              onClick={handleSaveVerify}
              disabled={isSavingVerify}
              size="lg"
              className={verifyingCustomer?.verification_status === 'verified'
                ? 'bg-morandi-gold hover:bg-morandi-gold/90 text-white px-8 font-medium'
                : 'bg-green-600 hover:bg-green-700 text-white px-8 font-medium'
              }
            >
              {isSavingVerify ? '儲存中...' : verifyingCustomer?.verification_status === 'verified' ? '儲存變更' : '確認驗證'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 顧客詳情對話框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open)
        if (!open) {
          setSelectedCustomer(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={20} className="text-morandi-gold" />
              顧客資料
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="py-4 overflow-y-auto">
              {/* 左右並列：照片和資訊 */}
              <div className="grid grid-cols-2 gap-8">
                {/* 左側：護照照片 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-morandi-secondary">護照照片</h4>
                  {selectedCustomer.passport_image_url ? (
                    <div className="rounded-lg overflow-hidden border border-morandi-gold/20 bg-gray-50">
                      <img
                        src={selectedCustomer.passport_image_url}
                        alt="護照照片"
                        className="w-full h-auto object-contain max-h-[400px]"
                      />
                    </div>
                  ) : (
                    <div className="h-64 bg-morandi-container/30 rounded-lg flex items-center justify-center">
                      <FileImage size={48} className="text-morandi-secondary/30" />
                    </div>
                  )}
                </div>

                {/* 右側：基本資訊 */}
                <div className="space-y-6">
                  {/* 姓名和狀態 */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-morandi-primary">{selectedCustomer.name}</h3>
                      {selectedCustomer.is_vip && (
                        <span className="px-2 py-1 bg-morandi-gold/20 text-morandi-gold text-xs font-medium rounded">
                          VIP
                        </span>
                      )}
                      {selectedCustomer.verification_status === 'unverified' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded">
                          待驗證
                        </span>
                      )}
                    </div>
                    <div className="text-base text-morandi-secondary font-mono">{selectedCustomer.code}</div>
                  </div>

                  {/* 護照資訊 */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-morandi-secondary mb-1">護照拼音</div>
                        <div className="text-base font-mono font-medium">{selectedCustomer.passport_romanization || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-morandi-secondary mb-1">護照號碼</div>
                        <div className="text-base font-mono font-medium">{selectedCustomer.passport_number || '-'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-morandi-secondary mb-1">護照效期</div>
                        <div className="text-base font-medium">
                          {selectedCustomer.passport_expiry_date
                            ? new Date(selectedCustomer.passport_expiry_date).toLocaleDateString('zh-TW')
                            : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-morandi-secondary mb-1">身分證號</div>
                        <div className="text-base font-mono font-medium">{selectedCustomer.national_id || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* 生日 */}
                  {selectedCustomer.date_of_birth && (
                    <div>
                      <div className="text-sm text-morandi-secondary mb-1">生日</div>
                      <div className="text-base font-medium">
                        {new Date(selectedCustomer.date_of_birth).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                  )}

                  {/* 聯絡資訊 */}
                  {(selectedCustomer.phone || selectedCustomer.email || selectedCustomer.address) && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <h4 className="text-sm font-medium text-morandi-secondary">聯絡資訊</h4>
                      {selectedCustomer.phone && (
                        <div className="flex items-center text-base">
                          <Phone size={16} className="mr-3 text-morandi-secondary" />
                          {selectedCustomer.phone}
                        </div>
                      )}
                      {selectedCustomer.email && (
                        <div className="flex items-center text-base">
                          <Mail size={16} className="mr-3 text-morandi-secondary" />
                          {selectedCustomer.email}
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-center text-base">
                          <MapPin size={16} className="mr-3 text-morandi-secondary" />
                          {selectedCustomer.address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 底部按鈕 */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  關閉
                </Button>
                {selectedCustomer.email && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsResetPasswordDialogOpen(true)}
                  >
                    <Key size={16} className="mr-2" />
                    重置密碼
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    openVerifyDialog(selectedCustomer)
                  }}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  <Edit size={16} className="mr-2" />
                  編輯資料
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 重置密碼對話框 */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={(open) => {
        setIsResetPasswordDialogOpen(open)
        if (!open) {
          setNewPassword('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key size={20} className="text-morandi-gold" />
              重置會員密碼
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <p className="text-sm text-morandi-secondary mb-2">
                為 <span className="font-medium text-morandi-primary">{selectedCustomer?.name}</span> 設定新密碼
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Email: {selectedCustomer?.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-morandi-secondary mb-1">
                新密碼
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="請輸入新密碼（至少 6 個字元）"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false)
                setNewPassword('')
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword || !newPassword || newPassword.length < 6}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              {isResettingPassword ? '重置中...' : '確認重置'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
