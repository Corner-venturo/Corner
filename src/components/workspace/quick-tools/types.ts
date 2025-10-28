export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  created_at: string;
}

export type ToolTab = 'calculator' | 'currency' | 'notes' | 'checklist';

export interface TabConfig {
  id: ToolTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export interface ExchangeRates {
  [fromCurrency: string]: {
    [toCurrency: string]: number;
  };
}
