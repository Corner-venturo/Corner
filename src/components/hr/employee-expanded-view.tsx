'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/user-store';
import { cn } from '@/lib/utils';
import {
  User,
  DollarSign,
  Shield,
  Calendar,
  FileText,
  X,
  Edit,
  Save
} from 'lucide-react';

// 導入分頁組件
import { BasicInfoTab } from './tabs/basic-info-tab';
import { SalaryTab } from './tabs/salary-tab';
import { PermissionsTab } from './tabs/permissions-tab';
import { AttendanceTab } from './tabs/attendance-tab';
import { ContractsTab } from './tabs/contracts-tab';
import { SYSTEM_PERMISSIONS } from '@/stores/types';

interface EmployeeExpandedViewProps {
  employeeId: string;
  onClose: () => void;
}

type EmployeeTab = 'basic' | 'salary' | 'permissions' | 'attendance' | 'contracts';

export function EmployeeExpandedView({ employeeId, onClose }: EmployeeExpandedViewProps) {
  const { getUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<EmployeeTab>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const basicInfoTabRef = useRef<{ handleSave: () => void }>(null);
  const salaryTabRef = useRef<{ handleSave: () => void }>(null);
  const permissionsTabRef = useRef<{ handleSave: () => void }>(null);
  const attendanceTabRef = useRef<{ handleSave: () => void }>(null);
  const contractsTabRef = useRef<{ handleSave: () => void }>(null);

  const employee = getUser(employeeId);

  if (!employee) {
    return null;
  }

  const tabs = [
    { key: 'basic' as const, label: '基本資料', icon: User },
    { key: 'salary' as const, label: '薪資', icon: DollarSign },
    { key: 'permissions' as const, label: '權限', icon: Shield },
    { key: 'attendance' as const, label: '出勤', icon: Calendar },
    { key: 'contracts' as const, label: '合約', icon: FileText },
  ];

  const renderTabStats = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="text-morandi-muted">
            入職日期：{new Date(employee.jobInfo.hireDate).toLocaleDateString()}
          </div>
        );
      case 'salary':
        const totalAllowances = employee.salaryInfo.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
        return (
          <div className="flex items-center gap-4 text-morandi-muted">
            <span>底薪：NT$ {employee.salaryInfo.baseSalary.toLocaleString()}</span>
            <span>津貼：NT$ {totalAllowances.toLocaleString()}</span>
            <span className="text-morandi-primary font-medium">
              總薪資：NT$ {(employee.salaryInfo.baseSalary + totalAllowances).toLocaleString()}
            </span>
          </div>
        );
      case 'permissions':
        return (
          <div className="text-morandi-muted">
            已授權 {employee.permissions.length} / {SYSTEM_PERMISSIONS.length} 項功能
          </div>
        );
      case 'attendance':
        return (
          <div className="flex items-center gap-4 text-morandi-muted">
            <span>請假記錄：{employee.attendance.leaveRecords.length} 筆</span>
            <span>加班記錄：{employee.attendance.overtimeRecords.length} 筆</span>
          </div>
        );
      case 'contracts':
        return (
          <div className="text-morandi-muted">
            合約記錄：{employee.contracts.length} 筆
          </div>
        );
      default:
        return null;
    }
  };

  const handleSave = async () => {
    try {
      // 根據不同頁面調用對應的儲存函數
      if (activeTab === 'permissions' && permissionsTabRef.current) {
        await permissionsTabRef.current.handleSave();
      } else if (activeTab === 'basic' && basicInfoTabRef.current) {
        await basicInfoTabRef.current.handleSave();
      } else if (activeTab === 'salary' && salaryTabRef.current) {
        await salaryTabRef.current.handleSave();
      } else if (activeTab === 'attendance' && attendanceTabRef.current) {
        await attendanceTabRef.current.handleSave();
      } else if (activeTab === 'contracts' && contractsTabRef.current) {
        await contractsTabRef.current.handleSave();
      }

      // 重新載入員工資料以確保顯示最新內容
      const { loadUsersFromDatabase } = useUserStore.getState();
      await loadUsersFromDatabase();

      setIsEditing(false);
    } catch (error) {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請稍後再試');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfoTab ref={basicInfoTabRef} employee={employee} isEditing={isEditing} setIsEditing={setIsEditing} />;
      case 'salary':
        return <SalaryTab ref={salaryTabRef} employee={employee} isEditing={isEditing} setIsEditing={setIsEditing} />;
      case 'permissions':
        return <PermissionsTab ref={permissionsTabRef} employee={employee} isEditing={isEditing} setIsEditing={setIsEditing} />;
      case 'attendance':
        return <AttendanceTab ref={attendanceTabRef} employee={employee} isEditing={isEditing} setIsEditing={setIsEditing} />;
      case 'contracts':
        return <ContractsTab ref={contractsTabRef} employee={employee} isEditing={isEditing} setIsEditing={setIsEditing} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-morandi-container/30 flex items-center justify-center">
              {employee.avatar ? (
                <img
                  src={employee.avatar}
                  alt={employee.chineseName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User size={24} className="text-morandi-secondary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-morandi-primary">
                {employee.chineseName} ({employee.englishName})
              </h2>
              <p className="text-morandi-secondary">
                {employee.employeeNumber} | {employee.jobInfo.department} | {employee.jobInfo.position}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* 分頁導航 */}
        <div className="flex items-center justify-between border-b border-border px-6">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                    activeTab === tab.key
                      ? 'text-morandi-primary border-b-2 border-morandi-gold'
                      : 'text-morandi-secondary hover:text-morandi-primary'
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 中間統計資訊區域 */}
          <div className="flex items-center gap-6 text-sm">
            {renderTabStats()}
          </div>

          {/* 編輯按鈕區域 */}
          <div className="py-3">
            {isEditing ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Save size={14} className="mr-1" />
                  儲存
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X size={14} className="mr-1" />
                  取消
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit size={14} className="mr-1" />
                編輯
              </Button>
            )}
          </div>
        </div>

        {/* 分頁內容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}