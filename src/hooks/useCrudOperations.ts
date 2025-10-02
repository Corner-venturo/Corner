// src/hooks/useCrudOperations.ts
export function useCrudOperations<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void
) {
  const add = (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as T;

    setItems([...items, newItem]);
    return newItem;
  };

  const update = (id: string, updates: Partial<T>) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    ));
  };

  const remove = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return { add, update, remove };
}