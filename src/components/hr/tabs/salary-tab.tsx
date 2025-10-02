'use client';

import React from 'react';
import { Employee } from '@/stores/types';
import { DollarSign, TrendingUp } from 'lucide-react';

interface SalaryTabProps {
  employee: Employee;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
}

export function SalaryTab({ employee, isEditing, setIsEditing }: SalaryTabProps) {
  const totalAllowances = employee.salaryInfo.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);

  return (
    <div className="space-y-6">
      {/* 目前薪資資訊 */}
      <div className="bg-morandi-container/10 rounded-lg p-4">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-morandi-primary">
              NT$ {employee.salaryInfo.baseSalary.toLocaleString()}
            </p>
            <p className="text-sm text-morandi-muted">底薪</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-morandi-gold">
              NT$ {totalAllowances.toLocaleString()}
            </p>
            <p className="text-sm text-morandi-muted">津貼</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              NT$ {(employee.salaryInfo.baseSalary + totalAllowances).toLocaleString()}
            </p>
            <p className="text-sm text-morandi-muted">總薪資</p>
          </div>
        </div>
      </div>

      {/* 津貼明細 */}
      <div className="bg-morandi-container/10 rounded-lg p-4">
        <h4 className="font-medium text-morandi-primary mb-3">津貼明細</h4>
        {employee.salaryInfo.allowances.length > 0 ? (
          <div className="space-y-2">
            {employee.salaryInfo.allowances.map((allowance, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-primary">{allowance.type}</span>
                <span className="font-medium">NT$ {allowance.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-morandi-muted text-sm">無津貼項目</p>
        )}
      </div>

      {/* 薪資調整歷史 */}
      <div className="bg-morandi-container/10 rounded-lg p-4">
        <h4 className="font-medium text-morandi-primary mb-3 flex items-center gap-2">
          <TrendingUp size={16} />
          薪資調整歷史
        </h4>
        <div className="space-y-3">
          {employee.salaryInfo.salaryHistory.map((record, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
              <div>
                <p className="font-medium text-morandi-primary">
                  NT$ {record.baseSalary.toLocaleString()}
                </p>
                <p className="text-sm text-morandi-muted">{record.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-morandi-secondary">
                  {new Date(record.effectiveDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}