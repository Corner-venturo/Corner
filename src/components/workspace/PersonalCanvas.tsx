/**
 * PersonalCanvas - re-export from refactored canvas structure
 *
 * This file maintains backward compatibility while using the new modular structure.
 * The component has been refactored into smaller, focused modules in:
 * src/components/workspace/canvas/personal-canvas/
 */

export { PersonalCanvas } from './canvas/personal-canvas';
export type { PersonalCanvasProps } from './canvas/shared/types';
