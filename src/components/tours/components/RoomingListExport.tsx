'use client'

/**
 * RoomingListExport - 分房總表輸出元件
 * 輸出給飯店的分房表格（PDF/列印）
 */

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Printer, Download } from 'lucide-react'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'
import type { OrderMember } from '@/components/orders/order-member.types'

interface RoomingListExportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourCode: string
  tourName: string
  departureDate: string
  returnDate: string
  rooms: TourRoomStatus[]
  assignments: TourRoomAssignment[]
  members: Pick<OrderMember, 'id' | 'chinese_name' | 'passport_name'>[]
}

interface HotelGroup {
  hotelName: string
  checkIn: string
  checkOut: string
  nights: number[]
  rooms: {
    roomNumber: number
    roomType: string
    bookingCode: string | null
    guests: { chineseName: string; passportName: string }[]
  }[]
}

export function RoomingListExport({
  open,
  onOpenChange,
  tourCode,
  tourName,
  departureDate,
  returnDate,
  rooms,
  assignments,
  members,
}: RoomingListExportProps) {
  
  // 將房間按飯店分組，連續入住合併
  const hotelGroups = useMemo(() => {
    const groups: HotelGroup[] = []
    
    // 先按 night_number 排序房間
    const sortedRooms = [...rooms].sort((a, b) => a.night_number - b.night_number)
    
    // 找出所有飯店名稱和對應的晚數
    const hotelNights = new Map<string, number[]>()
    sortedRooms.forEach(room => {
      const hotel = room.hotel_name || '未指定飯店'
      if (!hotelNights.has(hotel)) {
        hotelNights.set(hotel, [])
      }
      const nights = hotelNights.get(hotel)!
      if (!nights.includes(room.night_number)) {
        nights.push(room.night_number)
      }
    })
    
    // 合併連續入住的飯店
    const processedHotels = new Set<string>()
    
    hotelNights.forEach((nights, hotelName) => {
      if (processedHotels.has(hotelName)) return
      processedHotels.add(hotelName)
      
      // 計算入住和退房日期
      const sortedNights = nights.sort((a, b) => a - b)
      const checkInDate = new Date(departureDate)
      checkInDate.setDate(checkInDate.getDate() + sortedNights[0] - 1)
      const checkOutDate = new Date(departureDate)
      checkOutDate.setDate(checkOutDate.getDate() + sortedNights[sortedNights.length - 1])
      
      // 取得該飯店的所有房間（取第一晚的房間設定）
      const hotelRooms = sortedRooms.filter(
        r => (r.hotel_name || '未指定飯店') === hotelName && r.night_number === sortedNights[0]
      )
      
      const roomsWithGuests = hotelRooms.map((room, idx) => {
        const roomAssignments = assignments.filter(a => a.room_id === room.id)
        const guests = roomAssignments.map(a => {
          const member = members.find(m => m.id === a.order_member_id)
          return {
            chineseName: member?.chinese_name || '',
            passportName: member?.passport_name || '',
          }
        })
        
        return {
          roomNumber: idx + 1,
          roomType: room.room_type,
          bookingCode: room.booking_code,
          guests,
        }
      })
      
      groups.push({
        hotelName,
        checkIn: checkInDate.toLocaleDateString('zh-TW'),
        checkOut: checkOutDate.toLocaleDateString('zh-TW'),
        nights: sortedNights,
        rooms: roomsWithGuests,
      })
    })
    
    return groups
  }, [rooms, assignments, members, departureDate])
  
  // 房型中英文對照
  const roomTypeLabels: Record<string, string> = {
    single: '單人房 Single',
    double: '雙人房 Double',
    twin: '雙床房 Twin',
    triple: '三人房 Triple',
    quad: '四人房 Quad',
    suite: '套房 Suite',
  }
  
  // 列印功能
  const handlePrint = () => {
    const printContent = hotelGroups.map(group => `
      <div class="hotel-page">
        <div class="header">
          <h1>分房總表 / Rooming List</h1>
          <div class="tour-info">
            <p><strong>團號 Tour Code:</strong> ${tourCode}</p>
            <p><strong>團名 Tour Name:</strong> ${tourName}</p>
          </div>
        </div>
        
        <div class="hotel-section">
          <div class="hotel-header">
            <h2>🏨 ${group.hotelName}</h2>
            <p>入住 Check-in: ${group.checkIn} ─ 退房 Check-out: ${group.checkOut}</p>
          </div>
          
          <table class="room-table">
            <thead>
              <tr>
                <th style="width: 50px">#</th>
                <th style="width: 120px">房型 Room Type</th>
                <th style="width: 150px">訂房代號 Booking Ref.</th>
                <th>住客 Guests</th>
              </tr>
            </thead>
            <tbody>
              ${group.rooms.map(room => `
                <tr>
                  <td class="center">${room.roomNumber}</td>
                  <td>${roomTypeLabels[room.roomType] || room.roomType}</td>
                  <td>${room.bookingCode || '-'}</td>
                  <td>
                    ${room.guests.map(g => `
                      <div class="guest-row">
                        <span class="passport-name">${g.passportName || '-'}</span>
                        <span class="chinese-name">${g.chineseName ? `(${g.chineseName})` : ''}</span>
                      </div>
                    `).join('')}
                    ${room.guests.length === 0 ? '<span class="empty">（空房）</span>' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            共 ${group.rooms.length} 間房 / ${group.rooms.reduce((sum, r) => sum + r.guests.length, 0)} 人
          </div>
        </div>
      </div>
    `).join('<div class="page-break"></div>')
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>分房總表 - ${tourCode}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px;
            color: #333;
          }
          .hotel-page { padding: 20px 0; }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .header h1 { 
            font-size: 24px; 
            margin-bottom: 15px;
          }
          .tour-info p { margin: 5px 0; font-size: 14px; }
          .hotel-section { margin-top: 20px; }
          .hotel-header { 
            background: #f5f5f5; 
            padding: 15px; 
            margin-bottom: 15px;
            border-radius: 8px;
          }
          .hotel-header h2 { font-size: 18px; margin-bottom: 5px; }
          .hotel-header p { font-size: 14px; color: #666; }
          .room-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px;
          }
          .room-table th, .room-table td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: left;
            vertical-align: top;
          }
          .room-table th { 
            background: #f9f9f9; 
            font-weight: 600;
            font-size: 13px;
          }
          .room-table td { font-size: 14px; }
          .room-table .center { text-align: center; }
          .guest-row { 
            padding: 3px 0;
            border-bottom: 1px dotted #eee;
          }
          .guest-row:last-child { border-bottom: none; }
          .passport-name { font-weight: 500; }
          .chinese-name { color: #666; font-size: 12px; margin-left: 8px; }
          .empty { color: #999; font-style: italic; }
          .summary { 
            text-align: right; 
            font-size: 14px; 
            color: #666;
            padding: 10px 0;
          }
          .page-break { page-break-after: always; }
          @media print {
            body { padding: 0; }
            .hotel-page { padding: 10px 0; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            分房總表預覽
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 預覽區域 */}
          <div className="border rounded-lg p-6 bg-white">
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
              <h1 className="text-xl font-bold mb-3">分房總表 / Rooming List</h1>
              <p className="text-sm"><strong>團號:</strong> {tourCode}</p>
              <p className="text-sm"><strong>團名:</strong> {tourName}</p>
            </div>
            
            {hotelGroups.map((group, idx) => (
              <div key={idx} className="mb-8">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <h2 className="text-lg font-semibold">🏨 {group.hotelName}</h2>
                  <p className="text-sm text-gray-600">
                    入住: {group.checkIn} ─ 退房: {group.checkOut}
                  </p>
                </div>
                
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 w-12 text-center">#</th>
                      <th className="border p-2 w-28">房型</th>
                      <th className="border p-2 w-36">訂房代號</th>
                      <th className="border p-2">住客</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rooms.map(room => (
                      <tr key={room.roomNumber}>
                        <td className="border p-2 text-center">{room.roomNumber}</td>
                        <td className="border p-2">{roomTypeLabels[room.roomType] || room.roomType}</td>
                        <td className="border p-2">{room.bookingCode || '-'}</td>
                        <td className="border p-2">
                          {room.guests.map((g, i) => (
                            <div key={i} className="py-1 border-b border-dotted last:border-0">
                              <span className="font-medium">{g.passportName || '-'}</span>
                              {g.chineseName && (
                                <span className="text-gray-500 text-xs ml-2">({g.chineseName})</span>
                              )}
                            </div>
                          ))}
                          {room.guests.length === 0 && (
                            <span className="text-gray-400 italic">（空房）</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <p className="text-right text-sm text-gray-600 mt-2">
                  共 {group.rooms.length} 間房 / {group.rooms.reduce((sum, r) => sum + r.guests.length, 0)} 人
                </p>
              </div>
            ))}
          </div>
          
          {/* 操作按鈕 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              列印 / 輸出 PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
