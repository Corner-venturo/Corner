'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Copy,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  ArrowRightCircle,
  Check,
} from 'lucide-react'
import { useAuthStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import {
  createPackage,
  updatePackage,
  duplicatePackage,
  createQuoteForPackage,
  createItineraryForPackage,
} from '@/services/proposal.service'
import { PackageDialog } from './PackageDialog'
import { ConvertToTourDialog } from './ConvertToTourDialog'
import type { Proposal, ProposalPackage, CreatePackageData } from '@/types/proposal.types'

interface PackageListPanelProps {
  proposal: Proposal
  packages: ProposalPackage[]
  onPackagesChange: () => void
}

export function PackageListPanel({
  proposal,
  packages,
  onPackagesChange,
}: PackageListPanelProps) {
  const router = useRouter()
  const { user } = useAuthStore()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<ProposalPackage | null>(null)

  // 新增套件
  const handleCreatePackage = useCallback(
    async (data: CreatePackageData | Partial<CreatePackageData>) => {
      if (!user?.id) {
        await alert('無法取得使用者資訊', 'error')
        return
      }

      try {
        // CreatePackageData requires proposal_id and version_name, which are set in the dialog
        await createPackage(data as CreatePackageData, user.id)
        onPackagesChange()
        setAddDialogOpen(false)
      } catch (error) {
        await alert('建立套件失敗', 'error')
      }
    },
    [user?.id, onPackagesChange]
  )

  // 更新套件
  const handleUpdatePackage = useCallback(
    async (data: CreatePackageData | Partial<CreatePackageData>) => {
      if (!selectedPackage || !user?.id) return

      try {
        await updatePackage(selectedPackage.id, data, user.id)
        onPackagesChange()
        setEditDialogOpen(false)
        setSelectedPackage(null)
      } catch (error) {
        await alert('更新套件失敗', 'error')
      }
    },
    [selectedPackage, user?.id, onPackagesChange]
  )

  // 複製套件
  const handleDuplicatePackage = useCallback(
    async (pkg: ProposalPackage) => {
      if (!user?.id) return

      const newVersionName = `${pkg.version_name} (複製)`
      try {
        await duplicatePackage(pkg.id, newVersionName, user.id)
        onPackagesChange()
      } catch (error) {
        await alert('複製套件失敗', 'error')
      }
    },
    [user?.id, onPackagesChange]
  )

  // 刪除套件
  const handleDeletePackage = useCallback(
    async (pkg: ProposalPackage) => {
      const confirmed = await confirm(
        `確定要刪除套件「${pkg.version_name}」嗎？`,
        { type: 'warning', title: '刪除套件' }
      )

      if (confirmed) {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { error } = await supabase
            .from('proposal_packages' as 'notes')
            .delete()
            .eq('id', pkg.id)
          if (error) throw error
          onPackagesChange()
        } catch (error) {
          await alert('刪除套件失敗', 'error')
        }
      }
    },
    [onPackagesChange]
  )

  // 建立報價單
  const handleCreateQuote = useCallback(
    async (pkg: ProposalPackage) => {
      if (!user?.workspace_id || !user?.id) return

      if (pkg.quote_id) {
        router.push(`/quotes?highlight=${pkg.quote_id}`)
        return
      }

      try {
        const quoteId = await createQuoteForPackage(pkg.id, user.workspace_id, user.id)
        onPackagesChange()
        router.push(`/quotes?highlight=${quoteId}`)
      } catch (error) {
        await alert('建立報價單失敗', 'error')
      }
    },
    [user?.workspace_id, user?.id, onPackagesChange, router]
  )

  // 建立行程表
  const handleCreateItinerary = useCallback(
    async (pkg: ProposalPackage) => {
      if (!user?.workspace_id || !user?.id) return

      if (pkg.itinerary_id) {
        router.push(`/itinerary?highlight=${pkg.itinerary_id}`)
        return
      }

      try {
        const itineraryId = await createItineraryForPackage(pkg.id, user.workspace_id, user.id)
        onPackagesChange()
        router.push(`/itinerary?highlight=${itineraryId}`)
      } catch (error) {
        await alert('建立行程表失敗', 'error')
      }
    },
    [user?.workspace_id, user?.id, onPackagesChange, router]
  )

  // 開啟編輯對話框
  const openEditDialog = useCallback((pkg: ProposalPackage) => {
    setSelectedPackage(pkg)
    setEditDialogOpen(true)
  }, [])

  // 開啟轉團對話框
  const openConvertDialog = useCallback((pkg: ProposalPackage) => {
    setSelectedPackage(pkg)
    setConvertDialogOpen(true)
  }, [])

  // 已轉團的提案不能再操作
  const isConverted = proposal.status === 'converted'
  const isArchived = proposal.status === 'archived'
  const canEdit = !isConverted && !isArchived

  return (
    <div className="p-4 bg-morandi-container/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-morandi-primary">團體套件</h4>
        {canEdit && (
          <Button
            size="sm"
            className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus size={14} />
            新增套件
          </Button>
        )}
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-8 text-morandi-secondary">
          尚無套件，請點擊「新增套件」開始建立
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`
                bg-white rounded-lg border p-4
                ${pkg.is_selected ? 'border-morandi-gold ring-1 ring-morandi-gold/30' : 'border-border'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-morandi-primary">
                      {pkg.version_name}
                    </span>
                    <span className="text-xs text-morandi-secondary">
                      v{pkg.version_number}
                    </span>
                    {pkg.is_selected && (
                      <span className="flex items-center gap-1 text-xs text-morandi-gold bg-morandi-gold/10 px-2 py-0.5 rounded">
                        <Check size={12} />
                        已選定
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-morandi-secondary">
                    {pkg.destination && (
                      <span>目的地：{pkg.destination}</span>
                    )}
                    {pkg.start_date && (
                      <span>
                        日期：{pkg.start_date}
                        {pkg.end_date && ` ~ ${pkg.end_date}`}
                      </span>
                    )}
                    {pkg.days && (
                      <span>
                        {pkg.days}天{pkg.nights}夜
                      </span>
                    )}
                    {pkg.group_size && (
                      <span>人數：{pkg.group_size}人</span>
                    )}
                  </div>

                  {/* 關聯文件狀態 */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCreateQuote(pkg)}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded text-xs
                        ${pkg.quote_id
                          ? 'bg-morandi-green/10 text-morandi-green'
                          : 'bg-morandi-container text-morandi-secondary hover:bg-morandi-container/80'
                        }
                      `}
                    >
                      <FileText size={12} />
                      {pkg.quote_id ? '查看報價單' : '建立報價單'}
                    </button>

                    <button
                      onClick={() => handleCreateItinerary(pkg)}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded text-xs
                        ${pkg.itinerary_id
                          ? 'bg-morandi-green/10 text-morandi-green'
                          : 'bg-morandi-container text-morandi-secondary hover:bg-morandi-container/80'
                        }
                      `}
                    >
                      <Calendar size={12} />
                      {pkg.itinerary_id ? '查看行程表' : '建立行程表'}
                    </button>
                  </div>
                </div>

                {/* 操作按鈕 */}
                {canEdit && (
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDuplicatePackage(pkg)}
                      title="複製套件"
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(pkg)}
                      title="編輯套件"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-morandi-red hover:text-morandi-red"
                      onClick={() => handleDeletePackage(pkg)}
                      title="刪除套件"
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      className="ml-2 gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                      onClick={() => openConvertDialog(pkg)}
                      title="轉開團"
                    >
                      <ArrowRightCircle size={14} />
                      轉開團
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增套件對話框 */}
      <PackageDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        mode="create"
        proposalId={proposal.id}
        proposal={proposal}
        onSubmit={handleCreatePackage}
      />

      {/* 編輯套件對話框 */}
      <PackageDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode="edit"
        proposalId={proposal.id}
        proposal={proposal}
        package={selectedPackage}
        onSubmit={handleUpdatePackage}
      />

      {/* 轉開團對話框 */}
      <ConvertToTourDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        proposal={proposal}
        package={selectedPackage}
        onSuccess={() => {
          onPackagesChange()
          setConvertDialogOpen(false)
        }}
      />
    </div>
  )
}
