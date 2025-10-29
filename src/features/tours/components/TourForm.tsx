import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmartDateInput } from '@/components/ui/smart-date-input';
import { Combobox } from '@/components/ui/combobox';
import { AddOrderForm, type OrderFormData } from '@/components/orders/add-order-form';
import { AlertCircle } from 'lucide-react';
import { NewTourData } from '../types';

interface TourFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  newTour: NewTourData;
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>;
  newOrder: Partial<OrderFormData>;
  setNewOrder: React.Dispatch<React.SetStateAction<Partial<OrderFormData>>>;
  activeCountries: Array<{ id: string; code: string; name: string }>;
  availableCities: Array<{ id: string; code: string; name: string }>;
  setAvailableCities: React.Dispatch<React.SetStateAction<any[]>>;
  getCitiesByCountryId: (countryId: string) => Array<{ id: string; code: string; name: string }>;
  submitting: boolean;
  formError: string | null;
  onSubmit: () => void;
}

export function TourForm({
  isOpen,
  onClose,
  mode,
  newTour,
  setNewTour,
  newOrder,
  setNewOrder,
  activeCountries,
  availableCities,
  setAvailableCities,
  getCitiesByCountryId,
  submitting,
  formError,
  onSubmit,
}: TourFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent
        className="max-w-6xl w-[90vw] h-[80vh] overflow-hidden"
        aria-describedby={undefined}
        onInteractOutside={(e) => {
          // 防止點擊 Select 下拉選單時關閉 Dialog
          const target = e.target as HTMLElement;
          if (target.closest('[role="listbox"]') || target.closest('select')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? '編輯旅遊團' : '新增旅遊團 & 訂單'}
          </DialogTitle>
        </DialogHeader>

        {/* Error message */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="text-sm">{formError}</div>
            </div>
          </div>
        )}

        <div className="flex h-full overflow-hidden">
          {/* Left side - Tour info */}
          <div className="flex-1 pr-6 border-r border-border">
            <div className="h-full overflow-y-auto">
              <h3 className="text-lg font-medium text-morandi-primary mb-4">旅遊團資訊</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">旅遊團名稱</label>
                  <Input
                    value={newTour.name}
                    onChange={(e) => setNewTour(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                {/* Destination selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-morandi-primary">國家/地區</label>
                    <select
                      value={newTour.countryCode}
                      onChange={(e) => {
                        const countryCode = e.target.value;
                        const selectedCountry = activeCountries.find(c => c.code === countryCode);
                        const cities = countryCode === '__custom__' ? [] : (selectedCountry ? getCitiesByCountryId(selectedCountry.id) : []);
                        setAvailableCities(cities);
                        setNewTour(prev => ({
                          ...prev,
                          countryCode,
                          cityCode: countryCode === '__custom__' ? '__custom__' : cities[0]?.code || '',
                        }));
                      }}
                      className="mt-1 w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="">請選擇國家...</option>
                      {activeCountries.map((country) => (
                        <option key={country.id} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                      <option value="__custom__">+ 新增其他目的地</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-morandi-primary">城市</label>
                    {newTour.countryCode === '__custom__' ? (
                      <Input
                        value={newTour.customLocation || ''}
                        onChange={(e) => setNewTour(prev => ({ ...prev, customLocation: e.target.value }))}
                        placeholder="輸入城市名稱 (如：曼谷)"
                        className="mt-1"
                      />
                    ) : (
                      <Combobox
                        value={newTour.cityCode}
                        onChange={(cityCode) => setNewTour(prev => ({ ...prev, cityCode }))}
                        options={availableCities.map((city) => ({
                          value: city.code,
                          label: `${city.name} (${city.code})`
                        }))}
                        placeholder="輸入或選擇城市..."
                        emptyMessage="找不到符合的城市"
                        showSearchIcon={true}
                        showClearButton={true}
                        disabled={!newTour.countryCode || newTour.countryCode === '__custom__'}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                {/* Custom destination details */}
                {newTour.countryCode === '__custom__' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-morandi-primary">國家名稱</label>
                      <Input
                        value={newTour.customCountry || ''}
                        onChange={(e) => setNewTour(prev => ({ ...prev, customCountry: e.target.value }))}
                        placeholder="輸入國家名稱 (如：泰國)"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-morandi-primary">3 碼城市代號</label>
                      <Input
                        value={newTour.customCityCode || ''}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 3);
                          setNewTour(prev => ({ ...prev, customCityCode: value }));
                        }}
                        placeholder="輸入 3 碼代號 (如：BKK)"
                        className="mt-1"
                        maxLength={3}
                      />
                      <p className="text-xs text-morandi-secondary mt-1">
                        💡 用於生成團號，建議使用國際機場代碼或城市縮寫
                      </p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-morandi-primary">出發日期</label>
                    <SmartDateInput
                      value={newTour.departure_date}
                      onChange={(departure_date) => {
                        setNewTour(prev => {
                          const newReturnDate = prev.return_date && prev.return_date < departure_date
                            ? departure_date
                            : prev.return_date;

                          return {
                            ...prev,
                            departure_date,
                            return_date: newReturnDate
                          };
                        });
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-morandi-primary">返回日期</label>
                    <SmartDateInput
                      value={newTour.return_date}
                      onChange={(return_date) => {
                        setNewTour(prev => ({ ...prev, return_date }));
                      }}
                      min={newTour.departure_date || new Date().toISOString().split('T')[0]}
                      initialMonth={newTour.departure_date}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">描述</label>
                  <Input
                    value={newTour.description || ''}
                    onChange={(e) => setNewTour(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isSpecial"
                    checked={newTour.isSpecial}
                    onChange={(e) => setNewTour(prev => ({ ...prev, isSpecial: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isSpecial" className="text-sm text-morandi-primary">特殊團</label>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Order info */}
          <div className="flex-1 pl-6">
            <div className="h-full overflow-y-auto">
              <h3 className="text-lg font-medium text-morandi-primary mb-4">同時新增訂單（選填）</h3>

              <AddOrderForm
                tourId="embedded"
                value={newOrder}
                onChange={setNewOrder}
              />

              <div className="bg-morandi-container/20 p-3 rounded-lg mt-4">
                <p className="text-xs text-morandi-secondary">
                  提示：如果填寫了聯絡人，將會同時建立一筆訂單。如果留空，則只建立旅遊團。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex justify-end space-x-2 pt-6 border-t border-border mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !newTour.name.trim() || !newTour.departure_date || !newTour.return_date}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {submitting ? '建立中...' : (newOrder.contact_person ? '新增旅遊團 & 訂單' : '新增旅遊團')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
