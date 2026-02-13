/**
 * SVG 渲染輔助工具
 *
 * 使用 svg2pdf.js 將 SVG 元素渲染到 jsPDF
 * 解決 jsPDF 原生不支援的：漸層、SVG Path
 */

import jsPDF from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import { logger } from '@/lib/utils/logger'

/**
 * 將 SVG Path 渲染到 PDF 指定位置
 */
export async function renderSvgPath(
  doc: jsPDF,
  options: {
    pathData: string
    x: number
    y: number
    width: number
    height: number
    fill?: string
    stroke?: string
    strokeWidth?: number
    opacity?: number
    viewBox?: string
  }
): Promise<void> {
  const { pathData, x, y, width, height, fill, stroke, strokeWidth, opacity, viewBox } = options

  const vb = viewBox ?? `0 0 ${width} ${height}`

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${width}" height="${height}">
    <path d="${pathData}"
      ${fill ? `fill="${fill}"` : 'fill="none"'}
      ${stroke ? `stroke="${stroke}"` : ''}
      ${strokeWidth ? `stroke-width="${strokeWidth}"` : ''}
      ${opacity !== undefined && opacity < 1 ? `opacity="${opacity}"` : ''}
    />
  </svg>`

  await renderSvgString(doc, svgStr, x, y, width, height)
}

/**
 * 渲染帶漸層的形狀到 PDF
 */
export async function renderGradientShape(
  doc: jsPDF,
  options: {
    shape: 'rect' | 'circle' | 'ellipse'
    x: number
    y: number
    width: number
    height: number
    gradient: {
      type: 'linear' | 'radial'
      angle?: number
      stops: Array<{ offset: number; color: string }>
    }
    cornerRadius?: number
    opacity?: number
  }
): Promise<void> {
  const { shape, x, y, width, height, gradient, cornerRadius, opacity } = options

  // 建構漸層 ID
  const gradId = 'grad_' + Math.random().toString(36).slice(2, 8)

  // 建構漸層定義
  let gradientDef = ''
  if (gradient.type === 'linear') {
    const angle = gradient.angle ?? 0
    const rad = (angle * Math.PI) / 180
    const x1 = 50 - Math.cos(rad) * 50
    const y1 = 50 - Math.sin(rad) * 50
    const x2 = 50 + Math.cos(rad) * 50
    const y2 = 50 + Math.sin(rad) * 50

    const stops = gradient.stops.map((s) => `<stop offset="${s.offset * 100}%" stop-color="${s.color}" />`).join('\n')
    gradientDef = `<linearGradient id="${gradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops}</linearGradient>`
  } else {
    const stops = gradient.stops.map((s) => `<stop offset="${s.offset * 100}%" stop-color="${s.color}" />`).join('\n')
    gradientDef = `<radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">${stops}</radialGradient>`
  }

  // 建構形狀
  let shapeSvg = ''
  switch (shape) {
    case 'rect':
      shapeSvg = cornerRadius
        ? `<rect width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#${gradId})" />`
        : `<rect width="${width}" height="${height}" fill="url(#${gradId})" />`
      break
    case 'circle': {
      const r = Math.min(width, height) / 2
      shapeSvg = `<circle cx="${r}" cy="${r}" r="${r}" fill="url(#${gradId})" />`
      break
    }
    case 'ellipse':
      shapeSvg = `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" fill="url(#${gradId})" />`
      break
  }

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${gradientDef}</defs>
    ${opacity !== undefined && opacity < 1 ? `<g opacity="${opacity}">` : ''}
    ${shapeSvg}
    ${opacity !== undefined && opacity < 1 ? '</g>' : ''}
  </svg>`

  await renderSvgString(doc, svgStr, x, y, width, height)
}

/**
 * 將 SVG 字串渲染到 PDF
 */
async function renderSvgString(
  doc: jsPDF,
  svgStr: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  try {
    // 建立 SVG DOM 元素
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgStr, 'image/svg+xml')
    const svgElement = svgDoc.documentElement

    // 使用 svg2pdf.js 渲染到 jsPDF
    await svg2pdf(svgElement, doc, { x, y, width, height })
  } catch (error) {
    logger.error('[PDF SVG] Failed to render SVG:', error)
    // Fallback: 繪製灰色佔位符
    doc.setFillColor(200, 200, 200)
    doc.rect(x, y, width, height, 'F')
  }
}
