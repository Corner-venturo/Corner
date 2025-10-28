'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  Receipt,
  FileText,
  Users,
  DollarSign,
  UserPlus,
} from 'lucide-react';
import { QuickActionsSectionProps, QuickActionContentProps, QuickActionTabConfig } from './types';

const quickActionTabs: QuickActionTabConfig[] = [
  { key: 'receipt' as const, label: '收款', icon: Receipt },
  { key: 'invoice' as const, label: '請款', icon: FileText },
  { key: 'group' as const, label: '開團', icon: Users },
  { key: 'quote' as const, label: '報價', icon: DollarSign },
  { key: 'share' as const, label: '共享', icon: UserPlus },
];

export function QuickActionsSection({ activeTab, onTabChange }: QuickActionsSectionProps) {
  return (
    <div className="mb-4 bg-card border border-border rounded-xl p-2 shadow-sm">
      <div className="flex gap-2">
        {quickActionTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all flex-1 rounded-lg',
                activeTab === tab.key
                  ? 'bg-morandi-container/30 text-morandi-primary'
                  : 'bg-transparent text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/10'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuickActionContent({ activeTab, todo }: QuickActionContentProps) {
  const { items: employees, fetchAll } = useUserStore();
  const { user: currentUser } = useAuthStore();

  // 使用 ref 建立穩定的函數參考
  const fetchAllRef = useRef(fetchAll);

  // 更新 ref 當 fetchAll 改變時
  useEffect(() => {
    fetchAllRef.current = fetchAll;
  }, [fetchAll]);

  // 只在共享分頁時載入員工資料
  useEffect(() => {
    if (activeTab === 'share' && employees.length === 0) {
      fetchAllRef.current();
    }
  }, [activeTab, employees.length]);

  // 過濾掉自己
  const otherEmployees = employees.filter(emp => emp.id !== currentUser?.id);

  switch (activeTab) {
    case 'receipt':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-morandi-container/20">
            <div className="p-1.5 bg-morandi-gold/10 rounded-lg">
              <Receipt size={16} className="text-morandi-gold" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-morandi-primary">快速收款</h5>
              <p className="text-xs text-morandi-secondary">建立新的收款記錄</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">選擇訂單</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇訂單" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order1">東京5日遊 - 王小明</SelectItem>
                  <SelectItem value="order2">沖繩度假 - 李小華</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">收款金額</label>
              <Input placeholder="輸入金額" type="number" className="shadow-sm h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">付款方式</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇付款方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">現金</SelectItem>
                  <SelectItem value="transfer">轉帳</SelectItem>
                  <SelectItem value="card">信用卡</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">收款日期</label>
              <Input placeholder="選擇日期" type="date" className="shadow-sm h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">備註</label>
              <Textarea placeholder="補充說明（選填）" rows={2} className="shadow-sm text-xs" />
            </div>
            <Button className="w-full bg-morandi-gold hover:bg-morandi-gold/90 shadow-md mt-1 h-9 text-xs">
              <Receipt size={14} className="mr-1.5" />
              建立收款單
            </Button>
          </div>
        </div>
      );

    case 'invoice':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">快速請款</h5>
          <div className="space-y-3">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="選擇供應商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel1">清邁假日酒店</SelectItem>
                <SelectItem value="transport1">清邁包車服務</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="請款項目" />
            <Input placeholder="金額" type="number" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="類別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accommodation">住宿</SelectItem>
                <SelectItem value="transport">交通</SelectItem>
                <SelectItem value="meals">餐食</SelectItem>
                <SelectItem value="tickets">門票</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">建立請款單</Button>
          </div>
        </div>
      );

    case 'group':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">快速開團</h5>
          <div className="space-y-3">
            <Input placeholder="團名" />
            <Input placeholder="預計人數" type="number" />
            <Input placeholder="出發日期" type="date" />
            <Input placeholder="返回日期" type="date" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="團體狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">籌備中</SelectItem>
                <SelectItem value="confirmed">確認成團</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">建立旅遊團</Button>
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-4">
          <h5 className="font-medium text-morandi-primary">快速報價</h5>
          <div className="space-y-3">
            <Input placeholder="客戶名稱" />
            <Input placeholder="聯絡人" />
            <Input placeholder="聯絡電話" />
            <Input placeholder="Email" type="email" />
            <Input placeholder="人數" type="number" />
            <Textarea placeholder="需求說明" rows={3} />
            <Input placeholder="預算範圍" />
            <Input placeholder="報價有效期" type="date" />
            <Button className="w-full">建立報價單</Button>
          </div>
        </div>
      );

    case 'share':
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-morandi-container/20">
            <div className="p-1.5 bg-morandi-gold/10 rounded-lg">
              <UserPlus size={16} className="text-morandi-gold" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-morandi-primary">共享待辦</h5>
              <p className="text-xs text-morandi-secondary">分享這個任務給團隊成員</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">共享給</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇成員" />
                </SelectTrigger>
                <SelectContent>
                  {otherEmployees.length > 0 ? (
                    otherEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.display_name || emp.english_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      尚無其他員工
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">權限</label>
              <Select>
                <SelectTrigger className="shadow-sm h-9 text-xs">
                  <SelectValue placeholder="選擇權限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">僅檢視</SelectItem>
                  <SelectItem value="edit">可編輯</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-primary mb-1">訊息（選填）</label>
              <Textarea placeholder="給成員的訊息..." rows={2} className="shadow-sm text-xs" />
            </div>
            <Button className="w-full bg-morandi-gold hover:bg-morandi-gold/90 shadow-md h-9 text-xs">
              <UserPlus size={14} className="mr-1.5" />
              共享待辦
            </Button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
