'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ListPageLayout } from '@/components/layout/list-page-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserStore, userStoreHelpers } from '@/stores/user-store';
import { Employee } from '@/stores/types';
import { EmployeeExpandedView } from '@/components/hr/employee-expanded-view';
import { AddEmployeeForm } from '@/components/hr/add-employee';
import { Users, Edit2, Trash2, UserX } from 'lucide-react';
import { TableColumn } from '@/components/ui/enhanced-table';
import { DateCell, ActionCell } from '@/components/table-cells';

export default function HRPage() {
  const { items: users, fetchAll, update: updateUser, delete: deleteUser } = useUserStore();
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 初始化時載入員工資料（只在沒有資料時載入）
  useEffect(() => {
    if (users.length === 0) {
      fetchAll();
    }
  }, [users.length, fetchAll]);

  const getStatusLabel = (status: Employee['status']) => {
    const statusMap = {
      active: '在職',
      probation: '試用期',
      leave: '請假',
      terminated: '離職'
    };
    return statusMap[status];
  };

  const getStatusColor = (status: Employee['status']) => {
    const colorMap = {
      active: 'text-morandi-primary bg-morandi-container',
      probation: 'text-yellow-600 bg-yellow-50',
      leave: 'text-blue-600 bg-blue-50',
      terminated: 'text-morandi-red bg-morandi-red/10'
    };
    return colorMap[status];
  };

  const handleEmployeeClick = (employee: Employee) => {
    setExpandedEmployee(employee.id);
  };

  const handleTerminateEmployee = async (employee: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmMessage = `⚠️ 確定要將員工「${employee.display_name || (employee as unknown).chinese_name || '未命名員工'}」辦理離職嗎？\n\n離職後將無法登入系統，但歷史記錄會保留。`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await updateUser(employee.id, { status: 'terminated' });
      if (expandedEmployee === employee.id) {
        setExpandedEmployee(null);
      }
    } catch (err) {
            alert('操作失敗，請稍後再試');
    }
  };

  const handleDeleteEmployee = async (employee: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmMessage = `⚠️⚠️⚠️ 確定要刪除員工「${employee.display_name || (employee as unknown).chinese_name || '未命名員工'}」嗎？\n\n此操作會：\n- 永久刪除員工所有資料\n- 移除所有歷史記錄\n- 無法復原\n\n建議使用「辦理離職」功能來保留歷史記錄。\n\n真的要刪除嗎？`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteUser(employee.id);
      if (expandedEmployee === employee.id) {
        setExpandedEmployee(null);
      }
      alert(`✅ 員工「${employee.display_name || (employee as unknown).chinese_name || '未命名員工'}」已成功刪除`);
    } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      alert(`❌ 刪除失敗：${errorMessage}`);
    }
  };

  // 定義表格欄位
  const columns: TableColumn<Employee>[] = useMemo(() => [
    {
      key: 'employee_number',
      label: '員工編號',
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'display_name',
      label: '姓名',
      sortable: true,
      render: (value, employee) => (
        <span className="font-medium">{value || (employee as unknown).chinese_name || '未命名員工'}</span>
      ),
    },
    {
      key: 'job_info',
      label: '職位',
      sortable: false,
      render: (value) => (
        <span className="text-sm">{value?.position || '未設定'}</span>
      ),
    },
    {
      key: 'personal_info',
      label: '聯絡方式',
      sortable: false,
      render: (value) => (
        <div className="text-sm">
          <div>{value?.phone || '未提供'}</div>
          <div className="text-morandi-muted text-xs truncate max-w-[200px]">{value?.email || '未提供'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(value)}`}>
          {getStatusLabel(value)}
        </span>
      ),
    },
    {
      key: 'job_info',
      label: '入職日期',
      sortable: true,
      render: (value) => {
        if (!value?.hire_date) return <span className="text-morandi-muted text-sm">未設定</span>;
        return <DateCell value={value.hire_date} />;
      },
    },
  ], []);

  const renderActions = useCallback((employee: Employee) => (
    <ActionCell
      actions={[
        {
          icon: Edit2,
          label: '編輯',
          onClick: () => setExpandedEmployee(employee.id),
        },
        ...(employee.status !== 'terminated' ? [{
          icon: UserX,
          label: '辦理離職',
          onClick: () => handleTerminateEmployee(employee),
          variant: 'warning' as const,
        }] : []),
        {
          icon: Trash2,
          label: '刪除',
          onClick: () => handleDeleteEmployee(employee),
          variant: 'danger' as const,
        },
      ]}
    />
  ), []);

  return (
    <>
      <ListPageLayout
        title="人資管理"
        icon={Users}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '人資管理', href: '/hr' }
        ]}
        data={users}
        columns={columns}
        searchFields={['display_name', 'employee_number', 'personal_info.email', 'personal_info.phone']}
        searchPlaceholder="搜尋員工..."
        onRowClick={handleEmployeeClick}
        renderActions={renderActions}
        onAdd={() => setIsAddDialogOpen(true)}
        addButtonLabel="新增員工"
        bordered={true}
      />

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