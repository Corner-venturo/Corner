/**
 * Shared constants for canvas components
 */

export const CANVAS_LIMITS = {
  MAX_PERSONAL_CANVASES: 5,
  MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB
  COMPRESSION_THRESHOLD: 500 * 1024, // 500KB
  MAX_IMAGE_DIMENSION: 1920, // pixels
} as const;

export const IMAGE_QUALITY = {
  HIGH: 0.85,
  LOW: 0.7,
} as const;

export const UPLOAD_DELAYS = {
  BETWEEN_IMAGES: 500, // ms
  HIDE_PROGRESS: 500, // ms
} as const;

export const EDITOR_CLASSES = {
  PROSE: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6',
  LINK: 'text-morandi-gold hover:underline cursor-pointer',
  IMAGE: 'max-w-full h-auto rounded-lg',
} as const;
