'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, FileX } from 'lucide-react'

interface TourNoticesSectionProps {
  data: {
    showNotices?: boolean
    notices?: string[]
    showCancellationPolicy?: boolean
    cancellationPolicy?: string[]
  }
  viewMode?: 'desktop' | 'mobile'
}

export function TourNoticesSection({ data, viewMode = 'desktop' }: TourNoticesSectionProps) {
  const notices = data.notices || []
  const cancellationPolicy = data.cancellationPolicy || []

  const hasNotices = data.showNotices && notices.length > 0
  const hasCancellation = data.showCancellationPolicy && cancellationPolicy.length > 0

  if (!hasNotices && !hasCancellation) {
    return null
  }

  const isMobile = viewMode === 'mobile'

  return (
    <section className={cn('py-12 bg-slate-50', isMobile && 'py-8')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'grid gap-8',
          hasNotices && hasCancellation ? 'lg:grid-cols-2' : 'grid-cols-1'
        )}>
          {/* 提醒事項 */}
          {hasNotices && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className={cn(
                'font-bold text-morandi-primary mb-6 flex items-center gap-3',
                isMobile ? 'text-lg' : 'text-xl'
              )}>
                <AlertCircle className={cn('text-amber-500', isMobile ? 'w-5 h-5' : 'w-6 h-6')} />
                <span>
                  提醒事項
                  <span className="text-xs font-normal text-morandi-secondary ml-2">NOTICES</span>
                </span>
              </h2>

              <ul className="space-y-3">
                {notices.map((notice, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex gap-3 text-morandi-secondary leading-relaxed',
                      isMobile ? 'text-xs' : 'text-sm'
                    )}
                  >
                    <span className="text-amber-500 font-bold flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span>{notice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 取消政策 */}
          {hasCancellation && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className={cn(
                'font-bold text-morandi-primary mb-6 flex items-center gap-3',
                isMobile ? 'text-lg' : 'text-xl'
              )}>
                <FileX className={cn('text-red-400', isMobile ? 'w-5 h-5' : 'w-6 h-6')} />
                <span>
                  取消政策
                  <span className="text-xs font-normal text-morandi-secondary ml-2">CANCELLATION</span>
                </span>
              </h2>

              <ul className="space-y-4">
                {cancellationPolicy.map((policy, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex gap-3 text-morandi-secondary leading-relaxed',
                      isMobile ? 'text-xs' : 'text-sm'
                    )}
                  >
                    <span className="text-red-400 flex-shrink-0 mt-0.5">
                      <span className="inline-block w-5 h-5 rounded-full bg-red-50 text-center text-xs font-bold leading-5">
                        {index + 1}
                      </span>
                    </span>
                    <span>{policy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
