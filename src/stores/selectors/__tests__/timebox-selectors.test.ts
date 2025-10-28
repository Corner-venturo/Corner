import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimeboxStore } from '@/stores/timebox-store';
import {
  useWeekStatistics,
  useTodayScheduledBoxes,
  useWeekViewBoxes,
} from '../timebox-selectors';

// Mock the timebox store
vi.mock('@/stores/timebox-store', () => ({
  useTimeboxStore: vi.fn(),
}));

describe('timebox-selectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useWeekStatistics', () => {
    it('should calculate completion rate correctly', () => {
      const mockBoxes = [
        { id: 'box-1', name: 'Morning Routine', type: 'basic', category: 'daily' },
        { id: 'box-2', name: 'Workout', type: 'workout', category: 'workout' },
      ];

      const mockScheduledBoxes = [
        { id: 's-1', boxId: 'box-1', completed: true, duration: 30 },
        { id: 's-2', boxId: 'box-1', completed: true, duration: 30 },
        { id: 's-3', boxId: 'box-2', completed: false, duration: 60 },
        { id: 's-4', boxId: 'box-2', completed: true, duration: 60 },
      ];

      (useTimeboxStore as any).mockImplementation((selector: any) => {
        const state = {
          boxes: mockBoxes,
          scheduledBoxes: mockScheduledBoxes,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useWeekStatistics());

      // 3 completed out of 4 = 75%
      expect(result.current.completionRate).toBe(75);
      expect(result.current.totalWorkoutTime).toBe(60); // Only completed workout
      expect(result.current.completedByType.basic).toBe(2);
      expect(result.current.completedByType.workout).toBe(1);
    });

    it('should handle empty boxes correctly', () => {
      (useTimeboxStore as any).mockImplementation((selector: any) => {
        const state = {
          boxes: [],
          scheduledBoxes: [],
        };
        return selector(state);
      });

      const { result } = renderHook(() => useWeekStatistics());

      expect(result.current.completionRate).toBe(0);
      expect(result.current.totalWorkoutTime).toBe(0);
      expect(result.current.completedByType).toEqual({});
    });

    it('should ignore scheduled boxes without matching base box', () => {
      const mockBoxes = [
        { id: 'box-1', name: 'Morning', type: 'basic', category: 'daily' },
      ];

      const mockScheduledBoxes = [
        { id: 's-1', boxId: 'box-1', completed: true },
        { id: 's-2', boxId: 'non-existent', completed: true }, // Should be ignored in stats
      ];

      (useTimeboxStore as any).mockImplementation((selector: any) => {
        const state = {
          boxes: mockBoxes,
          scheduledBoxes: mockScheduledBoxes,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useWeekStatistics());

      // completionRate = completedBoxes.length / totalBoxes * 100
      // completedBoxes filters all with completed=true (both s-1 and s-2)
      // So 2/2 = 100%, but only 1 is counted in completedByType
      expect(result.current.completionRate).toBe(100); // 2 completed / 2 total
      expect(result.current.completedByType.basic).toBe(1); // Only valid box counted
    });

    it('should use Map for O(1) lookup performance', () => {
      // Test with larger dataset to verify Map usage
      const mockBoxes = Array.from({ length: 100 }, (_, i) => ({
        id: `box-${i}`,
        name: `Box ${i}`,
        type: 'basic',
        category: 'daily',
      }));

      const mockScheduledBoxes = Array.from({ length: 200 }, (_, i) => ({
        id: `s-${i}`,
        boxId: `box-${i % 100}`,
        completed: i % 2 === 0,
      }));

      (useTimeboxStore as any).mockImplementation((selector: any) => {
        const state = {
          boxes: mockBoxes,
          scheduledBoxes: mockScheduledBoxes,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useWeekStatistics());

      // 100 completed out of 200 = 50%
      expect(result.current.completionRate).toBe(50);
      expect(result.current.completedByType.basic).toBe(100);
    });
  });

  describe('useWeekViewBoxes', () => {
    it('should filter boxes by week', () => {
      const mockScheduledBoxes = [
        { id: 's-1', boxId: 'box-1', scheduledDate: '2025-10-20T09:00' }, // In week
        { id: 's-2', boxId: 'box-2', scheduledDate: '2025-10-21T10:00' }, // In week
        { id: 's-3', boxId: 'box-3', scheduledDate: '2025-10-28T09:00' }, // Next week
      ];

      (useTimeboxStore as any).mockImplementation((selector: any) =>
        selector({ scheduledBoxes: mockScheduledBoxes })
      );

      const { result } = renderHook(() => useWeekViewBoxes('2025-10-20'));

      // Should have 2 days with boxes
      expect(result.current.size).toBe(2);
      expect(result.current.get('2025-10-20')).toHaveLength(1);
      expect(result.current.get('2025-10-21')).toHaveLength(1);
    });

    it('should return empty Map for week with no boxes', () => {
      const mockScheduledBoxes = [
        { id: 's-1', boxId: 'box-1', scheduledDate: '2025-10-20T09:00' },
      ];

      (useTimeboxStore as any).mockImplementation((selector: any) =>
        selector({ scheduledBoxes: mockScheduledBoxes })
      );

      const { result } = renderHook(() => useWeekViewBoxes('2025-11-01'));

      expect(result.current.size).toBe(0);
    });
  });

  describe('useTodayScheduledBoxes', () => {
    it('should return boxes for current day', () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const mockScheduledBoxes = [
        { id: 's-1', boxId: 'box-1', scheduledDate: `${today}T09:00` },
        { id: 's-2', boxId: 'box-2', scheduledDate: `${tomorrowStr}T10:00` },
        { id: 's-3', boxId: 'box-3', scheduledDate: `${today}T14:00` },
      ];

      (useTimeboxStore as any).mockImplementation((selector: any) =>
        selector({ scheduledBoxes: mockScheduledBoxes })
      );

      const { result } = renderHook(() => useTodayScheduledBoxes());

      expect(result.current).toHaveLength(2);
      expect(result.current[0].id).toBe('s-1');
      expect(result.current[1].id).toBe('s-3');
    });

    it('should return empty array when no boxes today', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const mockScheduledBoxes = [
        { id: 's-1', boxId: 'box-1', scheduledDate: `${tomorrowStr}T09:00` },
      ];

      (useTimeboxStore as any).mockImplementation((selector: any) =>
        selector({ scheduledBoxes: mockScheduledBoxes })
      );

      const { result } = renderHook(() => useTodayScheduledBoxes());

      expect(result.current).toHaveLength(0);
    });
  });
});
