import { useState, useEffect } from 'react'
import { Tour, ContractTemplate } from '@/types/tour.types'
import { useTourStore, useOrderStore, useMemberStore, useItineraryStore } from '@/stores'
import { prepareContractData, ContractData } from '@/lib/contract-utils'

interface UseContractFormProps {
  tour: Tour
  mode: 'create' | 'edit'
  isOpen: boolean
}

export function useContractForm({ tour, mode, isOpen }: UseContractFormProps) {
  const { update: updateTour } = useTourStore()
  const { items: orders } = useOrderStore()
  const { items: members } = useMemberStore()
  const { items: itineraries } = useItineraryStore()

  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | ''>('')
  const [contractNotes, setContractNotes] = useState('')
  const [contractCompleted, setContractCompleted] = useState(false)
  const [archivedDate, setArchivedDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [contractData, setContractData] = useState<Partial<ContractData>>({})
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')

  // 取得這個團的資料
  const tourOrders = orders.filter(o => o.tour_id === tour.id)
  const firstOrder = tourOrders[0]
  const selectedOrder = tourOrders.find(o => o.id === selectedOrderId) || firstOrder
  const tourMembers = members.filter(m => m.tour_id === tour.id)
  const selectedOrderMembers = selectedOrder
    ? members.filter(m => m.order_id === selectedOrder.id)
    : []
  const itinerary = itineraries.find(i => i.tour_id === tour.id)

  // 初始化選擇的訂單（預設第一個）
  useEffect(() => {
    if (isOpen && firstOrder) {
      // 對話框開啟時，如果還沒選擇訂單，預設第一個
      if (!selectedOrderId) {
        setSelectedOrderId(firstOrder.id)
      }
    } else if (!isOpen) {
      // 對話框關閉時，重置選擇的訂單
      setSelectedOrderId('')
    }
  }, [isOpen, firstOrder])

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && tour.contract_template) {
        setSelectedTemplate(tour.contract_template as ContractTemplate)
        setContractNotes(tour.contract_notes || '')
        setContractCompleted(tour.contract_completed || false)
        setArchivedDate(tour.contract_archived_date || '')

        // 載入已儲存的合約資料,或從系統自動帶入
        if (tour.contract_content) {
          try {
            const savedData = JSON.parse(tour.contract_content)
            setContractData(savedData)
          } catch {
            // 如果 contract_content 不是 JSON,就重新準備資料
            if (selectedOrder) {
              const firstMember = selectedOrderMembers[0]
              const autoData = prepareContractData(tour, selectedOrder, firstMember, itinerary)
              setContractData(autoData)
            }
          }
        } else if (selectedOrder) {
          const firstMember = selectedOrderMembers[0]
          const autoData = prepareContractData(tour, selectedOrder, firstMember, itinerary)
          setContractData(autoData)
        }
      } else {
        // 建立模式:自動準備資料
        setSelectedTemplate('')
        setContractNotes('')
        setContractCompleted(false)
        setArchivedDate('')

        if (selectedOrder) {
          // 有訂單資料，自動帶入
          const firstMember = selectedOrderMembers[0]
          const autoData = prepareContractData(tour, selectedOrder, firstMember, itinerary)
          setContractData(autoData)
        } else {
          // 沒有訂單資料，初始化空白欄位
          setContractData({
            reviewYear: new Date().getFullYear().toString(),
            reviewMonth: (new Date().getMonth() + 1).toString(),
            reviewDay: new Date().getDate().toString(),
            travelerName: '',
            travelerAddress: '',
            travelerIdNumber: '',
            travelerPhone: '',
            tourName: tour.name || '',
            tourDestination: tour.location || '',
            tourCode: tour.code || '',
            gatherYear: '',
            gatherMonth: '',
            gatherDay: '',
            gatherHour: '',
            gatherMinute: '',
            gatherLocation: '',
            totalAmount: '',
            depositAmount: '',
            deathInsurance: '2,500,000',
            medicalInsurance: '100,000',
            companyExtension: '',
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, tour.id])

  const handleFieldChange = (field: keyof ContractData, value: string) => {
    // 數字欄位自動轉半形
    const numberFields = [
      'reviewYear',
      'reviewMonth',
      'reviewDay',
      'gatherYear',
      'gatherMonth',
      'gatherDay',
      'gatherHour',
      'gatherMinute',
      'totalAmount',
      'depositAmount',
    ]

    let processedValue = value
    if (numberFields.includes(field)) {
      // 全形數字轉半形
      processedValue = value.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    }

    setContractData(prev => ({ ...prev, [field]: processedValue }))
  }

  const handleSave = async () => {
    if (mode === 'create' && !selectedTemplate) {
      alert('請選擇合約範本')
      return
    }

    setSaving(true)
    try {
      // 將合約資料轉成 JSON 儲存
      const contractContentJson = JSON.stringify(contractData)

      if (mode === 'create') {
        await updateTour(tour.id, {
          contract_template: selectedTemplate as ContractTemplate,
          contract_content: contractContentJson,
          contract_created_at: new Date().toISOString(),
          contract_notes: contractNotes,
          contract_completed: contractCompleted,
          contract_archived_date: archivedDate || undefined,
        })
        alert('合約建立成功!')
      } else {
        await updateTour(tour.id, {
          contract_content: contractContentJson,
          contract_notes: contractNotes,
          contract_completed: contractCompleted,
          contract_archived_date: archivedDate || undefined,
        })
        alert('合約更新成功!')
      }
      return true
    } catch (error) {
      alert('儲存合約失敗，請稍後再試')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = async () => {
    if (!contractData || Object.keys(contractData).length === 0) {
      alert('請先填寫合約資料')
      return
    }

    try {
      // 先儲存合約資料
      setSaving(true)
      const contractContentJson = JSON.stringify(contractData)
      await updateTour(tour.id, {
        contract_template: selectedTemplate,
        contract_content: contractContentJson,
        contract_created_at: new Date().toISOString(),
        contract_notes: contractNotes,
        contract_completed: contractCompleted,
        contract_archived_date: archivedDate || '',
      })

      // 讀取合約範本
      const templateMap: Record<string, string> = {
        domestic: 'domestic.html',
        international: 'international.html',
        individual_international: 'individual_international.html',
      }
      const templateFile = templateMap[selectedTemplate as string] || 'international.html'
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

      // 開啟新視窗並列印
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('請允許彈出視窗以進行列印')
        return
      }

      printWindow.document.write(template)
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
      alert('列印合約時發生錯誤，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  return {
    selectedTemplate,
    setSelectedTemplate,
    contractNotes,
    setContractNotes,
    contractCompleted,
    setContractCompleted,
    archivedDate,
    setArchivedDate,
    saving,
    contractData,
    handleFieldChange,
    handleSave,
    handlePrint,
    firstOrder,
    tourMembers,
    tourOrders,
    selectedOrderId,
    setSelectedOrderId,
    selectedOrder,
  }
}
