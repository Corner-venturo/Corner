'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface OrderMember {
  id: string
  order_id: string
  identity?: string
  chinese_name?: string
  passport_name?: string
  birth_date?: string
  age?: number
  id_number?: string
  gender?: string
  passport_number?: string
  passport_expiry?: string
  special_meal?: string
  pnr?: string
  flight_cost?: number
  hotel_1_name?: string
  hotel_1_checkin?: string
  hotel_1_checkout?: string
  hotel_2_name?: string
  hotel_2_checkin?: string
  hotel_2_checkout?: string
  transport_cost?: number
  misc_cost?: number
  total_payable?: number
  deposit_amount?: number
  balance_amount?: number
  deposit_receipt_no?: string
  balance_receipt_no?: string
  remarks?: string
  cost_price?: number
  selling_price?: number
  profit?: number
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
  const [memberCountToAdd, setMemberCountToAdd] = useState(1)
  const [showIdentityColumn, setShowIdentityColumn] = useState(false) // 控制身份欄位顯示
  const [isComposing, setIsComposing] = useState(false) // 追蹤是否正在使用輸入法

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
      console.error('載入出發日期失敗:', error)
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
      console.error('載入成員失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    setIsAddDialogOpen(true)
  }

  const confirmAddMembers = async () => {
    try {
      const newMembers = Array.from({ length: memberCountToAdd }, () => ({
        order_id: orderId,
        workspace_id: workspaceId,
        member_type: 'adult',
        identity: '大人',
      }))

      const { data, error } = await supabase
        .from('order_members')
        .insert(newMembers)
        .select()

      if (error) throw error
      setMembers([...members, ...(data || [])])
      setIsAddDialogOpen(false)
      setMemberCountToAdd(1)
    } catch (error) {
      console.error('新增成員失敗:', error)
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
      console.error('刪除成員失敗:', error)
      alert('刪除失敗')
    }
  }

  // 全形轉半形工具函式（只轉換全形英數字和標點符號，不影響中文和注音）
  const toHalfWidth = (str: string): string => {
    return str.replace(/[\uFF01-\uFF5E]/g, (s) => {
      // 全形字符範圍 FF01-FF5E 對應半形 21-7E
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    })
  }

  // 更新本地狀態（不立即寫入資料庫，不做任何轉換）
  const updateLocalField = (memberId: string, field: keyof OrderMember, value: string | number) => {
    setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: value } : m)))
  }

  // 直接更新欄位到資料庫和本地狀態
  const updateField = async (memberId: string, field: keyof OrderMember, value: string | number) => {
    // 如果正在使用輸入法，只更新本地狀態，不寫入資料庫
    if (isComposing) {
      updateLocalField(memberId, field, value)
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

      // 更新本地狀態
      setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: processedValue } : m)))
    } catch (error) {
      console.error('更新失敗:', error)
      alert('更新失敗')
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

    const expiry = new Date(expiryDate)
    const departure = new Date(departureDate)
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
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
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
                          updateField(member.id, 'identity', e.currentTarget.value)
                        }}
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
                        updateField(member.id, 'chinese_name', e.currentTarget.value)
                      }}
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
                        updateField(member.id, 'passport_name', e.currentTarget.value)
                      }}
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
                      maxLength={10}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 性別 */}
                  <td
                    className="border border-morandi-gold/20 px-2 py-1 bg-white text-xs text-center cursor-pointer hover:bg-morandi-container/30"
                    onClick={() => {
                      const currentGender = member.gender
                      const newGender = !currentGender ? 'M' : currentGender === 'M' ? 'F' : ''
                      updateField(member.id, 'gender', newGender)
                    }}
                    title="點擊切換性別"
                  >
                    {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                  </td>

                  {/* 身分證號 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.id_number || ''}
                      onChange={e => handleIdNumberChange(member.id, e.target.value)}
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
                        updateField(member.id, 'passport_number', e.currentTarget.value)
                      }}
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
                        updateField(member.id, 'special_meal', e.currentTarget.value)
                      }}
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
                        updateField(member.id, 'pnr', e.currentTarget.value)
                      }}
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

                  {/* 備註 + 刪除按鈕 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white relative">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={member.remarks || ''}
                        onChange={e => updateField(member.id, 'remarks', e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          setIsComposing(false)
                          updateField(member.id, 'remarks', e.currentTarget.value)
                        }}
                        className="flex-1 bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="opacity-0 group-hover:opacity-100 absolute right-1 text-morandi-secondary/50 hover:text-red-500 transition-all duration-200 p-1"
                        title="刪除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 新增成員對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新增成員</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">請輸入要新增的成員數量：</label>
            <input
              type="number"
              min="1"
              max="50"
              value={memberCountToAdd}
              onChange={e => setMemberCountToAdd(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmAddMembers} className="bg-morandi-gold hover:bg-morandi-gold/90">
              確認新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
