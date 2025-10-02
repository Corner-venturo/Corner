'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo, useCallback } from 'react';
import { useTourStore } from '@/stores/tour-store';
import { Member } from '@/stores/types';
import {
  getGenderFromIdNumber,
  calculateAge
} from '@/lib/utils';
import { ReactDataSheetWrapper, DataSheetColumn } from '@/components/shared/react-datasheet-wrapper';

interface MemberTableProps {
  orderId: string;
  departureDate: string;
  memberCount: number;
}

export interface MemberTableRef {
  addRow: () => void;
}

interface EditingMember extends Omit<Member, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  isNew?: boolean;
}


export const ExcelMemberTable = forwardRef<MemberTableRef, MemberTableProps>(
  ({ orderId, departureDate, memberCount }, ref) => {
  const { members, addMember, updateMember, deleteMember } = useTourStore();
  const [tableMembers, setTableMembers] = useState<EditingMember[]>([]);

  const orderMembers = useMemo(() =>
    members.filter(member => member.orderId === orderId),
    [members, orderId]
  );

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
    { key: 'reservationCode', label: '訂位代號', width: 100 }
  ];

  useEffect(() => {
    const existingMembers = orderMembers.map(member => ({ ...member }));

    // 確保至少有memberCount行
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
        reservationCode: '',
        addOns: [],
        refunds: [],
        isNew: true
      });
    }

    setTableMembers(existingMembers);
  }, [orderMembers, memberCount, orderId]);


  // 自動儲存成員
  const autoSaveMember = (member: EditingMember, index: number) => {
    if (member.isNew && member.name.trim()) {
      const { isNew, ...memberData } = member;
      const newId = addMember(memberData);

      const updatedMembers = [...tableMembers];
      updatedMembers[index] = { ...member, id: newId, isNew: false };
      setTableMembers(updatedMembers);
    } else if (member.id && !member.isNew) {
      const { isNew, ...memberData } = member;
      updateMember(member.id, memberData);
    }
  };

  // 處理資料更新 (用於 ReactDataSheet)
  const handleDataUpdate = useCallback((newData: EditingMember[]) => {
    // 處理自動計算欄位
    const processedData = newData.map(member => {
      const processed = { ...member };

      // 從身分證號自動計算性別和年齡
      if (processed.idNumber) {
        processed.gender = getGenderFromIdNumber(processed.idNumber);
        processed.age = calculateAge(processed.idNumber, departureDate);
      }
      // 從生日計算年齡
      else if (processed.birthday) {
        processed.age = calculateAge(processed.birthday, departureDate, true);
      }

      return processed;
    });

    setTableMembers(processedData);

    // 自動儲存到 store
    processedData.forEach((member, index) => {
      autoSaveMember(member, index);
    });
  }, [departureDate, tableMembers, addMember, updateMember]);

  // 新增行
  const addRow = () => {
    console.log('addRow called, current tableMembers:', tableMembers.length);
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
      reservationCode: '',
      addOns: [],
      refunds: [],
      isNew: true
    };
    setTableMembers([...tableMembers, newMember]);
    console.log('New member added, new length should be:', tableMembers.length + 1);
  };

  // 暴露addRow函數給父組件
  useImperativeHandle(ref, () => ({
    addRow
  }));




  return (
    <div className="w-full">
      {/* 使用 ReactDataSheet 替代原來的表格 */}
      <ReactDataSheetWrapper
        columns={dataSheetColumns}
        data={tableMembers.map((member, index) => ({
          ...member,
          index: index + 1,
          age: member.age > 0 ? `${member.age}歲` : '',
          gender: member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : ''
        }))}
        onDataUpdate={handleDataUpdate}
        className="min-h-[400px]"
      />

      <div className="text-xs text-morandi-secondary px-6 py-2 space-y-1">
        <p>• 點擊任意單元格即可編輯，自動儲存</p>
        <p>• 年齡和性別為自動計算欄位</p>
        <p>• 支援 Excel 式鍵盤導航和複製貼上</p>
        <p>• 身分證號碼會自動計算年齡和性別</p>
      </div>
    </div>
  );
  }
);

ExcelMemberTable.displayName = 'ExcelMemberTable';