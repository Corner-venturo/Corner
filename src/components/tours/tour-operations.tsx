'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tour } from '@/stores/types'
import { useOrderStore, useMemberStore, useTourAddOnStore, usePaymentRequestStore } from '@/stores'
import { _Button } from '@/components/ui/button'
import { _Input } from '@/components/ui/input'
import { Eye } from 'lucide-react'
import { _cn } from '@/lib/utils'
import { getFieldCoordinate } from '@/lib/formula-calculator'
import { ReactDataSheetWrapper, DataSheetColumn } from '@/components/shared/react-datasheet-wrapper'

interface TourOperationsProps {
  tour: Tour
  orderFilter?: string // 選填：只顯示特定訂單的團員
  extraFields?: {
    addOns: boolean
    refunds: boolean
    customFields: Array<{ id: string; name: string }>
  }
}

interface EditingMember {
  id?: string
  order_id: string
  name: string
  nameEn: string
  birthday: string
  passportNumber: string
  passportExpiry: string
  idNumber: string
  gender: string
  age: number
  isNew?: boolean
  order_number?: string
  contact_person?: string
  assignedRoom?: string
  isChildNoBed?: boolean
  reservationCode?: string
  addOns?: string[]
  refunds?: string[]
  customFields?: Record<string, unknown>
}

interface RoomOption {
  value: string
  label: string
  room_type: string
  capacity: number
  currentCount: number
}

