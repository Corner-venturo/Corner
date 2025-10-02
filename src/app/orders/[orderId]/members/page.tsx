'use client';

import React, { useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { useTourStore } from '@/stores/tour-store';
import { ArrowLeft, Plus } from 'lucide-react';
import { ExcelMemberTable, MemberTableRef } from '@/components/members/excel-member-table';

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const { orders, tours } = useTourStore();
  const memberTableRef = useRef<MemberTableRef | null>(null);

  const order = orders.find(o => o.id === orderId);
  const tour = tours.find(t => t.id === order?.tourId);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-morandi-secondary mb-4">找不到該訂單</p>
          <Button onClick={() => router.push('/orders')} variant="outline">
            <ArrowLeft size={16} className="mr-1" />
            返回訂單列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ">
      <ResponsiveHeader
        title={`成員管理 - ${order.orderNumber}`}
        onAdd={() => memberTableRef.current?.addRow()}
        addLabel="新增成員"
      >
        {/* 訂單資訊 */}
        <div className="flex items-center space-x-6 text-sm text-morandi-secondary">
          <div className="flex items-center space-x-2">
            <span>旅遊團:</span>
            <span className="text-morandi-primary font-medium">{order.tourName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>聯絡人:</span>
            <span className="text-morandi-primary font-medium">{order.contactPerson}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>預定人數:</span>
            <span className="text-morandi-primary font-medium">{order.memberCount}人</span>
          </div>
          <Button
            onClick={() => router.push('/orders')}
            variant="ghost"
            size="sm"
            className="p-2 ml-auto"
          >
            <ArrowLeft size={16} />
          </Button>
        </div>
      </ResponsiveHeader>

      {/* 成員管理表格 */}
      <div className="px-6 pb-6">
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <ExcelMemberTable
            ref={memberTableRef}
            orderId={orderId}
            departureDate={tour?.departureDate || ''}
            memberCount={order.memberCount}
          />
        </div>
      </div>
    </div>
  );
}