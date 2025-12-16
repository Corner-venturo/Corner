'use client'

import React, { forwardRef, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Member } from '@/stores/types';
import { useMembers } from '@/hooks/use-members'; // Generic useMembers hook
import { useOrderStore, useTourStore } from '@/stores'; // To get orders and tour details
import { MemberTable } from '@/components/members/MemberTable';
import { DataSheetColumn } from '@/components/shared/react-datasheet-wrapper';
import { ImageIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGenderFromIdNumber, calculateAge } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

interface TourMemberViewProps {
  tourId: string;
  // Initially, members might be passed, but with useMembers hook, we'll fetch them internally
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TourMemberViewRef {
  // 預留給未來 forwardRef 暴露方法用
}

interface EditingMember extends Omit<Member, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  isNew?: boolean;
}

export const TourMemberView = forwardRef<TourMemberViewRef, TourMemberViewProps>(
  ({ tourId }, ref) => {
    const { items: allOrders, fetchAll: fetchAllOrders } = useOrderStore();
    const { items: allTours, fetchAll: fetchAllTours } = useTourStore();
    
    // Fetch all members using the generic useMembers hook
    // We pass no orderId/tourId to useMembers here to get all members, and filter locally
    // Alternatively, the useMembers hook could be extended to accept an array of orderIds
    const {
      members: allMembers,
      createMember,
      updateMember,
      refetchMembers,
      workspaceId,
      uploadPassportImage,
    } = useMembers();

    const [tableMembers, setTableMembers] = useState<EditingMember[]>([]);
    const [isEditMode, setIsEditMode] = useState(false); // Tour member view might have its own edit mode

    // Fetch necessary data
    useEffect(() => {
      fetchAllOrders();
      fetchAllTours();
    }, [fetchAllOrders, fetchAllTours]);

    // Filter members based on tourId
    const membersForTour = useMemo(() => {
      const ordersInTour = allOrders.filter(order => order.tour_id === tourId);
      const orderIdsInTour = new Set(ordersInTour.map(order => order.id));
      
      return allMembers.filter(member => orderIdsInTour.has(member.order_id));
    }, [allOrders, allMembers, tourId]);

    // Get departure date from the tour
    const tourDepartureDate = useMemo(() => {
      const tour = allTours.find(t => t.id === tourId);
      // Assuming tour has a departure_date property
      return tour?.departure_date || ''; // Default to empty string if not found
    }, [allTours, tourId]);


    useEffect(() => {
        setTableMembers(membersForTour as EditingMember[]);
    }, [membersForTour]);


    // Placeholder for handlers for a generic MemberTable, these would typically come from a hook
    const handleEditModeChange = useCallback(
      (index: number, field: keyof EditingMember, value: string) => {
        const updatedMembers = [...tableMembers];
        const member = { ...updatedMembers[index], [field]: value };

        if (field === 'id_number' && value) {
          member.gender = getGenderFromIdNumber(value);
        }
        
        updatedMembers[index] = member;
        setTableMembers(updatedMembers);

        // Auto-save member (debounce logic similar to OrderMemberView if needed)
        // For now, directly call updateMember for simplicity or add debounce here
        if (member.id) {
          updateMember(member.id, member); // Assuming updateMember can handle Partial<Member>
        }
      },
      [tableMembers, updateMember]
    );

    const handleDataUpdate = useCallback(
      (newData: EditingMember[]) => {
        const processedData = newData.map((member, index) => {
            const processed = { ...member };
            if (processed.id_number) {
                processed.gender = getGenderFromIdNumber(processed.id_number);
                const age = calculateAge(processed.id_number, tourDepartureDate);
                if (age !== null && 'age' in processed) {
                    (processed as EditingMember & { age: number }).age = age;
                }
            } else if (processed.birthday) {
                const age = calculateAge(String(processed.birthday), tourDepartureDate);
                if (age !== null && 'age' in processed) {
                    (processed as EditingMember & { age: number }).age = age;
                }
            }
            return processed;
        });
        setTableMembers(processedData);
        // Implement batch update or individual updates here if needed
        // For simplicity, let's assume individual updates are handled by handleEditModeChange
        // or a dedicated save button for batch updates.
      },
      [tourDepartureDate]
    );

    const tourMemberColumns: DataSheetColumn[] = useMemo(() => [
      { key: 'index', label: '序號', width: 40, readOnly: true },
      {
        key: 'name',
        label: '姓名',
        width: 100,
        valueRenderer: (cell) => {
          const rowData = cell.rowData as Member | undefined;
          const hasPassport = rowData?.passport_image_url;
          const name = cell.value as string;
          // Simplified for TourMemberView, no direct customer verification status display for now
          if (hasPassport) {
            return (
              <span className="flex items-center gap-1 cursor-pointer text-primary hover:underline">
                <ImageIcon size={12} className="text-primary flex-shrink-0" />
                <span className="truncate">{name}</span>
              </span>
            );
          }
          return name || '';
        },
      },
      { key: 'nameEn', label: '英文姓名', width: 100 },
      { key: 'birthday', label: '生日', width: 100 },
      { key: 'age', label: '年齡', width: 60, readOnly: true },
      { key: 'gender', label: '性別', width: 50, readOnly: true },
      { key: 'idNumber', label: '身分證字號', width: 120 },
      { key: 'passportNumber', label: '護照號碼', width: 100 },
      { key: 'passportExpiry', label: '護照效期', width: 100 },
      { key: 'reservationCode', label: '訂位代號', width: 100 },
      { key: 'order_number', label: '訂單編號', width: 100, readOnly: true }, // Display order number
      // Add tour-specific columns here, e.g., room assignment, vehicle assignment
      { key: 'room_number', label: '房號', width: 80 },
      { key: 'vehicle_number', label: '車號', width: 80 },
    ], []);


    return (
      <div className="w-full">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="text-sm text-muted-foreground">
            共 {tableMembers.length} 位成員
          </div>
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            {isEditMode ? '完成編輯' : '全部編輯模式'}
          </Button>
        </div>

        <MemberTable
          data={tableMembers.map((member, index: number) => {
            const age = calculateAge(member.id_number || member.birthday || '', tourDepartureDate);
            const order = allOrders.find(o => o.id === member.order_id);
            return {
              ...member,
              index: index + 1,
              age: age !== null ? `${age}歲` : '',
              gender: member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '',
              order_number: order?.order_number || '', // Display order number
            };
          })}
          columns={tourMemberColumns}
          isEditMode={isEditMode}
          handleEditModeChange={handleEditModeChange}
          handleDataUpdate={handleDataUpdate as (data: unknown[]) => void}
        />

        <div className="text-xs text-morandi-secondary px-6 py-2 space-y-1">
          <p>• 顯示旅遊團所有成員</p>
          <p>• 姓名列顯示所屬訂單編號</p>
          <p>• 可選全部編輯模式，直接修改所有欄位</p>
          <p>• 年齡根據旅遊團出發日期自動計算</p>
        </div>
      </div>
    );
  }
);

TourMemberView.displayName = 'TourMemberView';