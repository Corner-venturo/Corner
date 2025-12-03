'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, X, Hash, Upload, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useCustomerStore } from '@/stores'

interface OrderMember {
  id: string
  order_id: string
  identity?: string | null
  chinese_name?: string | null
  passport_name?: string | null
  birth_date?: string | null
  age?: number | null
  id_number?: string | null
  gender?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
  special_meal?: string | null
  pnr?: string | null
  flight_cost?: number | null
  hotel_1_name?: string | null
  hotel_1_checkin?: string | null
  hotel_1_checkout?: string | null
  hotel_2_name?: string | null
  hotel_2_checkin?: string | null
  hotel_2_checkout?: string | null
  transport_cost?: number | null
  misc_cost?: number | null
  total_payable?: number | null
  deposit_amount?: number | null
  balance_amount?: number | null
  deposit_receipt_no?: string | null
  balance_receipt_no?: string | null
  remarks?: string | null
  cost_price?: number | null
  selling_price?: number | null
  profit?: number | null
}

interface OrderMembersExpandableProps {
  orderId: string
  tourId: string
  workspaceId: string
  onClose: () => void
}

export function OrderMembersExpandable({
  orderId,
  tourId,
  workspaceId,
  onClose,
}: OrderMembersExpandableProps) {
  const [members, setMembers] = useState<OrderMember[]>([])
  const [loading, setLoading] = useState(false)
  const [departureDate, setDepartureDate] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [memberCountToAdd, setMemberCountToAdd] = useState<number | ''>(1)
  const [showIdentityColumn, setShowIdentityColumn] = useState(false) // 控制身份欄位顯示
  const [isComposing, setIsComposing] = useState(false) // 追蹤是否正在使用輸入法

  // 護照上傳相關狀態
  const [passportFiles, setPassportFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)


  // 定義可編輯欄位的順序（用於方向鍵導航）
  const editableFields = showIdentityColumn
    ? ['identity', 'chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal', 'pnr']
    : ['chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal', 'pnr']

  // 載入成員資料和出發日期
  useEffect(() => {
    loadMembers()
    loadTourDepartureDate()
  }, [orderId, tourId])

  const loadTourDepartureDate = async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('departure_date')
        .eq('id', tourId)
        .single()

      if (error) throw error
      setDepartureDate(data?.departure_date || null)
    } catch (error) {
      logger.error('載入出發日期失敗:', error)
    }
  }

  const loadMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('order_members')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      logger.error('載入成員失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    setIsAddDialogOpen(true)
  }

  const confirmAddMembers = async () => {
    // 如果是空白或無效數字，預設為 1
    const count = typeof memberCountToAdd === 'number' ? memberCountToAdd : 1

    try {
      const newMembers = Array.from({ length: count }, () => ({
        order_id: orderId,
        workspace_id: workspaceId,
        member_type: 'adult',
        identity: '大人',
      }))

      const { data, error } = await supabase
        .from('order_members')
        .insert(newMembers as any)
        .select()

      if (error) throw error
      setMembers([...members, ...(data || [])])
      setIsAddDialogOpen(false)
      setMemberCountToAdd(1)
    } catch (error) {
      logger.error('新增成員失敗:', error)
      alert('新增失敗')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('確定要刪除此成員嗎？')) return

    try {
      const { error } = await supabase.from('order_members').delete().eq('id', memberId)

      if (error) throw error
      setMembers(members.filter(m => m.id !== memberId))
    } catch (error) {
      logger.error('刪除成員失敗:', error)
      alert('刪除失敗')
    }
  }

  // 全形轉半形工具函式（只轉換全形英數字和標點符號，不影響中文和注音）
  const toHalfWidth = (str: string): string => {
    return str.replace(/[\uFF01-\uFF5E]/g, (s) => {
      // 全形字符範圍 FF01-FF5E 對應半形 21-7E
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    })
  }

  // 更新本地狀態（不立即寫入資料庫，不做任何轉換）
  const updateLocalField = (memberId: string, field: keyof OrderMember, value: string | number) => {
    setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: value } : m)))
  }

  // 鍵盤導航處理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, memberIndex: number, fieldName: string) => {
    const currentFieldIndex = editableFields.indexOf(fieldName)

    // 性別欄位：Enter 切換性別
    if (fieldName === 'gender' && e.key === 'Enter') {
      e.preventDefault()
      const member = members[memberIndex]
      const currentGender = member.gender
      const newGender = !currentGender ? 'M' : currentGender === 'M' ? 'F' : ''
      updateField(member.id, 'gender', newGender)
      return
    }

    // Enter / 下鍵：移動到下一列同一欄位
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextMemberIndex = memberIndex + 1
      if (nextMemberIndex < members.length) {
        const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement
        nextInput?.focus()
      }
    }
    // 上鍵：移動到上一列同一欄位
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevMemberIndex = memberIndex - 1
      if (prevMemberIndex >= 0) {
        const prevInput = document.querySelector(`input[data-member="${members[prevMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement
        prevInput?.focus()
      }
    }
    // Tab：移動到右邊欄位
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      if (currentFieldIndex < editableFields.length - 1) {
        const nextField = editableFields[currentFieldIndex + 1]
        const nextInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${nextField}"]`) as HTMLInputElement
        nextInput?.focus()
      } else {
        // 最後一欄，移到下一列第一欄
        const nextMemberIndex = memberIndex + 1
        if (nextMemberIndex < members.length) {
          const firstField = editableFields[0]
          const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${firstField}"]`) as HTMLInputElement
          nextInput?.focus()
        }
      }
    }
    // Shift+Tab：移動到左邊欄位
    else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      if (currentFieldIndex > 0) {
        const prevField = editableFields[currentFieldIndex - 1]
        const prevInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${prevField}"]`) as HTMLInputElement
        prevInput?.focus()
      }
    }
  }

  // 直接更新欄位到資料庫和本地狀態
  const updateField = async (memberId: string, field: keyof OrderMember, value: string | number) => {
    // 先更新本地狀態（即時反應）
    updateLocalField(memberId, field, value)

    // 如果正在使用輸入法，延遲資料庫寫入
    if (isComposing) {
      return
    }

    // 如果是字串，自動轉半形
    let processedValue: string | number | null = value
    if (typeof value === 'string') {
      processedValue = toHalfWidth(value)
    }

    // 如果是空字串，對於日期欄位轉成 null
    if (processedValue === '' && (field.includes('date') || field.includes('expiry'))) {
      processedValue = null
    }

    try {
      const { error } = await supabase
        .from('order_members')
        .update({ [field]: processedValue })
        .eq('id', memberId)

      if (error) throw error

      // 確保本地狀態同步（使用處理過的值）
      setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: processedValue } : m)))
    } catch (error) {
      logger.error('更新失敗:', error)
      // 失敗時回滾本地狀態
      loadMembers()
    }
  }

  // 自動格式化日期輸入 (YYYY-MM-DD)
  const handleDateInput = (memberId: string, field: keyof OrderMember, value: string) => {
    // 只保留數字
    const numbers = value.replace(/\D/g, '')

    // 如果是空字串，立即更新為 null
    if (numbers.length === 0) {
      updateField(memberId, field, '')
      return
    }

    // 只顯示數字，不加分隔符號（讓使用者看到純數字）
    let formatted = numbers.slice(0, 8) // 最多 8 位數字

    // 只在輸入完整日期（8 位數字）時才格式化並存入資料庫
    if (numbers.length === 8) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4, 6) + '-' + numbers.slice(6, 8)
      updateField(memberId, field, formatted)

      // 如果是護照效期，檢查是否不足 6 個月
      if (field === 'passport_expiry' && departureDate) {
        checkPassportExpiry(formatted)
      }
    } else {
      // 輸入中途：只更新本地顯示（純數字，無分隔符號）
      setMembers(
        members.map(m => (m.id === memberId ? { ...m, [field]: formatted } : m))
      )
    }
  }

  // 檢查護照效期是否不足 6 個月
  const checkPassportExpiry = (expiryDate: string) => {
    if (!departureDate) return

    const expiry = new Date(expiryDate || '')
    const departure = new Date(departureDate || '')
    const sixMonthsBeforeDeparture = new Date(departure)
    sixMonthsBeforeDeparture.setMonth(sixMonthsBeforeDeparture.getMonth() - 6)

    if (expiry < sixMonthsBeforeDeparture) {
      alert(
        `⚠️ 護照效期警告\n\n護照效期：${expiryDate}\n出發日期：${departureDate}\n\n護照效期不足出發日 6 個月，請提醒客戶更換護照！`
      )
    }
  }

  // 根據台灣身分證號碼自動辨識性別
  const handleIdNumberChange = (memberId: string, value: string) => {
    // 先轉大寫和半形
    const processedValue = toHalfWidth(value).toUpperCase()
    updateField(memberId, 'id_number', processedValue)

    // 台灣身分證格式：第一碼英文，第二碼數字（1=男, 2=女）
    const idPattern = /^[A-Z][12]/

    if (idPattern.test(processedValue)) {
      // 自動判斷性別，不彈確認視窗
      const genderCode = processedValue.charAt(1)
      const detectedGender = genderCode === '1' ? 'M' : 'F'
      updateField(memberId, 'gender', detectedGender)
    } else if (processedValue.length >= 2) {
      // 如果格式不符且已輸入至少2個字元，提示手動選擇
      alert('⚠️ 無法自動辨識性別\n\n請手動點擊性別欄位選擇')
    }
  }

  // 處理數字輸入（含全形半形轉換）
  const handleNumberInput = (memberId: string, field: keyof OrderMember, value: string) => {
    // 全形轉半形並只保留數字
    const processedValue = value
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[^\d.]/g, '')

    updateField(memberId, field, processedValue ? parseFloat(processedValue) : 0)
  }

  // ========== 護照上傳相關函數 ==========
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
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      if (imageFiles.length > 0) {
        setPassportFiles(prev => [...prev, ...imageFiles])
      }
    }
  }

  const handleRemovePassportFile = (index: number) => {
    setPassportFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 壓縮圖片（確保小於 800KB）
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

  // 批次上傳護照並建立成員
  const handleBatchUpload = async () => {
    if (passportFiles.length === 0) return

    setIsUploading(true)
    try {
      // 壓縮所有圖片
      const compressedFiles = await Promise.all(
        passportFiles.map(async (file) => {
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

      // 批次建立成員和顧客
      let successCount = 0
      const failedItems: string[] = []
      const customerStore = useCustomerStore.getState()

      for (const item of result.results) {
        if (item.success && item.customer) {
          try {
            // 1. 建立顧客（如果有姓名）
            let customerId: string | null = null
            if (item.customer.name && item.customer.name.trim()) {
              const newCustomer = await customerStore.create({
                name: item.customer.name,
                english_name: item.customer.english_name || '',
                passport_number: item.customer.passport_number || '',
                passport_romanization: item.customer.passport_romanization || '',
                passport_expiry_date: item.customer.passport_expiry_date || null,
                national_id: item.customer.national_id || '',
                date_of_birth: item.customer.date_of_birth || null,
                sex: item.customer.sex || '',
                phone: item.customer.phone || '',
                code: '',
                is_vip: false,
                is_active: true,
                total_spent: 0,
                total_orders: 0,
                verification_status: 'unverified',
              } as any)
              customerId = newCustomer?.id || null
            }

            // 2. 建立訂單成員
            const memberData = {
              order_id: orderId,
              workspace_id: workspaceId,
              customer_id: customerId,
              chinese_name: item.customer.name || '',
              passport_name: item.customer.passport_romanization || item.customer.english_name || '',
              passport_number: item.customer.passport_number || '',
              passport_expiry: item.customer.passport_expiry_date || null,
              birth_date: item.customer.date_of_birth || null,
              id_number: item.customer.national_id || '',
              gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : '',
              identity: '大人',
              member_type: 'adult', // 必要欄位
            }

            const { error } = await supabase
              .from('order_members')
              .insert(memberData)

            if (error) throw error
            successCount++
          } catch (error) {
            logger.error(`建立成員失敗 (${item.fileName}):`, error)
            failedItems.push(`${item.fileName} (建立失敗)`)
          }
        } else {
          failedItems.push(`${item.fileName} (辨識失敗)`)
        }
      }

      // 顯示結果
      let message = `✅ 成功辨識 ${result.successful}/${result.total} 張護照\n✅ 成功建立 ${successCount} 位成員\n\n⚠️ 重要提醒：\n• OCR 辨識的資料已標記為「待驗證」\n• 請務必人工檢查護照資訊是否正確`
      if (failedItems.length > 0) {
        message += `\n\n❌ 失敗項目：\n${failedItems.join('\n')}`
      }
      alert(message)

      // 清空檔案並重新載入成員
      setPassportFiles([])
      await loadMembers()
      setIsAddDialogOpen(false)
    } catch (error) {
      logger.error('批次上傳失敗:', error)
      alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-morandi-blue" />
          <h4 className="font-medium text-morandi-primary">成員列表 ({members.length})</h4>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAddMember}
            className="gap-1 bg-morandi-gold hover:bg-morandi-gold/90 text-white"
          >
            <Plus size={14} />
            新增成員
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowIdentityColumn(!showIdentityColumn)}
            className={cn(
              "gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30",
              showIdentityColumn && "bg-morandi-container/30 text-morandi-primary"
            )}
            title="顯示/隱藏身份欄位"
          >
            身份
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30"
          >
            <X size={14} />
            收起
          </Button>
        </div>
      </div>

      {/* 成員表格 */}
      {loading ? (
        <div className="text-center py-8 text-morandi-secondary">載入中...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-morandi-secondary">尚未新增成員</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40">
                {showIdentityColumn && (
                  <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">身份</th>
                )}
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  中文姓名
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照拼音
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  出生年月日
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">性別</th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  身分證號
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照號碼
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照效期
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  特殊餐食
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">PNR</th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  機票費用
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  應付金額
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  訂金
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  尾款
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  備註
                </th>
                <th className="px-2 py-1.5 text-center font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 w-12">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, memberIndex) => (
                <tr
                  key={member.id}
                  className="group relative hover:bg-morandi-container/20 transition-colors"
                >
                  {/* 身份 - 可選顯示，直接輸入 */}
                  {showIdentityColumn && (
                    <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                      <input
                        type="text"
                        value={member.identity || ''}
                        onChange={e => updateField(member.id, 'identity', e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          setIsComposing(false)
                          // 輸入法結束後立即寫入資料庫
                          setTimeout(() => {
                            updateField(member.id, 'identity', e.currentTarget.value)
                          }, 0)
                        }}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'identity')}
                        data-member={member.id}
                        data-field="identity"
                        className="w-full bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        placeholder=""
                      />
                    </td>
                  )}

                  {/* 中文姓名 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.chinese_name || ''}
                      onChange={e => updateField(member.id, 'chinese_name', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'chinese_name', e.currentTarget.value)
                        }, 0)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'chinese_name')}
                      data-member={member.id}
                      data-field="chinese_name"
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      placeholder=""
                    />
                  </td>

                  {/* 護照拼音 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.passport_name || ''}
                      onChange={e => updateField(member.id, 'passport_name', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'passport_name', e.currentTarget.value)
                        }, 0)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_name')}
                      data-member={member.id}
                      data-field="passport_name"
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 出生年月日 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      placeholder=""
                      value={member.birth_date || ''}
                      onChange={e => handleDateInput(member.id, 'birth_date', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'birth_date')}
                      data-member={member.id}
                      data-field="birth_date"
                      maxLength={10}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 性別 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white text-xs text-center relative">
                    <input
                      type="text"
                      value={member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                      readOnly
                      onClick={() => {
                        const currentGender = member.gender
                        const newGender = !currentGender ? 'M' : currentGender === 'M' ? 'F' : ''
                        updateField(member.id, 'gender', newGender)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'gender')}
                      data-member={member.id}
                      data-field="gender"
                      className="w-full bg-transparent text-xs text-center cursor-pointer hover:bg-morandi-container/30"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      title="點擊或按 Enter 切換性別"
                    />
                  </td>

                  {/* 身分證號 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.id_number || ''}
                      onChange={e => handleIdNumberChange(member.id, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'id_number')}
                      data-member={member.id}
                      data-field="id_number"
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      placeholder=""
                    />
                  </td>

                  {/* 護照號碼 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.passport_number || ''}
                      onChange={e => updateField(member.id, 'passport_number', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'passport_number', e.currentTarget.value)
                        }, 0)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_number')}
                      data-member={member.id}
                      data-field="passport_number"
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 護照效期 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      placeholder=""
                      value={member.passport_expiry || ''}
                      onChange={e => handleDateInput(member.id, 'passport_expiry', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_expiry')}
                      data-member={member.id}
                      data-field="passport_expiry"
                      maxLength={10}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 特殊餐食 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.special_meal || ''}
                      onChange={e => updateField(member.id, 'special_meal', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'special_meal', e.currentTarget.value)
                        }, 0)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'special_meal')}
                      data-member={member.id}
                      data-field="special_meal"
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* PNR */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.pnr || ''}
                      onChange={e => updateField(member.id, 'pnr', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'pnr', e.currentTarget.value)
                        }, 0)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'pnr')}
                      data-member={member.id}
                      data-field="pnr"
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 機票費用 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={member.flight_cost || ''}
                      onChange={e => handleNumberInput(member.id, 'flight_cost', e.target.value)}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 應付金額 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={member.total_payable || ''}
                      onChange={e => handleNumberInput(member.id, 'total_payable', e.target.value)}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 訂金 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={member.deposit_amount || ''}
                      onChange={e => handleNumberInput(member.id, 'deposit_amount', e.target.value)}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 尾款 (自動計算: 應付金額 - 訂金) */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-gray-50 text-xs text-center text-morandi-secondary">
                    {((member.total_payable || 0) - (member.deposit_amount || 0)).toLocaleString()}
                  </td>

                  {/* 備註 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.remarks || ''}
                      onChange={e => updateField(member.id, 'remarks', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'remarks', e.currentTarget.value)
                        }, 0)
                      }}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 操作 - 刪除按鈕 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white text-center">
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-morandi-secondary/50 hover:text-red-500 transition-colors p-1"
                      title="刪除成員"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 新增成員對話框 - 左右兩半 */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          setMemberCountToAdd(1)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增成員</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* 左邊：輸入人數 */}
            <div className="space-y-4 border-r border-border pr-6">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Hash size={18} />
                <span>依人數新增</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                快速新增空白成員列，之後手動填寫資料
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">新增數量：</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={memberCountToAdd}
                  onChange={e => {
                    let value = e.target.value
                    value = value.replace(/[\uff10-\uff19]/g, ch =>
                      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
                    )
                    if (value === '') {
                      setMemberCountToAdd('')
                      return
                    }
                    const num = parseInt(value, 10)
                    if (!isNaN(num)) {
                      setMemberCountToAdd(Math.min(50, Math.max(1, num)))
                    }
                  }}
                  onFocus={e => e.target.select()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      confirmAddMembers()
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  autoFocus
                />
              </div>
              <Button
                onClick={confirmAddMembers}
                className="w-full bg-morandi-gold hover:bg-morandi-gold/90"
              >
                新增 {memberCountToAdd || 1} 位成員
              </Button>
            </div>

            {/* 右邊：上傳護照 OCR 辨識（和顧客管理一樣） */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Upload size={18} />
                <span>上傳護照辨識</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                上傳護照圖片，自動辨識並建立成員資料
              </p>

              {/* 重要提醒 */}
              <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-morandi-primary mb-2">⚠️ 重要提醒</h4>
                <ul className="text-xs text-morandi-secondary space-y-1">
                  <li>• OCR 辨識的資料會自動標記為<strong>「待驗證」</strong></li>
                  <li>• 請務必<strong>人工檢查護照資訊</strong></li>
                  <li>• 支援所有國家護照（TWN、USA、JPN 等）</li>
                </ul>
              </div>

              {/* 拍攝提示 */}
              <div className="bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-morandi-gold mb-2">📸 拍攝建議</h4>
                <ul className="text-xs text-morandi-gold space-y-1">
                  <li>✓ 確保護照<strong>最下方兩排文字</strong>清晰可見</li>
                  <li>✓ 光線充足，避免反光或陰影</li>
                  <li>✓ 拍攝角度正面，避免傾斜</li>
                </ul>
              </div>

              {/* 上傳區域 */}
              <label
                htmlFor="member-passport-upload"
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
                  id="member-passport-upload"
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
                          <Trash2 size={12} className="text-morandi-red" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleBatchUpload}
                    disabled={isUploading}
                    className="w-full bg-morandi-gold hover:bg-morandi-gold/90 text-white"
                  >
                    {isUploading ? '辨識中...' : `辨識並建立 ${passportFiles.length} 位成員`}
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
