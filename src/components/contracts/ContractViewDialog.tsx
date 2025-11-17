'use client'

import { logger } from '@/lib/utils/logger'
import React, { useMemo, useState, useEffect } from 'react'
import { FileSignature, X, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tour } from '@/types/tour.types'
import { ContractData } from '@/lib/contract-utils'

interface ContractViewDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

export function ContractViewDialog({ isOpen, onClose, tour }: ContractViewDialogProps) {
  const [printing, setPrinting] = useState(false)
  const [contractHtml, setContractHtml] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // 解析儲存的合約資料
  const contractData = useMemo<Partial<ContractData>>(() => {
    if (!tour.contract_content) {
      return {}
    }
    try {
      return JSON.parse(tour.contract_content)
    } catch (error) {
      return {}
    }
  }, [tour.contract_content])

  // 載入並渲染完整合約
  useEffect(() => {
    if (!isOpen || !tour.contract_template || !tour.contract_content) {
      return
    }

    const loadContract = async () => {
      try {
        setLoading(true)

        // 讀取合約範本
        const templateMap = {
          domestic: 'domestic.html',
          international: 'international.html',
          individual_international: 'individual_international_full.html',
        }
        const templateFile =
          templateMap[tour.contract_template as keyof typeof templateMap] || 'international.html'
        const response = await fetch(`/contract-templates/${templateFile}`)

        if (!response.ok) {
          throw new Error('無法載入合約範本')
        }

        let template = await response.text()

        // 替換所有變數
        Object.entries(contractData).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g')
          template = template.replace(regex, value || '')
        })

        setContractHtml(template)
      } catch (error) {
        logger.error('載入合約失敗:', error)
        setContractHtml('<p class="text-red-500">載入合約範本失敗，請稍後再試</p>')
      } finally {
        setLoading(false)
      }
    }

    loadContract()
  }, [isOpen, tour.contract_template, tour.contract_content, contractData])

  const handlePrint = async () => {
    if (!contractHtml) {
      alert('無合約資料可列印')
      return
    }

    try {
      setPrinting(true)

      // 開啟新視窗並列印
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('請允許彈出視窗以進行列印')
        return
      }

      printWindow.document.write(contractHtml)
      printWindow.document.close()

      // 等待內容載入後列印
      printWindow.onload = () => {
        printWindow.print()
        // 列印後關閉視窗
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }
    } catch (error) {
      logger.error('列印錯誤:', error)
      alert('列印合約時發生錯誤，請稍後再試')
    } finally {
      setPrinting(false)
    }
  }

  if (!tour.contract_content) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>無合約資料</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-morandi-secondary">此旅遊團尚未儲存合約資料。</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature size={20} />
            查看合約 - {tour.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-morandi-secondary">載入合約中...</div>
            </div>
          ) : (
            <div
              className="bg-white p-8 shadow-sm border border-gray-200 rounded-lg"
              dangerouslySetInnerHTML={{ __html: contractHtml }}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={printing}>
            <X size={16} className="mr-2" />
            關閉
          </Button>
          <Button
            onClick={handlePrint}
            disabled={printing || loading}
            className="bg-morandi-gold hover:bg-morandi-gold/90"
          >
            <Printer size={16} className="mr-2" />
            {printing ? '列印中...' : '列印完整合約'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
