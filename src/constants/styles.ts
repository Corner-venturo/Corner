// src/constants/styles.ts
import { TOUR_STATUS, ORDER_STATUS, TODO_STATUS } from './status';

export const STATUS_COLORS = {
  [TOUR_STATUS.PROPOSAL]: 'bg-morandi-blue text-white',
  [TOUR_STATUS.IN_PROGRESS]: 'bg-morandi-green text-white',
  [TOUR_STATUS.PENDING_CLOSE]: 'bg-morandi-gold text-white',
  [TOUR_STATUS.CLOSED]: 'bg-morandi-container text-morandi-secondary',
  [TOUR_STATUS.SPECIAL]: 'bg-morandi-red text-white',

  [ORDER_STATUS.UNPAID]: 'bg-morandi-red text-white',
  [ORDER_STATUS.PARTIAL]: 'bg-morandi-gold text-white',
  [ORDER_STATUS.PAID]: 'bg-morandi-green text-white',

  [TODO_STATUS.PENDING]: 'bg-morandi-container text-morandi-secondary',
  // [TODO_STATUS.IN_PROGRESS]: 'bg-morandi-gold text-white', // Duplicate removed
  [TODO_STATUS.COMPLETED]: 'bg-morandi-green text-white'
} as const;