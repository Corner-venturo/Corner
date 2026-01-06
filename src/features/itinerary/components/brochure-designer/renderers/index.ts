/**
 * Renderers Module
 * 統一渲染引擎的導出
 */

// 元素渲染器
export {
  TextRenderer,
  ImageRenderer,
  ShapeRenderer,
  ElementRenderer,
  ElementsRenderer,
} from './ElementRenderers'

// 文件渲染器
export {
  PageRenderer,
  PagesPreview,
  SpreadPreview,
} from './DocumentRenderer'

// Canvas 同步工具
export {
  extractBaseProps,
  extractTextProps,
  extractImageProps,
  extractShapeProps,
  getTextFabricOptions,
  getImageFabricOptions,
  getShapeFabricOptions,
  setupCanvasListeners,
  findObjectById,
  findObjectByName,
  getAllElementIds,
} from './CanvasSync'

export type { CanvasChangeEvent, CanvasSyncConfig } from './CanvasSync'
