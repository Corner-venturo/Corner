import { useState, useCallback, useMemo } from 'react'
import { useTours } from '@/features/tours/hooks/useTours'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { useSupplierStore, useEmployeeStore } from '@/stores'
import { RequestFormData, RequestItem, NewItemFormData } from '../types'

export function useRequestForm() {
  const { tours } = useTours()
  const { orders } = useOrders()
  const { items: suppliers } = useSupplierStore()
  const { items: employees } = useEmployeeStore()

  const [formData, setFormData] = useState<RequestFormData>({
    tour_id: '',
    order_id: '',
    request_date: '',
    note: '',
    is_special_billing: false,
    created_by: '1',
  })

  const [requestItems, setRequestItems] = useState<RequestItem[]>([])

  const [newItem, setNewItem] = useState<NewItemFormData>({
    category: '住宿',
    supplier_id: '',
    description: '',
    unit_price: 0,
    quantity: 1,
  })

  // Search states
  const [tourSearchValue, setTourSearchValue] = useState('')
  const [orderSearchValue, setOrderSearchValue] = useState('')
  const [supplierSearchValue, setSupplierSearchValue] = useState('')
  const [showTourDropdown, setShowTourDropdown] = useState(false)
  const [showOrderDropdown, setShowOrderDropdown] = useState(false)
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

  // Filter tours by search
  const filteredTours = useMemo(
    () =>
      tours.filter(tour => {
        const searchTerm = tourSearchValue.toLowerCase()
        if (!searchTerm) return true

        const tourCode = tour.code?.toLowerCase() || ''
        const tour_name = tour.name?.toLowerCase() || ''
        const departure_date = tour.departure_date || ''
        const dateNumbers = departure_date.replace(/\D/g, '').slice(-4)

        return (
          tourCode.includes(searchTerm) ||
          tour_name.includes(searchTerm) ||
          dateNumbers.includes(searchTerm.replace(/\D/g, ''))
        )
      }),
    [tours, tourSearchValue]
  )

  // Filter orders by search and selected tour
  const filteredOrders = useMemo(
    () =>
      orders.filter(order => {
        if (!formData.tour_id) return false
        if (order.tour_id !== formData.tour_id) return false

        const searchTerm = orderSearchValue.toLowerCase()
        if (!searchTerm) return true

        const order_number = order.order_number?.toLowerCase() || ''
        const contact_person = order.contact_person?.toLowerCase() || ''

        return order_number.includes(searchTerm) || contact_person.includes(searchTerm)
      }),
    [orders, formData.tour_id, orderSearchValue]
  )

  // Calculate total amount
  const total_amount = useMemo(
    () => requestItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [requestItems]
  )

  // Combine suppliers and employees into one list
  const combinedSuppliers = useMemo(() => {
    const supplierList = suppliers.map(s => ({
      id: s.id,
      name: s.name,
      type: 'supplier' as const,
      group: '供應商',
    }))

    const employeeList = employees.map(e => ({
      id: e.id,
      name: e.display_name || e.english_name || e.chinese_name || e.employee_number || '未命名員工',
      type: 'employee' as const,
      group: '員工',
    }))

    return [...supplierList, ...employeeList]
  }, [suppliers, employees])

  // Filter suppliers by search
  const filteredSuppliers = useMemo(
    () =>
      combinedSuppliers.filter(supplier => {
        const searchTerm = supplierSearchValue.toLowerCase()
        if (!searchTerm) return true
        return supplier.name.toLowerCase().includes(searchTerm)
      }),
    [combinedSuppliers, supplierSearchValue]
  )

  // Add item to list
  const addItemToList = useCallback(() => {
    // 允許新增空白列，不驗證必填
    const selected = combinedSuppliers.find(s => s.id === newItem.supplier_id)
    const supplierName = selected?.name || ''

    const itemId = Math.random().toString(36).substr(2, 9)
    setRequestItems(prev => [
      ...prev,
      {
        id: itemId,
        ...newItem,
        supplierName,
      },
    ])

    // 清空表單，準備下一個項目
    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1,
    })
    setSupplierSearchValue('')
  }, [newItem, combinedSuppliers])

  // Remove item from list
  const removeItem = useCallback((itemId: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      tour_id: '',
      order_id: '',
      request_date: '',
      note: '',
      is_special_billing: false,
      created_by: '1',
    })
    setRequestItems([])
    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1,
    })
    setTourSearchValue('')
    setOrderSearchValue('')
    setSupplierSearchValue('')
    setShowTourDropdown(false)
    setShowOrderDropdown(false)
    setShowSupplierDropdown(false)
  }, [])

  return {
    formData,
    setFormData,
    requestItems,
    setRequestItems,
    newItem,
    setNewItem,
    tourSearchValue,
    setTourSearchValue,
    orderSearchValue,
    setOrderSearchValue,
    supplierSearchValue,
    setSupplierSearchValue,
    showTourDropdown,
    setShowTourDropdown,
    showOrderDropdown,
    setShowOrderDropdown,
    showSupplierDropdown,
    setShowSupplierDropdown,
    filteredTours,
    filteredOrders,
    filteredSuppliers,
    total_amount,
    addItemToList,
    removeItem,
    resetForm,
    suppliers: combinedSuppliers,
    tours,
    orders,
  }
}
