/**
 * Canvas Components - main barrel exports
 */

// Personal Canvas
export { PersonalCanvas } from './personal-canvas';
export type { PersonalCanvasProps } from './shared/types';

// Canvas Editor
export { CanvasEditor } from './canvas-editor';
export type { CanvasEditorProps } from './shared/types';

// Shared types
export type { ViewMode, EditMode, DocumentFilter, EditorState } from './shared/types';

// Shared hooks
export { useCanvasState, useEditorState } from './shared/useCanvasState';

// Shared constants
export { CANVAS_LIMITS, IMAGE_QUALITY, UPLOAD_DELAYS, EDITOR_CLASSES } from './shared/constants';
