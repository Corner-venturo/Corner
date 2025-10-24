/**
 * 工作空間類型定義
 */

import type { BaseEntity } from './base.types';

export interface WorkspaceItem extends BaseEntity {
  title: string;
  description?: string;
  type: 'note' | 'task' | 'link' | 'file';
  content?: string;
  url?: string;
  file_path?: string;
  tags?: string[];
  is_pinned: boolean;
  position_x?: number;
  position_y?: number;
  color?: string;
  owner_id: string;
}

export type CreateWorkspaceItemData = Omit<WorkspaceItem, keyof BaseEntity>;
export type UpdateWorkspaceItemData = Partial<CreateWorkspaceItemData>;

export type ChannelMessageType =
  | 'text'
  | 'poll'
  | 'system'
  | 'file';

export interface ChannelPollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface ChannelPollSettings {
  allowMultiple: boolean;
  allowAddOptions: boolean;
  anonymous: boolean;
  deadline?: string;
}

export interface ChannelPollStats {
  totalVotes: number;
  voterCount: number;
}

export interface ChannelPoll {
  id: string;
  question: string;
  description?: string;
  options: ChannelPollOption[];
  settings: ChannelPollSettings;
  stats: ChannelPollStats;
  created_by: string;
  created_at: string;
}
