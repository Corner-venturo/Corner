'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { ContractData } from './types';

interface ContractFormFieldsProps {
  contractData: Partial<ContractData>;
  onFieldChange: (field: keyof ContractData, value: string) => void;
}

export function ContractFormFields({ contractData, onFieldChange }: ContractFormFieldsProps) {
  return (
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
              onChange={(e) => onFieldChange('travelerName', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-morandi-secondary block mb-1">身分證字號</label>
            <input
              type="text"
              value={contractData.travelerIdNumber || ''}
              onChange={(e) => onFieldChange('travelerIdNumber', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-morandi-secondary block mb-1">住址</label>
            <input
              type="text"
              value={contractData.travelerAddress || ''}
              onChange={(e) => onFieldChange('travelerAddress', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-morandi-secondary block mb-1">電話</label>
            <input
              type="text"
              value={contractData.travelerPhone || ''}
              onChange={(e) => onFieldChange('travelerPhone', e.target.value)}
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
            onChange={(e) => onFieldChange('gatherYear', e.target.value)}
            placeholder="年"
            className="p-2 border rounded text-sm text-center"
          />
          <input
            type="text"
            value={contractData.gatherMonth || ''}
            onChange={(e) => onFieldChange('gatherMonth', e.target.value)}
            placeholder="月"
            className="p-2 border rounded text-sm text-center"
          />
          <input
            type="text"
            value={contractData.gatherDay || ''}
            onChange={(e) => onFieldChange('gatherDay', e.target.value)}
            placeholder="日"
            className="p-2 border rounded text-sm text-center"
          />
          <input
            type="text"
            value={contractData.gatherHour || ''}
            onChange={(e) => onFieldChange('gatherHour', e.target.value)}
            placeholder="時"
            className="p-2 border rounded text-sm text-center"
          />
          <input
            type="text"
            value={contractData.gatherMinute || ''}
            onChange={(e) => onFieldChange('gatherMinute', e.target.value)}
            placeholder="分"
            className="p-2 border rounded text-sm text-center"
          />
        </div>
        <input
          type="text"
          value={contractData.gatherLocation || ''}
          onChange={(e) => onFieldChange('gatherLocation', e.target.value)}
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
              onChange={(e) => onFieldChange('totalAmount', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-morandi-secondary block mb-1">定金（新台幣）</label>
            <input
              type="text"
              value={contractData.depositAmount || ''}
              onChange={(e) => onFieldChange('depositAmount', e.target.value)}
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
            onChange={(e) => onFieldChange('companyExtension', e.target.value)}
            placeholder="分機號碼"
            className="w-full p-2 border rounded text-sm"
          />
        </div>
      </div>
    </>
  );
}
