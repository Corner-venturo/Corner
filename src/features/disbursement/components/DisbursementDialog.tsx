/**
 * DisbursementDialog
 * 新增出納單對話框
 */

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { FileText } from 'lucide-react';
import { PaymentRequest } from '../types';
import { useMemo } from 'react';

interface DisbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingRequests: PaymentRequest[];
  selectedRequests: string[];
  selectedAmount: number;
  searchTerm: string;
  orderNumber: string;
  nextThursday: string | Date;
  onSearchChange: (term: string) => void;
  onSelectRequest: (requestId: string) => void;
  onSelectAll: () => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function DisbursementDialog({
  open,
  onOpenChange,
  pendingRequests,
  selectedRequests,
  selectedAmount,
  searchTerm,
  orderNumber,
  nextThursday,
  onSearchChange,
  onSelectRequest,
  onSelectAll,
  onCreate,
  onCancel
}: DisbursementDialogProps) {
  const columns = useMemo<TableColumn[]>(
    () => [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={selectedRequests.length === pendingRequests.length && pendingRequests.length > 0}
            onChange={onSelectAll}
            className="rounded border-morandi-secondary"
          />
        ),
        width: '50px',
        render: (_value, row) => (
          <input
            type="checkbox"
            checked={selectedRequests.includes(row.id)}
            onChange={() => onSelectRequest(row.id)}
            className="rounded border-morandi-secondary"
          />
        )
      },
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        render: (value) => <div className="font-medium text-morandi-primary">{value}</div>
      },
      {
        key: 'code',
        label: '團號',
        sortable: true,
        render: (value) => <div className="font-medium">{value}</div>
      },
      {
        key: 'tour_name',
        label: '團名',
        sortable: true,
        render: (value) => <div className="text-morandi-secondary">{value}</div>
      },
      {
        key: 'request_date',
        label: '請款日期',
        sortable: true,
        render: (value) => <div className="text-sm text-morandi-secondary">{value}</div>
      },
      {
        key: 'total_amount',
        label: '金額',
        sortable: true,
        render: (value) => <div className="font-bold text-morandi-primary text-right">NT$ {value.toLocaleString()}</div>
      }
    ],
    [selectedRequests, pendingRequests.length, onSelectRequest, onSelectAll]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">新增出納單</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            {orderNumber} • {typeof nextThursday === 'string' ? nextThursday : nextThursday.toLocaleDateString('zh-TW')}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {pendingRequests.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-morandi-secondary opacity-50" />
                <p className="text-lg text-morandi-secondary">目前沒有待出帳的請款單</p>
              </div>
            </div>
          ) : (
            <>
              {/* 統計和搜尋 */}
              <div className="flex items-center justify-between py-3 px-4 border-b bg-gray-50">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">共 {pendingRequests.length} 筆請款單</span>
                  {selectedRequests.length > 0 && (
                    <span className="text-sm text-morandi-secondary">
                      • 已選 {selectedRequests.length} 筆 •
                      <span className="font-bold text-morandi-primary ml-1">NT$ {selectedAmount.toLocaleString()}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="搜尋請款單號、團號或團名..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-64 px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary"
                  />
                </div>
              </div>

              {/* 表格 */}
              <div className="flex-1 overflow-hidden">
                <EnhancedTable
                  data={pendingRequests}
                  columns={columns}
                  searchableFields={['request_number', 'code', 'tour_name']}
                  searchTerm={searchTerm}
                  initialPageSize={15}
                />
              </div>
            </>
          )}
        </div>

        {/* 底部操作區 */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel} className="px-6">
              取消
            </Button>
            <Button
              onClick={onCreate}
              disabled={selectedRequests.length === 0}
              className="bg-morandi-gold hover:bg-morandi-gold/90 px-6"
            >
              建立出納單 ({selectedRequests.length} 筆)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
