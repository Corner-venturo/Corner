import { useState, useEffect } from 'react'
import { Tour, ContractTemplate } from '@/types/tour.types'
import { Order, Member } from '@/types/order.types'
import { useTourStore, useOrderStore, useMemberStore, useItineraryStore, useQuoteStore } from '@/stores'
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
  const { items: itineraries, fetchAll: fetchItineraries } = useItineraryStore()
  const { items: quotes } = useQuoteStore()

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

  // 取得關聯的報價單（用於帶入客戶聯絡資訊）
  const linkedQuote = quotes.find(q => q.tour_id === tour.id)

  // 對話框開啟時載入行程表資料
  useEffect(() => {
    if (isOpen) {
      // 每次開啟都重新載入，確保資料最新
      fetchItineraries()
    }
  }, [isOpen, fetchItineraries])

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
            // 如果已儲存的旅客資訊為空，嘗試從報價單補上（欄位名是 customer_name, contact_phone, contact_address）
            if (!savedData.travelerName && (linkedQuote as any)?.customer_name) {
              savedData.travelerName = (linkedQuote as any).customer_name
            }
            if (!savedData.travelerAddress && linkedQuote?.contact_address) {
              savedData.travelerAddress = linkedQuote.contact_address
            }
            if (!savedData.travelerPhone && linkedQuote?.contact_phone) {
              savedData.travelerPhone = linkedQuote.contact_phone
            }
            setContractData(savedData)
          } catch {
            // 如果 contract_content 不是 JSON,就重新準備資料
            if (selectedOrder) {
              const firstMember = selectedOrderMembers[0]
              const autoData = prepareContractData(tour, selectedOrder as Order, firstMember as Member, itinerary)
              setContractData(autoData)
            } else if (linkedQuote) {
              // 沒有訂單，從報價單帶入
              setContractData({
                reviewYear: new Date().getFullYear().toString(),
                reviewMonth: (new Date().getMonth() + 1).toString(),
                reviewDay: new Date().getDate().toString(),
                travelerName: (linkedQuote as any).customer_name || '',
                travelerAddress: linkedQuote.contact_address || '',
                travelerIdNumber: '',
                travelerPhone: linkedQuote.contact_phone || '',
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
        } else if (selectedOrder) {
          const firstMember = selectedOrderMembers[0]
          const autoData = prepareContractData(tour, selectedOrder as Order, firstMember as Member, itinerary)
          setContractData(autoData)
        } else if (linkedQuote) {
          // 沒有訂單也沒有已存的合約資料，從報價單帶入
          setContractData({
            reviewYear: new Date().getFullYear().toString(),
            reviewMonth: (new Date().getMonth() + 1).toString(),
            reviewDay: new Date().getDate().toString(),
            travelerName: (linkedQuote as any).customer_name || '',
            travelerAddress: linkedQuote.contact_address || '',
            travelerIdNumber: '',
            travelerPhone: linkedQuote.contact_phone || '',
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
      } else {
        // 建立模式:自動準備資料
        setSelectedTemplate('')
        setContractNotes('')
        setContractCompleted(false)
        setArchivedDate('')

        if (selectedOrder) {
          // 有訂單資料，自動帶入
          const firstMember = selectedOrderMembers[0]
          const autoData = prepareContractData(tour, selectedOrder as Order, firstMember as Member, itinerary)
          setContractData(autoData)
        } else {
          // 沒有訂單資料，但可能有行程表的集合資訊
          // 從行程表計算集合時間
          let gatherYear = ''
          let gatherMonth = ''
          let gatherDay = ''
          let gatherHour = ''
          let gatherMinute = ''
          let gatherLocation = ''

          if (itinerary) {
            // 優先使用行程表的集合資訊
            if (itinerary.meeting_info?.location) {
              gatherLocation = itinerary.meeting_info.location
            }
            if (itinerary.meeting_info?.time) {
              const timeStr = itinerary.meeting_info.time
              if (timeStr.includes('T')) {
                const meetingDate = new Date(timeStr)
                gatherYear = meetingDate.getFullYear().toString()
                gatherMonth = (meetingDate.getMonth() + 1).toString()
                gatherDay = meetingDate.getDate().toString()
                gatherHour = meetingDate.getHours().toString().padStart(2, '0')
                gatherMinute = meetingDate.getMinutes().toString().padStart(2, '0')
              } else if (timeStr.includes(':')) {
                const [hour, minute] = timeStr.split(':')
                gatherHour = hour.padStart(2, '0')
                gatherMinute = minute.padStart(2, '0')
                if (tour.departure_date) {
                  const departureDate = new Date(tour.departure_date)
                  gatherYear = departureDate.getFullYear().toString()
                  gatherMonth = (departureDate.getMonth() + 1).toString()
                  gatherDay = departureDate.getDate().toString()
                }
              }
            } else if (itinerary.outbound_flight?.departureTime) {
              // 從航班計算集合時間（起飛前3小時）
              const [hourStr, minuteStr] = itinerary.outbound_flight.departureTime.split(':')
              let hour = parseInt(hourStr) - 3
              if (hour < 0) hour += 24
              gatherHour = hour.toString().padStart(2, '0')
              gatherMinute = minuteStr.padStart(2, '0')

              if (tour.departure_date) {
                const departureDate = new Date(tour.departure_date)
                gatherYear = departureDate.getFullYear().toString()
                gatherMonth = (departureDate.getMonth() + 1).toString()
                gatherDay = departureDate.getDate().toString()
              }
            }

            // 根據航空公司判斷航廈
            if (!gatherLocation && itinerary.outbound_flight?.airline) {
              const airline = itinerary.outbound_flight.airline.toUpperCase()
              const terminal2Airlines = ['中華航空', 'CI', 'CHINA AIRLINES', '華航', '長榮航空', 'BR', 'EVA', '星宇航空', 'JX', 'STARLUX', '台灣虎航', 'IT', 'TIGERAIR', '樂桃航空', 'MM', 'PEACH', '捷星航空', 'GK', 'JETSTAR', '酷航', 'TR', 'SCOOT', '亞洲航空', 'AK', 'D7', 'AIRASIA']
              const isTerminal2 = terminal2Airlines.some(t => airline.includes(t.toUpperCase()))
              gatherLocation = isTerminal2 ? '桃園國際機場第二航廈' : ''
            }
          } else if (tour.departure_date) {
            // 沒有行程表，只帶入出發日期
            const departureDate = new Date(tour.departure_date)
            gatherYear = departureDate.getFullYear().toString()
            gatherMonth = (departureDate.getMonth() + 1).toString()
            gatherDay = departureDate.getDate().toString()
          }

          setContractData({
            reviewYear: new Date().getFullYear().toString(),
            reviewMonth: (new Date().getMonth() + 1).toString(),
            reviewDay: new Date().getDate().toString(),
            // 優先使用報價單的聯絡資訊（欄位名是 customer_name, contact_phone, contact_address）
            travelerName: (linkedQuote as any)?.customer_name || '',
            travelerAddress: linkedQuote?.contact_address || '',
            travelerIdNumber: '',
            travelerPhone: linkedQuote?.contact_phone || '',
            tourName: tour.name || '',
            tourDestination: tour.location || '',
            tourCode: tour.code || '',
            gatherYear,
            gatherMonth,
            gatherDay,
            gatherHour,
            gatherMinute,
            gatherLocation,
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
  }, [isOpen, mode, tour.id, itinerary?.id, linkedQuote?.id])

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
