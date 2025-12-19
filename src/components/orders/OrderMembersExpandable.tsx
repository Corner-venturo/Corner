'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Trash2, X, Hash, Upload, FileImage, Eye, FileText, AlertTriangle, Pencil, Check, ZoomIn, ZoomOut, RotateCcw, RotateCw, FlipHorizontal, Crop, RefreshCw, Save, Printer, Hotel, Bus, Coins, Plane, Home } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useImageEditor, useOcrRecognition } from '@/hooks'
import { formatPassportExpiryWithStatus } from '@/lib/utils/passport-expiry'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea' // Added for edit dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useCustomerStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { TourRoomManager } from '@/components/tours/tour-room-manager'
import { TourVehicleManager } from '@/components/tours/tour-vehicle-manager'
import { CustomerVerifyDialog } from '@/app/(main)/customers/components/CustomerVerifyDialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'


interface OrderMember {
  id: string
  order_id: string
  customer_id?: string | null
  identity?: string | null
  chinese_name?: string | null
  passport_name?: string | null
  birth_date?: string | null
  age?: number | null
  id_number?: string | null
  gender?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
  special_meal?: string | null
  pnr?: string | null
  flight_cost?: number | null
  hotel_1_name?: string | null
  hotel_1_checkin?: string | null
  hotel_1_checkout?: string | null
  hotel_2_name?: string | null
  hotel_2_checkin?: string | null
  hotel_2_checkout?: string | null
  hotel_confirmation?: string | null
  checked_in?: boolean | null
  checked_in_at?: string | null
  transport_cost?: number | null
  misc_cost?: number | null
  total_payable?: number | null
  deposit_amount?: number | null
  balance_amount?: number | null
  deposit_receipt_no?: string | null
  balance_receipt_no?: string | null
  remarks?: string | null
  cost_price?: number | null
  selling_price?: number | null
  profit?: number | null
  passport_image_url?: string | null
  // 關聯的顧客驗證狀態（從 join 查詢取得）
  customer_verification_status?: string | null
  order_code?: string | null  // 訂單編號（團體模式用）
}

// PDF 轉 JPG 需要的類型
interface ProcessedFile {
  file: File
  preview: string
  originalName: string
  isPdf: boolean
}

interface OrderMembersExpandableProps {
  orderId?: string  // 可選：單一訂單模式
  tourId: string
  workspaceId: string
  onClose?: () => void  // 團體模式時可能不需要關閉按鈕
  mode?: 'order' | 'tour'  // 'order' = 單一訂單, 'tour' = 團體模式（顯示旅遊團所有成員）
}

