'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { FileSignature, Edit2, Trash2, Eye, Mail, Plus } from 'lucide-react'
import { useToursSlim, updateTour } from '@/data'
import { useToast } from '@/components/ui/use-toast'
import { confirm } from '@/lib/ui/alert-dialog'
import { Tour } from '@/stores/types'
import { TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell, NumberCell } from '@/components/table-cells'
import { ContractDialog } from '@/components/contracts/ContractDialog'
import { ContractViewDialog } from '@/components/contracts/ContractViewDialog'
import { EnvelopeDialog } from '@/components/contracts/EnvelopeDialog'
import { SelectTourDialog } from '@/components/contracts/SelectTourDialog'

export default function ContractsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tourIdParam = searchParams?.get('tour_id')
  const { items: tours } = useToursSlim()
  const { toast } = useToast()
  const [contractDialog, setContractDialog] = useState<{
    isOpen: boolean
    tour: Tour | null
    mode: 'create' | 'edit'
  }>({
    isOpen: false,
    tour: null,
    mode: 'edit',
  })
  const [viewDialog, setViewDialog] = useState<{ isOpen: boolean; tour: Tour | null }>({
    isOpen: false,
    tour: null,
  })
  const [envelopeDialog, setEnvelopeDialog] = useState<{ isOpen: boolean; tour: Tour | null }>({
    isOpen: false,
    tour: null,
  })
  const [selectTourDialog, setSelectTourDialog] = useState(false)

  // 篩選沒有合約的團
  const toursWithoutContract = useMemo(() => {
    return tours.filter(tour => !tour.contract_template)
  }, [tours])

  // 篩選旅遊團 - 只顯示有合約的團（或是從 URL 指定的團）
  const contractTours = useMemo(() => {
    if (tourIdParam) {
      // 如果有指定 tour_id，只顯示該團（無論有無合約）
      return tours.filter(tour => tour.id === tourIdParam)
    }
    // 否則顯示所有有合約的團
    return tours.filter(tour => !!tour.contract_template)
  }, [tours, tourIdParam])

  // 追蹤是否已經自動打開過對話框
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  // 自動打開對話框（如果從旅遊團頁面跳轉過來）- 只在首次載入時執行
  useEffect(() => {
    if (tourIdParam && tours.length > 0 && !hasAutoOpened) {
      const targetTour = tours.find(tour => tour.id === tourIdParam)
      if (targetTour) {
        // 如果該團已有合約，打開編輯對話框；否則打開新增對話框
        const mode = targetTour.contract_template ? 'edit' : 'create'
        setContractDialog({
          isOpen: true,
          tour: targetTour,
          mode,
        })
        setHasAutoOpened(true)
      }
    }
  }, [tourIdParam, tours, hasAutoOpened])

  const handleRowClick = useCallback((tour: Tour) => {
    setContractDialog({
      isOpen: true,
      tour: tour,
      mode: 'edit',
    })
  }, [])

  // 定義表格欄位
  const columns: TableColumn<Tour>[] = useMemo(
    () => [
      {
        key: 'code',
        label: '團號',
        sortable: true,
      },
      {
        key: 'name',
        label: '團名',
        sortable: true,
      },
      {
        key: 'departure_date',
        label: '出發時間',
        sortable: true,
        render: (_, tour) => <DateCell date={tour.departure_date} showIcon={false} />,
      },
      {
        key: 'participants',
        label: '人數',
        render: (_, tour) => <NumberCell value={tour.current_participants || 0} suffix="人" />,
      },
      {
        key: 'contract_status',
        label: '狀態',
        sortable: true,
        render: (_, tour) => {
          let status = '建立完成'
          let colorClass = 'text-morandi-primary/80 bg-morandi-container px-2 py-1 rounded'

          if (tour.contract_completed) {
            status = '已完成'
            colorClass = 'text-morandi-gold bg-morandi-gold/10 px-2 py-1 rounded'
          } else if (tour.contract_archived_date) {
            status = '已歸檔'
            colorClass = 'text-morandi-secondary bg-morandi-secondary/10 px-2 py-1 rounded'
          }

          return <span className={`text-sm font-medium ${colorClass}`}>{status}</span>
        },
      },
    ],
    []
  )

  const handleDeleteContract = useCallback(
    async (tour: Tour) => {
      const confirmed = await confirm(`確定要刪除「${tour.name}」的合約嗎？`, {
        type: 'warning',
        title: '刪除合約',
      })

      if (!confirmed) {
        return
      }

      try {
        // 準備更新資料：只包含需要清除的欄位
        await updateTour(tour.id, {
          contract_template: null,
          contract_content: null,
          contract_created_at: null,
          contract_notes: null,
          contract_completed: false,
          contract_archived_date: null,
        })

        // 清除 URL 參數，避免重新整理後又跳出建立合約對話框
        if (tourIdParam) {
          router.replace('/contracts')
        }

        toast({
          title: '刪除成功',
          description: `已刪除「${tour.name}」的合約`,
        })
      } catch (error) {
        toast({
          title: '刪除失敗',
          description: '刪除合約時發生錯誤，請稍後再試',
          variant: 'destructive',
        })
      }
    },
    [updateTour, toast, tourIdParam, router]
  )

  const renderActions = useCallback(
    (tour: Tour) => (
      <ActionCell
        actions={[
          {
            icon: Eye,
            label: '查看合約',
            onClick: () => setViewDialog({ isOpen: true, tour }),
          },
          {
            icon: Edit2,
            label: '編輯',
            onClick: () => setContractDialog({ isOpen: true, tour, mode: 'edit' }),
          },
          {
            icon: Mail,
            label: '列印信封',
            onClick: () => setEnvelopeDialog({ isOpen: true, tour }),
          },
          {
            icon: Trash2,
            label: '刪除',
            onClick: () => handleDeleteContract(tour),
            variant: 'danger',
          },
        ]}
      />
    ),
    [handleDeleteContract]
  )

  // 選擇團後建立合約
  const handleSelectTour = useCallback((tour: Tour) => {
    setSelectTourDialog(false)
    setContractDialog({
      isOpen: true,
      tour,
      mode: 'create',
    })
  }, [])

  return (
    <>
      <ListPageLayout
        title="合約管理"
        icon={FileSignature}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '合約管理', href: '/contracts' },
        ]}
        data={contractTours}
        columns={columns}
        searchFields={['name', 'code', 'status']}
        searchPlaceholder="搜尋合約..."
        onRowClick={handleRowClick}
        renderActions={renderActions}
        bordered={true}
        onAdd={() => setSelectTourDialog(true)}
        addLabel="新增合約"
      />

      {/* View dialog */}
      {viewDialog.tour && (
        <ContractViewDialog
          isOpen={viewDialog.isOpen}
          onClose={() => setViewDialog({ isOpen: false, tour: null })}
          tour={viewDialog.tour}
        />
      )}

      {/* Contract dialog */}
      {contractDialog.tour && (
        <ContractDialog
          isOpen={contractDialog.isOpen}
          onClose={() => setContractDialog({ isOpen: false, tour: null, mode: 'edit' })}
          tour={contractDialog.tour}
          mode={contractDialog.mode}
        />
      )}

      {/* Envelope dialog */}
      {envelopeDialog.tour && (
        <EnvelopeDialog
          isOpen={envelopeDialog.isOpen}
          onClose={() => setEnvelopeDialog({ isOpen: false, tour: null })}
          tour={envelopeDialog.tour}
        />
      )}

      {/* Select tour dialog */}
      <SelectTourDialog
        isOpen={selectTourDialog}
        onClose={() => setSelectTourDialog(false)}
        tours={toursWithoutContract}
        onSelect={handleSelectTour}
      />
    </>
  )
}
