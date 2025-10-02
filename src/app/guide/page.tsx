'use client';

import React from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  ShoppingCart,
  Users,
  CreditCard,
  CheckSquare,
  Settings,
  BarChart3,
  Building2,
  UserCog,
  Database,
  Star,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <ResponsiveHeader title="系統使用說明" />

      {/* 系統概述 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">Venturo 旅行社管理系統</h2>
        <p className="text-morandi-secondary mb-4">
          Venturo 是一個專為旅行社設計的全方位管理系統，涵蓋從報價、成團、收款到結算的完整業務流程。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-morandi-container/30 rounded-lg">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-morandi-gold" />
            <h3 className="font-medium text-morandi-primary">流程自動化</h3>
            <p className="text-sm text-morandi-secondary">報價→成團→訂單→收款全流程串接</p>
          </div>
          <div className="text-center p-4 bg-morandi-container/30 rounded-lg">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-morandi-gold" />
            <h3 className="font-medium text-morandi-primary">財務透明</h3>
            <p className="text-sm text-morandi-secondary">即時掌握成本、收入與利潤</p>
          </div>
          <div className="text-center p-4 bg-morandi-container/30 rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 text-morandi-gold" />
            <h3 className="font-medium text-morandi-primary">團隊協作</h3>
            <p className="text-sm text-morandi-secondary">業務、助理、會計、老闆各司其職</p>
          </div>
          <div className="text-center p-4 bg-morandi-container/30 rounded-lg">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-morandi-gold" />
            <h3 className="font-medium text-morandi-primary">數據分析</h3>
            <p className="text-sm text-morandi-secondary">自動生成報表與獎金計算</p>
          </div>
        </div>
      </Card>

      {/* 使用者角色 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">使用者角色與權限</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Star className="w-6 h-6 mr-2 text-yellow-500" />
              <h3 className="font-medium text-morandi-primary">老闆 (William01)</h3>
            </div>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 查看所有資料</li>
              <li>• 審核請款</li>
              <li>• 查看財務報表</li>
              <li>• 設定獎金規則</li>
              <li>• 管理員工</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <MapPin className="w-6 h-6 mr-2 text-blue-500" />
              <h3 className="font-medium text-morandi-primary">業務 (Sales)</h3>
            </div>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 建立報價單</li>
              <li>• 管理旅遊團</li>
              <li>• 建立訂單</li>
              <li>• 追蹤收款</li>
              <li>• 查看個人業績</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckSquare className="w-6 h-6 mr-2 text-green-500" />
              <h3 className="font-medium text-morandi-primary">助理/OP</h3>
            </div>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 管理團員名單</li>
              <li>• 處理加購/退費</li>
              <li>• 製作行程表</li>
              <li>• 協助請款</li>
              <li>• 文件管理</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CreditCard className="w-6 h-6 mr-2 text-purple-500" />
              <h3 className="font-medium text-morandi-primary">會計</h3>
            </div>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 管理收款</li>
              <li>• 處理請款</li>
              <li>• 出納付款</li>
              <li>• 月度結算</li>
              <li>• 查看薪資</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <UserCog className="w-6 h-6 mr-2 text-orange-500" />
              <h3 className="font-medium text-morandi-primary">人資 (HR)</h3>
            </div>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 管理員工資料</li>
              <li>• 薪資設定</li>
              <li>• 出勤管理</li>
              <li>• 查看所有薪資</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 業務流程 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">業務流程圖</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-center">
            <div className="inline-block bg-blue-100 px-4 py-2 rounded-lg mb-4">
              <span className="text-blue-800 font-medium">客戶詢價</span>
            </div>
            <div className="text-gray-500">↓</div>
            <div className="inline-block bg-green-100 px-4 py-2 rounded-lg mb-4">
              <span className="text-green-800 font-medium">報價單(多版本)</span>
            </div>
            <div className="text-gray-500">↓</div>
            <div className="inline-block bg-yellow-100 px-4 py-2 rounded-lg mb-4">
              <span className="text-yellow-800 font-medium">確認報價 → 建立旅遊團</span>
            </div>
            <div className="text-gray-500">↓</div>
            <div className="inline-block bg-purple-100 px-4 py-2 rounded-lg mb-4">
              <span className="text-purple-800 font-medium">建立訂單 → 收到訂金</span>
            </div>
            <div className="text-gray-500">↓</div>
            <div className="inline-block bg-indigo-100 px-4 py-2 rounded-lg mb-4">
              <span className="text-indigo-800 font-medium">團員資料收集 → 房間分配</span>
            </div>
            <div className="text-gray-500">↓</div>
            <div className="inline-block bg-red-100 px-4 py-2 rounded-lg mb-4">
              <span className="text-red-800 font-medium">向供應商請款 → 每週四付款</span>
            </div>
            <div className="text-gray-500">↓</div>
            <div className="inline-block bg-teal-100 px-4 py-2 rounded-lg">
              <span className="text-teal-800 font-medium">出團執行 → 結案 → 計算獎金</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 功能模組 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">主要功能模組</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 報價管理 */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FileText className="w-6 h-6 mr-2 text-morandi-gold" />
              <h3 className="font-medium text-morandi-primary">報價管理</h3>
            </div>
            <p className="text-sm text-morandi-secondary mb-2">
              業務收到客戶詢價時使用
            </p>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 建立多版本報價</li>
              <li>• 成本結構設定</li>
              <li>• 自動計算利潤</li>
              <li>• 一鍵轉為旅遊團</li>
            </ul>
          </div>

          {/* 旅遊團管理 */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <MapPin className="w-6 h-6 mr-2 text-morandi-gold" />
              <h3 className="font-medium text-morandi-primary">旅遊團管理</h3>
            </div>
            <p className="text-sm text-morandi-secondary mb-2">
              管理確認的旅遊團，團號規則：地區碼+日期+流水號
            </p>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 總覽：財務狀況、預算vs實際</li>
              <li>• 訂單管理：該團所有訂單</li>
              <li>• 團員名單：所有參加者資料</li>
              <li>• 行程表製作：簡易版/精美HTML版</li>
            </ul>
          </div>

          {/* 訂單管理 */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ShoppingCart className="w-6 h-6 mr-2 text-morandi-gold" />
              <h3 className="font-medium text-morandi-primary">訂單管理</h3>
            </div>
            <p className="text-sm text-morandi-secondary mb-2">
              管理客戶訂單，訂單編號：團號+流水號
            </p>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 訂單建立（關聯旅遊團）</li>
              <li>• 付款狀態追蹤</li>
              <li>• 團員資料管理</li>
              <li>• 自動建立顧客檔案</li>
            </ul>
          </div>

          {/* 財務中心 */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CreditCard className="w-6 h-6 mr-2 text-morandi-gold" />
              <h3 className="font-medium text-morandi-primary">財務中心</h3>
            </div>
            <p className="text-sm text-morandi-secondary mb-2">
              四大子系統：收款、請款、出納、結帳
            </p>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 收款管理：依訂單收款、開立收據</li>
              <li>• 請款管理：向供應商請款、成本控管</li>
              <li>• 出納管理：每週四付款日、批次付款</li>
              <li>• 結帳系統：月度結算、獎金計算</li>
            </ul>
          </div>

        </div>
      </Card>

      {/* 獎金計算規則 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">獎金計算規則</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-morandi-primary mb-3">基本規則</h3>
            <ul className="text-sm text-morandi-secondary space-y-2">
              <li>• <strong>基礎獎金：</strong>營業額 5%（門檻 10萬）</li>
              <li>• <strong>階梯獎金：</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>- 0-50萬：3%</li>
                  <li>- 50-100萬：5%</li>
                  <li>- 100萬以上：8%</li>
                </ul>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-morandi-primary mb-3">特別獎金</h3>
            <ul className="text-sm text-morandi-secondary space-y-2">
              <li>• <strong>新客戶獎金：</strong>1,000元/人</li>
              <li>• <strong>大團獎金：</strong>2,000元（30人以上）</li>
              <li>• <strong>滿意度獎金：</strong>5,000元（100%滿意）</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 快捷操作 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">快捷鍵與小技巧</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-morandi-primary mb-3">快捷鍵</h3>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+N</kbd> 快速新增</li>
              <li>• <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+S</kbd> 儲存</li>
              <li>• <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+F</kbd> 搜尋</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-morandi-primary mb-3">操作技巧</h3>
            <ul className="text-sm text-morandi-secondary space-y-1">
              <li>• 點擊團號：展開詳細資訊</li>
              <li>• 拖曳團員：快速分房</li>
              <li>• 右鍵選單：快速操作</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 常見問題 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">常見問題</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-morandi-gold pl-4">
            <h3 className="font-medium text-morandi-primary">Q: 如何處理退費？</h3>
            <p className="text-sm text-morandi-secondary">A: 旅遊團管理 → 退費處理 → 新增退費</p>
          </div>
          <div className="border-l-4 border-morandi-gold pl-4">
            <h3 className="font-medium text-morandi-primary">Q: 如何查看個人業績？</h3>
            <p className="text-sm text-morandi-secondary">A: 報表管理 → 業務報表 → 個人業績</p>
          </div>
          <div className="border-l-4 border-morandi-gold pl-4">
            <h3 className="font-medium text-morandi-primary">Q: 如何分配房間？</h3>
            <p className="text-sm text-morandi-secondary">A: 旅遊團管理 → 團務操作 → 房間分配</p>
          </div>
          <div className="border-l-4 border-morandi-gold pl-4">
            <h3 className="font-medium text-morandi-primary">Q: 如何製作行程表？</h3>
            <p className="text-sm text-morandi-secondary">A: 旅遊團管理 → 行程表製作 → 選擇簡易版或HTML版</p>
          </div>
        </div>
      </Card>

      {/* 聯絡支援 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-morandi-primary">聯絡支援</h2>
        <div className="bg-morandi-container/30 p-4 rounded-lg">
          <p className="text-morandi-secondary mb-2">如有任何問題，請聯絡：</p>
          <ul className="text-sm text-morandi-secondary space-y-1">
            <li>• <strong>系統管理員：</strong>William</li>
            <li>• <strong>技術支援：</strong>IT部門</li>
            <li>• <strong>使用問題：</strong>請查看本說明或聯繫主管</li>
          </ul>
        </div>
      </Card>

    </div>
  );
}