export const TourOperations = React.memo(function TourOperations({
  tour,
  orderFilter,
  extraFields,
}: TourOperationsProps) {
  const { items: orders } = useOrderStore()
  const { items: members, update: updateMember } = useMemberStore()
  const { items: tourAddOns } = useTourAddOnStore()
  const { items: paymentRequests } = usePaymentRequestStore()
  const [tableMembers, setTableMembers] = useState<EditingMember[]>([])
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([])

  // Excel 式公式編輯狀態
  const [isFormulaModeActive, _setIsFormulaModeActive] = useState(false)
  const [formulaInputRef, _setFormulaInputRef] = useState<HTMLInputElement | null>(null)

  // 欄位管理狀態
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])

  // 根據房型名稱推算容量
  const getRoomCapacity = (room_type: string): number => {
    if (room_type.includes('單人')) return 1
    if (room_type.includes('雙人')) return 2
    if (room_type.includes('三人')) return 3
    if (room_type.includes('四人')) return 4
    return 2 // 預設雙人房
  }

  // 動態獲取房間容量
  const _getRoomCapacityFromOptions = (roomValue: string): number => {
    const room = roomOptions.find(option => option.value === roomValue)
    return room ? room.capacity : 0
  }

  // 獲取所有可用房間的映射
  const roomCapacity = roomOptions.reduce(
    (acc, option) => {
      acc[option.value] = option.capacity
      return acc
    },
    {} as Record<string, number>
  )

  // 分配房間
  const assignMemberToRoom = (member_id: string, roomValue: string) => {
    if (roomValue === 'no-bed') {
      // 選擇「不佔床」，更新狀態但不分配房間
      setTableMembers(prev =>
        prev.map(member =>
          member.id === member_id
            ? { ...member, isChildNoBed: true, assignedRoom: undefined }
            : member
        )
      )
      updateMember(member_id, { is_child_no_bed: true, assigned_room: undefined })
    } else if (roomValue.startsWith('no-bed-')) {
      // 不佔床但選擇特定房間
      const actualRoom = roomValue.replace('no-bed-', '')
      setTableMembers(prev =>
        prev.map(member =>
          member.id === member_id
            ? { ...member, isChildNoBed: true, assignedRoom: actualRoom }
            : member
        )
      )
      updateMember(member_id, { is_child_no_bed: true, assigned_room: actualRoom })
    } else {
      // 一般分房，檢查容量
      if (roomValue && isRoomFull(roomValue, member_id)) {
        alert('該房間已滿，無法分配！')
        return
      }

      setTableMembers(prev =>
        prev.map(member =>
          member.id === member_id
            ? { ...member, assignedRoom: roomValue || undefined, isChildNoBed: false }
            : member
        )
      )
      updateMember(member_id, { assigned_room: roomValue || undefined, is_child_no_bed: false })
    }
  }

  // 檢查房間是否已滿（不佔床的人不計入容量）
  const isRoomFull = (roomValue: string, excludeMemberId?: string) => {
    const capacity = roomCapacity[roomValue] || 0
    const currentOccupants = tableMembers.filter(
      member =>
        member.assignedRoom === roomValue && member.id !== excludeMemberId && !member.isChildNoBed // 不佔床的人不計入容量
    )
    return currentOccupants.length >= capacity
  }

  // 獲取房間使用情況（分別統計佔床和不佔床）
  const getRoomUsage = (roomValue: string) => {
    const capacity = roomCapacity[roomValue] || 0
    const occupants = tableMembers.filter(member => member.assignedRoom === roomValue)
    const bedCount = occupants.filter(member => !member.isChildNoBed).length // 佔床人數
    const noBedCount = occupants.filter(member => member.isChildNoBed).length // 不佔床人數
    return { bedCount, noBedCount, totalCount: occupants.length, capacity }
  }

  // 處理欄位點擊以插入公式引用
  const _handleFieldClick = (fieldName: string) => {
    if (isFormulaModeActive && formulaInputRef) {
      const customFields = extraFields?.customFields || []
      const coordinate = getFieldCoordinate(fieldName, customFields)
      if (coordinate) {
        const currentValue = formulaInputRef.value
        const cursorPosition = formulaInputRef.selectionStart || currentValue.length
        const newValue =
          currentValue.slice(0, cursorPosition) + coordinate + currentValue.slice(cursorPosition)

        // 更新輸入框值
        formulaInputRef.value = newValue

        // 觸發 change 事件
        const event = new Event('input', { bubbles: true })
        formulaInputRef.dispatchEvent(event)

        // 設置游標位置
        setTimeout(() => {
          formulaInputRef.focus()
          formulaInputRef.setSelectionRange(
            cursorPosition + coordinate.length,
            cursorPosition + coordinate.length
          )
        }, 0)
      }
    }
  }

  // 獲取屬於這個旅遊團的所有訂單（如果有 orderFilter，則只取該訂單）
  const tourOrders = orders.filter(order => {
    if (orderFilter) {
      return order.id === orderFilter
    }
    return order.tour_id === tour.id
  })

  // 初始化團員
  useEffect(() => {
    const tourOrdersFiltered = orders.filter(order => order.tour_id === tour.id)
    const allTourMembers = members
      .filter(member => tourOrdersFiltered.some(order => order.id === member.order_id))
      .map(member => {
        const relatedOrder = tourOrdersFiltered.find(order => order.id === member.order_id)
        return {
          ...member,
          nameEn: member.name_en,
          passportNumber: member.passport_number,
          passportExpiry: member.passport_expiry,
          idNumber: member.id_number,
          order_number: relatedOrder?.order_number || '',
          contact_person: relatedOrder?.contact_person || '',
          // 保留現有的分房數據，不要覆蓋
          assignedRoom: member.assigned_room,
          isChildNoBed: member.is_child_no_bed,
        } as EditingMember
      })

    setTableMembers(allTourMembers)
  }, [members, orders, tour.id])

  // 單獨處理房間選項
  useEffect(() => {
    const tourPaymentRequests = paymentRequests.filter(request => request.tour_id === tour.id)
    const roomOptions: RoomOption[] = []

    tourPaymentRequests.forEach(request => {
      request.items.forEach((item: { category: string; description: string }) => {
        if (item.category === '住宿' && item.description) {
          // 解析房型和數量（例如：雙人房 x5, 三人房 x2）
          const roomMatches = item.description.match(/(\S+房)\s*[x×]\s*(\d+)/g)
          if (roomMatches) {
            roomMatches.forEach((match: any) => {
              const [, room_type, quantity] = match.match(/(\S+房)\s*[x×]\s*(\d+)/) || []
              if (room_type && quantity) {
                const capacity = getRoomCapacity(room_type)
                const roomCount = parseInt(quantity)

                // 生成具體房間選項（如：雙人房-1、雙人房-2...）
                for (let i = 1; i <= roomCount; i++) {
                  roomOptions.push({
                    value: `${room_type}-${i}`,
                    label: `${room_type}-${i}`,
                    room_type,
                    capacity,
                    currentCount: 0,
                  })
                }
              }
            })
          }
        }
      })
    })

    setRoomOptions(roomOptions)
  }, [paymentRequests, tour.id])

  const totalMembers = tableMembers.length
  const completedMembers = tableMembers.filter(member => member.name && member.idNumber).length

  // 處理資料更新
  const handleDataUpdate = useCallback(
    (newData: unknown[]) => {
      setTableMembers(newData)

      // 更新到 store
      newData.forEach(member => {
        if (member.id) {
          updateMember(member.id, member)
        }
      })
    },
    [updateMember]
  )

  // 處理欄位隱藏
  const handleColumnHide = useCallback((columnKey: string) => {
    setHiddenColumns(prev => [...prev, columnKey])
  }, [])

  // 處理欄位顯示
  const handleColumnShow = useCallback((columnKey: string) => {
    setHiddenColumns(prev => prev.filter(key => key !== columnKey))
  }, [])

  // 處理欄位刪除
  const handleColumnDelete = useCallback(
    (columnKey: string) => {
      // 確認刪除
      if (confirm('確定要刪除此欄位嗎？這將會刪除所有團員在此欄位的資料。')) {
        // 從所有團員中移除此欄位的資料
        const updatedMembers = tableMembers.map(member => {
          if (member.customFields) {
            const { [columnKey]: deleted, ...remainingFields } = member.customFields
            return {
              ...member,
              customFields: remainingFields,
            }
          }
          return member
        })

        setTableMembers(updatedMembers)

        // 更新到 store
        updatedMembers.forEach(member => {
          if (member.id) {
            // customFields 不是 Member 型別的欄位，移除此更新
            // updateMember(member.id, { customFields: member.customFields });
          }
        })

        // 從隱藏列表中移除（如果存在）
        setHiddenColumns(prev => prev.filter(key => key !== columnKey))
      }
    },
    [tableMembers]
  )

  if (tourOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-morandi-secondary">此旅遊團尚無訂單</p>
        </div>
      </div>
    )
  }

  // 配置 DataSheet 欄位
  const dataSheetColumns: DataSheetColumn[] = [
    { key: 'index', label: '序號', width: 40, readOnly: true },
    { key: 'name', label: '姓名', width: 80 },
    { key: 'nameEn', label: '英文姓名', width: 100 },
    { key: 'birthday', label: '生日', width: 100 },
    { key: 'age', label: '年齡', width: 60, readOnly: true },
    { key: 'gender', label: '性別', width: 50, readOnly: true },
    { key: 'idNumber', label: '身分證字號', width: 120 },
    { key: 'passportNumber', label: '護照號碼', width: 100 },
    { key: 'passportExpiry', label: '護照效期', width: 100 },
    { key: 'reservationCode', label: '訂位代號', width: 100 },
    { key: 'assignedRoom', label: '分房', width: 120 },

    // 動態欄位
    ...(extraFields?.addOns
      ? [{ key: 'addOns', label: '加購項目', width: 100, readOnly: true }]
      : []),
    ...(extraFields?.refunds ? [{ key: 'refunds', label: '退費項目', width: 100 }] : []),
    ...(extraFields?.customFields?.map(field => ({
      key: field.id,
      label: field.name,
      width: 100,
    })) || []),
  ]

  return (
    <div>
      {/* 隱藏欄位控制 */}
      {hiddenColumns.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">隱藏的欄位：</div>
          <div className="flex flex-wrap gap-2">
            {hiddenColumns.map(columnKey => {
              // 先找自定義欄位
              let columnName = extraFields?.customFields?.find(f => f.id === columnKey)?.name

              // 如果不是自定義欄位，找系統欄位
              if (!columnName) {
                const systemColumn = dataSheetColumns.find(col => col.key === columnKey)
                columnName = systemColumn?.label
              }

              return columnName ? (
                <button
                  key={columnKey}
                  onClick={() => handleColumnShow(columnKey)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                >
                  <Eye size={12} />
                  {columnName}
                </button>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* 使用 ReactDataSheet 替代原來的表格 */}
      <div className="overflow-hidden bg-white rounded-lg shadow-sm">
        <ReactDataSheetWrapper
          columns={dataSheetColumns}
          data={tableMembers.map((member, index) => ({
            ...member,
            index: index + 1,
            age: member.age > 0 ? `${member.age}歲` : '',
            gender: member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '',
            assignedRoom: member.isChildNoBed
              ? `不佔床${member.assignedRoom ? ` - ${member.assignedRoom}` : ''}`
              : member.assignedRoom || '未分配',
          }))}
          tour_add_ons={tourAddOns.filter(a => a.tour_id === tour.id)}
          onDataUpdate={handleDataUpdate}
          onColumnHide={handleColumnHide}
          onColumnDelete={handleColumnDelete}
          hiddenColumns={hiddenColumns}
          orderFilter={orderFilter}
          roomOptions={roomOptions}
          onRoomAssign={assignMemberToRoom}
          getRoomUsage={getRoomUsage}
          isRoomFull={isRoomFull}
          tour_id={tour.id}
          className="min-h-[400px]"
        />
      </div>

      {/* 團務統計 */}
      <div className="bg-morandi-container/20 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-primary">{totalMembers}</div>
            <div className="text-sm text-morandi-secondary">總成員數</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-primary">{completedMembers}</div>
            <div className="text-sm text-morandi-secondary">已完成資料</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-primary">
              {totalMembers > 0 ? Math.round((completedMembers / totalMembers) * 100) : 0}%
            </div>
            <div className="text-sm text-morandi-secondary">完成率</div>
          </div>
        </div>
      </div>
    </div>
  )
})
