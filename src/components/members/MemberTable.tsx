// Placeholder for MemberTable.tsx
// This file will contain the generic table rendering logic extracted from OrderMemberView.tsx

import React, { forwardRef } from 'react';
import { ReactDataSheetWrapper, DataSheetColumn } from '@/components/shared/react-datasheet-wrapper';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Member } from '@/stores/types'; // Assuming Member type is still needed

interface MemberTableProps {
  data: Member[]; // The actual member data to display
  columns: DataSheetColumn[]; // Column definitions for ReactDataSheet
  isEditMode: boolean; // Controls whether to show input fields or ReactDataSheet
  handleEditModeChange: (index: number, field: keyof Member, value: string) => void; // For direct input changes
  handleDataUpdate: (newData: Member[]) => void; // For ReactDataSheet updates
  // Add any other props needed for generic table functionality
}

export const MemberTable = forwardRef<HTMLDivElement, MemberTableProps>(
  ({ data, columns, isEditMode, handleEditModeChange, handleDataUpdate }, ref) => {
    return (
      <>
        {isEditMode ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground w-10">#</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[100px]">姓名</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[120px]">英文姓名</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[110px]">生日</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground w-[50px]">性別</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[120px]">身分證字號</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[110px]">護照號碼</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[110px]">護照效期</th>
                </tr>
              </thead>
              <tbody>
                {data.map((member, index) => (
                  <tr key={member.id || `new-${index}`} className="border-b hover:bg-muted/20">
                    <td className="px-2 py-1 text-muted-foreground">{index + 1}</td>
                    <td className="px-1 py-1">
                      <Input
                        value={member.name || ''}
                        onChange={(e) => handleEditModeChange(index, 'name', e.target.value)}
                        placeholder="姓名"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={member.name_en || ''}
                        onChange={(e) => handleEditModeChange(index, 'name_en', e.target.value)}
                        placeholder="英文姓名"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <DatePicker
                        value={member.birthday || ''}
                        onChange={(date) => handleEditModeChange(index, 'birthday', date)}
                        placeholder="選擇日期"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-2 py-1 text-center text-muted-foreground">
                      {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={member.id_number || ''}
                        onChange={(e) => handleEditModeChange(index, 'id_number', e.target.value)}
                        placeholder="身分證字號"
                        className="h-8 text-sm font-mono"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={member.passport_number || ''}
                        onChange={(e) => handleEditModeChange(index, 'passport_number', e.target.value)}
                        placeholder="護照號碼"
                        className="h-8 text-sm font-mono"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <DatePicker
                        value={member.passport_expiry || ''}
                        onChange={(date) => handleEditModeChange(index, 'passport_expiry', date)}
                        placeholder="選擇日期"
                        className="h-8 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* 一般模式：使用 ReactDataSheet */
          <ReactDataSheetWrapper
            columns={columns}
            data={data.map((member, index: number) => {
              const age = 'age' in member ? (member as Member & { age: number }).age : 0
              return {
                ...member,
                index: index + 1,
                age: age > 0 ? `${age}歲` : '',
                gender: member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '',
                passport_image_url: member.passport_image_url || '',
                customer_id: member.customer_id || '',
              }
            })}
            onDataUpdate={handleDataUpdate as (data: unknown[]) => void}
            className="min-h-[400px]"
          />
        )}
      </>
    );
  }
);

MemberTable.displayName = 'MemberTable';
