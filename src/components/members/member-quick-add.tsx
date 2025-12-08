'use client'

import { useState } from 'react'
import { Upload, UserPlus, Loader2, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PassportUploadZone } from '@/components/shared/passport-upload-zone'
import { CustomerCombobox } from '@/components/customers/customer-combobox'
import { MemberExcelImport } from './member-excel-import'
import { useMemberStore, useCustomerStore } from '@/stores'
import type { Customer } from '@/types/customer.types'
import type { Member } from '@/stores/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

interface MemberQuickAddProps {
  orderId: string
  departureDate: string
  onMembersAdded?: () => void
}

interface ParsedMember {
  name: string
  name_en: string
  passport_number: string
  passport_expiry: string
  id_number: string
  birthday: string
  gender: string
}

// 壓縮圖片函數
async function compressImage(file: File, quality = 0.6): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = e => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 護照 OCR 只需要看底部文字，降低到 1200px
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
          async blob => {
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

export function MemberQuickAdd({ orderId, departureDate, onMembersAdded }: MemberQuickAddProps) {
  const [mode, setMode] = useState<'upload' | 'search' | null>(null)
  const [passportFiles, setPassportFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // 同名確認對話框
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingMember, setPendingMember] = useState<ParsedMember | null>(null)
  const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([])

  const memberStore = useMemberStore()
  const { items: customers, create: createCustomer } = useCustomerStore()

  // 上傳護照照片到 Supabase Storage
  const uploadPassportImage = async (file: File, memberId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${memberId}_${Date.now()}.${fileExt}`
      const filePath = `passports/${fileName}`

      const { error } = await supabase.storage
        .from('member-documents')
        .upload(filePath, file, { upsert: true })

      if (error) {
        console.error('上傳護照照片失敗:', error)
        // 檢查是否是空間不足
        if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('exceeded')) {
          toast.error('雲端儲存空間已滿，護照照片無法儲存。請聯繫管理員升級方案。')
        }
        return null
      }

      // 取得公開 URL
      const { data: urlData } = supabase.storage
        .from('member-documents')
        .getPublicUrl(filePath)

      return urlData?.publicUrl || null
    } catch (error) {
      console.error('上傳護照照片失敗:', error)
      return null
    }
  }

  const handleUploadPassports = async () => {
    if (passportFiles.length === 0) {
      toast.error('請先選擇護照照片')
      return
    }

    setIsUploading(true)

    try {
      // 取得訂單內現有成員
      const existingMembers = memberStore.items.filter(m => m.order_id === orderId)

      // 批次處理所有照片
      interface ParsedResult {
        parsed: ParsedMember
        file: File
      }
      const results: ParsedResult[] = []

      for (const file of passportFiles) {
        // 壓縮圖片
        const compressedFile = await compressImage(file)

        // 轉成 base64
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(compressedFile)
        })

        // 呼叫 OCR API
        const response = await fetch('/api/ocr/passport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })

        if (!response.ok) {
          throw new Error(`辨識失敗：${file.name}`)
        }

        const data = await response.json()
        if (data.success && data.data) {
          results.push({ parsed: data.data, file: compressedFile })
        }
      }

      if (results.length === 0) {
        toast.error('無法辨識護照資訊')
        return
      }

      let updatedCount = 0
      let newCount = 0

      for (const { parsed, file } of results) {
        // 先比對訂單內現有成員（用護照號碼或姓名）
        const matchedMember = existingMembers.find(m =>
          (parsed.passport_number && m.passport_number === parsed.passport_number) ||
          (parsed.name && m.name === parsed.name)
        )

        if (matchedMember) {
          // 找到現有成員 → 更新資料 + 上傳護照照片
          const passportUrl = await uploadPassportImage(file, matchedMember.id)

          await memberStore.update(matchedMember.id, {
            name_en: parsed.name_en || matchedMember.name_en,
            passport_number: parsed.passport_number || matchedMember.passport_number,
            passport_expiry: parsed.passport_expiry || matchedMember.passport_expiry,
            id_number: parsed.id_number || matchedMember.id_number,
            birthday: parsed.birthday || matchedMember.birthday,
            gender: parsed.gender || matchedMember.gender,
            passport_image_url: passportUrl || (matchedMember as any).passport_image_url,
          } as unknown as Parameters<typeof memberStore.update>[1])

          updatedCount++
        } else {
          // 沒找到 → 新增成員
          await addMemberAndCustomer(parsed, undefined, file)
          newCount++
        }
      }

      const messages: string[] = []
      if (updatedCount > 0) messages.push(`更新 ${updatedCount} 位`)
      if (newCount > 0) messages.push(`新增 ${newCount} 位`)
      toast.success(messages.join('、') || '處理完成')

      setPassportFiles([])
      setMode(null)
      onMembersAdded?.()
    } catch (error) {
      console.error('OCR 錯誤:', error)
      toast.error('辨識失敗，請重試')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectCustomer = async () => {
    if (!selectedCustomer) {
      toast.error('請選擇顧客')
      return
    }

    const memberData = {
      order_id: orderId,
      name: selectedCustomer.name,
      name_en: selectedCustomer.passport_romanization || '',
      passport_number: selectedCustomer.passport_number || '',
      passport_expiry: selectedCustomer.passport_expiry_date || '',
      id_number: selectedCustomer.national_id || '',
      birthday: selectedCustomer.date_of_birth || '',
      gender: selectedCustomer.gender || '',
      reservation_code: '',
      add_ons: [],
      refunds: [],
    }

    await memberStore.create(memberData as unknown as Parameters<typeof memberStore.create>[0])
    toast.success(`已新增成員：${selectedCustomer.name}`)
    setSelectedCustomer(null)
    setMode(null)
    onMembersAdded?.()
  }

  // 新增成員 + 自動新增到顧客資料庫
  const addMemberAndCustomer = async (parsed: ParsedMember, confirmedCustomerId?: string, passportFile?: File) => {
    // 🔒 先檢查訂單內是否已有相同成員（避免重複匯入）
    const existingOrderMembers = memberStore.items.filter(m => m.order_id === orderId)
    const duplicateInOrder = existingOrderMembers.find(
      m =>
        // 護照號碼相同
        (parsed.passport_number && m.passport_number === parsed.passport_number) ||
        // 身分證相同
        (parsed.id_number && m.id_number === parsed.id_number)
    )

    if (duplicateInOrder) {
      toast.warning(`${parsed.name} 已在此訂單中，跳過`)
      return // 跳過，不重複新增
    }

    let customerId: string | undefined

    // 如果已經確認過顧客 ID，直接使用
    if (confirmedCustomerId) {
      customerId = confirmedCustomerId
    } else {
      // 🔍 檢查規則（優先順序）
      // 1️⃣ 護照號碼 + 身分證都一致 → 100% 同一人
      const exactMatch = customers.find(
        c =>
          c.passport_number === parsed.passport_number &&
          c.national_id === parsed.id_number &&
          parsed.passport_number &&
          parsed.id_number
      )

      // 2️⃣ 只有護照號碼或身分證一致 → 很可能是同一人
      const partialMatch = customers.find(
        c =>
          (c.passport_number && c.passport_number === parsed.passport_number) ||
          (c.national_id && c.national_id === parsed.id_number)
      )

      // 3️⃣ 只有姓名一致 → 可能同名，需要使用者確認
      const nameMatches = customers.filter(c => c.name === parsed.name)

      if (exactMatch) {
        // ✅ 完全匹配 → 直接使用
        customerId = exactMatch.id
        toast.success(`辨識到現有顧客：${exactMatch.name}`)
      } else if (partialMatch) {
        // ⚠️ 部分匹配 → 顯示確認對話框
        setPendingMember(parsed)
        setMatchedCustomers([partialMatch])
        setShowConfirmDialog(true)
        return // 等待使用者確認
      } else if (nameMatches.length > 0) {
        // ⚠️ 同名 → 顯示確認對話框
        setPendingMember(parsed)
        setMatchedCustomers(nameMatches)
        setShowConfirmDialog(true)
        return // 等待使用者確認
      } else {
        // 🆕 完全沒有匹配 → 新增到顧客資料庫
        const newCustomer = await createCustomer({
          name: parsed.name,
          passport_number: parsed.passport_number,
          passport_romanization: parsed.name_en,
          passport_expiry_date: parsed.passport_expiry,
          national_id: parsed.id_number,
          date_of_birth: parsed.birthday,
          gender: parsed.gender,
          email: '',
          phone: '',
        } as unknown as Parameters<typeof createCustomer>[0])

        customerId = newCustomer?.id
        toast.success(`新增顧客：${parsed.name}`)
      }
    }

    // 先建立成員取得 ID
    const newMember = await memberStore.create({
      order_id: orderId,
      name: parsed.name,
      name_en: parsed.name_en,
      passport_number: parsed.passport_number,
      passport_expiry: parsed.passport_expiry,
      id_number: parsed.id_number,
      birthday: parsed.birthday,
      gender: parsed.gender,
      customer_id: customerId,
      reservation_code: '',
      add_ons: [],
      refunds: [],
    } as unknown as Parameters<typeof memberStore.create>[0])

    // 如果有護照檔案，上傳並更新 URL
    if (passportFile && newMember?.id) {
      const passportUrl = await uploadPassportImage(passportFile, newMember.id)
      if (passportUrl) {
        await memberStore.update(newMember.id, {
          passport_image_url: passportUrl,
        } as unknown as Parameters<typeof memberStore.update>[1])
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* 選擇模式 */}
      {!mode && (
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => setMode('upload')}
          >
            <Upload size={24} />
            <span>上傳護照 (OCR)</span>
          </Button>
          <MemberExcelImport
            orderId={orderId}
            onImportComplete={onMembersAdded}
          />
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => setMode('search')}
          >
            <UserPlus size={24} />
            <span>搜尋現有顧客</span>
          </Button>
        </div>
      )}

      {/* 上傳護照模式 */}
      {mode === 'upload' && (
        <Dialog open={true} onOpenChange={() => setMode(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>上傳護照（自動辨識）</DialogTitle>
            </DialogHeader>

            <PassportUploadZone files={passportFiles} onFilesChange={setPassportFiles} maxFiles={10} />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMode(null)} disabled={isUploading}>
                取消
              </Button>
              <Button onClick={handleUploadPassports} disabled={isUploading || passportFiles.length === 0}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    辨識中...
                  </>
                ) : (
                  `開始辨識 (${passportFiles.length} 張)`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 搜尋顧客模式 */}
      {mode === 'search' && (
        <Dialog open={true} onOpenChange={() => setMode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>選擇現有顧客</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <CustomerCombobox
                customers={customers}
                value={selectedCustomer?.id}
                onSelect={setSelectedCustomer}
              />

              {selectedCustomer && (
                <div className="p-4 bg-morandi-background border border-morandi-border rounded-lg">
                  <p className="text-sm font-medium mb-2">已選擇：</p>
                  <p className="text-sm text-morandi-secondary">
                    {selectedCustomer.name}
                    {selectedCustomer.national_id && ` | 身分證：${selectedCustomer.national_id}`}
                    {selectedCustomer.passport_number && ` | 護照：${selectedCustomer.passport_number}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMode(null)}>
                取消
              </Button>
              <Button onClick={handleSelectCustomer} disabled={!selectedCustomer}>
                確定新增
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 同名確認對話框 */}
      {showConfirmDialog && pendingMember && (
        <Dialog open={true} onOpenChange={() => setShowConfirmDialog(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>⚠️ 發現相似的顧客</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* 辨識結果 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium mb-2">📄 辨識結果：</p>
                <div className="text-sm space-y-1">
                  <p>姓名：{pendingMember.name}</p>
                  <p>護照：{pendingMember.passport_number || '無'}</p>
                  <p>身分證：{pendingMember.id_number || '無'}</p>
                  <p>生日：{pendingMember.birthday || '無'}</p>
                </div>
              </div>

              {/* 找到的相似顧客 */}
              <div>
                <p className="text-sm font-medium mb-2">找到 {matchedCustomers.length} 位相似顧客：</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {matchedCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        addMemberAndCustomer(pendingMember, customer.id)
                        setShowConfirmDialog(false)
                        setPendingMember(null)
                      }}
                      className="w-full p-3 text-left border border-morandi-border rounded-lg hover:bg-morandi-background transition-colors"
                    >
                      <p className="font-medium">{customer.name}</p>
                      <div className="text-xs text-morandi-secondary space-y-1 mt-1">
                        <p>
                          身分證：{customer.national_id || '無'}
                          {customer.national_id === pendingMember.id_number && (
                            <span className="ml-2 text-green-600">✓ 相符</span>
                          )}
                        </p>
                        <p>
                          護照：{customer.passport_number || '無'}
                          {customer.passport_number === pendingMember.passport_number && (
                            <span className="ml-2 text-green-600">✓ 相符</span>
                          )}
                        </p>
                        <p>電話：{customer.phone || '無'}</p>
                        <p>Email：{customer.email || '無'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 建立新顧客選項 */}
              <button
                onClick={async () => {
                  const newCustomer = await createCustomer({
                    name: pendingMember.name,
                    passport_number: pendingMember.passport_number,
                    passport_romanization: pendingMember.name_en,
                    passport_expiry_date: pendingMember.passport_expiry,
                    national_id: pendingMember.id_number,
                    date_of_birth: pendingMember.birthday,
                    gender: pendingMember.gender,
                    email: '',
                    phone: '',
                  } as unknown as Parameters<typeof createCustomer>[0])

                  if (newCustomer?.id) {
                    await addMemberAndCustomer(pendingMember, newCustomer.id)
                  }
                  setShowConfirmDialog(false)
                  setPendingMember(null)
                }}
                className="w-full p-3 border-2 border-dashed border-morandi-border rounded-lg hover:bg-morandi-background transition-colors"
              >
                <p className="font-medium text-primary">+ 這是新的顧客，建立新資料</p>
              </button>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false)
                  setPendingMember(null)
                }}
              >
                取消
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
