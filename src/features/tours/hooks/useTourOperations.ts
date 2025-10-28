import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tour } from '@/stores/types';
import { tourService } from '@/features/tours/services/tour.service';
import { logger } from '@/lib/utils/logger';
import { NewTourData } from '../types';
import { OrderFormData } from '@/components/orders/add-order-form';

interface UseTourOperationsParams {
  actions: any;
  addOrder: any;
  updateQuote: any;
  availableCities: any[];
  resetForm: () => void;
  closeDialog: () => void;
  setSubmitting: (value: boolean) => void;
  setFormError: (error: string | null) => void;
  dialogType: string;
  dialogData: any;
}

export function useTourOperations(params: UseTourOperationsParams) {
  const router = useRouter();
  const {
    actions,
    addOrder,
    updateQuote,
    availableCities,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    dialogType,
    dialogData,
  } = params;

  const handleAddTour = useCallback(async (
    newTour: NewTourData,
    newOrder: Partial<OrderFormData>,
    fromQuoteId?: string
  ) => {
    if (!newTour.name.trim() || !newTour.departure_date || !newTour.return_date) {
      return;
    }

    // Check custom destination
    if (newTour.countryCode === '__custom__') {
      if (!newTour.customCountry?.trim()) {
        alert('請填寫國家名稱');
        return;
      }
      if (!newTour.customLocation?.trim()) {
        alert('請填寫城市名稱');
        return;
      }
      if (!newTour.customCityCode?.trim()) {
        alert('請填寫城市代號');
        return;
      }
      if (newTour.customCityCode.length !== 3) {
        alert('城市代號必須是 3 碼');
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const departure_date = new Date(newTour.departure_date);

      // Determine city code and name
      const cityCode = newTour.countryCode === '__custom__'
        ? newTour.customCityCode!
        : newTour.cityCode;
      const cityName = newTour.countryCode === '__custom__'
        ? newTour.customLocation!
        : availableCities.find(c => c.code === newTour.cityCode)?.name || newTour.cityCode;

      // Edit mode: update existing tour
      if (dialogType === 'edit' && dialogData) {
        const existingTour = dialogData as Tour;

        const tourData = {
          name: newTour.name,
          location: cityName,
          departure_date: newTour.departure_date,
          return_date: newTour.return_date,
          status: newTour.status,
          price: newTour.price,
          max_participants: newTour.max_participants,
          description: newTour.description,
        };

        await actions.update(existingTour.id, tourData);
        resetForm();
        closeDialog();
        return;
      }

      // Create mode: create new tour
      const code = await tourService.generateTourCode(cityCode, departure_date, newTour.isSpecial);

      // Get city ID from availableCities (if not custom)
      const selectedCity = newTour.countryCode !== '__custom__'
        ? availableCities.find(c => c.code === newTour.cityCode)
        : undefined;

      const tourData = {
        name: newTour.name,
        location: cityName,
        country_id: selectedCity?.country_id || undefined,
        main_city_id: selectedCity?.id || undefined,
        departure_date: newTour.departure_date,
        return_date: newTour.return_date,
        status: newTour.status,
        price: newTour.price,
        max_participants: newTour.max_participants,
        code,
        contract_status: 'pending' as const,
        total_revenue: 0,
        total_cost: 0,
        profit: 0,
        current_participants: 0,
        quote_id: fromQuoteId || undefined,
      };

      const createdTour = await actions.create(tourData);

      // If contact person is filled, also add order
      if (newOrder.contact_person?.trim()) {
        const order_number = `${code}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const memberCount = newOrder.member_count || 1;
        const totalAmount = newOrder.total_amount || (newTour.price * memberCount);
        const orderData = {
          order_number,
          tour_id: createdTour.id,
          code: code,
          tour_name: newTour.name,
          contact_person: newOrder.contact_person,
          sales_person: newOrder.sales_person || '',
          assistant: newOrder.assistant || '',
          member_count: memberCount,
          payment_status: 'unpaid' as const,
          total_amount: totalAmount,
          paid_amount: 0,
          remaining_amount: totalAmount,
        };

        addOrder(orderData);
      }

      // If created from quote, update quote's tourId
      if (fromQuoteId) {
        updateQuote(fromQuoteId, { tour_id: createdTour.id });
        router.replace('/tours');
      }

      resetForm();
      closeDialog();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : dialogType === 'edit' ? '更新旅遊團失敗' : '建立旅遊團失敗';
      setFormError(errorMessage);
      logger.error('Failed to create/update tour:', err);
    } finally {
      setSubmitting(false);
    }
  }, [
    actions,
    addOrder,
    updateQuote,
    availableCities,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    dialogType,
    dialogData,
    router
  ]);

  const handleDeleteTour = useCallback(async (tour: Tour | null) => {
    if (!tour) return;

    try {
      await actions.delete(tour.id);
    } catch (err) {
      logger.error('刪除旅遊團失敗:', err);
    }
  }, [actions]);

  const handleArchiveTour = useCallback(async (tour: Tour) => {
    try {
      await actions.update(tour.id, { archived: !tour.archived });
      logger.info(tour.archived ? '已解除封存旅遊團' : '已封存旅遊團');
    } catch (err) {
      logger.error('封存/解封旅遊團失敗:', err);
    }
  }, [actions]);

  return {
    handleAddTour,
    handleDeleteTour,
    handleArchiveTour,
  };
}
