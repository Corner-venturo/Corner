/**
 * DisbursementPage
 * 出納單管理主頁面
 */

'use client';

import { useCallback } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { FileText, Calendar, Wallet } from 'lucide-react';
import { useDisbursementData } from '../hooks/useDisbursementData';
import { useDisbursementFilters } from '../hooks/useDisbursementFilters';
import { useDisbursementForm } from '../hooks/useDisbursementForm';
import { PendingList, CurrentOrderList, EmptyCurrentOrder, HistoryList } from './DisbursementList';
import { DisbursementDialog } from './DisbursementDialog';

export function DisbursementPage() {
  // 獲取數據
  const {
    disbursement_orders,
    pendingRequests,
    currentOrder,
    currentOrderRequests,
    nextThursday,
    addToCurrentDisbursementOrder,
    removeFromDisbursementOrder,
    confirmDisbursementOrder,
    createDisbursementOrder,
    generateDisbursementNumber
  } = useDisbursementData();

  // 篩選和搜尋
  const { activeTab, setActiveTab, searchTerm, setSearchTerm, dialogSearchTerm, setDialogSearchTerm } = useDisbursementFilters();

  // 表單狀態
  const {
    selectedRequests,
    selectedRequestsForNew,
    isAddDialogOpen,
    selectedAmount,
    selectedAmountForNew,
    setIsAddDialogOpen,
    handleSelectRequest,
    handleSelectRequestForNew,
    handleSelectAllForNew,
    resetForm,
    clearSelections
  } = useDisbursementForm(pendingRequests);

  // 加入出納單
  const handleAddToDisbursement = useCallback(() => {
    if (selectedRequests.length === 0) return;
    addToCurrentDisbursementOrder(selectedRequests);
    clearSelections();
  }, [selectedRequests, addToCurrentDisbursementOrder, clearSelections]);

  // 從出納單移除
  const handleRemoveFromDisbursement = useCallback(
    (paymentRequestId: string) => {
      if (!currentOrder) return;
      removeFromDisbursementOrder(currentOrder.id, paymentRequestId);
    },
    [currentOrder, removeFromDisbursementOrder]
  );

  // 確認出納單
  const handleConfirmDisbursement = useCallback(() => {
    if (!currentOrder) return;
    confirmDisbursementOrder(currentOrder.id, '1'); // 使用實際用戶ID
  }, [currentOrder, confirmDisbursementOrder]);

  // 新增出納單
  const handleCreateDisbursement = useCallback(() => {
    if (selectedRequestsForNew.length === 0) return;
    createDisbursementOrder(selectedRequestsForNew);
    setDialogSearchTerm('');
    resetForm();
    setActiveTab('current'); // 切換到本週出帳查看新建的出納單
  }, [selectedRequestsForNew, createDisbursementOrder, resetForm, setActiveTab, setDialogSearchTerm]);

  // 取消新增對話框
  const handleCancelDialog = useCallback(() => {
    setIsAddDialogOpen(false);
    resetForm();
    setDialogSearchTerm('');
  }, [resetForm, setIsAddDialogOpen, setDialogSearchTerm]);

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="出納單管理"
        tabs={[
          { value: 'pending', label: '待出帳', icon: FileText },
          { value: 'current', label: '本週出帳', icon: Calendar },
          { value: 'all', label: '出納單列表', icon: Wallet }
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'pending' | 'current' | 'all')}
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增出納單"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋請款單號、團號或團名..."
      />

      <div className="flex-1 overflow-auto">
        {/* 待出帳頁面 */}
        {activeTab === 'pending' && (
          <PendingList
            data={pendingRequests}
            selectedRequests={selectedRequests}
            selectedAmount={selectedAmount}
            searchTerm={searchTerm}
            nextThursday={nextThursday}
            onSelectRequest={handleSelectRequest}
            onAddToDisbursement={handleAddToDisbursement}
          />
        )}

        {/* 本週出帳頁面 */}
        {activeTab === 'current' && (
          <>
            {currentOrder ? (
              <CurrentOrderList
                currentOrder={currentOrder}
                requests={currentOrderRequests}
                searchTerm={searchTerm}
                onRemove={handleRemoveFromDisbursement}
                onConfirm={handleConfirmDisbursement}
              />
            ) : (
              <EmptyCurrentOrder onNavigate={() => setActiveTab('pending')} />
            )}
          </>
        )}

        {/* 出納單列表頁面 */}
        {activeTab === 'all' && <HistoryList data={disbursement_orders} searchTerm={searchTerm} />}
      </div>

      {/* 新增出納單對話框 */}
      <DisbursementDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        pendingRequests={pendingRequests}
        selectedRequests={selectedRequestsForNew}
        selectedAmount={selectedAmountForNew}
        searchTerm={dialogSearchTerm}
        orderNumber={generateDisbursementNumber()}
        nextThursday={nextThursday}
        onSearchChange={setDialogSearchTerm}
        onSelectRequest={handleSelectRequestForNew}
        onSelectAll={handleSelectAllForNew}
        onCreate={handleCreateDisbursement}
        onCancel={handleCancelDialog}
      />
    </div>
  );
}
