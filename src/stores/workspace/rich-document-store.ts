/**
 * Rich Document Store (使用 createStore)
 * 管理 rich_documents 表格資料
 * 自動繼承快取優先、Realtime 同步等功能
 */

import { createStore } from '../core/create-store'
import type { RichDocument } from './types'
import type { BaseEntity } from '@/types'

/**
 * Rich Document 擴展型別（符合 BaseEntity）
 */
type RichDocumentEntity = RichDocument &
  Pick<BaseEntity, 'updated_at'> & {
    created_at: string
    updated_at: string
  }

/**
 * Rich Document Store
 * 表格: rich_documents
 * 快取策略: 全量快取 (數量不多，經常使用)
 *
 * 原因：
 * - 文件數量通常不多
 * - 經常需要快速搜尋和查看
 * - 全量快取提升使用體驗
 */
export const useRichDocumentStore = createStore<RichDocumentEntity>({
  tableName: 'rich_documents' as any,
  cacheStrategy: 'full',
  enableRealtime: true,
} as any)

/**
 * Hook 型別（方便使用）
 */
export type RichDocumentStoreType = ReturnType<typeof useRichDocumentStore>
