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
import { ImageIcon, X } from 'lucide-react'

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
    const [pendingMemberIndex, setPendingMemberIndex] = useState<number | null>(null)
    const [pendingMemberData, setPendingMemberData] = useState<EditingMember | null>(null)

    // 護照圖片預覽
    const [showPassportPreview, setShowPassportPreview] = useState(false)
    const [previewMember, setPreviewMember] = useState<EditingMember | null>(null)

    const orderMembers = useMemo(
      () => members.filter(member => member.order_id === order_id),
      [members, order_id]
    )

    // Debounce 計時器
    const saveTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
    const DEBOUNCE_DELAY = 800 // 800ms debounce

    // 點擊姓名查看護照照片
    const handleNameClick = useCallback(
      (rowData: Record<string, unknown>) => {
        const index = (rowData.index as number) - 1
        const member = tableMembers[index]
        if (member && member.passport_image_url) {
          setPreviewMember(member)
          setShowPassportPreview(true)
        }
      },
      [tableMembers]
    )

    // 配置 DataSheet 欄位
    const dataSheetColumns: DataSheetColumn[] = [
      { key: 'index', label: '序號', width: 40, readOnly: true },
      {
        key: 'name',
        label: '姓名',
        width: 80,
        onCellClick: handleNameClick,
        valueRenderer: (cell) => {
          const rowData = cell.rowData as Record<string, unknown> | undefined
          const hasPassport = rowData?.passport_image_url
          const name = cell.value as string
          if (hasPassport && name) {
            return (
              <span className="flex items-center gap-1 cursor-pointer text-primary hover:underline">
                <ImageIcon size={12} className="text-primary" />
                {name}
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
    // 檢查顧客匹配
    const checkCustomerMatch = useCallback(
      (memberData: EditingMember, index: number) => {
        const name = memberData.name?.trim()
        if (!name) return false

        // 搜尋同名顧客
        const nameMatches = customers.filter(c => c.name === name)

        if (nameMatches.length === 0) {
          return false // 沒有匹配，繼續正常流程
        }

        // 有同名顧客，顯示選擇對話框讓使用者確認
        setMatchedCustomers(nameMatches)
        setPendingMemberIndex(index)
        setPendingMemberData(memberData)
        setShowMatchDialog(true)
        return true
      },
      [customers, tableMembers]
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

        // 檢查是否有姓名變更，觸發顧客匹配
        processedData.forEach((member, index) => {
          const oldMember = tableMembers[index]
          if (member.name !== oldMember?.name && member.name?.trim()) {
            // 姓名有變更，檢查顧客匹配
            const matched = checkCustomerMatch(member, index)
            if (!matched) {
              // 沒有匹配，正常儲存
              autoSaveMember(member, index)
            }
          } else {
            // 其他欄位變更，正常儲存
            autoSaveMember(member, index)
          }
        })
      },
      [departure_date, autoSaveMember, checkCustomerMatch, tableMembers]
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
          <p>• 有護照照片的成員，姓名會顯示圖片圖示，點擊可預覽</p>
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

        {/* 顧客選擇對話框 */}
        {showMatchDialog && matchedCustomers.length > 0 && (
          <Dialog open={true} onOpenChange={() => setShowMatchDialog(false)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>找到 {matchedCustomers.length} 位同名顧客</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm text-morandi-secondary">
                  請選擇要使用的顧客資料（依身分證號碼區分）：
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matchedCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full p-4 text-left border-2 border-morandi-border rounded-lg hover:border-primary hover:bg-morandi-background transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-lg mb-2">{customer.name}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm text-morandi-secondary">
                            <div>
                              <span className="font-medium">身分證：</span>
                              <span className="ml-1">{customer.national_id || '無'}</span>
                            </div>
                            <div>
                              <span className="font-medium">護照：</span>
                              <span className="ml-1">{customer.passport_number || '無'}</span>
                            </div>
                            <div>
                              <span className="font-medium">生日：</span>
                              <span className="ml-1">{customer.date_of_birth || '無'}</span>
                            </div>
                            <div>
                              <span className="font-medium">性別：</span>
                              <span className="ml-1">
                                {customer.gender === 'M' ? '男' : customer.gender === 'F' ? '女' : '無'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">電話：</span>
                              <span className="ml-1">{customer.phone || '無'}</span>
                            </div>
                            <div>
                              <span className="font-medium">Email：</span>
                              <span className="ml-1">{customer.email || '無'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-primary">
                          <span className="text-sm">→ 選擇</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-morandi-secondary">或是手動輸入新的顧客資料</p>
                  <Button
                    variant="outline"
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
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }
)

ExcelMemberTable.displayName = 'ExcelMemberTable'
