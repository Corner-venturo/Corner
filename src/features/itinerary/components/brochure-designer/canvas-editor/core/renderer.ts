/**
 * Brochure Canvas V2 Rendering Engine
 *
 * A stateless, declarative renderer that translates a CanvasPage object
 * into a visual representation on a Fabric.js canvas.
 */

import {
  Canvas,
  StaticCanvas,
  Rect,
  Textbox,
  Circle,
  Image as FabricImage,
  Group,
  Object as FabricObject,
} from 'fabric'
import type {
  CanvasPage,
  CanvasElement,
  ShapeElement,
  TextElement,
  ImageElement,
  FabricObjectWithData,
} from '../types'

interface RenderOptions {
  isEditable: boolean
  canvasWidth: number
  canvasHeight: number
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCommonProps(el: CanvasElement, isEditable: boolean): Partial<FabricObject> {
  return {
    angle: el.rotation || 0,
    opacity: el.opacity ?? 1,
    visible: el.visible ?? true,
    selectable: isEditable && !el.locked,
    evented: isEditable && !el.locked,
    data: { elementId: el.id, elementType: el.type } as FabricObjectWithData['data'],
  }
}

// ============================================================================
// Atomic Element Renderers
// ============================================================================

function renderShapeElement(el: ShapeElement, options: RenderOptions): FabricObject {
  const { canvasWidth, canvasHeight, isEditable } = options
  let { x, y } = el

  // V2 Architecture: Handle declarative alignment
  if (el.align?.horizontal === 'center') {
    x = (canvasWidth - el.width) / 2
  } else if (el.align?.horizontal === 'right') {
    x = canvasWidth - el.width
  }

  if (el.align?.vertical === 'center') {
    y = (canvasHeight - el.height) / 2
  } else if (el.align?.vertical === 'bottom') {
    y = canvasHeight - el.height
  }

  const commonProps = getCommonProps(el, isEditable)

  switch (el.variant) {
    case 'rectangle':
      return new Rect({
        ...commonProps,
        left: x,
        top: y,
        width: el.width,
        height: el.height,
        fill: el.fill || '#e0e0e0',
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        rx: el.cornerRadius,
        ry: el.cornerRadius,
      })

    case 'circle':
      return new Circle({
        ...commonProps,
        left: x,
        top: y,
        radius: el.width / 2,
        fill: el.fill || '#e0e0e0',
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
      })

    default:
      // Fallback for unknown variants
      return new Rect({
        ...commonProps,
        left: x,
        top: y,
        width: el.width,
        height: el.height,
        fill: 'red',
      })
  }
}

function renderTextElement(el: TextElement, options: RenderOptions): FabricObject {
  // Using Textbox for better multiline text handling
  return new Textbox(el.content, {
    ...getCommonProps(el, options.isEditable),
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    fontFamily: el.style.fontFamily,
    fontSize: el.style.fontSize,
    fontWeight: el.style.fontWeight,
    fontStyle: el.style.fontStyle,
    fill: el.style.color,
    lineHeight: el.style.lineHeight,
    letterSpacing: el.style.letterSpacing,
    textAlign: el.style.textAlign,
  })
}

async function renderImageElement(el: ImageElement, options: RenderOptions): Promise<FabricObject> {
  const { isEditable } = options;

  // V2 Architecture: Robust "Group Clipping" model for objectFit
  return new Promise((resolve, reject) => {
    FabricImage.fromURL(el.src, (img) => {
      if (!img) {
        // On failure, return a placeholder rectangle
        resolve(new Rect({
          ...getCommonProps(el, isEditable),
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          fill: '#f0f0f0',
          stroke: 'red',
          strokeWidth: 2,
        }));
        return;
      }

      const targetWidth = el.width;
      const targetHeight = el.height;
      const originalWidth = img.width || 1;
      const originalHeight = img.height || 1;

      let scaleX: number, scaleY: number;

      if (el.objectFit === 'cover') {
        const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
        scaleX = scale;
        scaleY = scale;
      } else if (el.objectFit === 'contain') {
        const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
        scaleX = scale;
        scaleY = scale;
      } else { // 'fill'
        scaleX = targetWidth / originalWidth;
        scaleY = targetHeight / originalHeight;
      }

      img.set({
        scaleX,
        scaleY,
        originX: 'center',
        originY: 'center',
      });

      const group = new Group([img], {
        ...getCommonProps(el, isEditable),
        left: el.x,
        top: el.y,
        width: targetWidth,
        height: targetHeight,
        // This is the key: the group provides the clipping boundary
        clipPath: new Rect({
          left: -targetWidth / 2,
          top: -targetHeight / 2,
          width: targetWidth,
          height: targetHeight,
        }),
      });

      resolve(group);

    }, { crossOrigin: 'anonymous' });
  });
}


// ============================================================================
// Main Renderer Orchestrator
// ============================================================================

/**
 * Renders a complete page on the canvas, clearing it first.
 * This is the main entry point for the V2 renderer.
 * @param canvas The Fabric.js canvas instance.
 * @param page The page object containing elements and properties.
 * @param options Rendering options.
 */
export async function renderPageOnCanvas(
  canvas: Canvas | StaticCanvas,
  page: CanvasPage,
  options: RenderOptions
): Promise<void> {
  // 1. Clear the canvas completely - prevents stacking bugs
  canvas.clear();
  canvas.backgroundColor = page.backgroundColor;
  canvas.setDimensions({ width: page.width, height: page.height });

  // 2. Create a list of promises for all Fabric objects
  const fabricObjectPromises = page.elements
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    .map((el) => {
      switch (el.type) {
        case 'shape':
          return Promise.resolve(renderShapeElement(el, options));
        case 'text':
          return Promise.resolve(renderTextElement(el, options));
        case 'image':
          return renderImageElement(el, options);
        // case 'group': // TODO: Add recursive group rendering if needed
        default:
          return Promise.resolve(null);
      }
    });

  // 3. Await all objects to be created (especially async images)
  const fabricObjects = await Promise.all(fabricObjectPromises);

  // 4. Add all created objects to the canvas at once
  canvas.add(...fabricObjects.filter((obj): obj is FabricObject => !!obj));

  // 5. Final render
  canvas.renderAll();
}
