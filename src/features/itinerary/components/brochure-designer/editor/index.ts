/**
 * 手冊編輯器模組
 * Brochure Editor Module
 */

export { BrochureEditor } from './BrochureEditor'
export { PropertyPanel } from './PropertyPanel'
export { AssetPanel } from './AssetPanel'
export { BrochureCanvas } from './BrochureCanvas'

// Types
export type {
  BrochureElement,
  TextElement,
  ImageElement,
  ShapeElement,
  AttractionCardElement,
  FlightInfoElement,
  AccommodationElement,
  DayHeaderElement,
  StickerElement,
  BrochurePage,
  Brochure,
  EditorState,
  DataSource,
  DataBinding,
  TextStyle,
  StickerCategory,
  Sticker,
} from './types'

export {
  CANVAS_CONFIG,
  DEFAULT_TEXT_STYLE,
  DEFAULT_SHAPE_STYLE,
} from './types'
