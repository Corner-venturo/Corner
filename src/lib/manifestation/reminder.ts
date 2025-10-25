export const MANIFESTATION_LAST_DATE_KEY = 'manifestation_last_date';
export const MANIFESTATION_STREAK_KEY = 'manifestation_streak';
export const MANIFESTATION_HISTORY_KEY = 'manifestation_history';
export const MANIFESTATION_EVENT = 'manifestation-progress-updated';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateOnly = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
};

const getDayDiff = (a: string, b: string): number => {
  const first = toDateOnly(a).getTime();
  const second = toDateOnly(b).getTime();
  return Math.floor((first - second) / MS_PER_DAY);
};

const parseHistory = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => typeof item === 'string');
    }
  } catch (error) {
    console.warn('Failed to parse manifestation history', error);
  }
  return [];
};

export interface ManifestationReminderSnapshot {
  lastDate: string | null;
  streak: number;
  history: string[];
}

export const getManifestationReminderSnapshot = (): ManifestationReminderSnapshot => {
  if (typeof window === 'undefined') {
    return { lastDate: null, streak: 0, history: [] };
  }

  const lastDate = localStorage.getItem(MANIFESTATION_LAST_DATE_KEY);
  const streakValue = localStorage.getItem(MANIFESTATION_STREAK_KEY);
  const history = parseHistory(localStorage.getItem(MANIFESTATION_HISTORY_KEY));

  return {
    lastDate,
    streak: streakValue ? Number.parseInt(streakValue, 10) || 0 : 0,
    history
  };
};

const pruneHistory = (history: string[]): string[] => {
  const sorted = [...new Set(history)].sort((a, b) => a.localeCompare(b));
  return sorted.slice(-90);
};

export const recordManifestationCompletion = (completedAt: Date = new Date()): ManifestationReminderSnapshot | void => {
  if (typeof window === 'undefined') return;

  const today = toDateKey(completedAt);
  const snapshot = getManifestationReminderSnapshot();
  const { lastDate, streak, history } = snapshot;

  let nextStreak = 1;

  if (lastDate) {
    const diff = getDayDiff(today, lastDate);
    if (diff === 0) {
      nextStreak = streak || 1;
    } else if (diff === 1) {
      nextStreak = (streak || 0) + 1;
    } else {
      nextStreak = 1;
    }
  }

  const updatedHistory = pruneHistory([...history, today]);

  localStorage.setItem(MANIFESTATION_LAST_DATE_KEY, today);
  localStorage.setItem(MANIFESTATION_STREAK_KEY, String(nextStreak));
  localStorage.setItem(MANIFESTATION_HISTORY_KEY, JSON.stringify(updatedHistory));

  const updatedSnapshot: ManifestationReminderSnapshot = {
    lastDate: today,
    streak: nextStreak,
    history: updatedHistory
  };

  window.dispatchEvent(new CustomEvent(MANIFESTATION_EVENT, { detail: updatedSnapshot }));

  return updatedSnapshot;
};

export const getTodayKey = (): string => toDateKey(new Date());

export const getDayDifferenceFromToday = (date: string | null): number | null => {
  if (!date) return null;
  const today = getTodayKey();
  return getDayDiff(today, date);
};

export const getWeekRange = (): string[] => {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    dates.push(toDateKey(day));
  }

  return dates;
};
