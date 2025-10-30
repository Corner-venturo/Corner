import React from 'react'
import { Tour } from '@/stores/types'
import {
  Calendar,
  FileText,
  MapPin,
  Calculator,
  BarChart3,
  ShoppingCart,
  Users,
  FileCheck,
  AlertCircle,
  Clipboard,
  Plus,
  Package,
  RefreshCw,
  Edit2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table'
import { TourMembers } from '@/components/tours/tour-members'
import { TourOperations } from '@/components/tours/tour-operations'
import { TourAddOns } from '@/components/tours/tour-add-ons'
import { TourRefunds } from '@/components/tours/tour-refunds'
import { TourPayments } from '@/components/tours/tour-payments'
import { TourCosts } from '@/components/tours/tour-costs'
import { TourTaskAssignment } from '@/components/tours/tour-task-assignment'
import { TourOverviewTab } from './TourOverviewTab'
import { TourOperationsAddButton } from './TourOperationsAddButton'

const tourTabs = [
  { id: 'overview', label: '總覽', icon: BarChart3 },
  { id: 'orders', label: '訂單管理', icon: ShoppingCart },
  { id: 'members', label: '團員名單', icon: Users },
  { id: 'operations', label: '團務', icon: Clipboard },
  { id: 'addons', label: '加購', icon: Package },
  { id: 'refunds', label: '退費', icon: RefreshCw },
  { id: 'payments', label: '收款紀錄', icon: Calculator },
  { id: 'costs', label: '成本支出', icon: AlertCircle },
  { id: 'documents', label: '文件確認', icon: FileCheck },
  { id: 'tasks', label: '指派任務', icon: Edit2 },
]

interface TourExpandedViewProps {
  tour: Tour
  orders: any[]
  activeTabs: Record<string, string>
  setActiveTab: (tourId: string, tabId: string) => void
  openDialog: (type: string, data?: any) => void
  tourExtraFields: Record<string, any>
  setTourExtraFields: React.Dispatch<React.SetStateAction<Record<string, any>>>
  triggerAddOnAdd: Record<string, boolean>
  setTriggerAddOnAdd: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  triggerRefundAdd: Record<string, boolean>
  setTriggerRefundAdd: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  triggerPaymentAdd: Record<string, boolean>
  setTriggerPaymentAdd: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  triggerCostAdd: Record<string, boolean>
  setTriggerCostAdd: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function TourExpandedView({
  tour,
  orders,
  activeTabs,
  setActiveTab,
  openDialog,
  tourExtraFields,
  setTourExtraFields,
  triggerAddOnAdd,
  setTriggerAddOnAdd,
  triggerRefundAdd,
  setTriggerRefundAdd,
  triggerPaymentAdd,
  setTriggerPaymentAdd,
  triggerCostAdd,
  setTriggerCostAdd,
}: TourExpandedViewProps) {
  return (
    <div>
      {/* Tab navigation */}
      <div className="flex border-b border-border justify-between items-center">
        {/* Left: Tabs */}
        <div className="flex">
          {tourTabs.map(tab => {
            const is_active = activeTabs[tour.id] === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tour.id, tab.id)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors',
                  is_active
                    ? 'text-morandi-primary bg-white border-b-2 border-morandi-gold/20'
                    : 'text-morandi-secondary hover:text-morandi-primary'
                )}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right: Tab-specific buttons */}
        <div className="flex items-center gap-2 px-4">
          {activeTabs[tour.id] === 'overview' && (
            <button
              onClick={() => openDialog('edit', tour)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Edit2 size={14} className="mr-1" />
              編輯
            </button>
          )}
          {activeTabs[tour.id] === 'orders' && (
            <button
              onClick={() => openDialog('new')}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增訂單
            </button>
          )}
          {activeTabs[tour.id] === 'operations' && (
            <TourOperationsAddButton
              tour={tour}
              tourExtraFields={tourExtraFields}
              setTourExtraFields={setTourExtraFields}
            />
          )}
          {activeTabs[tour.id] === 'addons' && (
            <button
              onClick={() => setTriggerAddOnAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增加購
            </button>
          )}
          {activeTabs[tour.id] === 'refunds' && (
            <button
              onClick={() => setTriggerRefundAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增退費
            </button>
          )}
          {activeTabs[tour.id] === 'payments' && (
            <button
              onClick={() => setTriggerPaymentAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增收款
            </button>
          )}
          {activeTabs[tour.id] === 'costs' && (
            <button
              onClick={() => setTriggerCostAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增支出
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTabs[tour.id] === 'overview' && <TourOverviewTab tour={tour} />}
        {activeTabs[tour.id] === 'orders' && (
          <ExpandableOrderTable
            orders={orders.filter(order => order.tour_id === tour.id)}
            showTourInfo={false}
            tourDepartureDate={tour.departure_date}
          />
        )}
        {activeTabs[tour.id] === 'members' && <TourMembers tour={tour} />}
        {activeTabs[tour.id] === 'operations' && (
          <TourOperations tour={tour} extraFields={tourExtraFields[tour.id]} />
        )}
        {activeTabs[tour.id] === 'addons' && (
          <TourAddOns
            tour={tour}
            triggerAdd={triggerAddOnAdd[tour.id] || false}
            onTriggerAddComplete={() => setTriggerAddOnAdd(prev => ({ ...prev, [tour.id]: false }))}
          />
        )}
        {activeTabs[tour.id] === 'refunds' && (
          <TourRefunds
            tour={tour}
            triggerAdd={triggerRefundAdd[tour.id] || false}
            onTriggerAddComplete={() =>
              setTriggerRefundAdd(prev => ({ ...prev, [tour.id]: false }))
            }
          />
        )}
        {activeTabs[tour.id] === 'payments' && (
          <TourPayments
            tour={tour}
            triggerAdd={triggerPaymentAdd[tour.id] || false}
            onTriggerAddComplete={() =>
              setTriggerPaymentAdd(prev => ({ ...prev, [tour.id]: false }))
            }
          />
        )}
        {activeTabs[tour.id] === 'costs' && (
          <TourCosts
            {...({
              tour,
              triggerAdd: triggerCostAdd[tour.id] || false,
              onTriggerAddComplete: () =>
                setTriggerCostAdd(prev => ({ ...prev, [tour.id]: false })),
            } as unknown)}
          />
        )}
        {activeTabs[tour.id] === 'documents' && (
          <div className="text-center py-8 text-morandi-secondary">
            <FileCheck size={48} className="mx-auto mb-4 opacity-50" />
            <p>文件確認功能開發中...</p>
          </div>
        )}
        {activeTabs[tour.id] === 'tasks' && <TourTaskAssignment tour={tour} />}
      </div>
    </div>
  )
}
