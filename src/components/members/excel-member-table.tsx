'use client'

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
  useRef,
} from 'react'
import { useMemberStore, useCustomerStore } from '@/stores'
import { Member } from '@/stores/types'
import type { Customer } from '@/types/customer.types'
import { getGenderFromIdNumber, calculateAge } from '@/lib/utils'
import { ReactDataSheetWrapper, DataSheetColumn } from '@/components/shared/react-datasheet-wrapper'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageIcon, X, AlertTriangle } from 'lucide-react'
import { CustomerVerifyDialog } from '@/app/(main)/customers/components/CustomerVerifyDialog'

interface MemberTableProps {
  order_id: string
  departure_date: string
  member_count: number
}

export interface MemberTableRef {
  addRow: () => void
}

interface EditingMember extends Omit<Member, 'id' | 'created_at' | 'updated_at'> {
  id?: string
  isNew?: boolean
}

export const ExcelMemberTable = forwardRef<MemberTableRef, MemberTableProps>(
  ({ order_id, departure_date, member_count }, ref) => {
    const memberStore = useMemberStore()
    const members = memberStore.items
    const [tableMembers, setTableMembers] = useState<EditingMember[]>([])

    // 顧客匹配對話框
    const { items: customers } = useCustomerStore()
    const [showMatchDialog, setShowMatchDialog] = useState(false)
    const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([])
    const [matchType, setMatchType] = useState<'name' | 'id_number'>('name')
    const [pendingMemberIndex, setPendingMemberIndex] = useState<number | null>(null)
    const [pendingMemberData, setPendingMemberData] = useState<EditingMember | null>(null)

    // 護照圖片預覽
    const [showPassportPreview, setShowPassportPreview] = useState(false)
    const [previewMember, setPreviewMember] = useState<EditingMember | null>(null)

    // 護照驗證對話框
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const [verifyCustomer, setVerifyCustomer] = useState<Customer | null>(null)

    const orderMembers = useMemo(
      () => members.filter(member => member.order_id === order_id),
      [members, order_id]
    )

    // Debounce 計時器
    const saveTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
    const DEBOUNCE_DELAY = 800 // 800ms debounce

    // 點擊姓名查看護照照片或開啟驗證對話框
    const handleNameClick = useCallback(
      (rowData: Record<string, unknown>) => {
        const index = (rowData.index as number) - 1
        const member = tableMembers[index]
        if (!member) return

        // 如果有關聯的顧客且有護照圖片，開啟驗證對話框
        const customerId = member.customer_id
        if (customerId) {
          const customer = customers.find(c => c.id === customerId)
          if (customer && customer.passport_image_url) {
            setVerifyCustomer(customer)
            setShowVerifyDialog(true)
            return
          }
        }

        // 否則只顯示護照圖片預覽
        if (member.passport_image_url) {
          setPreviewMember(member)
          setShowPassportPreview(true)
        }
      },
      [tableMembers, customers]
    )

    // 配置 DataSheet 欄位
    const dataSheetColumns: DataSheetColumn[] = [
      { key: 'index', label: '序號', width: 40, readOnly: true },
      {
        key: 'name',
        label: '姓名',
        width: 100,
        onCellClick: handleNameClick,
        valueRenderer: (cell) => {
          const rowData = cell.rowData as Record<string, unknown> | undefined
          const hasPassport = rowData?.passport_image_url
          const customerId = rowData?.customer_id as string | undefined
          const name = cell.value as string

          // 找到關聯的顧客，檢查驗證狀態
          const customer = customerId ? customers.find(c => c.id === customerId) : null
          const needsVerification = customer?.passport_image_url && customer?.verification_status !== 'verified'

          if (hasPassport || customer?.passport_image_url) {
            return (
              <span className="flex items-center gap-1 cursor-pointer text-primary hover:underline">
                {needsVerification && (
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                )}
                <ImageIcon size={12} className="text-primary flex-shrink-0" />
                <span className="truncate">{name}</span>
              </span>
            )
          }
          return name || ''
        },
      },
      { key: 'nameEn', label: '英文姓名', width: 100 },
      { key: 'birthday', label: '生日', width: 100 },
      { key: 'age', label: '年齡', width: 60, readOnly: true },
      { key: 'gender', label: '性別', width: 50, readOnly: true },
      { key: 'idNumber', label: '身分證字號', width: 120 },
      { key: 'passportNumber', label: '護照號碼', width: 100 },
      { key: 'passportExpiry', label: '護照效期', width: 100 },
      { key: 'reservationCode', label: '訂位代號', width: 100 },
    ]

    useEffect(() => {
      const existingMembers: EditingMember[] = orderMembers.map(member => ({ ...member })) as unknown as EditingMember[]

      // 確保至少有member_count行
      while (existingMembers.length < member_count) {
        existingMembers.push({
          order_id,
          name: '',
          name_en: '',
          birthday: '',
          passport_number: '',
          passport_expiry: '',
          id_number: '',
          gender: '',
          reservation_code: '',
          add_ons: [],
          refunds: [],
          isNew: true,
        } as unknown as EditingMember)
      }

      setTableMembers(existingMembers)
    }, [orderMembers, member_count, order_id])

    // 自動儲存成員（帶 debounce）
    const autoSaveMember = useCallback(
      (member: EditingMember, index: number) => {
        // 清除之前的計時器
        const existingTimer = saveTimersRef.current.get(index)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        // 設定新的 debounce 計時器
        const timer = setTimeout(async () => {
          if (member.isNew && member.name?.trim()) {
            const { isNew, ...memberData } = member
            const created = await memberStore.create(memberData as unknown as Parameters<typeof memberStore.create>[0])
            const newId = created?.id

            setTableMembers(prev => {
              const updated = [...prev]
              updated[index] = { ...member, id: newId as string, isNew: false }
              return updated
            })
          } else if (member.id && !member.isNew) {
            const { isNew, ...memberData } = member
            await memberStore.update(member.id, memberData as Partial<Member>)
          }
          saveTimersRef.current.delete(index)
        }, DEBOUNCE_DELAY)

        saveTimersRef.current.set(index, timer)
      },
      [memberStore]
    )

    // 清理計時器
    useEffect(() => {
      return () => {
        saveTimersRef.current.forEach(timer => clearTimeout(timer))
        saveTimersRef.current.clear()
      }
    }, [])

    // 處理資料更新 (用於 ReactDataSheet)
    // 檢查顧客匹配 - 姓名 2 字以上觸發模糊搜尋
    const checkCustomerMatchByName = useCallback(
      (memberData: EditingMember, index: number) => {
        const name = memberData.name?.trim()
        if (!name || name.length < 2) return false

        // 模糊搜尋：姓名包含輸入的字串
        const nameMatches = customers.filter(c =>
          c.name?.includes(name) || name.includes(c.name || '')
        )

        if (nameMatches.length === 0) {
          return false // 沒有匹配，繼續正常流程
        }

        // 有匹配顧客，顯示選擇對話框讓使用者確認
        setMatchedCustomers(nameMatches)
        setMatchType('name')
        setPendingMemberIndex(index)
        setPendingMemberData(memberData)
        setShowMatchDialog(true)
        return true
      },
      [customers]
    )

    // 檢查顧客匹配 - 身分證字號
    const checkCustomerMatchByIdNumber = useCallback(
      (memberData: EditingMember, index: number) => {
        const idNumber = memberData.id_number?.trim()
        if (!idNumber || idNumber.length < 5) return false

        // 搜尋身分證字號相符的顧客
        const idMatches = customers.filter(c =>
          c.national_id === idNumber
        )

        if (idMatches.length === 0) {
          return false
        }

        // 有匹配顧客，顯示選擇對話框
        setMatchedCustomers(idMatches)
        setMatchType('id_number')
        setPendingMemberIndex(index)
        setPendingMemberData(memberData)
        setShowMatchDialog(true)
        return true
      },
      [customers]
    )

    // 選擇顧客後帶入資料
    const handleSelectCustomer = useCallback(
      (customer: Customer) => {
        if (pendingMemberIndex === null || !pendingMemberData) return

        const updatedMembers = [...tableMembers]
        const customerGender = customer.gender as 'M' | 'F' | '' | null
        updatedMembers[pendingMemberIndex] = {
          ...pendingMemberData,
          name_en: customer.passport_romanization || pendingMemberData.name_en,
          passport_number: customer.passport_number || pendingMemberData.passport_number,
          passport_expiry: customer.passport_expiry_date || pendingMemberData.passport_expiry,
          id_number: customer.national_id || pendingMemberData.id_number,
          birthday: customer.date_of_birth || pendingMemberData.birthday,
          gender: customerGender || pendingMemberData.gender,
          customer_id: customer.id,
        }
        setTableMembers(updatedMembers)
        setShowMatchDialog(false)
        setPendingMemberIndex(null)
        setPendingMemberData(null)

        // 儲存到 store
        autoSaveMember(updatedMembers[pendingMemberIndex], pendingMemberIndex)
      },
      [pendingMemberIndex, pendingMemberData, tableMembers, autoSaveMember]
    )

    const handleDataUpdate = useCallback(
      (newData: EditingMember[]) => {
        // 處理自動計算欄位
        const processedData = newData.map((member, index) => {
          const processed = { ...member }

          // 從身分證號自動計算性別和年齡
          if (processed.id_number) {
            processed.gender = getGenderFromIdNumber(processed.id_number)
            const age = calculateAge(processed.id_number, departure_date)
            if (age !== null && 'age' in processed) {
              (processed as EditingMember & { age: number }).age = age
            }
          }
          // 從生日計算年齡
          else if (processed.birthday) {
            const age = calculateAge(String(processed.birthday), departure_date)
            if (age !== null && 'age' in processed) {
              (processed as EditingMember & { age: number }).age = age
            }
          }

          return processed
        })

        setTableMembers(processedData)

        // 檢查是否有姓名或身分證字號變更，觸發顧客匹配
        processedData.forEach((member, index) => {
          const oldMember = tableMembers[index]

          // 姓名有變更（2 字以上），檢查顧客匹配
          if (member.name !== oldMember?.name && member.name?.trim() && member.name.trim().length >= 2) {
            const matched = checkCustomerMatchByName(member, index)
            if (!matched) {
              autoSaveMember(member, index)
            }
            return
          }

          // 身分證字號有變更（5 字以上），檢查顧客匹配
          if (member.id_number !== oldMember?.id_number && member.id_number?.trim() && member.id_number.trim().length >= 5) {
            const matched = checkCustomerMatchByIdNumber(member, index)
            if (!matched) {
              autoSaveMember(member, index)
            }
            return
          }

          // 其他欄位變更，正常儲存
          autoSaveMember(member, index)
        })
      },
      [departure_date, autoSaveMember, checkCustomerMatchByName, checkCustomerMatchByIdNumber, tableMembers]
    )

    // 新增行
    const addRow = () => {
      const newMember = {
        order_id,
        name: '',
        name_en: '',
        birthday: '',
        passport_number: '',
        passport_expiry: '',
        id_number: '',
        gender: '',
        reservation_code: '',
        add_ons: [],
        refunds: [],
        isNew: true,
      } as unknown as EditingMember
      setTableMembers([...tableMembers, newMember])
    }

    // 暴露addRow函數給父組件
    useImperativeHandle(ref, () => ({
      addRow,
    }))

    return (
      <div className="w-full">
        {/* 使用 ReactDataSheet 替代原來的表格 */}
        <ReactDataSheetWrapper
          columns={dataSheetColumns}
          data={tableMembers.map((member, index: number) => {
            const age = 'age' in member ? (member as EditingMember & { age: number }).age : 0
            return {
              ...member,
              index: index + 1,
              age: age > 0 ? `${age}歲` : '',
              gender: member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '',
              passport_image_url: member.passport_image_url || '',
              customer_id: member.customer_id || '',
            }
          })}
          onDataUpdate={handleDataUpdate as (data: unknown[]) => void}
          className="min-h-[400px]"
        />

        <div className="text-xs text-morandi-secondary px-6 py-2 space-y-1">
          <p>• 點擊任意單元格即可編輯，自動儲存</p>
          <p>• 年齡和性別為自動計算欄位</p>
          <p>• 支援 Excel 式鍵盤導航和複製貼上</p>
          <p>• 身分證號碼會自動計算年齡和性別</p>
          <p>• 輸入姓名時會自動搜尋顧客資料庫，同名時可選擇</p>
          <p>• <ImageIcon size={12} className="inline text-primary" /> 有護照照片的成員，點擊可預覽或驗證</p>
          <p>• <AlertTriangle size={12} className="inline text-amber-500" /> 金色驚嘆號表示護照資料待驗證，點擊可進行驗證</p>
        </div>

        {/* 護照圖片預覽對話框 */}
        {showPassportPreview && previewMember && (
          <Dialog open={true} onOpenChange={() => setShowPassportPreview(false)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon size={20} />
                  {previewMember.name || previewMember.chinese_name} 的護照
                </DialogTitle>
              </DialogHeader>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10 bg-white/80 hover:bg-white"
                  onClick={() => setShowPassportPreview(false)}
                >
                  <X size={20} />
                </Button>
                {previewMember.passport_image_url ? (
                  <div className="relative w-full max-h-[70vh] overflow-auto">
                    <img
                      src={previewMember.passport_image_url}
                      alt={`${previewMember.name || previewMember.chinese_name} 的護照`}
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-morandi-background rounded-lg">
                    <p className="text-morandi-secondary">沒有護照照片</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-morandi-background p-4 rounded-lg">
                <div>
                  <span className="font-medium text-morandi-secondary">姓名：</span>
                  <span>{previewMember.name || previewMember.chinese_name}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">英文姓名：</span>
                  <span>{previewMember.name_en || previewMember.passport_name || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">護照號碼：</span>
                  <span>{previewMember.passport_number || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">護照效期：</span>
                  <span>{previewMember.passport_expiry || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">生日：</span>
                  <span>{previewMember.birthday || previewMember.birth_date || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">性別：</span>
                  <span>
                    {previewMember.gender === 'M'
                      ? '男'
                      : previewMember.gender === 'F'
                      ? '女'
                      : '-'}
                  </span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 顧客選擇對話框 - 橫向表格式 */}
        {showMatchDialog && matchedCustomers.length > 0 && (
          <Dialog open={true} onOpenChange={() => setShowMatchDialog(false)}>
            <DialogContent className="max-w-4xl p-0">
              <DialogHeader className="p-4 pb-2">
                <DialogTitle className="text-base">
                  {matchType === 'name'
                    ? `找到 ${matchedCustomers.length} 位相似顧客「${pendingMemberData?.name}」`
                    : `找到 ${matchedCustomers.length} 位相同身分證「${pendingMemberData?.id_number}」`}
                </DialogTitle>
              </DialogHeader>

              {/* 橫向表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-y">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">姓名</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">英文拼音</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">身分證</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">護照號碼</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">生日</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">性別</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="border-b hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-3 font-medium text-primary">{customer.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{customer.passport_romanization || '-'}</td>
                        <td className="px-3 py-3 font-mono text-xs">{customer.national_id || '-'}</td>
                        <td className="px-3 py-3 font-mono text-xs">{customer.passport_number || '-'}</td>
                        <td className="px-3 py-3">{customer.date_of_birth || '-'}</td>
                        <td className="px-3 py-3">{customer.gender === 'M' ? '男' : customer.gender === 'F' ? '女' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 底部操作 */}
              <div className="flex justify-between items-center p-3 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground">點擊列即可選擇該顧客資料</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                      // 關閉對話框前，先儲存已輸入的資料（不帶入顧客資料）
                      if (pendingMemberIndex !== null && pendingMemberData) {
                        autoSaveMember(pendingMemberData, pendingMemberIndex)
                      }
                      setShowMatchDialog(false)
                      setPendingMemberIndex(null)
                      setPendingMemberData(null)
                    }}
                  >
                    取消，手動輸入
                  </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 護照驗證對話框 - 複用顧客管理的驗證組件 */}
        <CustomerVerifyDialog
          open={showVerifyDialog}
          onOpenChange={setShowVerifyDialog}
          customer={verifyCustomer}
          onUpdate={async (id, data) => {
            // 使用 customerStore 更新顧客資料
            const customerStore = useCustomerStore.getState()
            await customerStore.update(id, data)
            // 重新載入成員資料以更新狀態
            memberStore.fetchAll()
          }}
        />
      </div>
    )
  }
)

ExcelMemberTable.displayName = 'ExcelMemberTable'
