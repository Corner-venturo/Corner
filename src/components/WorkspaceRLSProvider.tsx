'use client'

import { useWorkspaceRLS } from '@/hooks/use-workspace-rls'

/**
 * Workspace RLS Provider
 * 在登入後自動初始化 RLS workspace 設定
 */
export function WorkspaceRLSProvider() {
  useWorkspaceRLS()
  return null
}
