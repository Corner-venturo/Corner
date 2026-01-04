import { formatDate } from '@/lib/utils/format-date'
export interface TaskTemplate {
  id: string
  title: string
  sub_tasks: string[]
  defaultDeadlineDays: number // 相對出發日期的天數（負數表示之前）
  defaultPriority: 1 | 2 | 3 | 4 | 5
  category: 'preparation' | 'documents' | 'booking' | 'finance' | 'operation'
}

export const taskTemplates: Record<string, TaskTemplate> = {
  'pre-tour': {
    id: 'pre-tour',
    title: '行前準備工作',
    sub_tasks: ['確認最終名單', '準備行程資料', '確認導遊領隊', '準備行前說明資料', '發送行前通知'],
    defaultDeadlineDays: -7, // 出發前7天
    defaultPriority: 4,
    category: 'preparation',
  },

  documents: {
    id: 'documents',
    title: '文件準備作業',
    sub_tasks: ['收集護照資料', '準備簽證文件', '保險投保', '合約簽署', '收據開立'],
    defaultDeadlineDays: -14, // 出發前14天
    defaultPriority: 3,
    category: 'documents',
  },

  booking: {
    id: 'booking',
    title: '訂房訂車作業',
    sub_tasks: ['飯店訂房確認', '遊覽車預訂', '餐廳訂位', '門票購買', '導遊聯繫'],
    defaultDeadlineDays: -21, // 出發前21天
    defaultPriority: 4,
    category: 'booking',
  },

  collection: {
    id: 'collection',
    title: '收款作業',
    sub_tasks: ['發送訂金通知', '確認訂金收款', '發送尾款通知', '確認尾款收款', '開立收據'],
    defaultDeadlineDays: -30, // 出發前30天
    defaultPriority: 5,
    category: 'finance',
  },

  'cost-control': {
    id: 'cost-control',
    title: '成本控制',
    sub_tasks: ['供應商詢價', '比價分析', '簽訂供應商合約', '請款單準備', '成本核算'],
    defaultDeadlineDays: -45, // 出發前45天
    defaultPriority: 3,
    category: 'finance',
  },

  'quality-check': {
    id: 'quality-check',
    title: '品質檢查',
    sub_tasks: ['行程表確認', '住宿標準檢查', '餐食安排確認', '交通安排檢查', '緊急聯絡資訊準備'],
    defaultDeadlineDays: -10, // 出發前10天
    defaultPriority: 3,
    category: 'operation',
  },
}

export function getTemplatesByCategory(category?: string): TaskTemplate[] {
  const templates = Object.values(taskTemplates)
  return category ? templates.filter(t => t.category === category) : templates
}

export function calculateDeadlineFromDeparture(departure_date: string, daysBefore: number): string {
  const departure = new Date(departure_date)
  const deadline = new Date(departure)
  deadline.setDate(deadline.getDate() + daysBefore) // daysBefore 是負數
  return formatDate(deadline)
}
