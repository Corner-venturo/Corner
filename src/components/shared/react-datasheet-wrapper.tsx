// For backwards compatibility, re-export from the new modular structure
export { ReactDatasheetWrapper } from './react-datasheet-wrapper'
export type { DataSheetColumn, DataSheetProps, CellData } from './react-datasheet-wrapper'

// Also export with old name for backwards compatibility
export { ReactDatasheetWrapper as ReactDataSheetWrapper } from './react-datasheet-wrapper'

// Default export
import ReactDataSheet from 'react-datasheet'
export default ReactDataSheet
export type { ReactDataSheet }
