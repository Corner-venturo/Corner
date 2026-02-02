/**
 * SupplierDispatchPage - 供應商派單管理
 *
 * 顯示已確認的需求，可派給司機
 */

'use client'

import React, { useState, useEffect } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, type TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Truck,
  User,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ConfirmedRequest {
  id: string
  request_code: string
  tour_code: string | null
  tour_name: string | null
  category: string
  service_date: string
  title: string
  quantity: number
  notes: string | null
  dispatch_status: 'pending' | 'assigned' | 'completed'
  assigned_driver_id: string | null
  assigned_driver_name: string | null
}

interface Driver {
  id: string
  name: string
  phone: string
  vehicle_plate: string | null
  vehicle_type: string | null
  status: string
}

const DISPATCH_STATUS_CONFIG = {
  pending: { label: '待派單', variant: 'outline' as const, icon: Clock },
  assigned: { label: '已派單', variant: 'secondary' as const, icon: Truck },
  completed: { label: '已完成', variant: 'default' as const, icon: CheckCircle2 },
}

export function SupplierDispatchPage() {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState<ConfirmedRequest[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ConfirmedRequest | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 載入已確認的需求（可派單）
  useEffect(() => {
    const loadData = async () => {
      if (!user?.workspace_id) return
      setIsLoading(true)

      try {
        // 載入已確認的需求（從 tour_requests 表）
        const { data: requestsData } = await supabase
          .from('tour_requests')
          .select(`
            id,
            code,
            tour_id,
            tour_code,
            tour_name,
            category,
            service_date,
            title,
            quantity,
            notes,
            response_status,
            reply_content,
            assigned_vehicle_id,
            assignee_name
          `)
          .eq('recipient_workspace_id', user.workspace_id)
          .eq('response_status', 'accepted')

        // 整理需求資料
        const confirmedRequests: ConfirmedRequest[] = (requestsData || []).map(r => {
          const replyContent = r.reply_content as { 
            driver_id?: string
            driver_name?: string
            dispatch_status?: string
          } | null

          return {
            id: r.id,
            request_code: r.code || '',
            tour_code: r.tour_code || null,
            tour_name: r.tour_name || null,
            category: r.category || 'other',
            service_date: r.service_date || '',
            title: r.title || '',
            quantity: r.quantity || 1,
            notes: r.notes || null,
            dispatch_status: (replyContent?.dispatch_status as 'pending' | 'assigned' | 'completed') || 'pending',
            assigned_driver_id: replyContent?.driver_id || r.assigned_vehicle_id || null,
            assigned_driver_name: replyContent?.driver_name || r.assignee_name || null,
          }
        })

        setRequests(confirmedRequests)

        // 載入司機列表
        const { data: driversData } = await supabase
          .from('supplier_employees')
          .select('id, name, phone, vehicle_plate, vehicle_type, is_active')
          .eq('supplier_id', user.workspace_id)
          .eq('role', 'driver')
          .eq('is_active', true)

        // 轉換為 Driver 格式
        const formattedDrivers: Driver[] = (driversData || []).map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone || '',
          vehicle_plate: d.vehicle_plate,
          vehicle_type: d.vehicle_type,
          status: d.is_active ? 'active' : 'inactive',
        }))
        setDrivers(formattedDrivers)
      } catch (error) {
        console.error('載入資料失敗:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.workspace_id])

  // 派單給司機
  const handleAssign = async () => {
    if (!selectedRequest || !selectedDriverId) return

    setIsAssigning(true)
    try {
      const driver = drivers.find(d => d.id === selectedDriverId)
      
      // 取得現有 reply_content 並更新
      const { data: currentData } = await supabase
        .from('tour_requests')
        .select('reply_content')
        .eq('id', selectedRequest.id)
        .single()

      const existingContent = (currentData?.reply_content || {}) as Record<string, unknown>
      
      // 更新 reply_content 和 assignee_name（保留現有資料）
      const { error } = await supabase
        .from('tour_requests')
        .update({
          assigned_vehicle_id: selectedDriverId,
          assignee_name: driver?.name || '',
          reply_content: {
            ...existingContent,
            driver_id: selectedDriverId,
            driver_name: driver?.name || '',
            dispatch_status: 'assigned',
            assigned_at: new Date().toISOString(),
          },
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      // 更新本地狀態
      setRequests(prev =>
        prev.map(r =>
          r.id === selectedRequest.id
            ? {
                ...r,
                dispatch_status: 'assigned',
                assigned_driver_id: selectedDriverId,
                assigned_driver_name: driver?.name || null,
              }
            : r
        )
      )

      setSelectedRequest(null)
      setSelectedDriverId('')
    } catch (error) {
      console.error('派單失敗:', error)
      alert('派單失敗，請稍後再試')
    } finally {
      setIsAssigning(false)
    }
  }

  // 過濾需求
  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true
    return r.dispatch_status === filterStatus
  })

  // 表格欄位
  const columns: TableColumn<ConfirmedRequest>[] = [
    {
      key: 'service_date',
      label: '服務日期',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-morandi-secondary" />
          <span>{row.service_date ? format(new Date(row.service_date), 'MM/dd (EEE)', { locale: zhTW }) : '-'}</span>
        </div>
      ),
    },
    {
      key: 'tour_code',
      label: '團號',
      width: '120px',
      render: (_, row) => (
        <span className="font-mono text-sm">{row.tour_code || '-'}</span>
      ),
    },
    {
      key: 'title',
      label: '服務內容',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.title}</div>
          {row.notes && (
            <div className="text-xs text-morandi-secondary mt-1 truncate max-w-[200px]">
              {row.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: '數量',
      width: '80px',
      render: (_, row) => <span>{row.quantity} 台</span>,
    },
    {
      key: 'dispatch_status',
      label: '派單狀態',
      width: '100px',
      render: (_, row) => {
        const config = DISPATCH_STATUS_CONFIG[row.dispatch_status]
        const Icon = config.icon
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        )
      },
    },
    {
      key: 'assigned_driver_name',
      label: '指派司機',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.assigned_driver_name ? (
            <>
              <User className="h-4 w-4 text-morandi-green" />
              <span>{row.assigned_driver_name}</span>
            </>
          ) : (
            <span className="text-morandi-secondary">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '100px',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedRequest(row)}
          disabled={row.dispatch_status === 'completed'}
        >
          {row.dispatch_status === 'pending' ? '派單' : '修改'}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="派單管理"
        icon={Truck}
      />

      {/* 篩選器 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-morandi-secondary">狀態：</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待派單</SelectItem>
              <SelectItem value="assigned">已派單</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <div className="text-sm text-morandi-secondary">
          共 {filteredRequests.length} 筆需求
        </div>
      </div>

      {/* 需求表格 */}
      <EnhancedTable
        data={filteredRequests}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="目前沒有需要派單的需求"
      />

      {/* 派單對話框 */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>指派司機</DialogTitle>
            <DialogDescription>
              將此需求派給司機執行
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* 需求資訊 */}
              <div className="p-4 bg-morandi-bg rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-morandi-secondary" />
                  <span>
                    {selectedRequest.service_date 
                      ? format(new Date(selectedRequest.service_date), 'yyyy/MM/dd (EEE)', { locale: zhTW })
                      : '-'}
                  </span>
                </div>
                <div className="font-medium">{selectedRequest.title}</div>
                {selectedRequest.tour_code && (
                  <div className="text-sm text-morandi-secondary">
                    團號：{selectedRequest.tour_code}
                  </div>
                )}
              </div>

              {/* 司機選擇 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">選擇司機</label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇司機" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{driver.name}</span>
                          {driver.vehicle_plate && (
                            <span className="text-xs text-morandi-secondary">
                              ({driver.vehicle_plate})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {drivers.length === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-morandi-gold/10 rounded text-sm">
                    <AlertCircle className="h-4 w-4 text-morandi-gold" />
                    <span>尚未建立司機資料，請先到車隊管理新增司機</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              取消
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDriverId || isAssigning}
            >
              {isAssigning ? '派單中...' : '確認派單'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
