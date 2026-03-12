import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { COMPANY } from '@/lib/constants/company'
import { logger } from '@/lib/utils/logger'

interface CompanyInfo {
  legalName: string
  subtitle: string
}

/**
 * 取得目前 workspace 的法定名稱和標語
 * 空值自動 fallback 到 COMPANY 常量
 */
export function useCompanyInfo(): CompanyInfo {
  const workspaceId = useAuthStore(state => state.user?.workspace_id)
  const [info, setInfo] = useState<CompanyInfo>({
    legalName: COMPANY.legalName,
    subtitle: COMPANY.subtitle,
  })

  useEffect(() => {
    if (!workspaceId) return

    let cancelled = false

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('legal_name, subtitle')
          .eq('id', workspaceId)
          .single()

        if (error) {
          logger.error('載入公司資訊失敗:', error)
          return
        }

        if (!cancelled && data) {
          setInfo({
            legalName: data.legal_name || COMPANY.legalName,
            subtitle: data.subtitle || COMPANY.subtitle,
          })
        }
      } catch (err) {
        logger.error('載入公司資訊錯誤:', err)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [workspaceId])

  return info
}
