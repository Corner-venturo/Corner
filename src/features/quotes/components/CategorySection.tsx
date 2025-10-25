import React from 'react';
import { Plus, Users, Car, Home, UtensilsCrossed, MapPin, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CostCategory, CostItem } from '../types';
import { CostItemRow } from './CostItemRow';
import { AccommodationItemRow } from './AccommodationItemRow';

const categoryIcons: Record<string, React.ElementType> = {
  transport: Car,
  'group-transport': Users,
  accommodation: Home,
  meals: UtensilsCrossed,
  activities: MapPin,
  others: MoreHorizontal,
  guide: Users
};

interface CategorySectionProps {
  category: CostCategory;
  accommodationTotal: number;
  accommodationDays: number;
  isReadOnly: boolean;
  handleAddAccommodationDay: () => void;
  handleAddRow: (categoryId: string) => void;
  handleAddGuideRow: (categoryId: string) => void;
  handleAddAdultTicket: (categoryId: string) => void;
  handleAddChildTicket: (categoryId: string) => void;
  handleAddInfantTicket: (categoryId: string) => void;
  handleUpdateItem: (categoryId: string, itemId: string, field: keyof CostItem, value: unknown) => void;
  handleRemoveItem: (categoryId: string, itemId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  accommodationTotal,
  accommodationDays,
  isReadOnly,
  handleAddAccommodationDay,
  handleAddRow,
  handleAddGuideRow,
  handleAddAdultTicket,
  handleAddChildTicket,
  handleAddInfantTicket,
  handleUpdateItem,
  handleRemoveItem
}) => {
  const Icon = categoryIcons[category.id];

  return (
    <React.Fragment>
      {/* 分類標題行 */}
      <tr className="bg-morandi-container/20 border-b border-border/40">
        <td colSpan={2} className="py-3 px-4 text-sm font-medium text-morandi-primary">
          <div className="flex items-center space-x-2">
            <Icon size={16} className="text-morandi-gold" />
            <span>{category.name}</span>
          </div>
        </td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4 text-sm font-medium text-morandi-primary text-center whitespace-nowrap">
          NT$ {category.id === 'accommodation' ? accommodationTotal.toLocaleString() :
               category.items.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString()}
        </td>
        <td colSpan={2} className="py-3 px-4 text-right">
          {category.id === 'accommodation' ? (
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={handleAddAccommodationDay}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-gold hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plus size={12} className="mr-1" />
                新增天數
              </Button>
              {accommodationDays > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleAddRow(category.id)}
                  disabled={isReadOnly}
                  className={cn(
                    "text-morandi-secondary hover:bg-morandi-gold/10",
                    isReadOnly && "cursor-not-allowed opacity-60"
                  )}
                >
                  <Plus size={12} className="mr-1" />
                  新增
                </Button>
              )}
            </div>
          ) : category.id === 'group-transport' ? (
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-gold hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plus size={12} className="mr-1" />
                新增
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddGuideRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-secondary hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Users size={12} className="mr-1" />
                新增
              </Button>
            </div>
          ) : category.id === 'transport' ? (
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddAdultTicket(category.id)}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-gold hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plus size={12} className="mr-1" />
                成人機票
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddChildTicket(category.id)}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-secondary hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plus size={12} className="mr-1" />
                小孩機票
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddInfantTicket(category.id)}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-secondary hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plus size={12} className="mr-1" />
                嬰兒機票
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-secondary hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plus size={12} className="mr-1" />
                其他
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleAddRow(category.id)}
                disabled={isReadOnly}
                className={cn(
                  "text-morandi-gold hover:bg-morandi-gold/10",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plus size={12} className="mr-1" />
                新增
              </Button>
            </div>
          )}
        </td>
      </tr>

      {/* 項目明細行 */}
      {category.id === 'accommodation' ? (
        // 住宿特殊渲染：按天分組，每天內顯示各房型
        (() => {
          const accommodationItems = category.items.filter(item => item.day !== undefined);
          const groupedByDay: Record<number, CostItem[]> = {};

          // 按天分組
          accommodationItems.forEach(item => {
            const day = item.day!;
            if (!groupedByDay[day]) groupedByDay[day] = [];
            groupedByDay[day].push(item);
          });

          return Object.keys(groupedByDay)
            .sort((a, b) => Number(a) - Number(b))
            .map(dayStr => {
              const day = Number(dayStr);
              const dayItems = groupedByDay[day];

              return dayItems.map((item, roomIndex) => (
                <AccommodationItemRow
                  key={item.id}
                  item={item}
                  categoryId={category.id}
                  day={day}
                  roomIndex={roomIndex}
                  handleUpdateItem={handleUpdateItem}
                  handleRemoveItem={handleRemoveItem}
                />
              ));
            });
        })()
      ) : (
        // 一般分類的渲染
        category.items.map((item) => (
          <CostItemRow
            key={item.id}
            item={item}
            categoryId={category.id}
            handleUpdateItem={handleUpdateItem}
            handleRemoveItem={handleRemoveItem}
          />
        ))
      )}
    </React.Fragment>
  );
};
