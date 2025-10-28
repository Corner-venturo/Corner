'use client';

import React, { useMemo, useState } from 'react';
import { FileSignature, X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tour } from '@/types/tour.types';
import { ContractData } from '@/lib/contract-utils';

interface ContractViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
}

export function ContractViewDialog({ isOpen, onClose, tour }: ContractViewDialogProps) {
  const [printing, setPrinting] = useState(false);

  // 解析儲存的合約資料
  const contractData = useMemo<Partial<ContractData>>(() => {
    if (!tour.contract_content) {
      return {};
    }
    try {
      return JSON.parse(tour.contract_content);
    } catch (error) {
      console.error('無法解析合約資料:', error);
      return {};
    }
  }, [tour.contract_content]);

  const handlePrint = async () => {
    if (!contractData || Object.keys(contractData).length === 0) {
      alert('無合約資料可列印');
      return;
    }

    try {
      setPrinting(true);

      // 讀取合約範本
      const templateFile = tour.contract_template === 'template_a' ? 'individual-overseas.html' : 'individual-overseas.html';
      const response = await fetch(`/contract-templates/${templateFile}`);
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
    } finally {
      setPrinting(false);
    }
  };

  if (!tour.contract_content) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>無合約資料</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-morandi-secondary">
            此旅遊團尚未儲存合約資料。
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature size={20} />
            查看合約 - {tour.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 旅遊團資訊 */}
          <div className="bg-morandi-container/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅遊團資訊</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-morandi-secondary">團號：</span>
                <span className="text-morandi-primary">{contractData.tourCode || '-'}</span>
              </div>
              <div>
                <span className="text-morandi-secondary">團名：</span>
                <span className="text-morandi-primary">{contractData.tourName || '-'}</span>
              </div>
              <div>
                <span className="text-morandi-secondary">目的地：</span>
                <span className="text-morandi-primary">{contractData.tourDestination || '-'}</span>
              </div>
            </div>
          </div>

          {/* 審閱日期 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">契約審閱日期</h3>
            <div className="text-sm text-morandi-primary">
              {contractData.reviewYear || '-'}年 {contractData.reviewMonth || '-'}月 {contractData.reviewDay || '-'}日
            </div>
          </div>

          {/* 旅客資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅客資訊（甲方）</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-morandi-secondary">姓名：</span>
                <span className="text-morandi-primary">{contractData.travelerName || '-'}</span>
              </div>
              <div>
                <span className="text-morandi-secondary">住址：</span>
                <span className="text-morandi-primary">{contractData.travelerAddress || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-morandi-secondary">身分證字號：</span>
                  <span className="text-morandi-primary">{contractData.travelerIdNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-morandi-secondary">電話：</span>
                  <span className="text-morandi-primary">{contractData.travelerPhone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 集合時地 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">集合時地</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-morandi-secondary">集合時間：</span>
                <span className="text-morandi-primary">
                  {contractData.gatherYear || '-'}年 {contractData.gatherMonth || '-'}月 {contractData.gatherDay || '-'}日{' '}
                  {contractData.gatherHour || '-'}時 {contractData.gatherMinute || '-'}分
                </span>
              </div>
              <div>
                <span className="text-morandi-secondary">集合地點：</span>
                <span className="text-morandi-primary">{contractData.gatherLocation || '-'}</span>
              </div>
            </div>
          </div>

          {/* 費用 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅遊費用</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-morandi-secondary">總金額（新台幣）：</span>
                <span className="text-morandi-primary">{contractData.totalAmount || '-'}</span>
              </div>
              <div>
                <span className="text-morandi-secondary">定金（新台幣）：</span>
                <span className="text-morandi-primary">{contractData.depositAmount || '-'}</span>
              </div>
            </div>
          </div>

          {/* 保險資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">保險資訊</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-morandi-secondary">死亡保險金：</span>
                <span className="text-morandi-primary">新台幣 {contractData.deathInsurance || '-'} 元</span>
              </div>
              <div>
                <span className="text-morandi-secondary">醫療保險金：</span>
                <span className="text-morandi-primary">新台幣 {contractData.medicalInsurance || '-'} 元</span>
              </div>
            </div>
          </div>

          {/* 乙方資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">乙方資訊</h3>
            <div className="text-sm">
              <span className="text-morandi-secondary">電話分機：</span>
              <span className="text-morandi-primary">02-7751-6051 #{contractData.companyExtension || '-'}</span>
            </div>
          </div>

          {/* 合約建立時間 */}
          {tour.contract_created_at && (
            <div className="pt-4 border-t border-morandi-container/30">
              <div className="text-xs text-morandi-secondary">
                合約建立時間：{new Date(tour.contract_created_at).toLocaleString('zh-TW')}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={printing}>
            <X size={16} className="mr-2" />
            關閉
          </Button>
          <Button
            onClick={handlePrint}
            disabled={printing}
            className="bg-morandi-gold hover:bg-morandi-gold/90"
          >
            <Printer size={16} className="mr-2" />
            {printing ? '列印中...' : '列印完整合約'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
