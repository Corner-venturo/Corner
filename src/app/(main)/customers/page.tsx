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

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MapPin, CreditCard, Search, X, Plus, Edit, Upload, FileImage, Trash2 } from 'lucide-react'

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
import type { Customer } from '@/types/customer.types'

const STORAGE_KEY = 'customerSearchParams'

export default function CustomersPage() {
  const router = useRouter()
  const { items: customers, create: addCustomer, delete: deleteCustomer } = useCustomers()

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

    return result
  }, [customers, searchParams])

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
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
      // 過濾只保留圖片檔案
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      if (imageFiles.length > 0) {
        setPassportFiles(prev => [...prev, ...imageFiles])
      }
    }
  }

  const handleRemovePassportFile = (index: number) => {
    setPassportFiles(prev => prev.filter((_, i) => i !== index))
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
      // 壓縮所有圖片（確保小於 800 KB）
      const compressedFiles = await Promise.all(
        passportFiles.map(async (file) => {
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

      // 批次建立客戶
      let successCount = 0
      const failedItems: string[] = []

      for (const item of result.results) {
        if (item.success && item.customer && item.customer.name && item.customer.name.trim()) {
          try {
            await addCustomer({
              ...item.customer,
              code: '', // 由 Store 自動生成
              is_vip: false,
              is_active: true,
              total_spent: 0,
              total_orders: 0,
              passport_image_url: item.imageBase64 || null, // 儲存壓縮後的圖片
              verification_status: 'unverified', // 🔥 OCR 辨識的資料標記為「待驗證」
            } as any)
            successCount++
          } catch (error) {
            console.error(`建立客戶失敗 (${item.fileName}):`, error)
            failedItems.push(`${item.fileName} (建立失敗)`)
          }
        } else {
          failedItems.push(`${item.fileName} (辨識失敗)`)
        }
      }

      // 顯示結果
      let message = `✅ 成功辨識 ${result.successful}/${result.total} 張護照\n✅ 成功建立 ${successCount} 位客戶\n\n⚠️ 重要提醒：\n• 所有 OCR 辨識的資料已標記為「待驗證」\n• 請務必點進客戶詳情頁人工檢查護照資訊\n• 確認無誤後，請將驗證狀態改為「已驗證」`
      if (failedItems.length > 0) {
        message += `\n\n❌ 失敗項目：\n${failedItems.join('\n')}`
      }
      alert(message)

      // 清空上傳的檔案
      setPassportFiles([])
    } catch (error) {
      console.error('批次上傳失敗:', error)
      alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return

    await addCustomer({
      ...newCustomer,
      code: '', // 由 Store 自動生成
      is_vip: false,
      is_active: true,
      total_spent: 0,
    } as any)

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

  const handleRowClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`)
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
          <div className="space-y-1">
            <div className="text-xs text-morandi-secondary font-mono">{customer.code}</div>
            {customer.verification_status === 'unverified' && (
              <div className="text-xs text-amber-600 font-medium">⚠️ 待驗證</div>
            )}
            {customer.verification_status === 'verified' && (
              <div className="text-xs text-green-600">✓ 已驗證</div>
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
        key: 'contact',
        label: '聯絡方式',
        sortable: false,
        render: (_value, customer: Customer) => (
          <div className="space-y-1">
            {customer.phone && (
              <div className="flex items-center text-xs text-morandi-primary">
                <Phone size={12} className="mr-1" />
                {customer.phone}
              </div>
            )}
            {customer.email && (
              <div className="flex items-center text-xs text-morandi-secondary">
                <Mail size={12} className="mr-1" />
                {customer.email}
              </div>
            )}
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
        render: (_value, customer: Customer) => (
          <div className="text-xs text-morandi-secondary">
            {customer.passport_expiry_date
              ? new Date(customer.passport_expiry_date).toLocaleDateString('zh-TW')
              : '-'}
          </div>
        ),
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
                <Button
                  variant="outline"
                  size="sm"
                  className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                  title="編輯顧客"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/customers/${customer.id}`)
                  }}
                >
                  <Edit size={14} className="text-morandi-gold" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="刪除顧客"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`確定要刪除顧客「${customer.name}」嗎？`)) {
                      deleteCustomer(customer.id)
                    }
                  }}
                >
                  <Trash2 size={14} className="text-red-500" />
                </Button>
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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                  <p className="text-xs text-morandi-secondary">支援 JPG, PNG（可多選）</p>
                </div>
                <input
                  id="passport-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePassportFile(index)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          disabled={isUploading}
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
