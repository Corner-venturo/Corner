import { Metadata } from 'next'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import PublicViewClient from './client'
import { PUBLIC_VIEW_LABELS } from './constants/labels'

interface PageProps {
  params: Promise<{ id: string }>
}

// 動態生成 metadata（Open Graph for LINE/Facebook 預覽）
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const supabase = getSupabaseAdminClient()
    const { data: itinerary } = await supabase
      .from('itineraries')
      .select('title, tour_code, description, cover_image')
      .eq('id', id)
      .single()

    if (itinerary) {
      // LINE 預覽標題：只顯示團名
      const title = itinerary.title || PUBLIC_VIEW_LABELS.METADATA_TITLE_FALLBACK
      const description =
        itinerary.description ||
        PUBLIC_VIEW_LABELS.METADATA_DESCRIPTION_TEMPLATE.replace(
          '{title}',
          itinerary.title || PUBLIC_VIEW_LABELS.ITINERARY_FALLBACK
        )

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: itinerary.cover_image ? [itinerary.cover_image] : [],
          type: 'website',
        },
      }
    }
  } catch (error) {
    logger.error('generateMetadata error:', error)
  }

  return {
    title: PUBLIC_VIEW_LABELS.METADATA_TITLE_FALLBACK,
    description: PUBLIC_VIEW_LABELS.METADATA_DESCRIPTION_FALLBACK,
  }
}

/**
 * 公開分享頁面
 * 讓客戶可以不用登入直接查看行程表
 */
export default async function PublicViewPage({ params }: PageProps) {
  const { id } = await params
  return <PublicViewClient id={id} />
}
