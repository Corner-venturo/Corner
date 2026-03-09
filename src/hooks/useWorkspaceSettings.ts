import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'

interface WorkspaceSettings {
  name: string
  phone: string
  address: string
  bank_name: string
  bank_branch: string
  bank_account: string
  bank_account_name: string
}

const EMPTY_SETTINGS: WorkspaceSettings = {
  name: '',
  phone: '',
  address: '',
  bank_name: '',
  bank_branch: '',
  bank_account: '',
  bank_account_name: '',
}

const SELECT_FIELDS =
  'name, phone, address, bank_name, bank_branch, bank_account, bank_account_name' as const

/**
 * 取得目前 workspace 的公司設定（銀行資訊、電話、地址等）
 * 用於列印模板、信封等需要動態讀取公司資訊的場景
 */
export function useWorkspaceSettings(): WorkspaceSettings {
  const workspaceId = useAuthStore(state => state.user?.workspace_id)
  const [settings, setSettings] = useState<WorkspaceSettings>(EMPTY_SETTINGS)

  useEffect(() => {
    if (!workspaceId) return

    let cancelled = false

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select(SELECT_FIELDS)
          .eq('id', workspaceId)
          .single()

        if (error) {
          logger.error('載入 workspace 設定失敗:', error)
          return
        }

        if (!cancelled && data) {
          setSettings({
            name: data.name ?? '',
            phone: data.phone ?? '',
            address: data.address ?? '',
            bank_name: data.bank_name ?? '',
            bank_branch: data.bank_branch ?? '',
            bank_account: data.bank_account ?? '',
            bank_account_name: data.bank_account_name ?? '',
          })
        }
      } catch (err) {
        logger.error('載入 workspace 設定錯誤:', err)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [workspaceId])

  return settings
}
