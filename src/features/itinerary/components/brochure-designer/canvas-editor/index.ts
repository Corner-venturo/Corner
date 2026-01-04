/**
 * Canvas Editor Module Exports
 * Canva-like 手冊設計器模組匯出
 */

// 主要組件
export { CanvasEditor } from './CanvasEditor'
export { LayerPanel } from './LayerPanel'
export { ElementLibrary } from './ElementLibrary'
export { Toolbar } from './Toolbar'
export { SmartGuides } from './SmartGuides'
export { OverlapIndicator } from './OverlapIndicator'

// Hooks
export { useCanvasEditor } from './useCanvasEditor'

// 類型
export type {
  // 基礎類型
  AtomicElementType,
  CompoundElementType,
  ElementType,
  BaseElementProps,

  // 元素類型
  TextElement,
  TextStyle,
  ImageElement,
  ShapeElement,
  ShapeVariant,
  DecorationElement,
  DecorationCategory,
  IconElement,
  SpotCardElement,
  ItineraryItemElement,
  FlightInfoElement,
  AccommodationCardElement,
  DayHeaderElement,
  CanvasElement,

  // 畫布類型
  CanvasPage,
  BrochureCanvas,

  // 功能類型
  GuideLine,
  SnapGuide,
  OverlapInfo,
  LayerOperation,
  HistoryAction,
  EditorState,

  // 素材庫類型
  LibraryAsset,
  LibraryCategory,

  // Fabric.js 擴展
  FabricElementData,
  FabricObjectWithData,

  // 事件類型
  CanvasEventMap,
  CanvasEventHandler,
} from './types'
