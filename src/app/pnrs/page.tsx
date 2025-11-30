'use client'

import { usePNRStore } from '@/stores/pnrs-store'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plane, Search, Calendar, AlertCircle } from 'lucide-react'
import { formatSegment } from '@/lib/pnr-parser'

export default function PNRsPage() {
  const { items: pnrs, fetchAll, loading } = usePNRStore()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filteredPNRs = pnrs.filter(pnr => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      pnr.record_locator?.toLowerCase().includes(search) ||
      pnr.passenger_names?.some(name => name.toLowerCase().includes(search))
    )
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-morandi-primary flex items-center gap-2">
            <Plane className="text-morandi-sky" />
            PNR 管理
          </h1>
          <p className="text-morandi-secondary mt-1">航班訂位記錄管理</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary" size={18} />
          <Input
            placeholder="搜尋訂位代號或旅客姓名..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* PNR List */}
      {loading ? (
        <div className="text-center py-12 text-morandi-secondary">載入中...</div>
      ) : filteredPNRs.length === 0 ? (
        <div className="text-center py-12 text-morandi-secondary">
          {searchTerm ? '沒有符合的記錄' : '尚無 PNR 記錄'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPNRs.map(pnr => (
            <div
              key={pnr.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Plane size={18} className="text-morandi-sky" />
                    <h3 className="text-lg font-semibold text-morandi-primary">
                      {pnr.record_locator}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        pnr.status === 'active'
                          ? 'bg-morandi-success/10 text-morandi-success'
                          : 'bg-morandi-secondary/10 text-morandi-secondary'
                      }`}
                    >
                      {pnr.status === 'active' ? '有效' : '已取消'}
                    </span>
                  </div>
                  <p className="text-sm text-morandi-secondary">
                    旅客: {pnr.passenger_names?.join(', ')}
                  </p>
                </div>

                {pnr.ticketing_deadline && (
                  <div className="flex items-center gap-1 text-sm">
                    {new Date(pnr.ticketing_deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && (
                      <AlertCircle size={14} className="text-morandi-alert" />
                    )}
                    <Calendar size={14} className="text-morandi-secondary" />
                    <span className="text-morandi-secondary">
                      出票期限: {new Date(pnr.ticketing_deadline).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                )}
              </div>

              {/* Flight Segments */}
              {pnr.segments && pnr.segments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-morandi-secondary">航班資訊</h4>
                  <div className="space-y-1">
                    {pnr.segments.map((seg: unknown, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-morandi-primary bg-morandi-container/10 px-3 py-2 rounded-lg"
                      >
                        <Plane size={12} className="text-morandi-sky" />
                        {formatSegment(seg)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-border text-xs text-morandi-secondary">
                建立時間: {new Date(pnr.created_at).toLocaleString('zh-TW')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
