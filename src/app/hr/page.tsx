'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserStore, userStoreHelpers } from '@/stores/user-store';
import { Employee } from '@/stores/types';
import { EmployeeExpandedView } from '@/components/hr/employee-expanded-view';
import { AddEmployeeForm } from '@/components/hr/add-employee-form';
import { User, Building, Phone, Mail, UserCheck, UserX, Clock, Briefcase, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '在職' },
  { value: 'probation', label: '試用期' },
  { value: 'leave', label: '請假' },
  { value: 'terminated', label: '離職' }
];

export default function HRPage() {
  const { items: users, fetchAll, loading: isLoading, update: updateUser, delete: deleteUser } = useUserStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 初始化時載入員工資料（只在沒有資料時載入）
  useEffect(() => {
    if (users.length === 0) {
      fetchAll();
    }
  }, []);

  const filteredEmployees = useMemo(() => {
    if (statusFilter === 'all') {
      return searchTerm ? userStoreHelpers.searchUsers(searchTerm) : users;
    } else {
      return userStoreHelpers.getUsersByStatus(statusFilter as Employee['status']).filter((emp: Employee) =>
        !searchTerm || userStoreHelpers.searchUsers(searchTerm).includes(emp)
      );
    }
  }, [users, statusFilter, searchTerm]);

  const getStatusColor = (status: Employee['status']) => {
    const colorMap = {
      active: 'text-green-600',
      probation: 'text-yellow-600',
      leave: 'text-blue-600',
      terminated: 'text-morandi-red'
    };
    return colorMap[status];
  };

  const getStatusLabel = (status: Employee['status']) => {
    const statusMap = {
      active: '在職',
      probation: '試用期',
      leave: '請假',
      terminated: '離職'
    };
    return statusMap[status];
  };

  const getStatusIcon = (status: Employee['status']) => {
    const iconMap = {
      active: UserCheck,
      probation: Clock,
      leave: UserX,
      terminated: UserX
    };
    return iconMap[status];
  };

  const handleEmployeeClick = (employee: Employee) => {
    setExpandedEmployee(employee.id);
  };

  const handleTerminateEmployee = async (employee: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmMessage = `⚠️ 確定要將員工「${employee.display_name || (employee as any).chinese_name || '未命名員工'}」辦理離職嗎？\n\n離職後將無法登入系統，但歷史記錄會保留。`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await updateUser(employee.id, { status: 'terminated' });
      if (expandedEmployee === employee.id) {
        setExpandedEmployee(null);
      }
    } catch (err) {
      console.error('辦理離職失敗:', err);
      alert('操作失敗，請稍後再試');
    }
  };

  const handleDeleteEmployee = async (employee: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmMessage = `⚠️⚠️⚠️ 確定要刪除員工「${employee.display_name || (employee as any).chinese_name || '未命名員工'}」嗎？\n\n此操作會：\n- 永久刪除員工所有資料\n- 移除所有歷史記錄\n- 無法復原\n\n建議使用「辦理離職」功能來保留歷史記錄。\n\n真的要刪除嗎？`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteUser(employee.id);
      if (expandedEmployee === employee.id) {
        setExpandedEmployee(null);
      }
      alert(`✅ 員工「${employee.display_name || (employee as any).chinese_name || '未命名員工'}」已成功刪除`);
    } catch (err) {
      console.error('刪除員工失敗:', err);
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      alert(`❌ 刪除失敗：${errorMessage}`);
    }
  };

  return (
    <>
      <ResponsiveHeader
        title="人資管理"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋員工..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增員工"
      >
        {/* 狀態篩選 */}
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                statusFilter === filter.value
                  ? 'bg-morandi-gold text-white'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </ResponsiveHeader>

      {/* 員工卡片網格 */}
      <div className="mt-6">
        {/* 載入中狀態 */}
        {isLoading && (
          <div className="text-center py-12 text-morandi-muted">
            <div className="animate-spin w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>載入員工資料中...</p>
          </div>
        )}

        {/* 員工卡片 */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((employee) => {
            const StatusIcon = getStatusIcon(employee.status);
            return (
              <div
                key={employee.id}
                onClick={() => handleEmployeeClick(employee)}
                className="bg-white rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
              >
                {/* 右上角操作按鈕 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {employee.status !== 'terminated' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleTerminateEmployee(employee, e)}
                      className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-100"
                      title="辦理離職"
                    >
                      <UserX size={14} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteEmployee(employee, e)}
                    className="h-7 w-7 p-0 text-morandi-red hover:bg-morandi-red/10"
                    title="刪除（不建議）"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                {/* 員工頭像與基本資訊 */}
                <div className="flex flex-col items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-morandi-container/30 flex items-center justify-center mb-2">
                    {employee.avatar ? (
                      <img
                        src={employee.avatar}
                        alt={employee.display_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-morandi-secondary" />
                    )}
                  </div>
                  <h3 className="font-semibold text-morandi-primary text-center">
                    {employee.display_name || (employee as any).chinese_name || '未命名員工'}
                  </h3>
                  <p className="text-sm text-morandi-muted">
                    {employee.employee_number}
                  </p>
                </div>

                {/* 聯絡資訊 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-morandi-secondary" />
                    <span className="text-morandi-primary">{employee.personal_info?.phone || '未提供'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-morandi-secondary" />
                    <span className="text-morandi-primary truncate">{employee.personal_info?.email || '未提供'}</span>
                  </div>
                </div>

                {/* 狀態標示 */}
                <div className="flex items-center justify-between">
                  <div className={cn('flex items-center gap-1 text-sm font-medium', getStatusColor(employee.status))}>
                    <StatusIcon size={14} />
                    <span>{getStatusLabel(employee.status)}</span>
                  </div>

                  {/* 權限數量 */}
                  <div className="text-xs text-morandi-muted">
                    {employee.permissions?.length || 0} 項權限
                  </div>
                </div>

                {/* 入職日期 */}
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-morandi-muted">
                    入職：{employee.job_info?.hire_date ? new Date(employee.job_info.hire_date).toLocaleDateString() : '未設定'}
                  </p>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* 無資料狀態 */}
        {!isLoading && filteredEmployees.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-morandi-primary mb-2">
              {statusFilter === 'all' ? '還沒有任何員工' : `沒有找到「${statusFilters.find(f => f.value === statusFilter)?.label}」狀態的員工`}
            </p>
            <p className="text-sm text-morandi-secondary">
              {statusFilter === 'all' ? '點擊右上角「新增員工」開始建立' : '嘗試調整篩選條件或新增員工'}
            </p>
          </div>
        )}
      </div>

      {/* 員工詳細資料展開視圖 */}
      {expandedEmployee && (
        <EmployeeExpandedView
          employee_id={expandedEmployee}
          onClose={() => setExpandedEmployee(null)}
        />
      )}

      {/* 新增員工對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增員工</DialogTitle>
          </DialogHeader>
          <AddEmployeeForm
            onSubmit={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}