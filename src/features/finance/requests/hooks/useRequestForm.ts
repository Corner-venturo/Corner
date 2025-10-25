import { useState, useCallback, useMemo } from 'react';
import { useTours } from '@/features/tours/hooks/useTours';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { useSupplierStore } from '@/stores';
import { RequestFormData, RequestItem, NewItemFormData } from '../types';

export function useRequestForm() {
  const { tours } = useTours();
  const { orders } = useOrders();
  const { items: suppliers } = useSupplierStore();

  const [formData, setFormData] = useState<RequestFormData>({
    tour_id: '',
    order_id: '',
    request_date: '',
    note: '',
    is_special_billing: false,
    created_by: '1'
  });

  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);

  const [newItem, setNewItem] = useState<NewItemFormData>({
    category: '住宿',
    supplier_id: '',
    description: '',
    unit_price: 0,
    quantity: 1
  });

  // Search states
  const [tourSearchValue, setTourSearchValue] = useState('');
  const [orderSearchValue, setOrderSearchValue] = useState('');
  const [showTourDropdown, setShowTourDropdown] = useState(false);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);

  // Filter tours by search
  const filteredTours = useMemo(() =>
    tours.filter(tour => {
      const searchTerm = tourSearchValue.toLowerCase();
      if (!searchTerm) return true;

      const tourCode = tour.code?.toLowerCase() || '';
      const tour_name = tour.name?.toLowerCase() || '';
      const departure_date = tour.departure_date || '';
      const dateNumbers = departure_date.replace(/\D/g, '').slice(-4);

      return tourCode.includes(searchTerm) ||
             tour_name.includes(searchTerm) ||
             dateNumbers.includes(searchTerm.replace(/\D/g, ''));
    })
  , [tours, tourSearchValue]);

  // Filter orders by search and selected tour
  const filteredOrders = useMemo(() =>
    orders.filter(order => {
      if (!formData.tour_id) return false;
      if (order.tour_id !== formData.tour_id) return false;

      const searchTerm = orderSearchValue.toLowerCase();
      if (!searchTerm) return true;

      const order_number = order.order_number?.toLowerCase() || '';
      const contact_person = order.contact_person?.toLowerCase() || '';

      return order_number.includes(searchTerm) || contact_person.includes(searchTerm);
    })
  , [orders, formData.tour_id, orderSearchValue]);

  // Calculate total amount
  const total_amount = useMemo(() =>
    requestItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  , [requestItems]);

  // Add item to list
  const addItemToList = useCallback(() => {
    if (!newItem.supplier_id || !newItem.description) return;

    const selectedSupplier = suppliers.find(s => s.id === newItem.supplier_id);
    if (!selectedSupplier) return;

    const itemId = Math.random().toString(36).substr(2, 9);
    setRequestItems(prev => [...prev, {
      id: itemId,
      ...newItem,
      supplierName: selectedSupplier.name,
    }]);

    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1
    });
  }, [newItem, suppliers]);

  // Remove item from list
  const removeItem = useCallback((itemId: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      tour_id: '',
      order_id: '',
      request_date: '',
      note: '',
      is_special_billing: false,
      created_by: '1'
    });
    setRequestItems([]);
    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1
    });
    setTourSearchValue('');
    setOrderSearchValue('');
    setShowTourDropdown(false);
    setShowOrderDropdown(false);
  }, []);

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
    showTourDropdown,
    setShowTourDropdown,
    showOrderDropdown,
    setShowOrderDropdown,
    filteredTours,
    filteredOrders,
    total_amount,
    addItemToList,
    removeItem,
    resetForm,
    suppliers,
    tours,
    orders
  };
}
