'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Canvas, Object as FabricObject } from 'fabric'
import { renderPageOnCanvas } from './core/renderer'
import type { CanvasPage, CanvasElement, FabricObjectWithData } from './types'

export interface UseCanvasEditorOptions {
  page: CanvasPage | null
  onElementChange: (elementId: string, updates: Partial<CanvasElement>) => void
  onSelect: (elementId: string | null) => void
  onElementAdd: (element: CanvasElement) => void
  onElementDelete: (elementId: string) => void
}

/**
 * useCanvasEditor (V2)
 *
 * This hook manages the interactive Fabric.js canvas.
 * It follows a unidirectional data flow.
 */
export function useCanvasEditor({ page, onElementChange, onSelect }: UseCanvasEditorOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)
  const [zoom, setZoomState] = useState(1);

  // Function to set zoom level
  const setZoom = useCallback((newZoom: number) => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    const clampedZoom = Math.max(0.1, Math.min(newZoom, 4));
    fabricCanvas.setZoom(clampedZoom);
    setZoomState(clampedZoom);
  }, []);

  // --- Element Creation Functions ---

  const addTextElement = useCallback(() => {
    if (!page) return;
    const id = `text-${Date.now()}`;
    const newElement: CanvasElement = {
      id,
      type: 'text',
      name: 'Text Box',
      x: page.width / 2 - 50,
      y: page.height / 2 - 20,
      width: 100,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: page.elements.length + 1,
      content: 'New Text',
      style: {
        fontFamily: 'Noto Sans TC',
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#000000',
      },
    };
    onElementAdd(newElement);
    onSelect(id); // Select the newly added element
  }, [page, onElementAdd, onSelect]);

  const addRectangle = useCallback(() => {
    if (!page) return;
    const id = `rect-${Date.now()}`;
    const newElement: CanvasElement = {
      id,
      type: 'shape',
      name: 'Rectangle',
      x: page.width / 2 - 75,
      y: page.height / 2 - 50,
      width: 150,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: page.elements.length + 1,
      variant: 'rectangle',
      fill: '#D1FAE5', // Light green
      stroke: '#059669', // Darker green
      strokeWidth: 2,
      cornerRadius: 8,
      align: { horizontal: 'center', vertical: 'center' }, // Default to centered
    };
    onElementAdd(newElement);
    onSelect(id);
  }, [page, onElementAdd, onSelect]);

  const addCircle = useCallback(() => {
    if (!page) return;
    const id = `circle-${Date.now()}`;
    const newElement: CanvasElement = {
      id,
      type: 'shape',
      name: 'Circle',
      x: page.width / 2 - 50,
      y: page.height / 2 - 50,
      width: 100, // Diameter
      height: 100, // Diameter
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: page.elements.length + 1,
      variant: 'circle',
      fill: '#BFDBFE', // Light blue
      stroke: '#3B82F6', // Darker blue
      strokeWidth: 2,
      cornerRadius: 50, // For a perfect circle with width/height 100
      align: { horizontal: 'center', vertical: 'center' },
    };
    onElementAdd(newElement);
    onSelect(id);
  }, [page, onElementAdd, onSelect]);

  const addImageElement = useCallback((src: string, initialX?: number, initialY?: number) => {
    if (!page) return;
    const id = `image-${Date.now()}`;
    const newElement: CanvasElement = {
      id,
      type: 'image',
      name: 'Image',
      x: initialX ?? page.width / 2 - 100,
      y: initialY ?? page.height / 2 - 75,
      width: 200,
      height: 150,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: page.elements.length + 1,
      src: src || 'https://via.placeholder.com/200x150?text=Placeholder+Image',
      objectFit: 'cover',
    };
    onElementAdd(newElement);
    onSelect(id);
  }, [page, onElementAdd, onSelect]);

  // Initialize Fabric.js canvas instance
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new Canvas(canvasRef.current, {
      renderOnAddRemove: false,
      preserveObjectStacking: true,
    })
    fabricCanvasRef.current = fabricCanvas

    // --- Event Listeners ---

    const handleObjectModified = (e: fabric.IEvent) => {
      const target = e.target as FabricObjectWithData | undefined
      if (!target || !target.data) return

      const { elementId } = target.data
      
      const bounds = target.getBoundingRect()

      onElementChange(elementId, {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
        rotation: target.angle || 0,
      })
    }

    const handleSelection = (e: fabric.IEvent) => {
      const selected = e.selected as FabricObjectWithData[] | undefined
      if (selected && selected.length === 1) {
        onSelect(selected[0].data.elementId)
      } else {
        onSelect(null)
      }
    }
    
    const handleSelectionCleared = () => {
      onSelect(null)
    }

    fabricCanvas.on('object:modified', handleObjectModified)
    fabricCanvas.on('selection:created', handleSelection)
    fabricCanvas.on('selection:updated', handleSelection)
    fabricCanvas.on('selection:cleared', handleSelectionCleared)


    return () => {
      fabricCanvas.off('object:modified', handleObjectModified)
      fabricCanvas.off('selection:created', handleSelection)
      fabricCanvas.off('selection:updated', handleSelection)
      fabricCanvas.off('selection:cleared', handleSelectionCleared)
      fabricCanvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [onElementChange, onSelect])

  // Re-render the canvas whenever the 'page' prop changes
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas || !page) return

    renderPageOnCanvas(fabricCanvas, page, {
      isEditable: true,
      canvasWidth: page.width,
      canvasHeight: page.height,
    })
  }, [page])

  const deleteSelectedElements = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const activeObjects = fabricCanvas.getActiveObjects();
    activeObjects.forEach(obj => {
      const elWithData = obj as FabricObjectWithData;
      if (elWithData.data?.elementId) {
        onElementDelete(elWithData.data.elementId);
      }
    });
    fabricCanvas.discardActiveObject(); // Deselect elements after deletion
  }, [onElementDelete]);

  return {
    canvasRef,
    zoom,
    setZoom,
    addTextElement,
    addRectangle,
    addCircle,
    addImageElement,
    deleteSelectedElements,
  }
}
