'use client';

import React from 'react';
import { FileSignature, Save, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ContractTemplate } from '@/types/tour.types';
import { ContractDialogProps } from './types';
import { useContractForm } from './useContractForm';
import { ContractFormFields } from './ContractFormFields';

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

export function ContractDialog({ isOpen, onClose, tour, mode }: ContractDialogProps) {
  const {
    selectedTemplate,
    setSelectedTemplate,
    contractNotes,
    setContractNotes,
    contractCompleted,
    setContractCompleted,
    archivedDate,
    setArchivedDate,
    saving,
    contractData,
    handleFieldChange,
    handleSave,
    handlePrint,
    firstOrder,
    tourMembers,
  } = useContractForm({ tour, mode, isOpen });

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      onClose();
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

          <ContractFormFields
            contractData={contractData}
            onFieldChange={handleFieldChange}
          />

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
            onClick={onSave}
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
