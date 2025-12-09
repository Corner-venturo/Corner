'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = supabaseClient as any
import { Tour } from '@/types/tour.types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, GripVertical, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TourHandoverPrint } from './tour-handover-print'

interface OrderMember {
  id: string
  order_id: string
  chinese_name: string | null
  passport_name: string | null
  birth_date: string | null
  gender: string | null
  id_number: string | null
  passport_number: string | null
  passport_expiry: string | null
  special_meal: string | null
  pnr: string | null
}

// 訂單編號對應表
type OrderCodeMap = Record<string, string>

interface MemberFieldValue {
  [memberId: string]: {
    [fieldName: string]: string
  }
}

interface TourMembersAdvancedProps {
  tour: Tour
}

// 拖曳行組件
function SortableRow({
  member,
  index,
  customFields,
  getFieldValue,
  updateFieldValue,
  isDragMode,
  orderCode
}: {
  member: OrderMember
  index: number
  customFields: string[]
  getFieldValue: (memberId: string, fieldName: string) => string
  updateFieldValue: (memberId: string, fieldName: string, value: string) => void
  isDragMode: boolean
  orderCode: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-morandi-gold/10 hover:bg-morandi-container/10 ${
        index % 2 === 0 ? 'bg-blue-50/30' : 'bg-green-50/30'
      } ${isDragging ? 'z-50' : ''}`}
    >
      {/* 拖曳手把 */}
      {isDragMode && (
        <td className="px-2 py-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical size={16} className="text-morandi-text-light" />
        </td>
      )}

      <td className="px-3 py-2 text-xs text-morandi-text-light">
        {orderCode || '-'}
      </td>
      <td className="px-3 py-2">{member.chinese_name || '-'}</td>
      <td className="px-3 py-2">{member.passport_name || '-'}</td>
      <td className="px-3 py-2 text-xs">{member.birth_date || '-'}</td>
      <td className="px-3 py-2 text-center">
        {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
      </td>
      <td className="px-3 py-2">{member.passport_number || '-'}</td>
      <td className="px-3 py-2 text-xs">{member.special_meal || '-'}</td>
      {customFields.map(field => (
        <td key={field} className="px-3 py-2 bg-white">
          <input
            type="text"
            value={getFieldValue(member.id, field)}
            onChange={e => updateFieldValue(member.id, field, e.target.value)}
            className="w-full bg-transparent text-xs border-none outline-none focus:bg-morandi-container/20 px-2 py-1 rounded"
            placeholder="-"
            disabled={isDragMode}
          />
        </td>
      ))}
    </tr>
  )
}

export function TourMembersAdvanced({ tour }: TourMembersAdvancedProps) {
  const [members, setMembers] = useState<OrderMember[]>([])
  const [orderCodes, setOrderCodes] = useState<OrderCodeMap>({})
  const [customFields, setCustomFields] = useState<string[]>([])
  const [fieldValues, setFieldValues] = useState<MemberFieldValue>({})
  const [loading, setLoading] = useState(true)
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [isDragMode, setIsDragMode] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // 拖曳感應器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 載入團員資料
  useEffect(() => {
    loadMembers()
  }, [tour.id])

  const loadMembers = async () => {
    try {
      // 1. 找出所有屬於這個團的訂單（包含 order_number）
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('tour_id', tour.id)

      if (ordersError) throw ordersError

      const orderIds = orders?.map((o: { id: string }) => o.id) || []

      // 建立 order_id -> order_number 對應表
      const codeMap: OrderCodeMap = {}
      orders?.forEach((o: { id: string; order_number: string | null }) => {
        codeMap[o.id] = o.order_number || '-'
      })
      setOrderCodes(codeMap)

      if (orderIds.length === 0) {
        setMembers([])
        setLoading(false)
        return
      }

      // 2. 抓取這些訂單的所有團員
      const { data: membersData, error: membersError } = await supabase
        .from('order_members')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: true })

      if (membersError) throw membersError

      setMembers((membersData || []) as unknown as OrderMember[])

      // 3. 載入已建立的動態欄位
      await loadCustomFields()

      // 4. 載入動態欄位的值
      await loadFieldValues()
    } catch (error) {
      logger.error('載入團員失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_member_fields')
        .select('field_name')
        .eq('tour_id', tour.id)

      if (error) throw error

      // 取得所有不重複的欄位名稱
      const fieldData = data as Array<{ field_name: string }> | null
      const uniqueFields = [...new Set(fieldData?.map(d => d.field_name) || [])]
      setCustomFields(uniqueFields)
    } catch (error) {
      logger.error('載入自訂欄位失敗:', error)
    }
  }

  const loadFieldValues = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_member_fields')
        .select('*')
        .eq('tour_id', tour.id)

      if (error) throw error

      // 組織成 { memberId: { fieldName: value } } 結構
      const values: MemberFieldValue = {}
      const fieldData = data as Array<{
        order_member_id: string
        field_name: string
        field_value: string | null
      }> | null

      fieldData?.forEach(item => {
        if (!values[item.order_member_id]) {
          values[item.order_member_id] = {}
        }
        values[item.order_member_id][item.field_name] = item.field_value || ''
      })

      setFieldValues(values)
    } catch (error) {
      logger.error('載入欄位值失敗:', error)
    }
  }

  // 新增自訂欄位
  const handleAddField = async () => {
    if (!newFieldName.trim()) {
      toast.error('請輸入欄位名稱')
      return
    }

    if (customFields.includes(newFieldName.trim())) {
      toast.error('欄位名稱已存在')
      return
    }

    setCustomFields([...customFields, newFieldName.trim()])
    setNewFieldName('')
    setShowAddFieldDialog(false)
    toast.success(`已新增欄位：${newFieldName.trim()}`)
  }

  // 刪除自訂欄位
  const handleDeleteField = async (fieldName: string) => {
    const confirmed = await confirm(`確定要刪除「${fieldName}」欄位嗎？所有資料將一併刪除。`, {
      title: '刪除欄位',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    try {
      // 刪除資料庫中的所有該欄位資料
      const { error } = await supabase
        .from('tour_member_fields')
        .delete()
        .eq('tour_id', tour.id)
        .eq('field_name', fieldName)

      if (error) throw error

      // 更新本地狀態
      setCustomFields(customFields.filter(f => f !== fieldName))

      // 清除欄位值
      const newFieldValues = { ...fieldValues }
      Object.keys(newFieldValues).forEach(memberId => {
        delete newFieldValues[memberId][fieldName]
      })
      setFieldValues(newFieldValues)

      toast.success(`已刪除欄位：${fieldName}`)
    } catch (error) {
      logger.error('刪除欄位失敗:', error)
      toast.error('刪除欄位失敗')
    }
  }

  // 更新動態欄位值
  const updateFieldValue = async (memberId: string, fieldName: string, value: string) => {
    // 立即更新本地狀態
    setFieldValues(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [fieldName]: value
      }
    }))

    try {
      // Upsert 到資料庫
      const { error } = await supabase
        .from('tour_member_fields')
        .upsert({
          tour_id: tour.id,
          order_member_id: memberId,
          field_name: fieldName,
          field_value: value,
          display_order: 0
        }, {
          onConflict: 'tour_id,order_member_id,field_name'
        })

      if (error) throw error
    } catch (error) {
      logger.error('更新欄位值失敗:', error)
      // 失敗時重新載入
      loadFieldValues()
    }
  }

  // 取得欄位值
  const getFieldValue = (memberId: string, fieldName: string): string => {
    return fieldValues[memberId]?.[fieldName] || ''
  }

  // 拖曳結束處理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setMembers(items => {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)

      return arrayMove(items, oldIndex, newIndex)
    })

    toast.success('順序已更新')
  }

  if (loading) {
    return <div className="p-6 text-center">載入中...</div>
  }

  if (members.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-morandi-secondary mb-4">目前沒有團員</p>
        <p className="text-sm text-morandi-text-light">請先在「訂單管理」中新增訂單和團員</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具列 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-morandi-gold/20">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-morandi-primary">
            團員名單總覽 ({members.length} 人)
          </h2>
          {isDragMode && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              拖曳模式
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isDragMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsDragMode(!isDragMode)}
          >
            {isDragMode ? '完成排序' : '排序模式'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddFieldDialog(true)}
          >
            <Plus size={16} className="mr-1" />
            新增欄位
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrintPreview(true)}
          >
            <Printer size={16} className="mr-1" />
            列印交接單
          </Button>
        </div>
      </div>

      {/* 團員列表 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-morandi-gold/20 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-morandi-container/30 border-b border-morandi-gold/20">
                  {isDragMode && <th className="w-10"></th>}
                  <th className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs w-24">訂單</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs">中文姓名</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs">護照拼音</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs">生日</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs w-16">性別</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs">護照號碼</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs">特殊餐食</th>
                  {customFields.map(field => (
                    <th key={field} className="px-3 py-2 text-left font-medium text-morandi-secondary text-xs bg-morandi-gold/10 relative group">
                      <div className="flex items-center justify-between gap-2">
                        <span>{field}</span>
                        {!isDragMode && (
                          <button
                            onClick={() => handleDeleteField(field)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                            title="刪除欄位"
                          >
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <SortableContext items={members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {members.map((member, index) => (
                    <SortableRow
                      key={member.id}
                      member={member}
                      index={index}
                      customFields={customFields}
                      getFieldValue={getFieldValue}
                      updateFieldValue={updateFieldValue}
                      isDragMode={isDragMode}
                      orderCode={orderCodes[member.order_id] || '-'}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* 新增欄位 Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增自訂欄位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                欄位名稱
              </label>
              <Input
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                placeholder="例如：分車、分房、分桌"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddField()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddFieldDialog(false)
                  setNewFieldName('')
                }}
              >
                取消
              </Button>
              <Button onClick={handleAddField}>
                確定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 列印預覽 Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
          <div className="no-print flex items-center justify-between mb-4">
            <DialogHeader>
              <DialogTitle>列印預覽 - 職務交辦單</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPrintPreview(false)}
              >
                關閉
              </Button>
              <Button
                onClick={() => window.print()}
              >
                <Printer size={16} className="mr-1" />
                列印
              </Button>
            </div>
          </div>
          <TourHandoverPrint
            tour={tour}
            members={members as unknown as Parameters<typeof TourHandoverPrint>[0]['members']}
            customFields={customFields}
            fieldValues={fieldValues}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
