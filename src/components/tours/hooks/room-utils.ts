// Helper: Generate UUID with fallback for older browsers
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 計算房間編號
export function calculateRoomNumbers(
  rooms: Array<{ id: string; hotel_name: string | null; room_type: string }>
): Record<string, number> {
  const roomCounters: Record<string, number> = {}
  const roomNumbers: Record<string, number> = {}

  rooms.forEach(room => {
    const roomKey = `${room.hotel_name || ''}_${room.room_type}`
    if (!roomCounters[roomKey]) {
      roomCounters[roomKey] = 1
    }
    roomNumbers[room.id] = roomCounters[roomKey]++
  })

  return roomNumbers
}

// 生成房間顯示名稱
export function getRoomDisplayName(
  room: { hotel_name: string | null; room_type: string },
  roomNumber: number,
  typeLabel: string
): string {
  return room.hotel_name
    ? `${room.hotel_name}${typeLabel} ${roomNumber}`
    : `${typeLabel} ${roomNumber}`
}

// 生成房型Key (用於分類篩選)
export function getRoomTypeKey(room: { hotel_name: string | null; room_type: string }): string {
  return room.hotel_name
    ? `${room.hotel_name}_${room.room_type}`
    : room.room_type
}
