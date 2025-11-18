// Re-export types and components
export type { DataSheetColumn, DataSheetProps, CellData } from './react-datasheet-wrapper/types'
export { ReactDatasheetWrapper } from './react-datasheet-wrapper/ReactDatasheetWrapper'

// Also export with old name for backwards compatibility
export { ReactDatasheetWrapper as ReactDataSheetWrapper } from './react-datasheet-wrapper/ReactDatasheetWrapper'

// Default export
import ReactDataSheet from 'react-datasheet'
export default ReactDataSheet
export type { ReactDataSheet as ReactDataSheetType }
