'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { Employee } from '@/stores/types';
import { _Clock } from 'lucide-react';

interface AttendanceTabProps {
  employee: Employee;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
}

export const AttendanceTab = forwardRef<{ handleSave: () => void }, AttendanceTabProps>(
  ({ employee }, ref) => {
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      // 出勤資訊目前為唯讀，未來若需編輯功能可在此實作
      console.log('AttendanceTab handleSave called');
    }
  }));

  const getLeaveTypeLabel = (type: Employee['attendance']['leave_records'][0]['type']) => {
    const typeMap = {
      annual: '年假',
      sick: '病假',
      personal: '事假',
      maternity: '產假',
      other: '其他'
    };
    return typeMap[type];
  };

  const getStatusColor = (status: Employee['attendance']['leave_records'][0]['status']) => {
    const colorMap = {
      pending: 'text-yellow-600',
      approved: 'text-green-600',
      rejected: 'text-red-600'
    };
    return colorMap[status];
  };

  return (
    <div className="space-y-6">
      {/* 請假紀錄 */}
      <div className="bg-morandi-container/10 rounded-lg p-4">
        <h4 className="font-medium text-morandi-primary mb-3">請假紀錄</h4>

        {employee.attendance.leave_records.length > 0 ? (
          <div className="space-y-3">
            {employee.attendance.leave_records.map((record) => (
              <div key={record.id} className="bg-white rounded border p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-morandi-primary">
                      {getLeaveTypeLabel(record.type)}
                    </span>
                    <span className={`ml-2 text-sm font-medium ${getStatusColor(record.status)}`}>
                      {record.status === 'pending' ? '待審核' :
                       record.status === 'approved' ? '已核准' : '已拒絕'}
                    </span>
                  </div>
                  <span className="text-sm text-morandi-muted">
                    {record.days} 天
                  </span>
                </div>
                <div className="text-sm text-morandi-secondary">
                  {new Date(record.start_date).toLocaleDateString()} - {new Date(record.end_date).toLocaleDateString()}
                </div>
                {record.reason && (
                  <div className="text-sm text-morandi-muted mt-1">
                    原因：{record.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-morandi-muted text-sm">無請假紀錄</p>
        )}
      </div>

      {/* 加班紀錄 */}
      <div className="bg-morandi-container/10 rounded-lg p-4">
        <h4 className="font-medium text-morandi-primary mb-3">加班紀錄</h4>

        {employee.attendance.overtime_records.length > 0 ? (
          <div className="space-y-3">
            {employee.attendance.overtime_records.map((record) => (
              <div key={record.id} className="bg-white rounded border p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-morandi-primary">
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                  <span className="text-sm text-morandi-muted">
                    {record.hours} 小時
                  </span>
                </div>
                <div className="text-sm text-morandi-muted">
                  原因：{record.reason}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-morandi-muted text-sm">無加班紀錄</p>
        )}
      </div>
    </div>
  );
});