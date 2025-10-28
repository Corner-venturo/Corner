'use client';

import React, { useState, useEffect } from 'react';
import { FileSignature, Save, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTourStore, useOrderStore, useMemberStore, useItineraryStore } from '@/stores';
import { Tour, ContractTemplate } from '@/types/tour.types';
import { prepareContractData, ContractData } from '@/lib/contract-utils';

const CONTRACT_TEMPLATES = [
  { value: 'domestic' as ContractTemplate, label: '國內旅遊定型化契約（1120908修訂版）' },
  { value: 'international' as ContractTemplate, label: '國外旅遊定型化契約（1120908修訂版）' },
  { value: 'individual_international' as ContractTemplate, label: '國外個別旅遊定型化契約（1120908修訂版）' },
];

const CONTRACT_TEMPLATE_LABELS = {
  domestic: '國內旅遊定型化契約（1120908修訂版）',
  international: '國外旅遊定型化契約（1120908修訂版）',
  individual_international: '國外個別旅遊定型化契約（1120908修訂版）',
};

interface ContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  mode: 'create' | 'edit';
}

export function ContractDialog({ isOpen, onClose, tour, mode }: ContractDialogProps) {
  const { update: updateTour } = useTourStore();
  const { items: orders } = useOrderStore();
  const { items: members } = useMemberStore();
  const { items: itineraries } = useItineraryStore();

  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | ''>('');
  const [contractNotes, setContractNotes] = useState('');
  const [contractCompleted, setContractCompleted] = useState(false);
  const [archivedDate, setArchivedDate] = useState('');
  const [saving, setSaving] = useState(false);

  // 合約填寫資料
  const [contractData, setContractData] = useState<Partial<ContractData>>({});

  // 取得這個團的資料
  const tourOrders = orders.filter(o => o.tour_id === tour.id);
  const firstOrder = tourOrders[0];
  const tourMembers = members.filter(m => m.tour_id === tour.id);
  const itinerary = itineraries.find(i => i.tour_id === tour.id);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && tour.contract_template) {
        setSelectedTemplate(tour.contract_template);
        setContractNotes(tour.contract_notes || '');
        setContractCompleted(tour.contract_completed || false);
        setArchivedDate(tour.contract_archived_date || '');

        // 載入已儲存的合約資料,或從系統自動帶入
        if (tour.contract_content) {
          try {
            const savedData = JSON.parse(tour.contract_content);
            setContractData(savedData);
          } catch {
            // 如果 contract_content 不是 JSON,就重新準備資料
            if (firstOrder && tourMembers[0]) {
              const autoData = prepareContractData(tour, firstOrder, tourMembers[0], itinerary);
              setContractData(autoData);
            }
          }
        } else if (firstOrder && tourMembers[0]) {
          const autoData = prepareContractData(tour, firstOrder, tourMembers[0], itinerary);
          setContractData(autoData);
        }
      } else {
        // 建立模式:自動準備資料
        setSelectedTemplate('');
        setContractNotes('');
        setContractCompleted(false);
        setArchivedDate('');

        if (firstOrder && tourMembers[0]) {
          // 有訂單和團員資料，自動帶入
          const autoData = prepareContractData(tour, firstOrder, tourMembers[0], itinerary);
          setContractData(autoData);
        } else {
          // 沒有訂單/團員資料，初始化空白欄位
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, tour.id]);

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

  const handleSave = async () => {
    if (mode === 'create' && !selectedTemplate) {
      alert('請選擇合約範本');
      return;
    }

    setSaving(true);
    try {
      // 將合約資料轉成 JSON 儲存
      const contractContentJson = JSON.stringify(contractData);

      if (mode === 'create') {
        await updateTour(tour.id, {
          contract_template: selectedTemplate as ContractTemplate,
          contract_content: contractContentJson,
          contract_created_at: new Date().toISOString(),
          contract_notes: contractNotes,
          contract_completed: contractCompleted,
          contract_archived_date: archivedDate || undefined,
        });
        alert('合約建立成功!');
      } else {
        await updateTour(tour.id, {
          contract_content: contractContentJson,
          contract_notes: contractNotes,
          contract_completed: contractCompleted,
          contract_archived_date: archivedDate || undefined,
        });
        alert('合約更新成功!');
      }
      onClose();
    } catch (error) {
            alert('儲存合約失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    if (!contractData || Object.keys(contractData).length === 0) {
      alert('請先填寫合約資料');
      return;
    }

    try {
      // 先儲存合約資料
      setSaving(true);
      const contractContentJson = JSON.stringify(contractData);
      await updateTour(tour.id, {
        contract_template: selectedTemplate,
        contract_content: contractContentJson,
        contract_created_at: new Date().toISOString(),
        contract_notes: contractNotes,
        contract_completed: contractCompleted,
        contract_archived_date: archivedDate || '',
      });

      // 讀取合約範本
      const templateFile = selectedTemplate === 'template_a' ? 'individual-overseas.html' : 'individual-overseas.html';
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
            alert('列印合約時發生錯誤，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature size={20} />
            {mode === 'create' ? '建立合約' : '編輯合約'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 旅遊團資訊 */}
          <div className="bg-morandi-container/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅遊團資訊</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-morandi-secondary">團號</div>
                <div className="text-sm text-morandi-primary font-medium">{tour.code}</div>
              </div>
              <div>
                <div className="text-xs text-morandi-secondary">團名</div>
                <div className="text-sm text-morandi-primary font-medium">{tour.name}</div>
              </div>
              <div>
                <div className="text-xs text-morandi-secondary">出發日期</div>
                <div className="text-sm text-morandi-primary font-medium">
                  {new Date(tour.departure_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-morandi-secondary">目的地</div>
                <div className="text-sm text-morandi-primary font-medium">{tour.location}</div>
              </div>
            </div>
          </div>

          {/* 選擇範本 (只在建立模式顯示) */}
          {mode === 'create' && (
            <div>
              <h3 className="text-sm font-semibold text-morandi-primary mb-3">選擇合約範本</h3>
              <div className="grid grid-cols-3 gap-4">
                {CONTRACT_TEMPLATES.map((template) => (
                  <button
                    key={template.value}
                    onClick={() => setSelectedTemplate(template.value)}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      selectedTemplate === template.value
                        ? 'border-morandi-gold bg-morandi-gold/10'
                        : 'border-gray-200 hover:border-morandi-gold/50'
                    }`}
                  >
                    <div className="text-center">
                      <FileSignature className="mx-auto mb-1" size={24} />
                      <div className="text-sm font-medium text-morandi-primary">{template.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 合約資訊 (只在編輯模式顯示) */}
          {mode === 'edit' && tour.contract_template && (
            <div className="bg-morandi-container/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-morandi-primary mb-3">合約資訊</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-morandi-secondary">合約範本</div>
                  <div className="text-sm text-morandi-primary font-medium">
                    {CONTRACT_TEMPLATE_LABELS[tour.contract_template]}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-morandi-secondary">建立時間</div>
                  <div className="text-sm text-morandi-primary font-medium">
                    {tour.contract_created_at
                      ? new Date(tour.contract_created_at).toLocaleString()
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 合約填寫欄位 */}
          {(!firstOrder || tourMembers.length === 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-4">
              💡 提示：尚無訂單或團員資料，所有欄位可手動填寫
            </div>
          )}

          {/* 始終顯示表單欄位 */}
          <>
              {/* 旅客資訊 */}
              <div>
                <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅客資訊（甲方）</h3>
                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-xs text-morandi-secondary block mb-1">身分證字號</label>
                    <input
                      type="text"
                      value={contractData.travelerIdNumber || ''}
                      onChange={(e) => handleFieldChange('travelerIdNumber', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-morandi-secondary block mb-1">住址</label>
                    <input
                      type="text"
                      value={contractData.travelerAddress || ''}
                      onChange={(e) => handleFieldChange('travelerAddress', e.target.value)}
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

              {/* 集合時地 */}
              <div>
                <h3 className="text-sm font-semibold text-morandi-primary mb-3">集合時地</h3>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <input
                    type="text"
                    value={contractData.gatherYear || ''}
                    onChange={(e) => handleFieldChange('gatherYear', e.target.value)}
                    placeholder="年"
                    className="p-2 border rounded text-sm text-center"
                  />
                  <input
                    type="text"
                    value={contractData.gatherMonth || ''}
                    onChange={(e) => handleFieldChange('gatherMonth', e.target.value)}
                    placeholder="月"
                    className="p-2 border rounded text-sm text-center"
                  />
                  <input
                    type="text"
                    value={contractData.gatherDay || ''}
                    onChange={(e) => handleFieldChange('gatherDay', e.target.value)}
                    placeholder="日"
                    className="p-2 border rounded text-sm text-center"
                  />
                  <input
                    type="text"
                    value={contractData.gatherHour || ''}
                    onChange={(e) => handleFieldChange('gatherHour', e.target.value)}
                    placeholder="時"
                    className="p-2 border rounded text-sm text-center"
                  />
                  <input
                    type="text"
                    value={contractData.gatherMinute || ''}
                    onChange={(e) => handleFieldChange('gatherMinute', e.target.value)}
                    placeholder="分"
                    className="p-2 border rounded text-sm text-center"
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
                <h3 className="text-sm font-semibold text-morandi-primary mb-3">乙方聯絡資訊</h3>
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
            </>

          {/* 備註 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">備註</h3>
            <textarea
              value={contractNotes}
              onChange={(e) => setContractNotes(e.target.value)}
              placeholder="請輸入備註..."
              className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 resize-none text-sm"
            />
          </div>

          {/* 完成合約與歸檔日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-morandi-primary mb-3">完成狀態</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contractCompleted}
                  onChange={(e) => setContractCompleted(e.target.checked)}
                  className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold/50 rounded"
                />
                <span className="text-sm text-morandi-primary">合約已完成</span>
              </label>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-morandi-primary mb-3">歸檔日期</h3>
              <input
                type="date"
                value={archivedDate}
                onChange={(e) => setArchivedDate(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (mode === 'create' && !selectedTemplate)}
          >
            <Save size={16} className="mr-2" />
            {saving ? '儲存中...' : mode === 'create' ? '建立合約' : '儲存'}
          </Button>
          <Button
            onClick={handlePrint}
            disabled={saving || !selectedTemplate}
            className="bg-morandi-gold hover:bg-morandi-gold/90"
          >
            <Printer size={16} className="mr-2" />
            列印合約
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
