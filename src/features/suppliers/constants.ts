/**
 * Suppliers feature constants
 */

import {
  Hotel,
  UtensilsCrossed,
  Car,
  Ticket,
  UserCheck,
  Plane,
  Package
} from 'lucide-react';

export const SUPPLIER_TYPE_ICONS = {
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  transport: Car,
  ticket: Ticket,
  guide: UserCheck,
  travel_agency: Plane,
  other: Package
} as const;

export const SUPPLIER_TYPE_LABELS = {
  hotel: '飯店住宿',
  restaurant: '餐廳',
  transport: '交通',
  ticket: '門票',
  guide: '導遊',
  travel_agency: '旅行社',
  other: '其他'
} as const;

export const SUPPLIER_TYPE_COLORS = {
  hotel: 'bg-blue-500',
  restaurant: 'bg-green-500',
  transport: 'bg-orange-500',
  ticket: 'bg-purple-500',
  guide: 'bg-pink-500',
  travel_agency: 'bg-cyan-500',
  other: 'bg-gray-500'
} as const;
