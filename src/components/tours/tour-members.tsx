'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tour } from '@/stores/types';
import { useOrderStore, useMemberStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { _Input } from '@/components/ui/input';
import {
  getGenderFromIdNumber,
  calculateAge
} from '@/lib/utils';
import { Trash2, GripVertical, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourMembersProps {
  tour: Tour;
  orderFilter?: string; // 選填：只顯示特定訂單的團員
}

interface EditingMember {
  id?: string;
  order_id: string;
  name: string;
  nameEn: string;
  birthday: string;
  passportNumber: string;
  passportExpiry: string;
  idNumber: string;
  gender: string;
  age: number;
  isNew?: boolean;
  order_number?: string;
  contact_person?: string;
  assignedRoom?: string;
}

interface EditingCell {
  rowIndex: number;
  field: keyof EditingMember;
}

export const TourMembers = React.memo(function TourMembers({ tour, orderFilter }: TourMembersProps) {
  const { items: orders } = useOrderStore();
  const { items: members, create: addMember, update: updateMember, delete: deleteMember } = useMemberStore();
  const [tableMembers, setTableMembers] = useState<EditingMember[]>([]);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 獲取屬於這個旅遊團的所有訂單（如果有 orderFilter，則只取該訂單）
  const tourOrders = useMemo(() => {
    return orders.filter(order => {
      if (orderFilter) {
        return order.id === orderFilter;
      }
      return order.tour_id === tour.id;
    });
  }, [orders, tour.id, orderFilter]);

  // 獲取所有團員，包含訂單信息
  useEffect(() => {
    const allTourMembers = members.filter(member =>
      tourOrders.some(order => order.id === member.order_id)
    ).map(member => {
      const relatedOrder = tourOrders.find(order => order.id === member.order_id);
      return {
        ...member,
        nameEn: member.name_en || '',
        passportNumber: member.passport_number || '',
        passportExpiry: member.passport_expiry || '',
        idNumber: member.id_number || '',
        order_number: relatedOrder?.order_number || '',
        contact_person: relatedOrder?.contact_person || '',
        assignedRoom: member.assigned_room
      } as EditingMember;
    });

    setTableMembers(allTourMembers);
  }, [members, tourOrders]);

  const totalMembers = tableMembers.length;
  const completedMembers = tableMembers.filter(member =>
    member.name && member.idNumber
  ).length;

  // 點擊單元格開始編輯
  const startCellEdit = (rowIndex: number, field: keyof EditingMember) => {
    if (field === 'age' || field === 'order_number' || field === 'contact_person' || field === 'assignedRoom') return;

    setEditingCell({ rowIndex, field });
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  // 更新單元格值
  const updateCellValue = (value: string) => {
    if (!editingCell) return;

    const { rowIndex, field } = editingCell;
    const updatedMembers = [...tableMembers];
    const member = { ...updatedMembers[rowIndex] };

    if (field === 'idNumber') {
      member.idNumber = value.toUpperCase();
      // 只有當性別欄位為空時才自動填入
      if (!member.gender) {
        member.gender = getGenderFromIdNumber(value);
      }
    } else if (field === 'birthday') {
      member.birthday = value;
      member.age = calculateAge(value, tour.departure_date, tour.return_date);
    } else if (field === 'gender') {
      // 手動輸入性別，轉換成 M/F 格式
      if (value === '男' || value.toLowerCase() === 'm' || value === '1') {
        member.gender = 'M';
      } else if (value === '女' || value.toLowerCase() === 'f' || value === '2') {
        member.gender = 'F';
      } else {
        member.gender = '';
      }
    } else {
      // 使用型別安全的方式更新屬性
      member[field] = value as never;
    }

    updatedMembers[rowIndex] = member;
    setTableMembers(updatedMembers);

    // 自動儲存
    autoSaveMember(member, rowIndex);
  };

  // 自動儲存成員
  const autoSaveMember = async (member: EditingMember, index: number) => {
    if (member.isNew && member.name.trim()) {
      const { isNew, order_number, contact_person, assignedRoom, nameEn, passportNumber, passportExpiry, idNumber, ...restData } = member;
      const convertedData = {
        ...restData,
        name_en: nameEn,
        passport_number: passportNumber,
        passport_expiry: passportExpiry,
        id_number: idNumber,
        assigned_room: assignedRoom
      };

      const newMember = await addMember(convertedData);

      const updatedMembers = [...tableMembers];
      updatedMembers[index] = { ...member, id: newMember.id, isNew: false };
      setTableMembers(updatedMembers);
    } else if (member.id && !member.isNew) {
      const { isNew, order_number, contact_person, assignedRoom, nameEn, passportNumber, passportExpiry, idNumber, ...restData } = member;
      const convertedData = {
        ...restData,
        name_en: nameEn,
        passport_number: passportNumber,
        passport_expiry: passportExpiry,
        id_number: idNumber,
        assigned_room: assignedRoom
      };

      await updateMember(member.id, convertedData);
    }
  };

  // 新增成員到指定訂單
  const _addMemberToOrder = (order_id: string) => {
    const _relatedOrder = tourOrders.find(order => order.id === order_id);
    if (!_relatedOrder) return;

    const newMember: EditingMember = {
      order_id,
      name: '',
      nameEn: '',
      birthday: '',
      passportNumber: '',
      passportExpiry: '',
      idNumber: '',
      gender: '',
      age: 0,
      isNew: true,
      order_number: _relatedOrder.order_number,
      contact_person: _relatedOrder.contact_person
    };
    setTableMembers([...tableMembers, newMember]);
  };

  // 刪除成員
  const deleteRow = (index: number) => {
    const member = tableMembers[index];
    if (member.id && !member.isNew) {
      deleteMember(member.id);
    }
    const updatedMembers = tableMembers.filter((_, i) => i !== index);
    setTableMembers(updatedMembers);
  };

  // 拖拽處理 - 重新實現更可靠的拖拽功能
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRow(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedRow === null) {
      return;
    }

    if (draggedRow === dropIndex) {
      setDraggedRow(null);
      return;
    }

    // 執行重排序
    const newMembers = [...tableMembers];
    const draggedMember = newMembers[draggedRow];

    // 移除原位置的成員
    newMembers.splice(draggedRow, 1);
    // 插入到新位置
    newMembers.splice(dropIndex, 0, draggedMember);

    setTableMembers(newMembers);
    setDraggedRow(null);
  };

  const handleDragEnd = () => {
    setDraggedRow(null);
  };

  const renderCell = (member: EditingMember, rowIndex: number, field: keyof EditingMember) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    const isAutoField = field === 'age' || field === 'order_number' || field === 'contact_person' || field === 'assignedRoom';
    let value = member[field] as string;

    // 格式化顯示值
    if (field === 'gender') {
      value = member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '';
    } else if (field === 'age') {
      value = member.age > 0 ? `${member.age}歲` : '';
    } else if (field === 'assignedRoom') {
      value = member.assignedRoom || '未分房';
    }

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          value={field === 'age' ? '' :
            field === 'gender' ? (member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '') :
            member[field] as string}
          onChange={(e) => updateCellValue(e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              setEditingCell(null);
            }
            if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          type={field === 'birthday' || field === 'passportExpiry' ? 'date' : 'text'}
          className="h-8 w-full border-none outline-none bg-transparent p-0 px-2 focus:ring-0 focus:border-none"
        />
      );
    }

    return (
      <div
        className={cn(
          "h-8 px-2 py-1 flex items-center",
          isAutoField ? "cursor-not-allowed text-gray-500" : "cursor-text",
          member[field] && !isAutoField && "font-medium"
        )}
        onClick={() => !isAutoField && startCellEdit(rowIndex, field)}
      >
        {value || ''}
      </div>
    );
  };

  if (tourOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-morandi-secondary">此旅遊團尚無訂單</p>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* 統一團員表格 */}
      <div className="overflow-hidden bg-card">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1200px] bg-white rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-morandi-container/10 sticky top-0 border-b-2 border-morandi-gold/20">
              <tr>
                <th className="w-[30px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20"></th>
                <th className="w-[40px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">序號</th>
                <th className="min-w-[80px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">姓名</th>
                <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">英文姓名</th>
                <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">生日</th>
                <th className="min-w-[60px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">年齡</th>
                <th className="min-w-[50px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">性別</th>
                <th className="min-w-[120px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">身分證字號</th>
                <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">護照號碼</th>
                <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">護照效期</th>
                <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">所屬訂單</th>
                <th className="min-w-[80px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">聯絡人</th>
                <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">分房</th>
                <th className="w-[40px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">操作</th>
              </tr>
            </thead>
            <tbody>
              {tableMembers.map((member, index) => {
                const relatedOrder = tourOrders.find(order => order.id === member.order_id);
                const orderIndex = tourOrders.findIndex(order => order.id === member.order_id);
                const bgColor = orderIndex % 2 === 0 ? 'bg-white' : 'bg-blue-50/30';

                return (
                  <tr
                    key={member.id || `row-${index}`}
                    className={cn(
                      bgColor,
                      draggedRow === index && "opacity-50"
                    )}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* 拖拽把手 */}
                    <td className="border border-gray-300 text-center py-1">
                      <GripVertical
                        size={14}
                        className="text-gray-400 cursor-grab active:cursor-grabbing mx-auto"
                      />
                    </td>

                    {/* 統一序號 */}
                    <td className="border border-gray-300 text-center py-1">
                      <span className="text-morandi-secondary font-medium">{index + 1}</span>
                    </td>

                    {/* 可編輯欄位 */}
                    <td className="border border-gray-300">{renderCell(member, index, 'name')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'nameEn')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'birthday')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'age')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'gender')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'idNumber')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'passportNumber')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'passportExpiry')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'order_number')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'contact_person')}</td>
                    <td className="border border-gray-300">{renderCell(member, index, 'assignedRoom')}</td>

                    {/* 刪除按鈕 */}
                    <td className="border border-gray-300 text-center py-1">
                      <Button
                        onClick={() => deleteRow(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {tableMembers.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-morandi-secondary">
                    <Users size={24} className="mx-auto mb-4 opacity-50" />
                    <p>尚無團員資料</p>
                    <p className="text-sm mt-1">點擊上方按鈕新增團員到指定訂單</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-morandi-secondary px-2 py-1 space-y-1">
          <p>• 點擊任意單元格即可編輯，自動儲存</p>
          <p>• 年齡和性別為自動計算欄位</p>
          <p>• 可拖拽行首圖示調整順序</p>
          <p>• 不同訂單用底色區分，方便識別</p>
        </div>
      </div>

      {/* 統計區域 */}
      <div className="bg-morandi-container/20 p-4">
        <div className={cn(
          "grid gap-4",
          orderFilter ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-4"
        )}>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-primary">{totalMembers}</div>
            <div className="text-sm text-morandi-secondary">{orderFilter ? '訂單成員數' : '總成員數'}</div>
          </div>
          {!orderFilter && (
            <div className="text-center">
              <div className="text-2xl font-bold text-morandi-primary">{tourOrders.length}</div>
              <div className="text-sm text-morandi-secondary">訂單數</div>
            </div>
          )}
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

        {/* 按訂單分組的統計 - 只在整團視圖顯示 */}
        {!orderFilter && tourOrders.length > 1 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-morandi-primary mb-3">各訂單成員數</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tourOrders.map(order => {
                const orderMemberCount = tableMembers.filter(member => member.order_id === order.id).length;
                return (
                  <div key={order.id} className="bg-card border border-border p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-morandi-primary text-sm">{order.order_number}</div>
                        <div className="text-xs text-morandi-secondary">{order.contact_person}</div>
                      </div>
                      <div className="text-lg font-bold text-morandi-primary">{orderMemberCount}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});