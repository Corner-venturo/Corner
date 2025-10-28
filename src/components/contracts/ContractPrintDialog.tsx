'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileSignature, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTourStore, useOrderStore, useMemberStore, useItineraryStore } from '@/stores';
import { Tour } from '@/types/tour.types';
import { prepareContractData, ContractData } from '@/lib/contract-utils';

interface ContractPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
}

export function ContractPrintDialog({ isOpen, onClose, tour }: ContractPrintDialogProps) {
  const { items: orders } = useOrderStore();
  const { items: members } = useMemberStore();
  const { items: itineraries } = useItineraryStore();
  const { update: updateTour } = useTourStore();

  // 取得這個團的訂單和團員
  const tourOrders = orders.filter(o => o.tour_id === tour.id);
  const firstOrder = tourOrders[0];
  const tourMembers = members.filter(m => m.tour_id === tour.id);

  // 取得行程表
  const itinerary = itineraries.find(i => i.tour_id === tour.id);

  // 準備合約資料
  const autoFilledData = useMemo(() => {
    if (!firstOrder || tourMembers.length === 0) return null;
    return prepareContractData(tour, firstOrder, tourMembers[0], itinerary);
  }, [tour, firstOrder, tourMembers, itinerary]);

  // 可編輯的欄位
  const [contractData, setContractData] = useState<Partial<ContractData>>({});

  useEffect(() => {
    if (isOpen) {
      // 如果有自動填入資料就用，沒有就用空物件（讓使用者手動填寫）
      if (autoFilledData) {
        setContractData(autoFilledData);
      } else {
        // 初始化空白欄位
        setContractData({
          reviewYear: new Date().getFullYear().toString(),
          reviewMonth: (new Date().getMonth() + 1).toString(),
          reviewDay: new Date().getDate().toString(),
          travelerName: '',
          travelerAddress: '',
          travelerIdNumber: '',
          travelerPhone: '',
          tourName: tour.name || '',
          tourDestination: tour.location || '',
          tourCode: tour.code || '',
          gatherYear: '',
          gatherMonth: '',
          gatherDay: '',
          gatherHour: '',
          gatherMinute: '',
          gatherLocation: '',
          totalAmount: '',
          depositAmount: '',
          deathInsurance: '2,500,000',
          medicalInsurance: '100,000',
          companyExtension: '',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tour.id]);

  const handleFieldChange = (field: keyof ContractData, value: string) => {
    // 數字欄位自動轉半形
    const numberFields = ['reviewYear', 'reviewMonth', 'reviewDay', 'gatherYear', 'gatherMonth', 'gatherDay', 'gatherHour', 'gatherMinute', 'totalAmount', 'depositAmount'];

    let processedValue = value;
    if (numberFields.includes(field)) {
      // 全形數字轉半形
      processedValue = value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    }

    setContractData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handlePrint = async () => {
    if (!contractData) {
      alert('請先填寫合約資料');
      return;
    }

    try {
      // 先儲存合約資料（避免報價單或行程表異動後資料不一致）
      const contractContentJson = JSON.stringify(contractData);
      await updateTour(tour.id, {
        contract_content: contractContentJson,
      });

      // 讀取合約範本
      const response = await fetch('/contract-templates/individual-overseas.html');
      if (!response.ok) {
        throw new Error('無法載入合約範本');
      }

      let template = await response.text();

      // 替換所有變數
      Object.entries(contractData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, value || '');
      });

      // 開啟新視窗並列印
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('請允許彈出視窗以進行列印');
        return;
      }

      printWindow.document.write(template);
      printWindow.document.close();

      // 等待內容載入後列印
      printWindow.onload = () => {
        printWindow.print();
        // 列印後關閉視窗
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    } catch (error) {
      console.error('列印合約時發生錯誤:', error);
      alert('列印合約時發生錯誤，請稍後再試');
    }
  };

  // 移除限制：允許手動填寫所有欄位
  // if (!firstOrder || tourMembers.length === 0) {
  //   return (
  //     <Dialog open={isOpen} onOpenChange={onClose}>
  //       <DialogContent>
  //         <DialogHeader>
  //           <DialogTitle>無法列印合約</DialogTitle>
  //         </DialogHeader>
  //         <div className="py-4 text-morandi-secondary">
  //           此旅遊團尚無訂單或團員資料,無法產生合約。
  //         </div>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature size={20} />
            列印合約 - {tour.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 旅遊團資訊（唯讀） */}
          <div className="bg-morandi-container/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅遊團資訊</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-morandi-secondary">團號：</span>
                <span className="text-morandi-primary">{contractData.tourCode}</span>
              </div>
              <div>
                <span className="text-morandi-secondary">團名：</span>
                <span className="text-morandi-primary">{contractData.tourName}</span>
              </div>
              <div>
                <span className="text-morandi-secondary">目的地：</span>
                <span className="text-morandi-primary">{contractData.tourDestination}</span>
              </div>
            </div>
          </div>

          {/* 審閱日期 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">契約審閱日期</h3>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={contractData.reviewYear || ''}
                onChange={(e) => handleFieldChange('reviewYear', e.target.value)}
                placeholder="年"
                className="p-2 border rounded text-sm"
              />
              <input
                type="text"
                value={contractData.reviewMonth || ''}
                onChange={(e) => handleFieldChange('reviewMonth', e.target.value)}
                placeholder="月"
                className="p-2 border rounded text-sm"
              />
              <input
                type="text"
                value={contractData.reviewDay || ''}
                onChange={(e) => handleFieldChange('reviewDay', e.target.value)}
                placeholder="日"
                className="p-2 border rounded text-sm"
              />
            </div>
          </div>

          {/* 旅客資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅客資訊（甲方）</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">姓名</label>
                <input
                  type="text"
                  value={contractData.travelerName || ''}
                  onChange={(e) => handleFieldChange('travelerName', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">住址</label>
                <input
                  type="text"
                  value={contractData.travelerAddress || ''}
                  onChange={(e) => handleFieldChange('travelerAddress', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-morandi-secondary block mb-1">身分證字號</label>
                  <input
                    type="text"
                    value={contractData.travelerIdNumber || ''}
                    onChange={(e) => handleFieldChange('travelerIdNumber', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-morandi-secondary block mb-1">電話</label>
                  <input
                    type="text"
                    value={contractData.travelerPhone || ''}
                    onChange={(e) => handleFieldChange('travelerPhone', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 集合時地 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">集合時地</h3>
            <div className="grid grid-cols-5 gap-2 mb-3">
              <input
                type="text"
                value={contractData.gatherYear || ''}
                onChange={(e) => handleFieldChange('gatherYear', e.target.value)}
                placeholder="年"
                className="p-2 border rounded text-sm"
              />
              <input
                type="text"
                value={contractData.gatherMonth || ''}
                onChange={(e) => handleFieldChange('gatherMonth', e.target.value)}
                placeholder="月"
                className="p-2 border rounded text-sm"
              />
              <input
                type="text"
                value={contractData.gatherDay || ''}
                onChange={(e) => handleFieldChange('gatherDay', e.target.value)}
                placeholder="日"
                className="p-2 border rounded text-sm"
              />
              <input
                type="text"
                value={contractData.gatherHour || ''}
                onChange={(e) => handleFieldChange('gatherHour', e.target.value)}
                placeholder="時"
                className="p-2 border rounded text-sm"
              />
              <input
                type="text"
                value={contractData.gatherMinute || ''}
                onChange={(e) => handleFieldChange('gatherMinute', e.target.value)}
                placeholder="分"
                className="p-2 border rounded text-sm"
              />
            </div>
            <input
              type="text"
              value={contractData.gatherLocation || ''}
              onChange={(e) => handleFieldChange('gatherLocation', e.target.value)}
              placeholder="集合地點（例如：桃園國際機場第一航廈）"
              className="w-full p-2 border rounded text-sm"
            />
          </div>

          {/* 費用 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅遊費用</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">總金額（新台幣）</label>
                <input
                  type="text"
                  value={contractData.totalAmount || ''}
                  onChange={(e) => handleFieldChange('totalAmount', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">定金（新台幣）</label>
                <input
                  type="text"
                  value={contractData.depositAmount || ''}
                  onChange={(e) => handleFieldChange('depositAmount', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* 乙方資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">乙方資訊</h3>
            <div>
              <label className="text-xs text-morandi-secondary block mb-1">
                電話分機（02-7751-6051 #）
              </label>
              <input
                type="text"
                value={contractData.companyExtension || ''}
                onChange={(e) => handleFieldChange('companyExtension', e.target.value)}
                placeholder="分機號碼"
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            列印合約
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
