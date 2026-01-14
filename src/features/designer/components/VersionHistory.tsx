'use client'

/**
 * VersionHistory - 版本歷史面板
 *
 * 顯示文件的所有版本，允許預覽和恢復
 */

import { useEffect, useState } from 'react'
import { X, Clock, RotateCcw, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentStore, type DocumentVersion } from '@/stores/document-store'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface VersionHistoryProps {
  onClose: () => void
  onPreview?: (version: DocumentVersion) => void
}

export function VersionHistory({ onClose, onPreview }: VersionHistoryProps) {
  const {
    versions,
    currentVersion,
    fetchVersions,
    restoreVersion,
    isLoading,
  } = useDocumentStore()

  const [restoringId, setRestoringId] = useState<string | null>(null)

  // Fetch versions on mount
  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const handleRestore = async (versionId: string) => {
    if (restoringId) return
    setRestoringId(versionId)
    await restoreVersion(versionId)
    setRestoringId(null)
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-morandi-gold" />
          <h3 className="font-semibold text-morandi-primary">版本歷史</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-morandi-gold" />
          </div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-center text-morandi-secondary text-sm">
            尚無版本記錄
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {versions.map((version) => {
              const isCurrent = version.id === currentVersion?.id
              const isRestoring = restoringId === version.id

              return (
                <div
                  key={version.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    isCurrent
                      ? 'border-morandi-gold bg-morandi-gold/5'
                      : 'border-border hover:border-morandi-gold/50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="flex gap-3">
                    <div className="w-16 h-20 bg-morandi-container rounded overflow-hidden flex-shrink-0">
                      {version.thumbnail_url ? (
                        <img
                          src={version.thumbnail_url}
                          alt={`版本 ${version.version_number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-morandi-muted">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-morandi-primary">
                          版本 {version.version_number}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-morandi-gold text-white px-1.5 py-0.5 rounded">
                            目前
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-morandi-secondary mt-1">
                        {formatDistanceToNow(new Date(version.created_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </div>

                      {version.created_by && (
                        <div className="text-xs text-morandi-muted mt-0.5 truncate">
                          {version.created_by}
                        </div>
                      )}

                      {version.restored_from && (
                        <div className="text-xs text-morandi-gold mt-0.5">
                          從舊版本恢復
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCurrent && (
                    <div className="flex gap-2 mt-3">
                      {onPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => onPreview(version)}
                        >
                          預覽
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs gap-1"
                        onClick={() => handleRestore(version.id)}
                        disabled={isRestoring}
                      >
                        {isRestoring ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                        恢復
                      </Button>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-morandi-gold">
                      <Check size={12} />
                      <span>目前使用中</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border text-xs text-morandi-muted text-center">
        版本會在每次儲存時自動建立
      </div>
    </div>
  )
}
