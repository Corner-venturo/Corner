/**
 * 工作空間類型定義
 */

import type { BaseEntity } from './base.types'

export interface WorkspaceItem extends BaseEntity {
  title: string
  description?: string
  type: 'note' | 'task' | 'link' | 'file'
  content?: string
  url?: string
  file_path?: string
  tags?: string[]
  is_pinned: boolean
  position_x?: number
  position_y?: number
  color?: string
  owner_id: string
}

export type CreateWorkspaceItemData = Omit<WorkspaceItem, keyof BaseEntity>
export type UpdateWorkspaceItemData = Partial<CreateWorkspaceItemData>
