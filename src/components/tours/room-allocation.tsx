'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tour, Member } from '@/stores/types'
import { useOrderStore, useMemberStore, usePaymentRequestStore } from '@/stores'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Bed, Users, AlertTriangle, Home } from 'lucide-react'

interface RoomAllocationProps {
  tour: Tour
}

interface RoomOption {
  value: string
  label: string
  room_type: string
  capacity: number
  currentCount: number
}

interface MemberWithRoom extends Member {
  // Uses assigned_room from Member interface
}

export function RoomAllocation({ tour }: RoomAllocationProps) {
  const { items: orders } = useOrderStore()
  const { items: members } = useMemberStore()
  const { items: paymentRequests } = usePaymentRequestStore()
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([])
  const [membersWithRooms, setMembersWithRooms] = useState<MemberWithRoom[]>([])

  // 獲取屬於這個旅遊團的所有訂單和團員
  const tourOrders = orders.filter((order: any) => order.tour_id === tour.id)
  const tourMembers = members.filter((member: any) =>
    tourOrders.some((order: any) => order.id === member.order_id)
  )

  // 根據房型名稱推算容量
  const getRoomCapacity = useCallback((room_type: string): number => {
    if (room_type.includes('單人')) return 1
    if (room_type.includes('雙人')) return 2
    if (room_type.includes('三人')) return 3
    if (room_type.includes('四人')) return 4
    return 2 // 預設雙人房
  }, [])

  // 從請款單解析房間配額，生成房間選項
  const generateRoomOptions = useCallback((): RoomOption[] => {
    const tourPaymentRequests = paymentRequests.filter((request: any) => request.tour_id === tour.id)
    const roomOptions: RoomOption[] = []

    tourPaymentRequests.forEach(request => {
      (request.items || []).forEach((item: { category: string; description: string }) => {
        if (item.category === '住宿' && item.description) {
          // 解析房型和數量（例如：雙人房 x5, 三人房 x2）
          const roomMatches = item.description.match(/(\S+房)\s*[x×]\s*(\d+)/g)
          if (roomMatches) {
            roomMatches.forEach((match: any) => {
              const matchResult = match.match(/(\S+房)\s*[x×]\s*(\d+)/)
              if (matchResult) {
                const [, room_type, quantity] = matchResult
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
              }
            })
          }
        }
      })
    })

    return roomOptions
  }, [paymentRequests, tour.id, getRoomCapacity])

  // 初始化資料
  useEffect(() => {
    const rooms = generateRoomOptions()
    setRoomOptions(rooms)
    // 保留 members 中原有的 assignedRoom 數據
    setMembersWithRooms(tourMembers.map(member => ({ ...member } as unknown as MemberWithRoom)))
  }, [tour.id, paymentRequests, tourMembers, generateRoomOptions])

  // 分配房間
  const assignMemberToRoom = (member_id: string, roomValue: string) => {
    setMembersWithRooms(prev =>
      prev.map(member =>
        member.id === member_id ? { ...member, assigned_room: roomValue || undefined } : member
      )
    )

    // 更新房間使用情況
    updateRoomCounts()
  }

  // 更新房間使用人數
  const updateRoomCounts = () => {
    setRoomOptions(prev =>
      prev.map(room => ({
        ...room,
        currentCount: membersWithRooms.filter(member => member.assigned_room === room.value).length,
      }))
    )
  }

  // 統計資料
  const totalRooms = roomOptions.length
  const assignedCount = membersWithRooms.filter(member => member.assigned_room).length
  const unassignedCount = membersWithRooms.length - assignedCount
  const totalCapacity = roomOptions.reduce((sum, room) => sum + room.capacity, 0)

  // 檢查房間是否已滿
  const isRoomFull = (roomValue: string) => {
    const room = roomOptions.find(r => r.value === roomValue)
    if (!room) return false
    const currentOccupancy = membersWithRooms.filter(m => m.assigned_room === roomValue).length
    return currentOccupancy >= room.capacity
  }

  return (
    <div className="space-y-6">
      {/* 房間配額總覽 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg text-center">
          <Home size={24} className="mx-auto mb-2 text-morandi-gold" />
          <div className="text-xl font-bold text-morandi-primary">{totalRooms}</div>
          <div className="text-sm text-morandi-secondary">總房間數</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg text-center">
          <Bed size={24} className="mx-auto mb-2 text-morandi-primary" />
          <div className="text-xl font-bold text-morandi-primary">{totalCapacity}</div>
          <div className="text-sm text-morandi-secondary">總床位數</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg text-center">
          <Users size={24} className="mx-auto mb-2 text-morandi-green" />
          <div className="text-xl font-bold text-morandi-primary">{assignedCount}</div>
          <div className="text-sm text-morandi-secondary">已分房</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg text-center">
          <AlertTriangle size={24} className="mx-auto mb-2 text-morandi-red" />
          <div className="text-xl font-bold text-morandi-primary">{unassignedCount}</div>
          <div className="text-sm text-morandi-secondary">未分房</div>
        </div>
      </div>

      {/* 團員分房表格 */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-morandi-container/30">
              <tr>
                <th className="w-[40px] py-2.5 px-4 text-left text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                  序號
                </th>
                <th className="min-w-[80px] py-2.5 px-4 text-left text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                  姓名
                </th>
                <th className="min-w-[80px] py-2.5 px-4 text-left text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                  性別
                </th>
                <th className="min-w-[60px] py-2.5 px-4 text-left text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                  年齡
                </th>
                <th className="min-w-[120px] py-2.5 px-4 text-left text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                  分房
                </th>
                <th className="min-w-[80px] py-2.5 px-4 text-left text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                  狀態
                </th>
              </tr>
            </thead>
            <tbody>
              {membersWithRooms.map((member, index) => {
                const assignedRoom = member.assigned_room
                const roomIsFull = assignedRoom && isRoomFull(assignedRoom)

                return (
                  <tr key={member.id} className="hover:bg-morandi-container/10">
                    <td className="py-3 px-4 text-center border border-gray-300">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-morandi-primary border border-gray-300">
                      {member.name}
                    </td>
                    <td className="py-3 px-4 text-morandi-secondary border border-gray-300">
                      {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                    </td>
                    <td className="py-3 px-4 text-morandi-secondary border border-gray-300">
                      {(member.age ?? 0) > 0 ? `${member.age}歲` : '-'}
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <Select
                        value={member.assigned_room || ''}
                        onValueChange={value => assignMemberToRoom(member.id, value)}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="選擇房間" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">未分配</SelectItem>
                          {roomOptions.map(room => {
                            const isFull = isRoomFull(room.value)
                            const isCurrentRoom = member.assigned_room === room.value

                            return (
                              <SelectItem
                                key={room.value}
                                value={room.value}
                                disabled={isFull && !isCurrentRoom}
                                className={cn(isFull && !isCurrentRoom && 'text-gray-400')}
                              >
                                {room.label} ({room.currentCount}/{room.capacity})
                                {isFull && !isCurrentRoom && ' - 已滿'}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      {assignedRoom ? (
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                            roomIsFull ? 'bg-morandi-red text-white' : 'bg-morandi-green text-white'
                          )}
                        >
                          {roomIsFull ? '已滿房' : '已分房'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-morandi-container text-morandi-secondary">
                          未分房
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {membersWithRooms.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-morandi-secondary">
                    <Users size={32} className="mx-auto mb-4 opacity-50" />
                    <p>尚無團員資料</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 房間使用狀況 */}
      {roomOptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">房間使用狀況</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {roomOptions.map(room => {
              const occupants = membersWithRooms.filter(m => m.assigned_room === room.value)
              const isFull = occupants.length >= room.capacity

              return (
                <div
                  key={room.value}
                  className={cn(
                    'bg-card border rounded-lg p-4',
                    isFull ? 'border-morandi-red' : 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-morandi-primary">{room.label}</h4>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded',
                        isFull
                          ? 'bg-morandi-red text-white'
                          : 'bg-morandi-container text-morandi-secondary'
                      )}
                    >
                      {occupants.length}/{room.capacity}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {occupants.map(member => (
                      <div key={member.id} className="text-sm text-morandi-primary">
                        • {member.name}
                      </div>
                    ))}

                    {occupants.length === 0 && (
                      <div className="text-sm text-morandi-secondary">空房</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {roomOptions.length === 0 && (
        <div className="text-center py-12 text-morandi-secondary">
          <Bed size={24} className="mx-auto mb-4 opacity-50" />
          <p>尚未找到住宿配額</p>
          <p className="text-sm mt-2">請檢查該旅遊團是否有住宿相關的請款單</p>
        </div>
      )}
    </div>
  )
}