export function OrderMembersExpandable({
  orderId,
  tourId,
  workspaceId,
  onClose,
  mode: propMode,
}: OrderMembersExpandableProps) {
  // All state hooks are preserved
  const mode = propMode || (orderId ? 'order' : 'tour');
  const [members, setMembers] = useState<OrderMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [departureDate, setDepartureDate] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberCountToAdd, setMemberCountToAdd] = useState<number | ''>(1);
  const [showIdentityColumn, setShowIdentityColumn] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isAllEditMode, setIsAllEditMode] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    identity: false,
    chinese_name: true,
    passport_name: true,
    birth_date: true,
    gender: true,
    id_number: false,
    passport_number: true,
    passport_expiry: true,
    special_meal: true,
    hotel_confirmation: false,
    total_payable: false,
    deposit_amount: false,
    balance: false,
    remarks: false,
  });

  const { items: customers, fetchAll: fetchCustomers } = useCustomerStore();
  const [showCustomerMatchDialog, setShowCustomerMatchDialog] = useState(false);
  const [matchedCustomers, setMatchedCustomers] = useState<typeof customers>([]);
  const [matchType, setMatchType] = useState<'name' | 'id_number'>('name');
  const [pendingMemberIndex, setPendingMemberIndex] = useState<number | null>(null);
  const [pendingMemberData, setPendingMemberData] = useState<Partial<OrderMember> | null>(null);

  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [previewMember, setPreviewMember] = useState<OrderMember | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [editingMember, setEditingMember] = useState<OrderMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'verify' | 'edit'>('edit');
  const [editFormData, setEditFormData] = useState<Partial<OrderMember>>({});
  const [isSaving, setIsSaving] = useState(false);

  const imageEditor = useImageEditor();
  const { isRecognizing, recognizePassport } = useOcrRecognition();

  const [showRoomManager, setShowRoomManager] = useState(false);
  const [showVehicleManager, setShowVehicleManager] = useState(false);
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({});
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, string>>({});
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  interface CustomCostField {
    id: string;
    name: string;
    values: Record<string, string>;
  }
  const [customCostFields, setCustomCostFields] = useState<CustomCostField[]>([]);
  const [showAddCostFieldDialog, setShowAddCostFieldDialog] = useState(false);
  const [newCostFieldName, setNewCostFieldName] = useState('');

  const [showPnrColumn, setShowPnrColumn] = useState(false);
  const [showHotelColumn, setShowHotelColumn] = useState(false);

  const editableFields = showIdentityColumn
    ? ['identity', 'chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal']
    : ['chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal'];
  
  // All original functions are preserved here...
  const loadTourDepartureDate = async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('departure_date, return_date')
        .eq('id', tourId)
        .single()

      if (error) throw error
      setDepartureDate(data?.departure_date || null)
      setReturnDate(data?.return_date || null)
    } catch (error) {
      logger.error('載入出發日期失敗:', error)
    }
  }

  const loadRoomAssignments = async () => {
    if (!tourId) return
    try {
      const { data: rooms } = await supabase
        .from('tour_rooms')
        .select('id, room_number, room_type')
        .eq('tour_id', tourId)

      if (!rooms || rooms.length === 0) return

      const { data: assignments } = await supabase
        .from('tour_room_assignments')
        .select('order_member_id, room_id')
        .in('room_id', rooms.map(r => r.id))

      if (assignments) {
        const map: Record<string, string> = {}
        assignments.forEach(a => {
          const room = rooms.find(r => r.id === a.room_id)
          if (room) {
            map[a.order_member_id] = room.room_number || room.room_type || '已分房'
          }
        })
        setRoomAssignments(map)
      }
    } catch (error) {
      logger.error('載入分房資訊失敗:', error)
    }
  }

  const loadVehicleAssignments = async () => {
    if (!tourId) return
    try {
      const { data: vehicles } = await supabase
        .from('tour_vehicles')
        .select('id, vehicle_name, vehicle_type')
        .eq('tour_id', tourId)

      if (!vehicles || vehicles.length === 0) return

      const { data: assignments } = await supabase
        .from('tour_vehicle_assignments')
        .select('order_member_id, vehicle_id')
        .in('vehicle_id', vehicles.map(v => v.id))

      if (assignments) {
        const map: Record<string, string> = {}
        assignments.forEach(a => {
          const vehicle = vehicles.find(v => v.id === a.vehicle_id)
          if (vehicle) {
            map[a.order_member_id] = vehicle.vehicle_name || vehicle.vehicle_type || '已分車'
          }
        })
        setVehicleAssignments(map)
      }
    } catch (error) {
      logger.error('載入分車資訊失敗:', error)
    }
  }

  const loadCustomCostFields = async () => {
    if (!tourId) return
    try {
      const { data: fields, error: fieldsError } = await supabase
        .from('tour_custom_cost_fields')
        .select('id, field_name, display_order')
        .eq('tour_id', tourId)
        .order('display_order', { ascending: true })

      if (fieldsError) throw fieldsError
      if (!fields || fields.length === 0) {
        setCustomCostFields([])
        return
      }

      const { data: values, error: valuesError } = await supabase
        .from('tour_custom_cost_values')
        .select('field_id, member_id, value')
        .in('field_id', fields.map(f => f.id))

      if (valuesError) throw valuesError

      const formattedFields: CustomCostField[] = fields.map(field => {
        const fieldValues: Record<string, string> = {}
        values?.forEach(v => {
          if (v.field_id === field.id && v.member_id) {
            fieldValues[v.member_id] = v.value || ''
          }
        })
        return {
          id: field.id,
          name: field.field_name,
          values: fieldValues,
        }
      })

      setCustomCostFields(formattedFields)
    } catch (error) {
      logger.error('載入自訂費用欄位失敗:', error)
    }
  }

  const addCustomCostField = async (fieldName: string) => {
    if (!tourId || !fieldName.trim()) return
    try {
      const { data, error } = await supabase
        .from('tour_custom_cost_fields')
        .insert({
          tour_id: tourId,
          field_name: fieldName.trim(),
          display_order: customCostFields.length,
        })
        .select('id, field_name')
        .single()

      if (error) throw error
      if (data) {
        setCustomCostFields(prev => [
          ...prev,
          { id: data.id, name: data.field_name, values: {} },
        ])
      }
    } catch (error) {
      logger.error('新增自訂費用欄位失敗:', error)
    }
  }

  const deleteCustomCostField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('tour_custom_cost_fields')
        .delete()
        .eq('id', fieldId)

      if (error) throw error
      setCustomCostFields(prev => prev.filter(f => f.id !== fieldId))
    } catch (error) {
      logger.error('刪除自訂費用欄位失敗:', error)
    }
  }
  
  const updateCustomCostFieldValue = async (fieldId: string, memberId: string, value: string) => {
    setCustomCostFields(prev => prev.map(f =>
      f.id === fieldId
        ? { ...f, values: { ...f.values, [memberId]: value } }
        : f
    ));
    try {
      const { error } = await supabase
        .from('tour_custom_cost_values')
        .upsert({
          field_id: fieldId,
          member_id: memberId,
          value: value,
        }, {
          onConflict: 'field_id,member_id',
        })
      if (error) throw error
    } catch (error) {
      logger.error('更新自訂費用欄位值失敗:', error)
    }
  }

  const loadMembers = async () => {
    setLoading(true);
    try {
      let membersData: OrderMember[] = [];
      let orderCodeMap: Record<string, string> = {};

      if (mode === 'tour') {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: true });

        if (ordersError) throw ordersError;

        if (ordersData && ordersData.length > 0) {
          setOrderCount(ordersData.length);
          orderCodeMap = Object.fromEntries(
            ordersData.map(o => {
              const orderNum = o.order_number || '';
              const seqMatch = orderNum.match(/-(\d+)$/);
              return [o.id, seqMatch ? seqMatch[1] : orderNum];
            })
          );
          const orderIds = ordersData.map(o => o.id);

          const { data: allMembersData, error: membersError } = await supabase
            .from('order_members')
            .select('*')
            .in('order_id', orderIds)
            .order('created_at', { ascending: true });

          if (membersError) throw membersError;
          membersData = allMembersData || [];
        }
      } else if (orderId) {
        const { data, error: membersError } = await supabase
          .from('order_members')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });

        if (membersError) throw membersError;
        membersData = data || [];
      }

      const customerIds = membersData.map(m => m.customer_id).filter(Boolean) as string[];
      let customerStatusMap: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, verification_status')
          .in('id', customerIds);

        if (customersData) {
          customerStatusMap = Object.fromEntries(
            customersData.map(c => [c.id, c.verification_status || ''])
          );
        }
      }

      const membersWithStatus = membersData.map(m => ({
        ...m,
        customer_verification_status: m.customer_id ? customerStatusMap[m.customer_id] || null : null,
        order_code: mode === 'tour' ? orderCodeMap[m.order_id] || null : null,
      }));

      setMembers(membersWithStatus);
    } catch (error) {
      logger.error('載入成員失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    setIsAddDialogOpen(true);
  };

  const confirmAddMembers = async () => {
    const count = typeof memberCountToAdd === 'number' ? memberCountToAdd : 1;
    try {
      const newMembers = Array.from({ length: count }, () => ({
        order_id: orderId,
        workspace_id: workspaceId,
        member_type: 'adult',
        identity: '大人',
      }));
      const { data, error } = await supabase.from('order_members').insert(newMembers as any).select();
      if (error) throw error;
      setMembers([...members, ...(data || [])]);
      setIsAddDialogOpen(false);
      setMemberCountToAdd(1);
    } catch (error) {
      logger.error('新增成員失敗:', error);
      await alert('新增失敗', 'error');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const confirmed = await confirm('確定要刪除此成員嗎？', {
      title: '刪除成員',
      type: 'warning',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('order_members').delete().eq('id', memberId);
      if (error) throw error;
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      logger.error('刪除成員失敗:', error);
      await alert('刪除失敗', 'error');
    }
  };

  const openEditDialog = (member: OrderMember, mode: 'verify' | 'edit') => {
    setEditingMember(member);
    setEditMode(mode);
    setEditFormData({
      chinese_name: member.chinese_name || '',
      passport_name: member.passport_name || '',
      birth_date: member.birth_date || '',
      gender: member.gender || '',
      id_number: member.id_number || '',
      passport_number: member.passport_number || '',
      passport_expiry: member.passport_expiry || '',
      special_meal: member.special_meal || '',
      remarks: member.remarks || '',
    });
    imageEditor.reset();
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setIsSaving(true);
    try {
      const customerStore = useCustomerStore.getState();
      const memberUpdateData: Record<string, unknown> = {
        chinese_name: editFormData.chinese_name,
        passport_name: editFormData.passport_name,
        birth_date: editFormData.birth_date,
        gender: editFormData.gender,
        id_number: editFormData.id_number,
        passport_number: editFormData.passport_number,
        passport_expiry: editFormData.passport_expiry,
        special_meal: editFormData.special_meal,
        remarks: editFormData.remarks,
      };

      const { error: memberError } = await supabase.from('order_members').update(memberUpdateData).eq('id', editingMember.id);
      if (memberError) throw memberError;

      let newCustomerId: string | null = null;
      if (editingMember.customer_id) {
        const customerUpdateData: Record<string, unknown> = {
          name: editFormData.chinese_name,
          passport_romanization: editFormData.passport_name,
          date_of_birth: editFormData.birth_date,
          gender: editFormData.gender,
          national_id: editFormData.id_number,
          passport_number: editFormData.passport_number,
          passport_expiry_date: editFormData.passport_expiry,
        };
        customerUpdateData.verification_status = 'verified';

        const { error: customerError } = await supabase.from('customers').update(customerUpdateData).eq('id', editingMember.customer_id);
        if (customerError) {
          logger.error('更新顧客失敗:', customerError);
        } else {
          await customerStore.fetchAll();
        }
      } else if (editFormData.chinese_name || editFormData.passport_number || editFormData.id_number) {
        const passportNumber = editFormData.passport_number?.trim() || null;
        const idNumber = editFormData.id_number?.trim() || null;
        const birthDate = editFormData.birth_date || null;
        const cleanChineseName = editFormData.chinese_name?.replace(/\([^)]+\)$/, '').trim() || null;

        const existingCustomer = customers.find(c => {
          if (passportNumber && c.passport_number === passportNumber) return true;
          if (idNumber && c.national_id === idNumber) return true;
          if (cleanChineseName && birthDate && c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName && c.date_of_birth === birthDate) return true;
          return false;
        });

        if (existingCustomer) {
          newCustomerId = existingCustomer.id;
          await supabase.from('order_members').update({ customer_id: existingCustomer.id }).eq('id', editingMember.id);
          await supabase.from('customers').update({
            name: editFormData.chinese_name || existingCustomer.name,
            passport_romanization: editFormData.passport_name || existingCustomer.passport_romanization,
            date_of_birth: editFormData.birth_date || existingCustomer.date_of_birth,
            gender: editFormData.gender || existingCustomer.gender,
            national_id: editFormData.id_number || existingCustomer.national_id,
            passport_number: editFormData.passport_number || existingCustomer.passport_number,
            passport_expiry_date: editFormData.passport_expiry || existingCustomer.passport_expiry_date,
            verification_status: 'verified',
          }).eq('id', existingCustomer.id);
          logger.info(`✅ 已關聯現有顧客: ${existingCustomer.name}`);
        } else {
          const newCustomer = await customerStore.create({
            name: editFormData.chinese_name || '',
            passport_romanization: editFormData.passport_name || '',
            passport_number: passportNumber,
            passport_expiry_date: editFormData.passport_expiry || null,
            national_id: idNumber,
            date_of_birth: birthDate,
            gender: editFormData.gender || null,
            phone: '',
            is_vip: false,
            is_active: true,
            total_spent: 0,
            total_orders: 0,
            verification_status: 'verified',
          } as any);
          if (newCustomer) {
            newCustomerId = newCustomer.id;
            await supabase.from('order_members').update({ customer_id: newCustomer.id }).eq('id', editingMember.id);
            logger.info(`✅ 已建立新顧客: ${newCustomer.name}`);
          }
        }
        await customerStore.fetchAll();
      }
      setMembers(members.map(m =>
        m.id === editingMember.id
          ? {
              ...m,
              ...memberUpdateData,
              customer_id: newCustomerId || editingMember.customer_id,
              customer_verification_status: 'verified',
            }
          : m
      ));
      setIsEditDialogOpen(false);
      setEditingMember(null);
      void alert(editMode === 'verify' ? '驗證完成！' : '儲存成功！', 'success');
    } catch (error) {
      logger.error('儲存失敗:', error);
      void alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toHalfWidth = (str: string): string => {
    return str.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  };
  const updateLocalField = (memberId: string, field: keyof OrderMember, value: string | number) => {
    setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: value } : m)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, memberIndex: number, fieldName: string) => {
    if (e.nativeEvent.isComposing || isComposing) return;
    const currentFieldIndex = editableFields.indexOf(fieldName);

    if (fieldName === 'gender' && e.key === 'Enter') {
      e.preventDefault();
      const member = members[memberIndex];
      const currentGender = member.gender;
      const newGender = !currentGender ? 'M' : currentGender === 'M' ? 'F' : '';
      updateField(member.id, 'gender', newGender);
      return;
    }

    if (isAllEditMode && e.key === 'Enter') {
      e.preventDefault();
      const member = members[memberIndex];
      if (fieldName === 'chinese_name' && member) {
        handleEditModeNameEnter(member.id, memberIndex);
        return;
      }
      (e.target as HTMLInputElement).blur();
      return;
    }

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextMemberIndex = memberIndex + 1;
      if (nextMemberIndex < members.length) {
        const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevMemberIndex = memberIndex - 1;
      if (prevMemberIndex >= 0) {
        const prevInput = document.querySelector(`input[data-member="${members[prevMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement;
        prevInput?.focus();
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (currentFieldIndex < editableFields.length - 1) {
        const nextField = editableFields[currentFieldIndex + 1];
        const nextInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${nextField}"]`) as HTMLInputElement;
        nextInput?.focus();
      } else {
        const nextMemberIndex = memberIndex + 1;
        if (nextMemberIndex < members.length) {
          const firstField = editableFields[0];
          const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${firstField}"]`) as HTMLInputElement;
          nextInput?.focus();
        }
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      if (currentFieldIndex > 0) {
        const prevField = editableFields[currentFieldIndex - 1];
        const prevInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${prevField}"]`) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  };

  const updateField = async (memberId: string, field: keyof OrderMember, value: string | number) => {
    updateLocalField(memberId, field, value);
    if (isComposing) return;
    let processedValue: string | number | null = value;
    if (typeof value === 'string') {
      processedValue = toHalfWidth(value);
    }
    if (processedValue === '' && (field.includes('date') || field.includes('expiry'))) {
      processedValue = null;
    }
    try {
      const { error } = await supabase.from('order_members').update({ [field]: processedValue }).eq('id', memberId);
      if (error) throw error;
      setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: processedValue } : m)));
    } catch (error) {
      logger.error('更新失敗:', error);
      loadMembers();
    }
  };

  const handleDateInput = (memberId: string, field: keyof OrderMember, value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) {
      updateField(memberId, field, '');
      return;
    }
    let formatted = numbers.slice(0, 8);
    if (numbers.length === 8) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4, 6) + '-' + numbers.slice(6, 8);
      updateField(memberId, field, formatted);
      if (field === 'passport_expiry' && departureDate) {
        checkPassportExpiry(formatted);
      }
    } else {
      setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: formatted } : m)));
    }
  };

  const checkPassportExpiry = (expiryDate: string) => {
    if (!departureDate) return;
    const expiry = new Date(expiryDate || '');
    const departure = new Date(departureDate || '');
    const sixMonthsBeforeDeparture = new Date(departure);
    sixMonthsBeforeDeparture.setMonth(sixMonthsBeforeDeparture.getMonth() - 6);
    if (expiry < sixMonthsBeforeDeparture) {
      void alert(`護照效期警告\n\n護照效期：${expiryDate}\n出發日期：${departureDate}\n\n護照效期不足出發日 6 個月，請提醒客戶更換護照！`, 'warning');
    }
  };

  const handleIdNumberChange = (memberId: string, value: string) => {
    const processedValue = toHalfWidth(value).toUpperCase();
    updateField(memberId, 'id_number', processedValue);
    const idPattern = /^[A-Z][12]/;
    if (idPattern.test(processedValue)) {
      const genderCode = processedValue.charAt(1);
      const detectedGender = genderCode === '1' ? 'M' : 'F';
      updateField(memberId, 'gender', detectedGender);
    } else if (processedValue.length >= 2) {
      void alert('無法自動辨識性別\n\n請手動點擊性別欄位選擇', 'info');
    }
  };

  const handleNumberInput = (memberId: string, field: keyof OrderMember, value: string) => {
    const processedValue = value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^！-～]/g, '');
    updateField(memberId, field, processedValue ? parseFloat(processedValue) : 0);
  };

  const checkCustomerMatchByName = (name: string, memberIndex: number, memberData: Partial<OrderMember>) => {
    logger.log('checkCustomerMatchByName called:', { name, memberIndex, customersCount: customers.length });
    if (!name || name.length < 2) {
      logger.log('Name too short, skipping search');
      return;
    }
    const nameMatches = customers.filter(c => c.name?.includes(name) || name.includes(c.name || ''));
    logger.log('Name matches found:', nameMatches.length);
    if (nameMatches.length > 0) {
      setMatchedCustomers(nameMatches);
      setMatchType('name');
      setPendingMemberIndex(memberIndex);
      setPendingMemberData(memberData);
      setShowCustomerMatchDialog(true);
    }
  };

  const checkCustomerMatchByIdNumber = (idNumber: string, memberIndex: number, memberData: Partial<OrderMember>) => {
    console.log('[ID搜尋] 觸發:', { idNumber, memberIndex, customersCount: customers.length });
    if (!idNumber || idNumber.length < 5) {
      console.log('[ID搜尋] 長度不足5字，跳過');
      return;
    }
    const normalizedInput = idNumber.toUpperCase().trim();
    const idMatches = customers.filter(c => {
      if (!c.national_id) return false;
      const normalizedCustomerId = c.national_id.toUpperCase().trim();
      return normalizedCustomerId.startsWith(normalizedInput) || normalizedInput.startsWith(normalizedCustomerId) || normalizedCustomerId === normalizedInput;
    });
    console.log('[ID搜尋] 比對結果:', idMatches.length, '筆', '搜尋:', normalizedInput);
    if (idMatches.length > 0) {
      setMatchedCustomers(idMatches);
      setMatchType('id_number');
      setPendingMemberIndex(memberIndex);
      setPendingMemberData(memberData);
      setShowCustomerMatchDialog(true);
    } else {
      const sampleIds = customers.slice(0, 10).map(c => c.national_id).filter(Boolean);
      console.log('[ID搜尋] 無匹配結果。前10筆顧客身分證:', sampleIds);
    }
  };

  const handleSelectCustomer = async (customer: typeof customers[0]) => {
    if (pendingMemberIndex === null) return;
    const member = members[pendingMemberIndex];
    if (!member) return;
    const updatedMember = {
      ...member,
      chinese_name: customer.name || member.chinese_name,
      passport_name: customer.passport_romanization || member.passport_name,
      birth_date: customer.date_of_birth || member.birth_date,
      gender: customer.gender || member.gender,
      id_number: customer.national_id || member.id_number,
      passport_number: customer.passport_number || member.passport_number,
      passport_expiry: customer.passport_expiry_date || member.passport_expiry,
      passport_image_url: customer.passport_image_url || member.passport_image_url,
      customer_id: customer.id,
      customer_verification_status: customer.verification_status,
    };
    setMembers(members.map((m, i) => i === pendingMemberIndex ? updatedMember : m));
    try {
      await supabase.from('order_members').update({
        chinese_name: updatedMember.chinese_name,
        passport_name: updatedMember.passport_name,
        birth_date: updatedMember.birth_date,
        gender: updatedMember.gender,
        id_number: updatedMember.id_number,
        passport_number: updatedMember.passport_number,
        passport_expiry: updatedMember.passport_expiry,
        passport_image_url: updatedMember.passport_image_url,
        customer_id: updatedMember.customer_id,
      }).eq('id', member.id);
    } catch (error) {
      logger.error('更新成員資料失敗:', error);
    }
    setShowCustomerMatchDialog(false);
    setPendingMemberIndex(null);
    setPendingMemberData(null);
  };

  const handleEditModeNameChange = (memberId: string, value: string) => {
    logger.log('handleEditModeNameChange called:', { memberId, value });
    setMembers(members.map(m => m.id === memberId ? { ...m, chinese_name: value } : m));
  };

  const handleEditModeNameEnter = (memberId: string, memberIndex: number) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const name = member.chinese_name?.trim();
    if (name && name.length >= 2) {
      logger.log('Triggering customer search for name:', name);
      checkCustomerMatchByName(name, memberIndex, { ...member });
    }
  };

  const handleEditModeIdNumberChange = (memberId: string, value: string, memberIndex: number) => {
    const processedValue = toHalfWidth(value).toUpperCase();
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    let gender = member.gender;
    const idPattern = /^[A-Z][12]/;
    if (idPattern.test(processedValue)) {
      const genderCode = processedValue.charAt(1);
      gender = genderCode === '1' ? 'M' : 'F';
    }
    setMembers(members.map(m => m.id === memberId ? { ...m, id_number: processedValue, gender } : m));
    if (processedValue.length >= 5) {
      checkCustomerMatchByIdNumber(processedValue, memberIndex, { ...member, id_number: processedValue });
    }
  };

  const handleEditModeBlur = async (memberId: string, field: keyof OrderMember, value: string | number) => {
    if (isComposing) return;
    let processedValue: string | number | null = value;
    if (typeof value === 'string') {
      processedValue = toHalfWidth(value);
    }
    if (processedValue === '' && (field.includes('date') || field.includes('expiry'))) {
      processedValue = null;
    }
    try {
      await supabase.from('order_members').update({ [field]: processedValue }).eq('id', memberId);
    } catch (error) {
      logger.error('儲存失敗:', error);
    }
  };
  
  const exportColumnLabels: Record<string, string> = {
    identity: '身份',
    chinese_name: '中文姓名',
    passport_name: '護照拼音',
    birth_date: '出生年月日',
    gender: '性別',
    id_number: '身分證號',
    passport_number: '護照號碼',
    passport_expiry: '護照效期',
    special_meal: '飲食禁忌',
    hotel_confirmation: '訂房代號',
    total_payable: '應付金額',
    deposit_amount: '訂金',
    balance: '尾款',
    remarks: '備註',
  };

  const handleExportPrint = () => {
    const selectedCols = Object.entries(exportColumns).filter(([, selected]) => selected).map(([key]) => key);
    if (selectedCols.length === 0) {
      void alert('請至少選擇一個欄位', 'warning');
      return;
    }
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>成員名單</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 15px; text-align: center; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          @media print {
            body { padding: 10px; }
            h1 { font-size: 16px; }
            table { font-size: 11px; }
            th, td { padding: 4px 6px; }
          }
        </style>
      </head>
      <body>
        <h1>成員名單（共 ${members.length} 人）</h1>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">序</th>
              ${selectedCols.map(col => `<th>${exportColumnLabels[col]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${members.map((member, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                ${selectedCols.map(col => {
                  let value = '';
                  if (col === 'gender') {
                    value = member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-';
                  } else if (col === 'balance') {
                    value = ((member.total_payable || 0) - (member.deposit_amount || 0)).toLocaleString();
                  } else if (col === 'total_payable' || col === 'deposit_amount') {
                    const num = member[col as keyof OrderMember] as number;
                    value = num ? num.toLocaleString() : '-';
                  } else {
                    value = (member[col as keyof OrderMember] as string) || '-';
                  }
                  const align = ['total_payable', 'deposit_amount', 'balance'].includes(col) ? 'text-right' : '';
                  return `<td class="${align}">${value}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    setIsExportDialogOpen(false);
  };

  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: File[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const scale = 2;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context!, viewport: viewport }).promise;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
      });
      const fileName = `${pdfFile.name.replace('.pdf', '')}_page${i}.jpg`;
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
      images.push(imageFile);
    }
    return images;
  };

  const handlePassportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const newProcessedFiles: ProcessedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          const images = await convertPdfToImages(file);
          for (const img of images) {
            const preview = URL.createObjectURL(img);
            newProcessedFiles.push({
              file: img,
              preview,
              originalName: file.name,
              isPdf: true,
            });
          }
        } else if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          newProcessedFiles.push({
            file,
            preview,
            originalName: file.name,
            isPdf: false,
          });
        }
      }
      setProcessedFiles(prev => [...prev, ...newProcessedFiles]);
    } catch (error) {
      logger.error('處理檔案失敗:', error);
      void alert('檔案處理失敗，請重試', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const newProcessedFiles: ProcessedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          const images = await convertPdfToImages(file);
          for (const img of images) {
            const preview = URL.createObjectURL(img);
            newProcessedFiles.push({
              file: img,
              preview,
              originalName: file.name,
              isPdf: true,
            });
          }
        } else if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          newProcessedFiles.push({
            file,
            preview,
            originalName: file.name,
            isPdf: false,
          });
        }
      }
      setProcessedFiles(prev => [...prev, ...newProcessedFiles]);
    } catch (error) {
      logger.error('處理檔案失敗:', error);
      void alert('檔案處理失敗，請重試', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePassportFile = (index: number) => {
    setProcessedFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const compressImage = async (file: File, quality = 0.6): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                if (compressedFile.size > 800 * 1024 && quality > 0.2) {
                  resolve(await compressImage(file, quality - 0.1));
                } else {
                  resolve(compressedFile);
                }
              } else {
                reject(new Error('壓縮失敗'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleBatchUpload = async () => {
    if (processedFiles.length === 0) return;
    if (isUploading) return;
    setIsUploading(true);
    try {
      const compressedFiles = await Promise.all(processedFiles.map(async (pf) => await compressImage(pf.file)));
      const formData = new FormData();
      compressedFiles.forEach(file => formData.append('files', file));
      const response = await fetch('/api/ocr/passport', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('OCR 辨識失敗');
      const result = await response.json();
      let successCount = 0;
      let duplicateCount = 0;
      let matchedCustomerCount = 0;
      let newCustomerCount = 0;
      const failedItems: string[] = [];
      const duplicateItems: string[] = [];

      if (!orderId) throw new Error('需要訂單 ID 才能批次上傳');
      const { data: existingMembers } = await supabase
        .from('order_members')
        .select('passport_number, id_number, chinese_name, birth_date')
        .eq('order_id', orderId);

      const existingPassports = new Set(existingMembers?.map(m => m.passport_number).filter(Boolean) || []);
      const existingIdNumbers = new Set(existingMembers?.map(m => m.id_number).filter(Boolean) || []);
      const existingNameBirthKeys = new Set(existingMembers?.filter(m => m.chinese_name && m.birth_date).map(m => `${m.chinese_name}|${m.birth_date}`) || []);
      await useCustomerStore.getState().fetchAll();
      const freshCustomers = useCustomerStore.getState().items;

      for (let i = 0; i < result.results.length; i++) {
        const item = result.results[i];
        if (item.success && item.customer) {
          const passportNumber = item.customer.passport_number || '';
          const idNumber = item.customer.national_id || '';
          const birthDate = item.customer.date_of_birth || null;
          const chineseName = item.customer.name || '';
          const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim();
          const nameBirthKey = cleanChineseName && birthDate ? `${cleanChineseName}|${birthDate}` : '';

          let isDuplicate = false;
          let duplicateReason = '';
          if (passportNumber && existingPassports.has(passportNumber)) {
            isDuplicate = true;
            duplicateReason = '護照號碼重複';
          } else if (idNumber && existingIdNumbers.has(idNumber)) {
            isDuplicate = true;
            duplicateReason = '身分證號重複';
          } else if (nameBirthKey && existingNameBirthKeys.has(nameBirthKey)) {
            isDuplicate = true;
            duplicateReason = '姓名+生日重複';
          }

          if (isDuplicate) {
            duplicateCount++;
            duplicateItems.push(`${chineseName || item.fileName} (${duplicateReason})`);
            continue;
          }

          try {
            let passportImageUrl: string | null = null;
            if (compressedFiles[i]) {
              const file = compressedFiles[i];
              const timestamp = Date.now();
              const fileExt = file.name.split('.').pop() || 'jpg';
              const fileName = `${workspaceId}/${orderId}/${timestamp}_${i}.${fileExt}`;
              const { data: uploadData, error: uploadError } = await supabase.storage.from('passport-images').upload(fileName, file, { contentType: file.type, upsert: false });
              if (uploadError) {
                logger.error('護照照片上傳失敗:', uploadError);
              } else if (uploadData?.path) {
                const { data: urlData } = supabase.storage.from('passport-images').getPublicUrl(uploadData.path);
                passportImageUrl = urlData?.publicUrl || null;
              }
            }

            const memberData = {
              order_id: orderId,
              workspace_id: workspaceId,
              customer_id: null,
              chinese_name: cleanChineseName || '',
              passport_name: item.customer.passport_romanization || item.customer.english_name || '',
              passport_number: passportNumber,
              passport_expiry: item.customer.passport_expiry_date || null,
              birth_date: birthDate,
              id_number: idNumber,
              gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
              identity: '大人',
              member_type: 'adult',
              passport_image_url: passportImageUrl,
            };

            const { data: newMember, error } = await supabase.from('order_members').insert(memberData).select().single();
            if (error) throw error;

            if (passportNumber) existingPassports.add(passportNumber);
            if (idNumber) existingIdNumbers.add(idNumber);
            if (nameBirthKey) existingNameBirthKeys.add(nameBirthKey);
            successCount++;

            if (newMember && (idNumber || birthDate || passportNumber)) {
              let existingCustomer = freshCustomers.find(c => {
                if (passportNumber && c.passport_number === passportNumber) return true;
                if (idNumber && c.national_id === idNumber) return true;
                if (cleanChineseName && birthDate && c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName && c.date_of_birth === birthDate) return true;
                return false;
              });

              if (existingCustomer) {
                const updateData: Record<string, unknown> = { customer_id: existingCustomer.id };
                if (!newMember.passport_name && existingCustomer.passport_romanization) {
                  updateData.passport_name = existingCustomer.passport_romanization;
                }
                await supabase.from('order_members').update(updateData).eq('id', newMember.id);
                if (passportImageUrl && !existingCustomer.passport_image_url) {
                  await supabase.from('customers').update({ passport_image_url: passportImageUrl }).eq('id', existingCustomer.id);
                }
                matchedCustomerCount++;
                logger.info(`✅ 顧客已存在，已關聯: ${existingCustomer.name}`);
              } else {
                const newCustomer = await useCustomerStore.getState().create({
                  name: item.customer.name || '',
                  english_name: item.customer.english_name || '',
                  passport_number: passportNumber,
                  passport_romanization: item.customer.passport_romanization || '',
                  passport_expiry_date: item.customer.passport_expiry_date || null,
                  passport_image_url: passportImageUrl,
                  national_id: idNumber,
                  date_of_birth: birthDate,
                  gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
                  phone: '',
                  is_vip: false,
                  is_active: true,
                  total_spent: 0,
                  total_orders: 0,
                  verification_status: 'unverified',
                } as any);
                if (newCustomer) {
                  await supabase.from('order_members').update({ customer_id: newCustomer.id }).eq('id', newMember.id);
                  newCustomerCount++;
                  logger.info(`✅ 新建顧客: ${newCustomer.name}`);
                }
              }
            }
          } catch (error) {
            logger.error(`建立成員失敗 (${item.fileName}):`, error);
            failedItems.push(`${item.fileName} (建立失敗)`);
          }
        } else {
          failedItems.push(`${item.fileName} (辨識失敗)`);
        }
      }

      let message = `✅ 成功辨識 ${result.successful}/${result.total} 張護照\n✅ 成功建立 ${successCount} 位成員`;
      if (matchedCustomerCount > 0) message += `\n✅ 已比對 ${matchedCustomerCount} 位現有顧客`;
      if (newCustomerCount > 0) message += `\n✅ 已新增 ${newCustomerCount} 位顧客資料`;
      if (duplicateCount > 0) message += `\n\n⚠️ 跳過 ${duplicateCount} 位重複成員：\n${duplicateItems.join('\n')}`;
      message += `\n\n📋 重要提醒：\n• OCR 資料已標記為「待驗證」\n• 請務必人工檢查護照資訊`;
      if (failedItems.length > 0) message += `\n\n❌ 失敗項目：\n${failedItems.join('\n')}`;
      void alert(message, 'success');

      processedFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
      setProcessedFiles([]);
      await loadMembers();
      setIsAddDialogOpen(false);
    } catch (error) {
      logger.error('批次上傳失敗:', error);
      void alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={mode === 'tour' ? '' : 'p-4'}>
      {/* Main component JSX will be here */}
      {/* 匯出對話框 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer size={20} className="text-morandi-gold" />
              匯出成員名單
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-morandi-secondary mb-4">
              選擇要匯出的欄位，然後點擊「列印」
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(exportColumnLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded hover:bg-morandi-container/30 cursor-pointer"
                >
                  <Checkbox
                    checked={exportColumns[key] || false}
                    onCheckedChange={checked => setExportColumns({
                      ...exportColumns,
                      [key]: checked as boolean
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-morandi-gold focus:ring-morandi-gold"
                  />
                  <span className="text-sm text-morandi-primary">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allSelected = Object.values(exportColumns).every(v => v);
                  const newValue = !allSelected;
                  setExportColumns(
                    Object.fromEntries(
                      Object.keys(exportColumns).map(k => [k, newValue])
                    )
                  );
                }}
                className="text-xs"
              >
                {Object.values(exportColumns).every(v => v) ? '取消全選' : '全選'}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleExportPrint}
              className="bg-morandi-gold hover:bg-morandi-gold/90 text-white gap-1"
            >
              <Printer size={16} />
              列印
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 編輯/驗證成員彈窗 */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingMember(null)
          setEditFormData({})
          imageEditor.reset()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {editMode === 'verify' ? (
                <>
                  <AlertTriangle className="text-amber-500" size={20} />
                  驗證成員資料
                </>
              ) : (
                <>
                  <Pencil className="text-morandi-blue" size={20} />
                  編輯成員資料
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4 flex-1 overflow-y-auto">
            {/* 左邊：護照照片 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-morandi-primary">護照照片</h3>
                {editingMember?.passport_image_url && !imageEditor.isCropMode && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => imageEditor.zoomOut()}
                      className="p-1.5 hover:bg-gray-100 rounded-md"
                      title="縮小"
                    >
                      <ZoomOut size={16} className="text-gray-600" />
                    </button>
                    <span className="text-xs text-gray-500 min-w-[3rem] text-center">
                      {Math.round(imageEditor.zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => imageEditor.zoomIn()}
                      className="p-1.5 hover:bg-gray-100 rounded-md ml-1"
                      title="放大"
                    >
                      <ZoomIn size={16} className="text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => imageEditor.reset()}
                      className="p-1.5 hover:bg-gray-100 rounded-md ml-1"
                      title="重置檢視"
                    >
                      <X size={16} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* 工具列 */}
              {editingMember?.passport_image_url && !imageEditor.isCropMode && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => imageEditor.rotateLeft()}
                      className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
                    >
                      <RotateCcw size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">左轉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => imageEditor.rotateRight()}
                      className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
                    >
                      <RotateCw size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">右轉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => imageEditor.toggleFlipH()}
                      className={`p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs ${imageEditor.flipH ? 'bg-blue-100' : ''}`}
                    >
                      <FlipHorizontal size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">翻轉</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => imageEditor.startCrop()}
                      className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
                    >
                      <Crop size={16} className="text-purple-600" />
                      <span className="text-gray-600 hidden sm:inline">裁剪</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {(imageEditor.rotation !== 0 || imageEditor.flipH) && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingMember?.passport_image_url) return
                          imageEditor.setIsSaving(true)
                          try {
                            const transformedImage = await imageEditor.transformImage(
                              editingMember.passport_image_url,
                              imageEditor.rotation,
                              imageEditor.flipH
                            )
                            const response = await fetch(transformedImage)
                            const blob = await response.blob()
                            const fileName = `passport_${editingMember.id}_${Date.now()}.jpg`
                            const { error: uploadError } = await supabase.storage
                              .from('passport-images')
                              .upload(fileName, blob, { upsert: true })
                            if (uploadError) throw uploadError
                            const { data: urlData } = supabase.storage
                              .from('passport-images')
                              .getPublicUrl(fileName)
                            await supabase
                              .from('order_members')
                              .update({ passport_image_url: urlData.publicUrl })
                              .eq('id', editingMember.id)
                            setEditingMember({ ...editingMember, passport_image_url: urlData.publicUrl })
                            imageEditor.reset()
                            const { toast } = await import('sonner')
                            toast.success('圖片已儲存')
                          } catch (error) {
                            const { toast } = await import('sonner')
                            toast.error('儲存圖片失敗')
                          } finally {
                            imageEditor.setIsSaving(false)
                          }
                        }}
                        disabled={imageEditor.isSaving}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
                      >
                        <Save size={16} />
                        <span>{imageEditor.isSaving ? '儲存中...' : '儲存圖片'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingMember?.passport_image_url) return
                        await recognizePassport(editingMember.passport_image_url, (result) => {
                          setEditFormData(prev => ({
                            ...prev,
                            chinese_name: result.name || prev.chinese_name,
                            passport_name: result.passport_romanization || prev.passport_name,
                            birth_date: result.date_of_birth || prev.birth_date,
                            gender: result.gender === '男' ? 'M' : result.gender === '女' ? 'F' : prev.gender,
                            id_number: result.national_id || prev.id_number,
                            passport_number: result.passport_number || prev.passport_number,
                            passport_expiry: result.passport_expiry_date || prev.passport_expiry,
                          }))
                        })
                      }}
                      disabled={isRecognizing}
                      className="p-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={isRecognizing ? 'animate-spin' : ''} />
                      <span>{isRecognizing ? '辨識中...' : '再次辨識'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 裁剪模式工具列 */}
              {editingMember?.passport_image_url && imageEditor.isCropMode && (
                <div className="flex items-center justify-between bg-purple-50 rounded-lg p-2">
                  <span className="text-xs text-purple-700">拖曳框選要保留的區域</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => imageEditor.cancelCrop()}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-white rounded-md"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingMember?.passport_image_url) return
                        try {
                          const croppedImage = await imageEditor.confirmCrop(editingMember.passport_image_url)
                          if (croppedImage) {
                            imageEditor.setIsSaving(true)
                            const response = await fetch(croppedImage)
                            const blob = await response.blob()
                            const fileName = `passport_${editingMember.id}_${Date.now()}.jpg`
                            const { error: uploadError } = await supabase.storage
                              .from('passport-images')
                              .upload(fileName, blob, { upsert: true })
                            if (uploadError) throw uploadError
                            const { data: urlData } = supabase.storage
                              .from('passport-images')
                              .getPublicUrl(fileName)
                            await supabase
                              .from('order_members')
                              .update({ passport_image_url: urlData.publicUrl })
                              .eq('id', editingMember.id)
                            setEditingMember({ ...editingMember, passport_image_url: urlData.publicUrl })
                            imageEditor.reset()
                            const { toast } = await import('sonner')
                            toast.success('裁剪完成')
                          }
                        } catch (error) {
                          const { toast } = await import('sonner')
                          toast.error(error instanceof Error ? error.message : '裁剪失敗')
                        } finally {
                          imageEditor.setIsSaving(false)
                        }
                      }}
                      disabled={imageEditor.cropRect.width < 20 || imageEditor.isSaving}
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      {imageEditor.isSaving ? '處理中...' : '確認裁剪'}
                    </button>
                  </div>
                </div>
              )}

              {/* 圖片容器 */}
              {editingMember?.passport_image_url ? (
                <div
                  ref={imageEditor.containerRef}
                  className={`relative overflow-hidden rounded-lg border bg-gray-50 ${
                    imageEditor.isCropMode
                      ? 'border-purple-400 cursor-crosshair'
                      : 'cursor-grab active:cursor-grabbing'
                  }`}
                  style={{ height: '320px' }}
                  onWheel={imageEditor.handleWheel}
                  onMouseDown={(e) => imageEditor.handleMouseDown(e, imageEditor.containerRef.current)}
                  onMouseMove={(e) => imageEditor.handleMouseMove(e, imageEditor.containerRef.current)}
                  onMouseUp={imageEditor.handleMouseUp}
                  onMouseLeave={(e) => imageEditor.handleMouseLeave(e, imageEditor.containerRef.current)}
                >
                  <img
                    src={editingMember.passport_image_url}
                    alt="護照照片"
                    className="absolute w-full h-full object-contain transition-transform"
                    style={{
                      transform: `translate(${imageEditor.position.x}px, ${imageEditor.position.y}px) scale(${imageEditor.zoom}) rotate(${imageEditor.rotation}deg) ${imageEditor.flipH ? 'scaleX(-1)' : ''}`,
                      transformOrigin: 'center center',
                    }}
                    draggable={false}
                  />
                  {/* 裁剪框 */}
                  {imageEditor.isCropMode && imageEditor.cropRect.width > 0 && (
                    <div
                      className="absolute border-2 border-purple-500 bg-purple-500/10"
                      style={{
                        left: imageEditor.cropRect.x,
                        top: imageEditor.cropRect.y,
                        width: imageEditor.cropRect.width,
                        height: imageEditor.cropRect.height,
                      }}
                    />
                  )}
                </div>
              ) : (
                <label
                  htmlFor="edit-passport-upload"
                  className="w-full h-48 bg-morandi-container/30 rounded-lg flex flex-col items-center justify-center text-morandi-secondary border-2 border-dashed border-morandi-secondary/30 hover:border-morandi-gold hover:bg-morandi-gold/5 cursor-pointer transition-all"
                >
                  <Upload size={32} className="mb-2 opacity-50" />
                  <span className="text-sm">點擊上傳護照照片</span>
                  <span className="text-xs mt-1 opacity-70">支援 JPG、PNG</span>
                  <input
                    id="edit-passport-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !editingMember) return

                      try {
                        // 壓縮圖片
                        const compressedFile = await new Promise<File>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.readAsDataURL(file)
                          reader.onload = (ev) => {
                            const img = new Image()
                            img.src = ev.target?.result as string
                            img.onload = () => {
                              const canvas = document.createElement('canvas')
                              let { width, height } = img
                              const maxDimension = 1200
                              if (width > maxDimension || height > maxDimension) {
                                if (width > height) {
                                  height = (height / width) * maxDimension
                                  width = maxDimension
                                } else {
                                  width = (width / height) * maxDimension
                                  height = maxDimension
                                }
                              }
                              canvas.width = width
                              canvas.height = height
                              const ctx = canvas.getContext('2d')!
                              ctx.drawImage(img, 0, 0, width, height)
                              canvas.toBlob(
                                (blob) => {
                                  if (blob) {
                                    resolve(new File([blob], file.name, { type: 'image/jpeg' }))
                                  } else {
                                    reject(new Error('壓縮失敗'))
                                  }
                                },
                                'image/jpeg',
                                0.8
                              )
                            }
                            img.onerror = reject
                          }
                          reader.onerror = reject
                        })

                        // 上傳到 Supabase Storage
                        const fileName = `passport_${editingMember.id}_${Date.now()}.jpg`
                        const { error: uploadError } = await supabase.storage
                          .from('passport-images')
                          .upload(fileName, compressedFile, { upsert: true })

                        if (uploadError) throw uploadError

                        const { data: urlData } = supabase.storage
                          .from('passport-images')
                          .getPublicUrl(fileName)

                        // 更新資料庫
                        await supabase
                          .from('order_members')
                          .update({ passport_image_url: urlData.publicUrl })
                          .eq('id', editingMember.id)

                        // 更新本地狀態
                        setEditingMember({ ...editingMember, passport_image_url: urlData.publicUrl })

                        const { toast } = await import('sonner')
                        toast.success('護照照片上傳成功')
                      } catch (error) {
                        logger.error('護照上傳失敗:', error)
                        const { toast } = await import('sonner')
                        toast.error('上傳失敗，請重試')
                      }

                      // 清空 input
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
              {editMode === 'verify' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    請仔細核對護照照片與右邊的資料是否一致。驗證完成後，此成員的資料將被標記為「已驗證」。
                  </p>
                </div>
              )}
            </div>

            {/* 右邊：表單 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-morandi-primary">成員資料</h3>

              {/* 中文姓名 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">中文姓名</label>
                <Input
                  type="text"
                  value={editFormData.chinese_name || ''}
                  onChange={e => setEditFormData({ ...editFormData, chinese_name: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* 護照拼音 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照拼音</label>
                <Input
                  type="text"
                  value={editFormData.passport_name || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_name: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* 出生年月日 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">出生年月日</label>
                <Input
                  type="text"
                  value={editFormData.birth_date || ''}
                  onChange={e => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full"
                />
              </div>

              {/* 性別 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">性別</label>
                <Select
                  value={editFormData.gender || ''}
                  onValueChange={value => setEditFormData({ ...editFormData, gender: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="請選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">男</SelectItem>
                    <SelectItem value="F">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 身分證號 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">身分證號</label>
                <Input
                  type="text"
                  value={editFormData.id_number || ''}
                  onChange={e => setEditFormData({ ...editFormData, id_number: e.target.value.toUpperCase() })}
                  className="w-full"
                />
              </div>

              {/* 護照號碼 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照號碼</label>
                <Input
                  type="text"
                  value={editFormData.passport_number || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_number: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* 護照效期 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照效期</label>
                <Input
                  type="text"
                  value={editFormData.passport_expiry || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_expiry: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full"
                />
              </div>

              {/* 特殊餐食 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">特殊餐食</label>
                <Input
                  type="text"
                  value={editFormData.special_meal || ''}
                  onChange={e => setEditFormData({ ...editFormData, special_meal: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">備註</label>
                <Textarea
                  value={editFormData.remarks || ''}
                  onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })}
                  rows={2}
                  className="w-full resize-none"
                />
              </div>
            </div>
          </div>

          {/* 按鈕區域 - 固定在底部 */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 pb-2 border-t bg-white">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              取消
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              size="lg"
              className={editMode === 'verify'
                ? 'bg-green-600 hover:bg-green-700 text-white px-8 font-medium'
                : 'bg-morandi-gold hover:bg-morandi-gold-hover text-white px-8 font-medium'
              }
            >
              {isSaving ? '儲存中...' : editMode === 'verify' ? '確認驗證' : '儲存變更'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
