# Dashboard Feature Module

This directory contains the refactored dashboard components, hooks, and types extracted from the main page.tsx file.

## Overview

The massive 1109-line page.tsx has been split into smaller, maintainable files organized by feature.

### File Structure

```
src/features/dashboard/
├── components/
│   ├── calculator-widget.tsx      (286 lines) - Calculator widget with sequential/math mode
│   ├── currency-widget.tsx        (213 lines) - Currency conversion widget
│   ├── notes-widget.tsx           (167 lines) - Notes widget with tabs
│   ├── stats-widget.tsx           (99 lines)  - Statistics dashboard widget
│   ├── timer-widget.tsx           (75 lines)  - Timer/stopwatch widget
│   ├── widget-settings-dialog.tsx (61 lines)  - Widget settings dialog
│   ├── widget-config.tsx          (16 lines)  - Widget configuration
│   └── index.ts                   (7 lines)   - Barrel export
├── hooks/
│   ├── use-stats-data.ts          (164 lines) - Stats calculation hook
│   ├── use-widgets.ts             (36 lines)  - Widget state management
│   └── index.ts                   (2 lines)   - Barrel export
└── types/
    └── index.ts                   (35 lines)  - TypeScript types and interfaces

Main page: src/app/page.tsx        (80 lines)  - Orchestrates dashboard layout
```

## Components

### Widget Components

1. **CalculatorWidget** - iPhone-style calculator
   - Supports both sequential and mathematical priority calculation
   - Auto-cleans input (removes Chinese, converts full-width chars)
   - Keyboard shortcuts (Enter to calculate, Escape to clear)

2. **CurrencyWidget** - Bi-directional currency converter
   - Supports 6 currencies (USD, JPY, KRW, CNY, VND, IDR)
   - Custom exchange rate support
   - Real-time conversion

3. **TimerWidget** - Simple stopwatch
   - Start/pause/reset functionality
   - HH:MM:SS format display

4. **NotesWidget** - Multi-tab notes
   - Up to 5 note tabs
   - Auto-save to localStorage
   - Rename tabs via double-click

5. **StatsWidget** - Business statistics dashboard
   - Configurable stats display
   - Real-time data from tours and orders
   - 6 stat types: todos, weekly/next week payments, deposits, tours this week/month

### UI Components

6. **WidgetSettingsDialog** - Widget configuration dialog
   - Select which widgets to display
   - Persists to localStorage

## Hooks

### useWidgets
Manages widget activation state and persistence.

```tsx
const { activeWidgets, toggleWidget } = useWidgets();
```

### useStatsData
Calculates all business statistics from tour and order data.

```tsx
const allStats = useStatsData();
```

### useStatsConfig
Loads and saves stats configuration.

```tsx
const activeStats = useStatsConfig();
saveStatsConfig(newStats);
```

## Types

- `WidgetType` - Union type for available widgets
- `WidgetConfig` - Widget configuration interface
- `StatType` - Union type for stat categories
- `StatConfig` - Stat item configuration
- `NoteTab` - Note tab data structure

## Usage

### Main Page (page.tsx)

The refactored main page is now only 80 lines (down from 1109):

```tsx
import { useWidgets } from '@/features/dashboard/hooks';
import { WidgetSettingsDialog, AVAILABLE_WIDGETS } from '@/features/dashboard/components';

export default function Home() {
  const { activeWidgets, toggleWidget } = useWidgets();

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="首頁"
        actions={
          <WidgetSettingsDialog
            activeWidgets={activeWidgets}
            onToggleWidget={toggleWidget}
          />
        }
      />
      <div className="flex-1 overflow-auto">
        {AVAILABLE_WIDGETS.filter((w) => activeWidgets.includes(w.id)).map(
          (widget) => {
            const Component = widget.component;
            return <Component key={widget.id} />;
          }
        )}
      </div>
    </div>
  );
}
```

### Adding New Widgets

1. Create widget component in `components/`
2. Add widget config to `widget-config.tsx`
3. Add type to `WidgetType` in `types/index.ts`
4. Export from `components/index.ts`

## Benefits

- **Maintainability**: Each file is under 300 lines
- **Separation of Concerns**: UI, business logic, and types are separated
- **Reusability**: Components and hooks can be reused elsewhere
- **Testability**: Smaller files are easier to test
- **Code Organization**: Clear feature-based structure
- **Type Safety**: Centralized type definitions

## Performance

- All widgets use localStorage for persistence
- Stats are calculated with useMemo for efficiency
- Widgets are only rendered when active
