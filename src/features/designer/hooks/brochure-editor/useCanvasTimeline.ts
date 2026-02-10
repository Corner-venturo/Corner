'use client'

import { useCallback } from 'react'
import * as fabric from 'fabric'
import type { AddTimelineOptions, FabricObjectWithData } from './types'

/**
 * useCanvasTimeline - 時間軸功能 Hook
 * 
 * 功能：
 * - addTimeline: 添加時間軸（垂直或水平）
 * - addTimelinePoint: 在選中的時間軸上新增時間點
 */

interface UseCanvasTimelineOptions {
  getCanvas: () => fabric.Canvas | null
}

interface UseCanvasTimelineReturn {
  addTimeline: (options?: AddTimelineOptions) => void
  addTimelinePoint: () => void
}

export function useCanvasTimeline(options: UseCanvasTimelineOptions): UseCanvasTimelineReturn {
  const { getCanvas } = options

  // ============================================
  // Add Timeline
  // ============================================
  const addTimeline = useCallback((opts?: AddTimelineOptions) => {
    const canvas = getCanvas()
    if (!canvas) return

    const pointCount = opts?.pointCount || 3
    const isVertical = opts?.orientation !== 'horizontal'
    const timelineId = `timeline-${Date.now()}`
    const itemSpacing = 36

    const startX = opts?.x ?? 100
    const startY = opts?.y ?? 150

    const allElements: fabric.FabricObject[] = []

    if (isVertical) {
      // 垂直時間軸線
      const lineHeight = pointCount * itemSpacing
      const mainLine = new fabric.Rect({
        left: startX + 52,
        top: startY + 12,
        width: 2,
        height: lineHeight,
        fill: '#c9aa7c',
        opacity: 0.4,
        selectable: true,
      }) as fabric.Rect & FabricObjectWithData
      mainLine.data = { timelineId, role: 'line', orientation: 'vertical', pointCount }
      allElements.push(mainLine)

      for (let i = 0; i < pointCount; i++) {
        const itemY = startY + i * itemSpacing

        // 時間文字
        const timeText = new fabric.IText(`${8 + i * 2}:00`, {
          left: startX,
          top: itemY,
          fontSize: 11,
          fontFamily: 'Noto Sans TC',
          fill: '#c9aa7c',
          textAlign: 'right',
          width: 45,
        }) as fabric.IText & FabricObjectWithData
        timeText.data = { timelineId, role: 'time', index: i }
        allElements.push(timeText)

        // 圓點
        const dot = new fabric.Circle({
          left: startX + 50,
          top: itemY + 5,
          radius: 4,
          fill: '#c9aa7c',
          originX: 'center',
          originY: 'center',
        }) as fabric.Circle & FabricObjectWithData
        dot.data = { timelineId, role: 'dot', index: i }
        allElements.push(dot)

        // 活動文字
        const activityText = new fabric.IText(`活動 ${i + 1}`, {
          left: startX + 64,
          top: itemY,
          fontSize: 11,
          fontFamily: 'Noto Sans TC',
          fill: '#3a3633',
          width: 150,
        }) as fabric.IText & FabricObjectWithData
        activityText.data = { timelineId, role: 'activity', index: i }
        allElements.push(activityText)
      }
    } else {
      // 水平時間軸
      const lineWidth = pointCount * 80
      const mainLine = new fabric.Rect({
        left: startX,
        top: startY + 50,
        width: lineWidth,
        height: 2,
        fill: '#c9aa7c',
        opacity: 0.4,
        selectable: true,
      }) as fabric.Rect & FabricObjectWithData
      mainLine.data = { timelineId, role: 'line', orientation: 'horizontal', pointCount }
      allElements.push(mainLine)

      for (let i = 0; i < pointCount; i++) {
        const itemX = startX + 40 + i * 80

        // 時間文字
        const timeText = new fabric.IText(`${8 + i * 2}:00`, {
          left: itemX,
          top: startY + 20,
          fontSize: 11,
          fontFamily: 'Noto Sans TC',
          fill: '#c9aa7c',
          originX: 'center',
        }) as fabric.IText & FabricObjectWithData
        timeText.data = { timelineId, role: 'time', index: i }
        allElements.push(timeText)

        // 圓點
        const dot = new fabric.Circle({
          left: itemX,
          top: startY + 50,
          radius: 4,
          fill: '#c9aa7c',
          originX: 'center',
          originY: 'center',
        }) as fabric.Circle & FabricObjectWithData
        dot.data = { timelineId, role: 'dot', index: i }
        allElements.push(dot)

        // 活動文字
        const activityText = new fabric.IText(`活動 ${i + 1}`, {
          left: itemX,
          top: startY + 70,
          fontSize: 11,
          fontFamily: 'Noto Sans TC',
          fill: '#3a3633',
          originX: 'center',
        }) as fabric.IText & FabricObjectWithData
        activityText.data = { timelineId, role: 'activity', index: i }
        allElements.push(activityText)
      }
    }

    allElements.forEach(el => canvas.add(el))

    const selection = new fabric.ActiveSelection(allElements, { canvas })
    canvas.setActiveObject(selection)
    canvas.renderAll()
  }, [getCanvas])

  // ============================================
  // Add Timeline Point
  // ============================================
  const addTimelinePoint = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    // 找出時間軸 ID
    let timelineId: string | null = null
    let orientation: string = 'vertical'
    let currentPointCount = 0

    for (const obj of activeObjects) {
      const objWithData = obj as FabricObjectWithData
      if (objWithData.data?.timelineId) {
        timelineId = objWithData.data.timelineId as string
        if (objWithData.data.role === 'line') {
          orientation = (objWithData.data.orientation as string) || 'vertical'
          currentPointCount = (objWithData.data.pointCount as number) || 0
        }
        break
      }
    }

    if (!timelineId) return

    // 找出該時間軸的所有元素
    const allObjects = canvas.getObjects()
    const timelineElements = allObjects.filter(obj => {
      const objWithData = obj as FabricObjectWithData
      return objWithData.data?.timelineId === timelineId
    })

    // 找出主線條
    const lineElement = timelineElements.find(obj => {
      const objWithData = obj as FabricObjectWithData
      return objWithData.data?.role === 'line'
    }) as (fabric.Rect & FabricObjectWithData) | undefined

    if (!lineElement) return

    orientation = (lineElement.data?.orientation as string) || 'vertical'
    currentPointCount = (lineElement.data?.pointCount as number) || 0
    const newIndex = currentPointCount
    const newPointCount = currentPointCount + 1

    // 找出圓點並排序
    const dots = timelineElements.filter(obj => {
      const objWithData = obj as FabricObjectWithData
      return objWithData.data?.role === 'dot'
    }) as (fabric.Circle & FabricObjectWithData)[]

    if (dots.length === 0) return

    dots.sort((a, b) => {
      return ((a.data?.index as number) || 0) - ((b.data?.index as number) || 0)
    })
    const lastDot = dots[dots.length - 1]

    const newElements: fabric.FabricObject[] = []

    if (orientation === 'vertical') {
      const itemSpacing = 36
      const newY = (lastDot.top || 0) + itemSpacing
      const baseX = (lineElement.left || 0) - 52

      const timeText = new fabric.IText(`${8 + newIndex * 2}:00`, {
        left: baseX,
        top: newY,
        fontSize: 11,
        fontFamily: 'Noto Sans TC',
        fill: '#c9aa7c',
        textAlign: 'right',
        width: 45,
      }) as fabric.IText & FabricObjectWithData
      timeText.data = { timelineId, role: 'time', index: newIndex }
      newElements.push(timeText)

      const dot = new fabric.Circle({
        left: baseX + 50,
        top: newY + 5,
        radius: 4,
        fill: '#c9aa7c',
        originX: 'center',
        originY: 'center',
      }) as fabric.Circle & FabricObjectWithData
      dot.data = { timelineId, role: 'dot', index: newIndex }
      newElements.push(dot)

      const activityText = new fabric.IText(`活動 ${newIndex + 1}`, {
        left: baseX + 64,
        top: newY,
        fontSize: 11,
        fontFamily: 'Noto Sans TC',
        fill: '#3a3633',
        width: 150,
      }) as fabric.IText & FabricObjectWithData
      activityText.data = { timelineId, role: 'activity', index: newIndex }
      newElements.push(activityText)

      lineElement.set({ height: (lineElement.height || 0) + itemSpacing })
    } else {
      const itemSpacing = 80
      const newX = (lastDot.left || 0) + itemSpacing
      const baseY = (lineElement.top || 0) - 50

      const timeText = new fabric.IText(`${8 + newIndex * 2}:00`, {
        left: newX,
        top: baseY + 20,
        fontSize: 11,
        fontFamily: 'Noto Sans TC',
        fill: '#c9aa7c',
        originX: 'center',
      }) as fabric.IText & FabricObjectWithData
      timeText.data = { timelineId, role: 'time', index: newIndex }
      newElements.push(timeText)

      const dot = new fabric.Circle({
        left: newX,
        top: baseY + 50,
        radius: 4,
        fill: '#c9aa7c',
        originX: 'center',
        originY: 'center',
      }) as fabric.Circle & FabricObjectWithData
      dot.data = { timelineId, role: 'dot', index: newIndex }
      newElements.push(dot)

      const activityText = new fabric.IText(`活動 ${newIndex + 1}`, {
        left: newX,
        top: baseY + 70,
        fontSize: 11,
        fontFamily: 'Noto Sans TC',
        fill: '#3a3633',
        originX: 'center',
      }) as fabric.IText & FabricObjectWithData
      activityText.data = { timelineId, role: 'activity', index: newIndex }
      newElements.push(activityText)

      lineElement.set({ width: (lineElement.width || 0) + itemSpacing })
    }

    // 更新 pointCount
    if (lineElement.data) {
      lineElement.data.pointCount = newPointCount
    }

    newElements.forEach(el => canvas.add(el))
    lineElement.setCoords()
    canvas.renderAll()
  }, [getCanvas])

  return {
    addTimeline,
    addTimelinePoint,
  }
}
