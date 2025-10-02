import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Visa } from './types';
import { createPersistentCrudMethods } from '@/lib/persistent-store';

interface VisaStore {
  visas: Visa[];
  addVisa: (visa: Omit<Visa, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Visa>;
  updateVisa: (id: string, data: Partial<Visa>) => Promise<Visa | undefined>;
  deleteVisa: (id: string) => Promise<boolean>;
  getVisaById: (id: string) => Visa | undefined;
  getVisasByTour: (tourId: string) => Visa[];
  getVisasByStatus: (status: Visa['status']) => Visa[];
  batchUpdateStatus: (ids: string[], status: Visa['status'], date?: string) => void;
  loadVisas: () => Promise<Visa[] | null>;
}

export const useVisaStore = create<VisaStore>()(
  persist(
    (set, get) => ({
      visas: [],

      // 使用統一的 CRUD 方法（連接 Supabase）
      ...createPersistentCrudMethods<Visa>('visas', 'visas', set, get),

  getVisaById: (id) => {
    return get().visas.find((visa) => visa.id === id);
  },

  getVisasByTour: (tourId) => {
    return get().visas.filter((visa) => visa.tourId === tourId);
  },

  getVisasByStatus: (status) => {
    return get().visas.filter((visa) => visa.status === status);
  },

      batchUpdateStatus: (ids, status, date) => {
        const now = new Date().toISOString();
        set((state) => ({
          visas: state.visas.map((visa) => {
            if (!ids.includes(visa.id)) return visa;

            const updates: Partial<Visa> = {
              status,
              updatedAt: now,
            };

            // 根據狀態自動設定對應的日期
            if (status === '已送件' && date) {
              updates.submissionDate = date;
            } else if (status === '已下件' && date) {
              updates.receivedDate = date;
            } else if (status === '已取件' && date) {
              updates.pickupDate = date;
            }

            return { ...visa, ...updates };
          }),
        }));
      },
    }),
    {
      name: 'venturo-visa-store',
      version: 1,
    }
  )
);
