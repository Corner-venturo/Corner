/**
 * usePrintLogo - Hook for loading company logo
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export const usePrintLogo = (isOpen: boolean) => {
  const [logoUrl, setLogoUrl] = useState<string>('')

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('company_assets')
          .select('file_path')
          .eq('category', 'logos')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          logger.error('載入 Logo 失敗:', error)
          return
        }

        if (data?.file_path) {
          const { data: urlData } = supabase.storage
            .from('company-assets')
            .getPublicUrl(data.file_path)

          setLogoUrl(`${urlData.publicUrl}?t=${Date.now()}`)
        }
      } catch (error) {
        logger.error('載入 Logo 錯誤:', error)
      }
    }

    if (isOpen) {
      loadLogo()
    }
  }, [isOpen])

  return logoUrl
}
