import { useState, useCallback, useMemo } from 'react'
import { useTours } from '@/features/tours/hooks/useTours'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { useSupplierStore, useEmployeeStore } from '@/stores'
import { RequestFormData, RequestItem } from '../types'

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
    supplier_id: '', // New: Request-level supplier ID
    supplier_name: '', // New: Request-level supplier name
  })

  const [requestItems, setRequestItems] = useState<RequestItem[]>(() => [
    {
      id: Math.random().toString(36).substr(2, 9),
      category: '住宿', // Default category
      supplier_id: '',
      supplierName: '',
      description: '',
      unit_price: 0,
      quantity: 1,
    },
  ])

  // Update first item's supplier when request-level supplier changes
  React.useEffect(() => {
    if (formData.supplier_id && requestItems.length > 0 &&
        (requestItems[0].supplier_id !== formData.supplier_id || requestItems[0].supplierName !== formData.supplier_name)) {
      setRequestItems(prev => prev.map((item, index) => {
        if (index === 0) {
          return {
            ...item,
            supplier_id: formData.supplier_id,
            supplierName: formData.supplier_name || '',
          };
        }
        return item;
      }));
    }
  }, [formData.supplier_id, formData.supplier_name, requestItems]);

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
      name: e.display_name,
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
        return (supplier.name || '').toLowerCase().includes(searchTerm)
      }),
    [combinedSuppliers, supplierSearchValue]
  )

  // Add a new empty item to the list
  const addNewEmptyItem = useCallback(() => {
    const newItem: RequestItem = {
      id: Math.random().toString(36).substr(2, 9),
      category: '住宿',
      supplier_id: formData.supplier_id || '', // Use request-level supplier if available
      supplierName: formData.supplier_name || '', // Use request-level supplier name
      description: '',
      unit_price: 0,
      quantity: 1,
    }
    setRequestItems(prev => [...prev, newItem])
  }, [formData.supplier_id, formData.supplier_name])

  // Update an item in the list
  const updateItem = useCallback((itemId: string, updatedFields: Partial<RequestItem>) => {
    setRequestItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, ...updatedFields } : item))
    )
  }, [])

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
      supplier_id: '',
      supplier_name: '',
    })
    setRequestItems([
      {
        id: Math.random().toString(36).substr(2, 9),
        category: '住宿', // Default category
        supplier_id: '',
        supplierName: '',
        description: '',
        unit_price: 0,
        quantity: 1,
      },
    ])
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
    addNewEmptyItem,
    updateItem,
    removeItem,
    resetForm,
    suppliers: combinedSuppliers,
    tours,
    orders,
  }
}
