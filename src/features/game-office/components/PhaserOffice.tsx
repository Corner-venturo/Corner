'use client'

import { useEffect, useRef, useCallback } from 'react'

const TW = 64, TH = 32
const ANCHORS = { floor: { x: 32, y: 16 }, wallL: { x: 15, y: 62 }, wallB: { x: 47, y: 62 } }

interface RoomObject {
  id: number; asset: string; col: number; row: number
  offX: number; offY: number; flip: boolean
  parentId?: number; slotIndex?: number; depthOffset?: number
}

interface RoomData {
  v: number; cols: number; rows: number
  floor: (string | null)[][]; leftWall: (string | null)[]; backWall: (string | null)[]
  objects: RoomObject[]; nextId: number
}

interface AssetCatalogEntry {
  name: string; file: string; label: string; cat: string; sub: string; w: number; h: number
}

interface PhaserOfficeProps {
  className?: string
  onReady?: () => void
}

function defaultRoom(): RoomData {
  const cols = 8, rows = 8
  const floor: (string | null)[][] = []
  for (let r = 0; r < rows; r++) {
    floor[r] = []
    for (let c = 0; c < cols; c++) {
      floor[r][c] = (r + c) % 2 === 0 ? 'Floor_3_Tile(64)' : 'Floor_5_Tile(64)'
    }
  }
  const leftWall: (string | null)[] = []
  const backWall: (string | null)[] = []
  for (let i = 0; i < Math.max(cols, rows); i++) {
    if (i < rows) leftWall[i] = i % 2 === 0 ? 'Wall_3_Tile(64)' : 'Wall_5_Tile(64)'
    if (i < cols) backWall[i] = i % 2 === 0 ? 'Wall_5_Tile(64)_L' : 'Wall_3_Tile(64)_L'
  }
  return { v: 2, cols, rows, floor, leftWall, backWall, objects: [], nextId: 1 }
}

export default function PhaserOffice({ className, onReady }: PhaserOfficeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<unknown>(null)
  const destroyRef = useRef(false)

  const initGame = useCallback(async () => {
    if (destroyRef.current) return
    const Phaser = (await import('phaser')).default
    if (destroyRef.current || !containerRef.current) return

    const [catalogRes, metaRes] = await Promise.all([
      fetch('/game-office/asset-catalog.json'),
      fetch('/game-office/asset-meta.json'),
    ])
    const catalog: AssetCatalogEntry[] = await catalogRes.json()
    if (destroyRef.current) return

    let room = defaultRoom()
    const saved = localStorage.getItem('vo-game-office')
    if (saved) { try { room = JSON.parse(saved) } catch { /* default */ } }

    class OfficeScene extends Phaser.Scene {
      private Z = 1; private panX = 0; private panY = 0; private OX = 0; private OY = 0
      constructor() { super({ key: 'OfficeScene' }) }

      preload() {
        catalog.forEach(a => this.load.image(a.name, `/game-office/assets/${a.file}`))
      }

      create() {
        this.OX = this.cameras.main.width / 2; this.OY = 120
        this.rebuildAll()
        this.time.addEvent({ delay: 30000, loop: true, callback: () => {
          localStorage.setItem('vo-game-office', JSON.stringify(room))
        }})
        this.input.on('wheel', (_p: unknown, _gx: unknown, _gy: unknown, _gz: unknown, e: WheelEvent) => {
          this.Z = Phaser.Math.Clamp(this.Z + (e.deltaY > 0 ? -0.1 : 0.1), 0.3, 3)
          this.rebuildAll()
        })
        let panning = false, psx = 0, psy = 0, pox = 0, poy = 0
        this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
          if (ptr.middleButtonDown() || ptr.rightButtonDown()) {
            panning = true; psx = ptr.x; psy = ptr.y; pox = this.panX; poy = this.panY
          }
        })
        this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
          if (panning && ptr.isDown) {
            this.panX = pox + (ptr.x - psx); this.panY = poy + (ptr.y - psy); this.rebuildAll()
          }
        })
        this.input.on('pointerup', () => { panning = false })
        this.input.mouse?.disableContextMenu()
        if (onReady) onReady()
      }

      private scr(c: number, r: number) {
        return {
          x: this.OX + (c - r) * 32 * this.Z + this.panX,
          y: this.OY + (c + r) * 16 * this.Z + this.panY,
        }
      }

      rebuildAll() {
        this.children.removeAll(true)
        const gfx = this.add.graphics().setDepth(0)
        gfx.lineStyle(1, 0xffffff, 0.08)
        for (let r = 0; r <= room.rows; r++) {
          const a = this.scr(0, r), b = this.scr(room.cols, r)
          gfx.lineBetween(a.x, a.y, b.x, b.y)
        }
        for (let c = 0; c <= room.cols; c++) {
          const a = this.scr(c, 0), b = this.scr(c, room.rows)
          gfx.lineBetween(a.x, a.y, b.x, b.y)
        }
        for (let r = 0; r < room.rows; r++) {
          for (let c = 0; c < room.cols; c++) {
            const tile = room.floor[r]?.[c]
            if (!tile) continue
            const p = this.scr(c + 0.5, r + 0.5)
            try {
              this.add.image(p.x, p.y, tile)
                .setOrigin(ANCHORS.floor.x / 64, ANCHORS.floor.y / 64)
                .setScale(this.Z).setDepth(1)
            } catch { /* skip */ }
          }
        }
        room.leftWall.forEach((tile, r) => {
          if (!tile) return
          const p = this.scr(0, r + 0.5)
          try {
            this.add.image(p.x, p.y, tile)
              .setOrigin(ANCHORS.wallL.x / 64, ANCHORS.wallL.y / 64)
              .setScale(this.Z).setDepth(2 + r * 0.01)
          } catch { /* skip */ }
        })
        room.backWall.forEach((tile, c) => {
          if (!tile) return
          const p = this.scr(c + 0.5, 0)
          try {
            this.add.image(p.x, p.y, tile)
              .setOrigin(ANCHORS.wallB.x / 64, ANCHORS.wallB.y / 64)
              .setScale(this.Z).setDepth(2 + c * 0.01)
          } catch { /* skip */ }
        })
        const sorted = [...room.objects].sort((a, b) => {
          const da = a.col + a.row + (a.depthOffset || 0) + (a.parentId ? 0.1 : 0)
          const db = b.col + b.row + (b.depthOffset || 0) + (b.parentId ? 0.1 : 0)
          return da - db
        })
        sorted.forEach(o => {
          try {
            const p = this.scr(o.col, o.row)
            const spr = this.add.image(p.x + (o.offX || 0) * this.Z, p.y + (o.offY || 0) * this.Z, o.asset)
            spr.setDepth(10 + o.col + o.row + (o.depthOffset || 0) + (o.parentId ? 0.1 : 0))
              .setScale(this.Z).setOrigin(0.5)
            if (o.flip) spr.setFlipX(true)
          } catch { /* skip */ }
        })
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#1a1a2e',
      scene: OfficeScene,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      input: { mouse: { preventDefaultWheel: true } },
      render: { pixelArt: true, antialias: false },
    })
    gameRef.current = game
  }, [onReady])

  useEffect(() => {
    destroyRef.current = false
    initGame()
    return () => {
      destroyRef.current = true
      if (gameRef.current) {
        (gameRef.current as { destroy: (b: boolean) => void }).destroy(true)
        gameRef.current = null
      }
    }
  }, [initGame])

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />
}
