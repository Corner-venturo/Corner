// src/hooks/useCrudOperations.ts
import { generateUUID } from '@/lib/utils/uuid';

export function useCrudOperations<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void
) {
  const add = (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    const newItem = {
      ...item,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as unknown as T;

    setItems([...items, newItem]);
    return newItem;
  };

  const update = (id: string, updates: Partial<T>) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, ...updates, updated_at: new Date().toISOString() }
        : item
    ));
  };

  const remove = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return { add, update, remove };
}