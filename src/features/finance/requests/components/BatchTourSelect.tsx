'use client';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UI_DELAYS } from '@/lib/constants/timeouts';
import { cn } from '@/lib/utils';

interface Tour {
  id: string;
  code: string;
  name: string;
  departure_date: string;
}

interface BatchTourSelectProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  tours: Tour[];
  selectedTourIds: string[];
  onToggleTour: (tourId: string) => void;
  onRemoveTour: (tourId: string) => void;
  showDropdown: boolean;
  onShowDropdown: (show: boolean) => void;
  allTours: Tour[];
}

export function BatchTourSelect({
  searchValue,
  onSearchChange,
  tours,
  selectedTourIds,
  onToggleTour,
  onRemoveTour,
  showDropdown,
  onShowDropdown,
  allTours
}: BatchTourSelectProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-morandi-primary mb-4">選擇旅遊團</h3>
      <div className="relative">
        <Input
          placeholder="搜尋團號、團名或日期 (如: 0820)..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onClick={() => onShowDropdown(true)}
          onBlur={() => setTimeout(() => onShowDropdown(false), UI_DELAYS.SHORT_DELAY)}
          className="bg-background"
        />
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
            {tours.length > 0 ? (
              tours.map((tour) => {
                const isSelected = selectedTourIds.includes(tour.id);
                return (
                  <div
                    key={tour.id}
                    onClick={() => onToggleTour(tour.id)}
                    className={cn(
                      "p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0 flex items-center",
                      isSelected && "bg-morandi-gold/10"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{tour.code} - {tour.name}</div>
                      <div className="text-sm text-morandi-secondary">
                        出發: {new Date(tour.departure_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-sm text-morandi-secondary">找不到相符的旅遊團</div>
            )}
          </div>
        )}
      </div>

      {/* Selected tours */}
      {selectedTourIds.length > 0 && (
        <div className="mt-4 p-3 bg-morandi-container/10 rounded">
          <div className="text-sm font-medium text-morandi-primary mb-2">
            已選擇 {selectedTourIds.length} 個旅遊團：
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTourIds.map(tourId => {
              const tour = allTours.find(t => t.id === tourId);
              if (!tour) return null;
              return (
                <Badge
                  key={tourId}
                  className="bg-morandi-gold text-white flex items-center gap-2"
                >
                  {tour.code}
                  <button
                    onClick={() => onRemoveTour(tourId)}
                    className="hover:bg-morandi-gold-hover rounded-full"
                  >
                    ✕
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
