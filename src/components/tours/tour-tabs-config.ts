// src/components/tours/tour-tabs-config.ts
import { BarChart3, ShoppingCart, Users, Clipboard, Package, RefreshCw, Calculator, AlertCircle, FileCheck, UserPlus } from 'lucide-react';

export const TOUR_TABS = [
  { id: 'overview', label: '總覽', icon: BarChart3 },
  { id: 'orders', label: '訂單管理', icon: ShoppingCart },
  { id: 'members', label: '團員名單', icon: Users },
  { id: 'operations', label: '團務', icon: Clipboard },
  { id: 'addons', label: '加購', icon: Package },
  { id: 'refunds', label: '退費', icon: RefreshCw },
  { id: 'payments', label: '收款紀錄', icon: Calculator },
  { id: 'costs', label: '成本支出', icon: AlertCircle },
  { id: 'documents', label: '文件確認', icon: FileCheck },
  { id: 'tasks', label: '指派任務', icon: UserPlus },
];