'use client'

import { BookOpen } from 'lucide-react'
import { DesignPage } from '@/features/design'
import { COMP_LAYOUT_LABELS } from '@/components/layout/constants/labels'

export default function BrochuresPage() {
  return (
    <DesignPage
      title={COMP_LAYOUT_LABELS.手冊}
      icon={BookOpen}
      breadcrumb={[
        { label: COMP_LAYOUT_LABELS.首頁, href: '/' },
        { label: COMP_LAYOUT_LABELS.手冊, href: '/brochures' },
      ]}
      categoryFilter={['brochure']}
    />
  )
}
