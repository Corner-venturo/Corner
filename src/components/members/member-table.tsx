'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTourStore } from '@/stores/tour-store';
import { Member } from '@/stores/types';
import {
  getGenderFromIdNumber,
  calculateAge,
  validateIdNumber,
  validatePassportNumber
} from '@/lib/utils';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberTableProps {
  orderId: string;
  departureDate: string;
  memberCount: number; // 訂單預設人數
}

interface EditingMember extends Omit<Member, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  isNew?: boolean;
}

interface EditingCell {
  rowIndex: number;
  field: keyof EditingMember;
}

export const MemberTable = React.memo(function MemberTable({ orderId, departureDate, memberCount }: MemberTableProps) {
  const { members, addMember, updateMember, deleteMember } = useTourStore();
  const [tableMembers, setTableMembers] = useState<EditingMember[]>([]);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const orderMembers = members.filter(member => member.orderId === orderId);

  useEffect(() => {
    const existingMembers = orderMembers.map(member => ({ ...member }));

    // 如果現有成員數量少於訂單人數，自動填充空白行
    while (existingMembers.length < memberCount) {
      existingMembers.push({
        orderId,
        name: '',
        nameEn: '',
        birthday: '',
        passportNumber: '',
        passportExpiry: '',
        idNumber: '',
        gender: '',
        age: 0,
        isNew: true
      });
    }

    setTableMembers(existingMembers);
  }, [orderMembers, memberCount, orderId]);

  // 點擊儲格開始編輯
  const startCellEdit = (rowIndex: number, field: keyof EditingMember) => {
    if (field === 'gender' || field === 'age') return; // 自動欄位不能編輯

    setEditingCell({ rowIndex, field });
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  // 完成儲格編輯
  const finishCellEdit = () => {
    setEditingCell(null);
  };

  // 更新儲格值
  const updateCellValue = (value: string) => {
    if (!editingCell) return;

    const { rowIndex, field } = editingCell;
    const updatedMembers = [...tableMembers];
    const member = { ...updatedMembers[rowIndex] };

    if (field === 'idNumber') {
      member.idNumber = value.toUpperCase();
      member.gender = getGenderFromIdNumber(value);
    } else if (field === 'birthday') {
      member.birthday = value;
      member.age = calculateAge(value, departureDate);
    } else {
      (member as any)[field] = value;
    }

    updatedMembers[rowIndex] = member;
    setTableMembers(updatedMembers);

    // 自動儲存到store
    autoSaveMember(member, rowIndex);
  };

  // 自動儲存成員
  const autoSaveMember = (member: EditingMember, index: number) => {
    if (member.isNew && member.name.trim()) {
      // 新增成員
      const { isNew, ...memberData } = member;
      const newId = addMember(memberData);

      // 更新本地狀態，標記為已存在
      const updatedMembers = [...tableMembers];
      updatedMembers[index] = { ...member, id: newId, isNew: false };
      setTableMembers(updatedMembers);
    } else if (member.id && !member.isNew) {
      // 更新現有成員
      const { isNew, ...memberData } = member;
      updateMember(member.id, memberData);
    }
  };

  // 新增行
  const addRow = () => {
    const newMember: EditingMember = {
      orderId,
      name: '',
      nameEn: '',
      birthday: '',
      passportNumber: '',
      passportExpiry: '',
      idNumber: '',
      gender: '',
      age: 0,
      isNew: true
    };
    setTableMembers([...tableMembers, newMember]);
  };

  // 刪除行
  const deleteRow = (index: number) => {
    const member = tableMembers[index];
    if (member.id && !member.isNew) {
      deleteMember(member.id);
    }
    const updatedMembers = tableMembers.filter((_, i) => i !== index);
    setTableMembers(updatedMembers);
  };

  // 拖拉行
  const handleDragStart = (index: number) => {
    setDraggedRow(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedRow === null) return;

    const updatedMembers = [...tableMembers];
    const draggedMember = updatedMembers[draggedRow];
    updatedMembers.splice(draggedRow, 1);
    updatedMembers.splice(dropIndex, 0, draggedMember);

    setTableMembers(updatedMembers);
    setDraggedRow(null);
  };

  const getValidationError = (member: EditingMember) => {
    const errors = [];
    if (member.idNumber && !validateIdNumber(member.idNumber)) {
      errors.push('身分證格式錯誤');
    }
    if (member.passportNumber && !validatePassportNumber(member.passportNumber)) {
      errors.push('護照號碼格式錯誤');
    }
    return errors;
  };

  return (
    <div className="w-full">
      <div className="flex justify-end items-center mb-2 px-6">
        {!isEditing ? (
          <Button
            onClick={startEditing}
            size="sm"
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            編輯成員
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={addNewRow} size="sm" variant="outline">
              <Plus size={16} className="mr-1" />
              新增成員
            </Button>
            <Button onClick={saveChanges} size="sm" className="bg-morandi-green hover:bg-morandi-green/80 text-white">
              <Save size={16} className="mr-1" />
              儲存
            </Button>
            <Button onClick={cancelEditing} size="sm" variant="outline">
              <X size={16} className="mr-1" />
              取消
            </Button>
          </div>
        )}
      </div>

      <table className="w-full text-sm">
            <thead className="bg-morandi-container/30">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary w-[40px]">序號</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[80px]">姓名</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[100px]">英文姓名</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[100px]">生日</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[50px]">年齡</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[50px]">性別</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[120px]">身分證字號</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[100px]">護照號碼</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[100px]">護照效期</th>
                {isEditing && (
                  <th className="text-left py-2 px-3 text-xs font-medium text-morandi-secondary min-w-[60px]">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((member, index) => {
                const validationErrors = getValidationError(member);
                const hasErrors = validationErrors.length > 0;

                return (
                  <tr
                    key={member.id || `new-${index}`}
                    className={cn(
                      "border-b border-border/30 hover:bg-morandi-container/10",
                      hasErrors && isEditing && "bg-red-50"
                    )}
                  >
                    <td className="py-2 px-3 text-center">
                      <span className="text-morandi-secondary font-medium">{index + 1}</span>
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <Input
                          value={member.name}
                          onChange={(e) => updateEditingMember(index, 'name', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="請輸入姓名"
                        />
                      ) : (
                        <span className="text-morandi-primary">{member.name}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <Input
                          value={member.nameEn}
                          onChange={(e) => updateEditingMember(index, 'nameEn', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="English Name"
                        />
                      ) : (
                        <span className="text-morandi-primary">{member.nameEn}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={member.birthday}
                          onChange={(e) => updateEditingMember(index, 'birthday', e.target.value)}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <span className="text-morandi-secondary">{member.birthday}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={cn(
                        "text-morandi-primary font-medium",
                        member.age > 0 && "bg-morandi-container/20 px-1 rounded"
                      )}>
                        {member.age > 0 ? `${member.age}歲` : '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={cn(
                        "text-morandi-primary",
                        member.gender === 'M' && "text-blue-600",
                        member.gender === 'F' && "text-pink-600"
                      )}>
                        {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <Input
                          value={member.idNumber}
                          onChange={(e) => updateEditingMember(index, 'idNumber', e.target.value)}
                          className={cn(
                            "h-8 text-xs",
                            member.idNumber && !validateIdNumber(member.idNumber) && "border-red-300"
                          )}
                          placeholder="A123456789"
                        />
                      ) : (
                        <span className="text-morandi-primary font-mono">{member.idNumber}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <Input
                          value={member.passportNumber}
                          onChange={(e) => updateEditingMember(index, 'passportNumber', e.target.value)}
                          className={cn(
                            "h-8 text-xs",
                            member.passportNumber && !validatePassportNumber(member.passportNumber) && "border-red-300"
                          )}
                          placeholder="護照號碼"
                        />
                      ) : (
                        <span className="text-morandi-primary font-mono">{member.passportNumber}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={member.passportExpiry}
                          onChange={(e) => updateEditingMember(index, 'passportExpiry', e.target.value)}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <span className="text-morandi-secondary">{member.passportExpiry}</span>
                      )}
                    </td>
                    {isEditing && (
                      <td className="py-2 px-3">
                        <Button
                          onClick={() => deleteEditingMember(index)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!isEditing && displayMembers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-morandi-secondary">
                    尚未新增成員，點擊「編輯成員」開始新增
                  </td>
                </tr>
              )}
            </tbody>
          </table>

      {isEditing && (
        <div className="text-xs text-morandi-secondary space-y-1 mt-4 px-6">
          <p>• 年齡會根據生日和出發日期自動計算</p>
          <p>• 性別會根據身分證字號第二碼自動判斷 (1,2=男性, 3,4=女性)</p>
          <p>• 身分證格式：英文字母 + 9位數字</p>
          <p>• 護照號碼格式：8-9位數字或英數組合</p>
        </div>
      )}
    </div>
  );
});