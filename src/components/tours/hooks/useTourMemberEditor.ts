'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'
import { Tour } from '@/stores/types'
import { useOrders, useMembers, createMember, updateMember, deleteMember } from '@/data'
import { getGenderFromIdNumber, calculateAge } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { confirm } from '@/lib/ui/alert-dialog'

export interface EditingMember {
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
}

export interface EditingCell {
  rowIndex: number
  field: keyof EditingMember
}

export interface EntryCardSettings {
  flightNumber: string
  hotelName: string
  hotelAddress: string
  hotelPhone: string
  stayDays: number
}

export function useTourMemberEditor(
  tour: Tour,
  orderFilter?: string,
  triggerAdd?: boolean,
  onTriggerAddComplete?: () => void
) {
  const { items: orders } = useOrders()
  const { items: members } = useMembers()

  const [tableMembers, setTableMembers] = useState<EditingMember[]>([])
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [draggedRow, setDraggedRow] = useState<number | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({})
  const [showEntryCardDialog, setShowEntryCardDialog] = useState(false)
  const [entryCardSettings, setEntryCardSettings] = useState<EntryCardSettings>({
    flightNumber: '',
    hotelName: '',
    hotelAddress: '',
    hotelPhone: '',
    stayDays: 5,
  })

  const editableFields: (keyof EditingMember)[] = [
    'name',
    'nameEn',
    'birthday',
    'gender',
    'idNumber',
    'passportNumber',
    'passportExpiry',
  ]

  const tourOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      if (orderFilter) {
        return order.id === orderFilter
      }
      return order.tour_id === tour.id
    })
    return filtered
  }, [orders, tour.id, orderFilter])

  useEffect(() => {
    const handleOpenEntryCard = (e: CustomEvent<{ tourId: string }>) => {
      if (e.detail.tourId === tour.id) {
        setShowEntryCardDialog(true)
      }
    }
    window.addEventListener('openEntryCardDialog', handleOpenEntryCard as EventListener)
    return () => {
      window.removeEventListener('openEntryCardDialog', handleOpenEntryCard as EventListener)
    }
  }, [tour.id])

  const getRoomTypeLabel = (roomType: string): string => {
    const labels: Record<string, string> = {
      single: '單人房',
      double: '雙人房',
      triple: '三人房',
      quad: '四人房',
      suite: '套房',
    }
    return labels[roomType] || roomType
  }

  const loadRoomAssignments = useCallback(async () => {
    if (!tour.id) return

    try {
      const { data: rooms } = await supabase
        .from('tour_rooms')
        .select('id, room_type, hotel_name, room_number')
        .eq('tour_id', tour.id)

      if (!rooms || rooms.length === 0) return

      const roomIds = rooms.map((r: { id: string }) => r.id)
      const { data: assignments } = await supabase
        .from('tour_room_assignments')
        .select('room_id, order_member_id')
        .in('room_id', roomIds)

      if (!assignments || assignments.length === 0) return

      const roomMap: Record<
        string,
        { room_type: string; hotel_name: string | null; room_number: string | null }
      > = {}
      rooms.forEach(
        (room: { id: string; room_type: string; hotel_name: string | null; room_number: string | null }) => {
          roomMap[room.id] = {
            room_type: room.room_type,
            hotel_name: room.hotel_name,
            room_number: room.room_number,
          }
        }
      )

      const roomCounters: Record<string, number> = {}
      const roomNumbers: Record<string, number> = {}
      rooms.forEach((room: { id: string; room_type: string; hotel_name: string | null }) => {
        const hotelName = room.hotel_name || ''
        const roomKey = hotelName + '_' + room.room_type
        if (!roomCounters[roomKey]) {
          roomCounters[roomKey] = 1
        }
        roomNumbers[room.id] = roomCounters[roomKey]++
      })

      const assignmentMap: Record<string, string> = {}
      assignments.forEach((a: { room_id: string; order_member_id: string }) => {
        const room = roomMap[a.room_id]
        if (room) {
          const roomTypeLabel = getRoomTypeLabel(room.room_type)
          const variant = room.hotel_name ? room.hotel_name + ' ' : ''
          const roomNum = roomNumbers[a.room_id] || 1
          assignmentMap[a.order_member_id] = variant + roomTypeLabel + ' ' + roomNum
        }
      })

      setRoomAssignments(assignmentMap)
    } catch (err) {
      logger.error('載入房間分配失敗:', err)
    }
  }, [tour.id])

  useEffect(() => {
    loadRoomAssignments()
  }, [loadRoomAssignments])

  useEffect(() => {
    const allTourMembers = members
      .filter(member => tourOrders.some(order => order.id === member.order_id))
      .map(member => {
        const relatedOrder = tourOrders.find(order => order.id === member.order_id)
        return {
          ...member,
          nameEn: member.name_en || '',
          passportNumber: member.passport_number || '',
          passportExpiry: member.passport_expiry || '',
          idNumber: member.id_number || '',
          order_number: relatedOrder?.order_number || '',
          contact_person: relatedOrder?.contact_person || '',
          assignedRoom: member.assigned_room,
        } as unknown as EditingMember
      })

    setTableMembers(allTourMembers)
  }, [members, tourOrders])

  useEffect(() => {
    if (triggerAdd && tourOrders.length > 0) {
      const firstOrder = tourOrders[0]
      const newMember: EditingMember = {
        order_id: firstOrder.id,
        name: '',
        nameEn: '',
        birthday: '',
        passportNumber: '',
        passportExpiry: '',
        idNumber: '',
        gender: '',
        age: 0,
        isNew: true,
        order_number: firstOrder.order_number ?? undefined,
        contact_person: firstOrder.contact_person ?? undefined,
      }
      setTableMembers([...tableMembers, newMember])
      onTriggerAddComplete?.()
    }
  }, [triggerAdd, tourOrders, onTriggerAddComplete])

  const startCellEdit = (rowIndex: number, field: keyof EditingMember) => {
    if (
      field === 'age' ||
      field === 'order_number' ||
      field === 'contact_person' ||
      field === 'assignedRoom'
    )
      return

    setEditingCell({ rowIndex, field })
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const updateCellValue = (value: string) => {
    if (!editingCell) return

    const { rowIndex, field } = editingCell
    const updatedMembers = [...tableMembers]
    const member = { ...updatedMembers[rowIndex] }

    if (field === 'idNumber') {
      member.idNumber = value.toUpperCase()
      if (!member.gender) {
        member.gender = getGenderFromIdNumber(value)
      }
    } else if (field === 'birthday') {
      member.birthday = value
      member.age = calculateAge(value, tour.departure_date, tour.return_date)
    } else if (field === 'gender') {
      if (value === '男' || value.toLowerCase() === 'm' || value === '1') {
        member.gender = 'M'
      } else if (value === '女' || value.toLowerCase() === 'f' || value === '2') {
        member.gender = 'F'
      } else {
        member.gender = ''
      }
    } else {
      const updatedMember = { ...member, [field]: value }
      updatedMembers[rowIndex] = updatedMember as EditingMember
      setTableMembers(updatedMembers)
      return
    }

    updatedMembers[rowIndex] = member
    setTableMembers(updatedMembers)
    autoSaveMember(member, rowIndex)
  }

  const autoSaveMember = async (member: EditingMember, index: number) => {
    if (member.isNew && member.name.trim()) {
      const {
        isNew,
        order_number,
        contact_person,
        assignedRoom,
        nameEn,
        passportNumber,
        passportExpiry,
        idNumber,
        ...restData
      } = member
      const convertedData = {
        ...restData,
        name_en: nameEn,
        passport_number: passportNumber,
        passport_expiry: passportExpiry,
        id_number: idNumber,
        assigned_room: assignedRoom,
      }

      const newMember = await createMember(convertedData as unknown as Parameters<typeof createMember>[0])

      const updatedMembers = [...tableMembers]
      updatedMembers[index] = { ...member, id: newMember.id, isNew: false }
      setTableMembers(updatedMembers)
    } else if (member.id && !member.isNew) {
      const {
        isNew,
        order_number,
        contact_person,
        assignedRoom,
        nameEn,
        passportNumber,
        passportExpiry,
        idNumber,
        ...restData
      } = member
      const convertedData = {
        ...restData,
        name_en: nameEn,
        passport_number: passportNumber,
        passport_expiry: passportExpiry,
        id_number: idNumber,
        assigned_room: assignedRoom,
      }

      await updateMember(member.id, convertedData as Parameters<typeof updateMember>[1])
    }
  }

  const deleteRow = async (index: number) => {
    const member = tableMembers[index]
    const memberName = member.name || member.nameEn || '此成員'

    const confirmed = await confirm('確定要刪除「' + memberName + '」嗎？', {
      title: '刪除成員',
      type: 'warning',
    })
    if (!confirmed) return

    if (member.id && !member.isNew) {
      deleteMember(member.id)
    }
    const updatedMembers = tableMembers.filter((_, i) => i !== index)
    setTableMembers(updatedMembers)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRow(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedRow === null) {
      return
    }

    if (draggedRow === dropIndex) {
      setDraggedRow(null)
      return
    }

    const newMembers = [...tableMembers]
    const draggedMember = newMembers[draggedRow]

    newMembers.splice(draggedRow, 1)
    newMembers.splice(dropIndex, 0, draggedMember)

    setTableMembers(newMembers)
    setDraggedRow(null)
  }

  const handleDragEnd = () => {
    setDraggedRow(null)
  }

  const totalMembers = tableMembers.length
  const completedMembers = tableMembers.filter(member => member.name && member.idNumber).length

  return {
    tableMembers,
    editingCell,
    draggedRow,
    isNavigating,
    inputRef,
    roomAssignments,
    showEntryCardDialog,
    entryCardSettings,
    editableFields,
    tourOrders,
    totalMembers,
    completedMembers,
    setEditingCell,
    setIsNavigating,
    setShowEntryCardDialog,
    setEntryCardSettings,
    startCellEdit,
    updateCellValue,
    deleteRow,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    getRoomTypeLabel,
  }
}
