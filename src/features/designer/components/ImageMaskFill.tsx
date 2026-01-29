'use client'

/**
 * 圖片遮罩填充功能
 *
 * 將圖片裁切成指定形狀（三角形、圓形、心形等）
 */

import { useState, useRef } from 'react'
import * as fabric from 'fabric'
import { Upload, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { logger } from '@/lib/utils/logger'

interface ImageMaskFillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canvas: fabric.Canvas | null
  targetShape: fabric.FabricObject | null
  onComplete: () => void
}

export function ImageMaskFillDialog({
  open,
  onOpenChange,
  canvas,
  targetShape,
  onComplete,
}: ImageMaskFillDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 處理圖片上傳
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImageUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 應用圖片遮罩
  const handleApply = async () => {
    if (!canvas || !targetShape || !imageUrl) return

    setLoading(true)

    try {
      // 取得形狀的邊界和位置
      const shapeLeft = targetShape.left || 0
      const shapeTop = targetShape.top || 0
      const shapeWidth = (targetShape.width || 100) * (targetShape.scaleX || 1)
      const shapeHeight = (targetShape.height || 100) * (targetShape.scaleY || 1)
      const shapeAngle = targetShape.angle || 0

      // 複製形狀作為 clipPath
      const clipPath = await cloneShapeAsClipPath(targetShape)

      // 載入圖片
      const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })

      // 計算圖片縮放以填滿形狀
      const imgWidth = img.width || 1
      const imgHeight = img.height || 1
      const scaleX = shapeWidth / imgWidth
      const scaleY = shapeHeight / imgHeight
      const scale = Math.max(scaleX, scaleY) // 使用較大的縮放以填滿

      // 設定圖片屬性
      img.set({
        left: shapeLeft,
        top: shapeTop,
        scaleX: scale,
        scaleY: scale,
        angle: shapeAngle,
        clipPath: clipPath,
        originX: 'center',
        originY: 'center',
      })

      // 移除原本的形狀
      canvas.remove(targetShape)

      // 加入帶遮罩的圖片
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()

      // 關閉對話框
      onOpenChange(false)
      setImageUrl(null)
      onComplete()

      logger.log('圖片遮罩填充成功', { shapeWidth, shapeHeight, imgWidth, imgHeight, scale })
    } catch (error) {
      logger.error('圖片遮罩填充失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 取消
  const handleCancel = () => {
    setImageUrl(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>圖片遮罩填充</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 上傳區域 */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-morandi-gold transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="預覽"
                  className="max-h-48 mx-auto rounded"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageUrl(null)
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto mb-2 text-morandi-secondary" size={32} />
                <p className="text-sm text-morandi-secondary">
                  點擊或拖曳上傳圖片
                </p>
                <p className="text-xs text-morandi-muted mt-1">
                  支援 JPG、PNG、WebP
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 提示 */}
          <div className="bg-morandi-container/30 rounded-lg p-3">
            <p className="text-xs text-morandi-secondary">
              📌 圖片會自動裁切成選取的形狀
            </p>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X size={16} className="mr-1" />
              取消
            </Button>
            <Button
              onClick={handleApply}
              disabled={!imageUrl || loading}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Check size={16} className="mr-1" />
              {loading ? '處理中...' : '套用'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 複製形狀作為 clipPath
 */
async function cloneShapeAsClipPath(shape: fabric.FabricObject): Promise<fabric.FabricObject> {
  // 根據形狀類型建立對應的 clipPath
  const type = shape.type
  // 取得原始形狀的縮放比例
  const scaleX = shape.scaleX || 1
  const scaleY = shape.scaleY || 1

  if (type === 'rect') {
    return new fabric.Rect({
      width: (shape.width || 100) * scaleX,
      height: (shape.height || 100) * scaleY,
      rx: ((shape as fabric.Rect).rx || 0) * scaleX,
      ry: ((shape as fabric.Rect).ry || 0) * scaleY,
      originX: 'center',
      originY: 'center',
    })
  }

  if (type === 'circle') {
    return new fabric.Circle({
      radius: ((shape as fabric.Circle).radius || 50) * Math.max(scaleX, scaleY),
      originX: 'center',
      originY: 'center',
    })
  }

  if (type === 'ellipse') {
    return new fabric.Ellipse({
      rx: ((shape as fabric.Ellipse).rx || 50) * scaleX,
      ry: ((shape as fabric.Ellipse).ry || 50) * scaleY,
      originX: 'center',
      originY: 'center',
    })
  }

  if (type === 'triangle') {
    return new fabric.Triangle({
      width: (shape.width || 100) * scaleX,
      height: (shape.height || 100) * scaleY,
      originX: 'center',
      originY: 'center',
    })
  }

  if (type === 'polygon') {
    const polygon = shape as fabric.Polygon
    // 縮放多邊形的點
    const scaledPoints = (polygon.points || []).map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }))
    return new fabric.Polygon(scaledPoints, {
      originX: 'center',
      originY: 'center',
    })
  }

  if (type === 'path') {
    const path = shape as fabric.Path
    const clonedPath = new fabric.Path(path.path, {
      originX: 'center',
      originY: 'center',
      scaleX: scaleX,
      scaleY: scaleY,
    })
    return clonedPath
  }

  if (type === 'group') {
    // 處理群組：克隆群組並設定為 clipPath
    const group = shape as fabric.Group
    const clonedGroup = await group.clone()
    clonedGroup.set({
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0,
    })
    return clonedGroup
  }

  // 預設：嘗試克隆
  const cloned = await shape.clone()
  cloned.set({
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
  })
  return cloned
}

/**
 * 預設遮罩形狀
 */
export const MASK_SHAPES = [
  // === 基本形狀 ===
  {
    id: 'circle',
    name: '圓形',
    category: 'basic',
    create: (size: number) => new fabric.Circle({ radius: size / 2 }),
  },
  {
    id: 'rect',
    name: '矩形',
    category: 'basic',
    create: (size: number) => new fabric.Rect({ width: size, height: size }),
  },
  {
    id: 'rounded-rect',
    name: '圓角矩形',
    category: 'basic',
    create: (size: number) => new fabric.Rect({ width: size, height: size, rx: 20, ry: 20 }),
  },
  {
    id: 'triangle',
    name: '三角形',
    category: 'basic',
    create: (size: number) => new fabric.Triangle({ width: size, height: size }),
  },
  {
    id: 'hexagon',
    name: '六邊形',
    category: 'basic',
    create: (size: number) => {
      const points: { x: number; y: number }[] = []
      const radius = size / 2
      const center = size / 2
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        points.push({
          x: center + radius * Math.cos(angle),
          y: center + radius * Math.sin(angle),
        })
      }
      return new fabric.Polygon(points)
    },
  },

  // === 特殊造型 ===
  {
    id: 'heart',
    name: '愛心',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      const path = `M ${50*s},${90*s} C ${20*s},${60*s} ${0*s},${35*s} ${0*s},${25*s} C ${0*s},${10*s} ${15*s},${0*s} ${30*s},${0*s} C ${40*s},${0*s} ${50*s},${10*s} ${50*s},${20*s} C ${50*s},${10*s} ${60*s},${0*s} ${70*s},${0*s} C ${85*s},${0*s} ${100*s},${10*s} ${100*s},${25*s} C ${100*s},${35*s} ${80*s},${60*s} ${50*s},${90*s} Z`
      return new fabric.Path(path)
    },
  },
  {
    id: 'star',
    name: '星形',
    category: 'special',
    create: (size: number) => {
      const points: { x: number; y: number }[] = []
      const outerRadius = size / 2
      const innerRadius = size / 4
      const center = size / 2
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const angle = (Math.PI / 5) * i - Math.PI / 2
        points.push({
          x: center + radius * Math.cos(angle),
          y: center + radius * Math.sin(angle),
        })
      }
      return new fabric.Polygon(points)
    },
  },
  {
    id: 'snowflake',
    name: '雪花',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      // 六角雪花 SVG
      const path = `M ${50*s},${0*s} L ${50*s},${100*s} M ${0*s},${25*s} L ${100*s},${75*s} M ${0*s},${75*s} L ${100*s},${25*s}
        M ${50*s},${15*s} L ${40*s},${25*s} M ${50*s},${15*s} L ${60*s},${25*s}
        M ${50*s},${85*s} L ${40*s},${75*s} M ${50*s},${85*s} L ${60*s},${75*s}
        M ${15*s},${32*s} L ${25*s},${25*s} M ${15*s},${32*s} L ${15*s},${45*s}
        M ${85*s},${68*s} L ${75*s},${75*s} M ${85*s},${68*s} L ${85*s},${55*s}
        M ${15*s},${68*s} L ${25*s},${75*s} M ${15*s},${68*s} L ${15*s},${55*s}
        M ${85*s},${32*s} L ${75*s},${25*s} M ${85*s},${32*s} L ${85*s},${45*s}`
      return new fabric.Path(path)
    },
  },
  {
    id: 'christmas-tree',
    name: '聖誕樹',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      const path = `M ${50*s},${0*s} L ${25*s},${35*s} L ${35*s},${35*s} L ${15*s},${60*s} L ${30*s},${60*s} L ${10*s},${85*s} L ${40*s},${85*s} L ${40*s},${100*s} L ${60*s},${100*s} L ${60*s},${85*s} L ${90*s},${85*s} L ${70*s},${60*s} L ${85*s},${60*s} L ${65*s},${35*s} L ${75*s},${35*s} Z`
      return new fabric.Path(path)
    },
  },
  {
    id: 'cloud',
    name: '雲朵',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      const path = `M ${25*s},${70*s} A ${20*s},${20*s} 0 1,1 ${25*s},${50*s} A ${15*s},${15*s} 0 1,1 ${50*s},${35*s} A ${18*s},${18*s} 0 1,1 ${80*s},${50*s} A ${15*s},${15*s} 0 1,1 ${80*s},${70*s} Z`
      return new fabric.Path(path)
    },
  },
  {
    id: 'flower',
    name: '花朵',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      // 五瓣花
      const path = `M ${50*s},${30*s} A ${15*s},${15*s} 0 1,1 ${50*s},${0*s} A ${15*s},${15*s} 0 1,1 ${50*s},${30*s}
        M ${70*s},${40*s} A ${15*s},${15*s} 0 1,1 ${95*s},${30*s} A ${15*s},${15*s} 0 1,1 ${70*s},${40*s}
        M ${65*s},${65*s} A ${15*s},${15*s} 0 1,1 ${85*s},${85*s} A ${15*s},${15*s} 0 1,1 ${65*s},${65*s}
        M ${35*s},${65*s} A ${15*s},${15*s} 0 1,1 ${15*s},${85*s} A ${15*s},${15*s} 0 1,1 ${35*s},${65*s}
        M ${30*s},${40*s} A ${15*s},${15*s} 0 1,1 ${5*s},${30*s} A ${15*s},${15*s} 0 1,1 ${30*s},${40*s}
        M ${50*s},${35*s} A ${12*s},${12*s} 0 1,0 ${50*s},${60*s} A ${12*s},${12*s} 0 1,0 ${50*s},${35*s}`
      return new fabric.Path(path)
    },
  },
  {
    id: 'leaf',
    name: '葉子',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      const path = `M ${50*s},${0*s} Q ${100*s},${30*s} ${100*s},${60*s} Q ${100*s},${100*s} ${50*s},${100*s} Q ${0*s},${100*s} ${0*s},${60*s} Q ${0*s},${30*s} ${50*s},${0*s} M ${50*s},${20*s} L ${50*s},${90*s}`
      return new fabric.Path(path)
    },
  },
  {
    id: 'diamond',
    name: '鑽石',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      const path = `M ${50*s},${0*s} L ${100*s},${30*s} L ${50*s},${100*s} L ${0*s},${30*s} Z M ${0*s},${30*s} L ${100*s},${30*s} M ${25*s},${30*s} L ${50*s},${0*s} L ${75*s},${30*s}`
      return new fabric.Path(path)
    },
  },
  {
    id: 'butterfly',
    name: '蝴蝶',
    category: 'special',
    create: (size: number) => {
      const s = size / 100
      const path = `M ${50*s},${20*s} Q ${20*s},${0*s} ${5*s},${25*s} Q ${0*s},${50*s} ${25*s},${60*s} Q ${10*s},${80*s} ${30*s},${90*s} Q ${45*s},${75*s} ${50*s},${60*s} Q ${55*s},${75*s} ${70*s},${90*s} Q ${90*s},${80*s} ${75*s},${60*s} Q ${100*s},${50*s} ${95*s},${25*s} Q ${80*s},${0*s} ${50*s},${20*s}`
      return new fabric.Path(path)
    },
  },

  // === 相框造型 ===
  {
    id: 'polaroid',
    name: '拍立得',
    category: 'frame',
    create: (size: number) => {
      const s = size / 100
      // 拍立得相框（下方留白較多）
      const path = `M ${5*s},${0*s} L ${95*s},${0*s} L ${95*s},${100*s} L ${5*s},${100*s} Z M ${10*s},${5*s} L ${90*s},${5*s} L ${90*s},${75*s} L ${10*s},${75*s} Z`
      return new fabric.Path(path)
    },
  },
  {
    id: 'stamp',
    name: '郵票',
    category: 'frame',
    create: (size: number) => {
      const s = size / 100
      // 郵票齒孔邊緣
      let path = ''
      const step = 8
      // 上邊
      for (let i = 0; i <= 100; i += step) {
        path += `M ${i*s},${0*s} A ${3*s},${3*s} 0 1,0 ${(i+step/2)*s},${0*s} `
      }
      // 右邊
      for (let i = 0; i <= 100; i += step) {
        path += `M ${100*s},${i*s} A ${3*s},${3*s} 0 1,0 ${100*s},${(i+step/2)*s} `
      }
      // 下邊
      for (let i = 100; i >= 0; i -= step) {
        path += `M ${i*s},${100*s} A ${3*s},${3*s} 0 1,0 ${(i-step/2)*s},${100*s} `
      }
      // 左邊
      for (let i = 100; i >= 0; i -= step) {
        path += `M ${0*s},${i*s} A ${3*s},${3*s} 0 1,0 ${0*s},${(i-step/2)*s} `
      }
      // 內框
      path += `M ${10*s},${10*s} L ${90*s},${10*s} L ${90*s},${90*s} L ${10*s},${90*s} Z`
      return new fabric.Path(path)
    },
  },
  {
    id: 'arch',
    name: '拱門',
    category: 'frame',
    create: (size: number) => {
      const s = size / 100
      const path = `M ${0*s},${100*s} L ${0*s},${40*s} A ${50*s},${40*s} 0 0,1 ${100*s},${40*s} L ${100*s},${100*s} Z`
      return new fabric.Path(path)
    },
  },
]

/**
 * 遮罩分類
 */
export const MASK_CATEGORIES = {
  basic: '基本形狀',
  special: '特殊造型',
  frame: '相框',
} as const
