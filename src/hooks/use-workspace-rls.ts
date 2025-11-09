import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Workspace RLS Hook
 * 用於設定當前 workspace，啟用 Supabase RLS 資料隔離
 *
 * 使用方式：
 * ```tsx
 * // 在 App Layout 中呼叫
 * useWorkspaceRLS();
 * ```
 */
export function useWorkspaceRLS() {
  const { currentWorkspaceId, setCurrentWorkspace } = useWorkspaceStore()
  const { currentProfile } = useAuthStore()

  useEffect(() => {
    if (!currentWorkspaceId) {
      return
    }

    // 呼叫 Supabase Function 設定當前 workspace
    const setWorkspaceInDatabase = async () => {
      try {
        const { error } = await supabase.rpc('set_current_workspace', {
          workspace_id: currentWorkspaceId,
        })

        if (error) {
          console.error('[Workspace RLS] 設定失敗:', error)
        } else {
          console.log('[Workspace RLS] 已設定 workspace:', currentWorkspaceId)
        }
      } catch (err) {
        console.error('[Workspace RLS] 執行錯誤:', err)
      }
    }

    setWorkspaceInDatabase()
  }, [currentWorkspaceId])

  // 登入後自動設定預設 workspace
  useEffect(() => {
    if (!currentProfile || currentWorkspaceId) {
      return
    }

    // 從員工資料取得預設 workspace
    const defaultWorkspace = currentProfile.workspace_id || 'taipei'

    console.log('[Workspace RLS] 自動設定預設 workspace:', defaultWorkspace)
    setCurrentWorkspace(defaultWorkspace)
  }, [currentProfile, currentWorkspaceId, setCurrentWorkspace])
}

/**
 * 手動切換 Workspace
 * 可用於 UI 切換器
 */
export async function switchWorkspace(workspaceId: string) {
  const { error } = await supabase.rpc('set_current_workspace', {
    workspace_id: workspaceId,
  })

  if (error) {
    console.error('[Workspace Switch] 失敗:', error)
    throw error
  }

  console.log('[Workspace Switch] 已切換到:', workspaceId)

  // 重新載入資料
  window.location.reload()
}
