// Core field keys that cannot be deleted
export const CORE_FIELD_KEYS = ['index', 'name', 'idNumber']

// Default field keys that cannot be hidden (except core fields)
export const PROTECTED_FIELD_KEYS = [
  'index',
  'name',
  'nameEn',
  'birthday',
  'age',
  'gender',
  'idNumber',
  'passport_number',
  'passportExpiry',
  'reservationCode',
  'assignedRoom',
]

// Default column width in pixels
export const DEFAULT_COLUMN_WIDTH = 100

// Minimum column width to prevent squishing
export const MIN_COLUMN_WIDTH = 50

// Default room options for room assignments
export const DEFAULT_ROOM_OPTIONS = []

// LocalStorage key prefix for column widths
export const COLUMN_WIDTHS_STORAGE_KEY = 'columnWidths_'

// CSS class names
export const CSS_CLASSES = {
  wrapper: 'excel-datasheet-wrapper',
  container: 'data-grid-container',
  grid: 'data-grid',
  header: 'datasheet-header',
  readonly: 'datasheet-readonly',
  formula: 'datasheet-formula',
  cell: 'datasheet-cell',
  dragging: 'dragging',
  selected: 'selected',
  editing: 'editing',
  copying: 'copying',
  resizeHandle: 'resize-handle',
  draggable: 'draggable',
}

// Keyboard keycodes
export const KEYCODES = {
  COPY: 'c',
  PASTE: 'v',
  DELETE: 'Delete',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
}

// Arrow keys for navigation
export const ARROW_KEYS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']

// Colors
export const COLORS = {
  border: '#e5e7eb',
  headerBg: '#f3f4f6',
  headerText: '#374151',
  white: 'white',
  gold: '#d97706',
  goldLight: '#fef3c7',
  red: '#ef4444',
  redLight: '#fee2e2',
  green: '#059669',
  greenLight: '#ecfdf5',
  gray: '#6b7280',
  grayBg: '#fafafa',
  hoverBg: '#f9fafb',
  readonly: '#fafafa',
}

// Special cell types
export const SPECIAL_CELLS = {
  ASSIGNED_ROOM: 'assignedRoom',
  NO_BED: 'no-bed',
}

// Error messages
export const ERROR_MESSAGES = {
  FORMULA_ERROR: '#ERROR',
  FORMULA_ERROR_DISPLAY: '錯誤',
}
