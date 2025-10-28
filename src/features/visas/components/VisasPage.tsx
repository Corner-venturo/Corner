'use client';

import React, { useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, FileCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { logger } from '@/lib/utils/logger';
import { tourService } from '@/features/tours/services/tour.service';
import { useVisasData } from '../hooks/useVisasData';
import { useVisasFilters } from '../hooks/useVisasFilters';
import { useVisasDialog } from '../hooks/useVisasDialog';
import { VisasList } from './VisasList';
import { VisasInfoDialog } from './VisasInfoDialog';
import { AddVisaDialog } from './AddVisaDialog';

// ============================================
// 簽證管理主頁面
// ============================================

export default function VisasPage() {
  // 資料管理
  const {
    visas,
    tours,
    orders,
    user,
    canManageVisas,
    addVisa,
    updateVisa,
    deleteVisa,
    addTour,
    fetchTours,
    addOrder,
  } = useVisasData();

  // 篩選管理
  const {
    activeTab,
    setActiveTab,
    selectedRows,
    setSelectedRows,
    filteredVisas,
  } = useVisasFilters(visas);

  // 對話框管理
  const {
    isDialogOpen,
    setIsDialogOpen,
    contact_info,
    setContactInfo,
    applicants,
    setApplicants,
    tourOptions,
    calculateFee,
    addApplicant,
    removeApplicant,
    updateApplicant,
    resetForm,
  } = useVisasDialog(tours);

  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);

  // 當頁面載入時，自動取得或建立當年度簽證專用團
  useEffect(() => {
    const initVisaTour = async () => {
      try {
        const visaTour = await tourService.getOrCreateVisaTour();
        await fetchTours();

        if (visaTour && !contact_info.tour_id) {
          setContactInfo(prev => ({ ...prev, tour_id: visaTour.id }));
        }
      } catch (error) {
                logger.error('Failed to get or create visa tour', error);
      }
    };

    initVisaTour();
  }, [contact_info.tour_id, fetchTours, setContactInfo]);

  // 權限檢查：清除選擇
  useEffect(() => {
    if (!canManageVisas && selectedRows.length > 0) {
      setSelectedRows([]);
    }
  }, [canManageVisas, selectedRows.length, setSelectedRows]);

  // 第一個辦理人自動帶入申請人姓名
  useEffect(() => {
    if (applicants.length > 0) {
      setApplicants(prev => {
        const updated = [...prev];
        updated[0].name = contact_info.applicant_name;
        return updated;
      });
    }
  }, [contact_info.applicant_name, applicants.length, setApplicants]);

  // 處理批次新增簽證
  const handleAddVisa = async () => {
    if (!canManageVisas || !contact_info.applicant_name || !user) return;

    let selectedTour;

    // 如果沒選團號，自動建立或使用預設的「簽證代辦團」
    if (!contact_info.tour_id) {
      const currentYear = new Date().getFullYear();
      const defaultTourCode = `VISA-${currentYear}`;
      const existingDefaultTour = tours.find(t => t.code === defaultTourCode);

      if (existingDefaultTour) {
        selectedTour = existingDefaultTour;
      } else {
        const endOfYear = `${currentYear}-12-31`;
        selectedTour = await addTour({
          name: `${currentYear}年度簽證代辦`,
          departure_date: endOfYear,
          return_date: endOfYear,
          status: 'special' as const,
          location: 'VISA',
          price: 0,
          max_participants: 9999,
          contract_status: 'pending' as const,
          total_revenue: 0,
          total_cost: 0,
          profit: 0,
        } as unknown);
      }
    } else {
      selectedTour = tours.find(t => t.id === contact_info.tour_id);
      if (!selectedTour) return;
    }

    // 取得或建立訂單
    const totalFee = applicants.reduce((sum, a) => sum + calculateFee(a.country), 0);
    let targetOrder;

    if (contact_info.order_id) {
      targetOrder = orders.find(o => o.id === contact_info.order_id);
      if (!targetOrder) return;
    } else {
      const tourOrders = orders.filter(o => o.tour_id === selectedTour.id);
      const nextNumber = (tourOrders.length + 1).toString().padStart(3, '0');
      const order_number = `${selectedTour.code}-${nextNumber}`;

      targetOrder = await addOrder({
        order_number,
        tour_id: selectedTour.id,
        code: order_number,
        tour_name: selectedTour.name,
        contact_person: contact_info.contact_person || contact_info.applicant_name,
        sales_person: user.display_name || '系統',
        assistant: user.display_name || '系統',
        member_count: applicants.filter(a => a.name).length,
        total_amount: totalFee,
        paid_amount: 0,
        remaining_amount: totalFee,
        payment_status: 'unpaid' as const,
      });
    }

    if (!targetOrder) {
      logger.error('訂單建立失敗');
      return;
    }

    // 批次建立簽證
    applicants.forEach((applicant) => {
      if (!applicant.name) return;

      const fee = calculateFee(applicant.country);
      const total_cost = applicant.is_urgent ? applicant.cost + 900 : applicant.cost;

      addVisa({
        applicant_name: applicant.name,
        contact_person: contact_info.contact_person,
        contact_phone: contact_info.contact_phone,
        visa_type: applicant.country,
        country: applicant.country,
        submission_date: applicant.submission_date,
        received_date: applicant.received_date,
        fee,
        cost: total_cost,
        status: 'pending',
        order_id: targetOrder.id,
        order_number: targetOrder.order_number,
        tour_id: selectedTour.id,
        code: selectedTour.code,
        created_by: user.id,
        note: '',
      });
    });

    // 重置表單
    const currentYear = new Date().getFullYear();
    const visaCode = `VISA${currentYear}001`;
    const defaultVisaTour = tours.find(t => t.code === visaCode);
    resetForm(defaultVisaTour?.id);
    setIsDialogOpen(false);
  };

  // 批次送件
  const handleBatchSubmit = async () => {
    if (!canManageVisas || selectedRows.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    for (const id of selectedRows) {
      await updateVisa(id, { status: 'submitted', submission_date: today });
    }

    setSelectedRows([]);
  };

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="簽證管理"
        icon={FileText}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '簽證管理', href: '/visas' }
        ]}
        actions={(
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsInfoDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Info size={16} />
              查看簽證資訊
            </Button>
            {canManageVisas && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增簽證
              </Button>
            )}
          </div>
        )}
        tabs={[
          { value: 'all', label: '全部', icon: FileText },
          { value: 'pending', label: '待送件', icon: Clock },
          { value: 'submitted', label: '已送件', icon: AlertCircle },
          { value: 'issued', label: '已下件', icon: CheckCircle },
          { value: 'collected', label: '已取件', icon: FileCheck },
          { value: 'rejected', label: '退件', icon: XCircle },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-auto">
        {/* 批次操作按鈕 */}
        {canManageVisas && selectedRows.length > 0 && (
          <div className="bg-morandi-container p-4 rounded-lg flex items-center justify-between">
            <span className="text-sm text-morandi-primary">
              已選擇 {selectedRows.length} 筆簽證
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handleBatchSubmit}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                批次送件
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedRows([])}
              >
                取消選擇
              </Button>
            </div>
          </div>
        )}

        {/* 簽證列表 */}
        <VisasList
          filteredVisas={filteredVisas}
          canManageVisas={canManageVisas}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onDelete={deleteVisa}
        />
      </div>

      {/* 簽證資訊對話框 */}
      <VisasInfoDialog
        open={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
      />

      {/* 新增簽證對話框 */}
      <AddVisaDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddVisa}
        contact_info={contact_info}
        setContactInfo={setContactInfo}
        applicants={applicants}
        tourOptions={tourOptions}
        calculateFee={calculateFee}
        addApplicant={addApplicant}
        removeApplicant={removeApplicant}
        updateApplicant={updateApplicant}
        canSubmit={!!contact_info.applicant_name && applicants.some(a => a.name)}
      />
    </div>
  );
}
