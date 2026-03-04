'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

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

interface AssetMeta {
  placement: string; sizeClass: string; footprint: [number, number]; hasSurface: boolean
  surfaceOffsetY?: number; maxItems?: number; acceptSizes?: string[]; slots?: { x: number; y: number }[]
}

interface PhaserOfficeProps {
  className?: string
  editMode?: boolean
  workspaceId?: string
  userId?: string
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

async function saveRoom(room: RoomData, wid?: string, uid?: string) {
  localStorage.setItem('vo-game-office', JSON.stringify(room))
  if (wid) {
    fetch('/api/game-office', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: wid, room_data: room, user_id: uid }) }).catch(() => {})
  }
}

function getMeta(assetMeta: Record<string, AssetMeta>, name: string): AssetMeta {
  return assetMeta[name] || { placement: 'floor', sizeClass: 'medium', footprint: [1, 1], hasSurface: false }
}

function findSurfaceParent(room: RoomData, assetMeta: Record<string, AssetMeta>, col: number, row: number, excludeId: number) {
  let best: RoomObject | null = null, bestDist = Infinity
  for (const o of room.objects) {
    if (o.id === excludeId) continue
    const m = getMeta(assetMeta, o.asset)
    if (!m.hasSurface) continue
    const dist = Math.sqrt((col - o.col) ** 2 + (row - o.row) ** 2)
    if (dist < 1.5 && dist < bestDist) { bestDist = dist; best = o }
  }
  return best
}

function findBestSlot(room: RoomData, assetMeta: Record<string, AssetMeta>, parent: RoomObject, childAsset: string) {
  const pm = getMeta(assetMeta, parent.asset)
  if (!pm.hasSurface || !pm.slots) return null
  const cm = getMeta(assetMeta, childAsset)
  if (pm.acceptSizes && !pm.acceptSizes.includes(cm.sizeClass)) return null
  const children = room.objects.filter(o => o.parentId === parent.id)
  if (children.length >= (pm.maxItems || 99)) return null
  const usedSlots = new Set(children.map(o => o.slotIndex))
  for (let i = 0; i < pm.slots.length; i++) {
    if (!usedSlots.has(i)) return { index: i, slot: pm.slots[i] }
  }
  return null
}

export default function PhaserOffice({ className, editMode = false, workspaceId, userId, onReady }: PhaserOfficeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<unknown>(null)
  const sceneRef = useRef<unknown>(null)
  const destroyRef = useRef(false)
  const editModeRef = useRef(editMode)
  const [catalog, setCatalog] = useState<AssetCatalogEntry[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState('全部')
  const [searchText, setSearchText] = useState('')

  useEffect(() => { editModeRef.current = editMode }, [editMode])

  const initGame = useCallback(async () => {
    if (destroyRef.current) return
    const Phaser = (await import('phaser')).default
    if (destroyRef.current || !containerRef.current) return

    const [catalogRes, metaRes] = await Promise.all([
      fetch('/game-office/asset-catalog.json'),
      fetch('/game-office/asset-meta.json'),
    ])
    const catalogData: AssetCatalogEntry[] = await catalogRes.json()
    const assetMeta: Record<string, AssetMeta> = await metaRes.json()
    setCatalog(catalogData)
    if (destroyRef.current) return

    let room = defaultRoom()
    if (workspaceId) {
      try {
        const roomRes = await fetch(`/api/game-office?workspace_id=${workspaceId}&user_id=${userId}`)
        const roomJson = await roomRes.json()
        if (roomJson.room) room = roomJson.room
      } catch { /* fallback to localStorage */ }
    }
    if (!workspaceId) {
      const saved = localStorage.getItem('vo-game-office')
      if (saved) { try { room = JSON.parse(saved) } catch { /* default */ } }
    }

    function assetType(name: string): 'floor' | 'wallL' | 'wallB' | 'object' {
      if (name.startsWith('Floor_')) return 'floor'
      if (/_L[_(.)]/.test(name) || name.endsWith('_L')) return 'wallB'
      if (name.startsWith('Wall_')) return 'wallL'
      return 'object'
    }

    class OfficeScene extends Phaser.Scene {
      Z = 1; panX = 0; panY = 0; OX = 0; OY = 0
      selObjId: number | null = null; dragging = false
      constructor() { super({ key: 'OfficeScene' }) }

      preload() {
        catalogData.forEach(a => this.load.image(a.name, `/game-office/assets/${a.file}`))
      }

      create() {
        this.OX = this.cameras.main.width / 2; this.OY = 120
        this.rebuildAll()

        // Auto-save
        this.time.addEvent({ delay: 30000, loop: true, callback: () => {
          saveRoom(room, workspaceId, userId)
        }})

        // Zoom
        this.input.on('wheel', (_p: unknown, _go: unknown[], dx: number, dy: number) => {
          this.Z = Phaser.Math.Clamp(this.Z + (dy > 0 ? -0.1 : 0.1), 0.3, 3)
          this.rebuildAll()
        })

        // Pan + place/select
        let panning = false, psx = 0, psy = 0, pox = 0, poy = 0
        this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
          if (ptr.middleButtonDown() || ptr.rightButtonDown()) {
            panning = true; psx = ptr.x; psy = ptr.y; pox = this.panX; poy = this.panY
            return
          }
          if (!editModeRef.current) return

          const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y)
          const g = this.grd(wp.x, wp.y)
          const s = this.snap(g.col, g.row)

          if (selectedAssetRef.current) {
            // Place object
            const asset = selectedAssetRef.current
            const t = assetType(asset)
            if (t === 'floor') {
              if (s.col >= 0 && s.col < room.cols && s.row >= 0 && s.row < room.rows) {
                room.floor[s.row][s.col] = asset
              }
            } else if (t === 'wallL') {
              const r = Math.round(s.row - 0.5)
              if (r >= 0 && r < room.rows) room.leftWall[r] = asset
            } else if (t === 'wallB') {
              const c = Math.round(s.col - 0.5)
              if (c >= 0 && c < room.cols) room.backWall[c] = asset
            } else {
              const obj: RoomObject = { id: room.nextId++, asset, col: s.col, row: s.row, offX: 0, offY: 0, flip: false }
              const m = getMeta(assetMeta, asset)
              if (m.placement === 'surface') {
                const parent = findSurfaceParent(room, assetMeta, s.col, s.row, -1)
                if (parent) {
                  const slotInfo = findBestSlot(room, assetMeta, parent, asset)
                  if (slotInfo) {
                    const pm = getMeta(assetMeta, parent.asset)
                    obj.parentId = parent.id; obj.slotIndex = slotInfo.index
                    obj.col = parent.col; obj.row = parent.row
                    obj.offX = slotInfo.slot.x; obj.offY = (pm.surfaceOffsetY || -30) + (slotInfo.slot.y || 0)
                  }
                }
              }
              if (m.placement === 'carpet') obj.depthOffset = -0.5
              room.objects.push(obj)
              this.selObjId = obj.id
            }
            saveRoom(room, workspaceId, userId)
            this.rebuildAll()
          } else {
            // Select existing object
            let found: RoomObject | null = null
            let minDist = 0.8
            for (const o of room.objects) {
              const dx = s.col - o.col, dy = s.row - o.row
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < minDist) { minDist = dist; found = o }
            }
            this.selObjId = found ? found.id : null
            if (found) this.dragging = true
            this.rebuildAll()
          }
        })

        this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
          if (panning && ptr.isDown) {
            this.panX = pox + (ptr.x - psx); this.panY = poy + (ptr.y - psy); this.rebuildAll()
          }
          if (this.dragging && this.selObjId !== null && ptr.isDown) {
            const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y)
            const g = this.grd(wp.x, wp.y); const s = this.snap(g.col, g.row)
            const o = room.objects.find(x => x.id === this.selObjId)
            if (o) {
              o.col = s.col; o.row = s.row
              // Move children
              room.objects.filter(x => x.parentId === o.id).forEach(x => { x.col = s.col; x.row = s.row })
              this.rebuildAll()
            }
          }
        })

        this.input.on('pointerup', () => {
          panning = false
          if (this.dragging) {
            this.dragging = false
            saveRoom(room, workspaceId, userId)
          }
        })

        this.input.mouse?.disableContextMenu()

        // Keyboard shortcuts
        this.input.keyboard?.on('keydown-DELETE', () => {
          if (!editModeRef.current || this.selObjId === null) return
          const kids = room.objects.filter(o => o.parentId === this.selObjId)
          const delIds = new Set([this.selObjId, ...kids.map(k => k.id)])
          room.objects = room.objects.filter(o => !delIds.has(o.id))
          this.selObjId = null
          saveRoom(room, workspaceId, userId)
          this.rebuildAll()
        })

        this.input.keyboard?.on('keydown-F', () => {
          if (!editModeRef.current || this.selObjId === null) return
          const o = room.objects.find(x => x.id === this.selObjId)
          if (o) { o.flip = !o.flip; this.rebuildAll() }
        })

        if (onReady) onReady()
        sceneRef.current = this
      }

      grd(sx: number, sy: number) {
        const rx = sx - this.OX - this.panX, ry = sy - this.OY - this.panY
        return { col: (rx / (32 * this.Z) + ry / (16 * this.Z)) / 2, row: (ry / (16 * this.Z) - rx / (32 * this.Z)) / 2 }
      }

      snap(c: number, r: number) {
        return { col: Math.round(c * 2) / 2, row: Math.round(r * 2) / 2 }
      }

      scr(c: number, r: number) {
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
        // Floors
        for (let r = 0; r < room.rows; r++) {
          for (let c = 0; c < room.cols; c++) {
            const tile = room.floor[r]?.[c]
            if (!tile) continue
            const p = this.scr(c + 0.5, r + 0.5)
            try { this.add.image(p.x, p.y, tile).setOrigin(ANCHORS.floor.x / 64, ANCHORS.floor.y / 64).setScale(this.Z).setDepth(1) } catch {}
          }
        }
        // Left walls
        room.leftWall.forEach((tile, r) => {
          if (!tile) return
          const p = this.scr(0, r + 0.5)
          try { this.add.image(p.x, p.y, tile).setOrigin(ANCHORS.wallL.x / 64, ANCHORS.wallL.y / 64).setScale(this.Z).setDepth(2 + r * 0.01) } catch {}
        })
        // Back walls
        room.backWall.forEach((tile, c) => {
          if (!tile) return
          const p = this.scr(c + 0.5, 0)
          try { this.add.image(p.x, p.y, tile).setOrigin(ANCHORS.wallB.x / 64, ANCHORS.wallB.y / 64).setScale(this.Z).setDepth(2 + c * 0.01) } catch {}
        })
        // Objects
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
            // Selection highlight
            if (editModeRef.current && o.id === this.selObjId) {
              const sg = this.add.graphics().setDepth(999)
              sg.lineStyle(2, 0x4ecca3, 0.8)
              const cx = p.x + (o.offX || 0) * this.Z, cy = p.y + (o.offY || 0) * this.Z
              sg.strokeRect(cx - 20 * this.Z, cy - 20 * this.Z, 40 * this.Z, 40 * this.Z)
            }
          } catch {}
        })
      }
    }

    // Ref for selected asset from React
    const selectedAssetRef = { current: null as string | null }
    ;((window as unknown) as Record<string, unknown>).__gameSelectedAsset = selectedAssetRef

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

  // Sync selectedAsset to Phaser ref
  useEffect(() => {
    const ref = ((window as unknown) as Record<string, unknown>).__gameSelectedAsset as { current: string | null } | undefined
    if (ref) ref.current = selectedAsset
  }, [selectedAsset])

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

  // Get unique categories
  const categories = ['全部', ...Array.from(new Set(catalog.map(a => a.cat))).sort()]
  const filteredAssets = catalog.filter(a => {
    // Search filter
    if (searchText && !a.label.toLowerCase().includes(searchText.toLowerCase()) && !a.name.toLowerCase().includes(searchText.toLowerCase())) return false
    // Only 64px tiles
    if (a.name.startsWith('Floor_') && !a.name.includes('(64)')) return false
    if (a.name.startsWith('Wall_') && !a.name.includes('(64)')) return false
    // Category filter
    if (filterCat === '全部') return true
    if (filterCat === 'floor') return a.name.startsWith('Floor_')
    if (filterCat === 'wallL') return a.name.startsWith('Wall_') && !a.name.endsWith('_L')
    if (filterCat === 'wallB') return a.name.startsWith('Wall_') && a.name.endsWith('_L')
    if (filterCat === 'object') return !a.name.startsWith('Floor_') && !a.name.startsWith('Wall_')
    // Sub-category (emoji prefix)
    return a.cat === filterCat
  })

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Edit mode asset palette */}
      {editMode && (
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#0f0f1a]/95 border-l border-gray-800 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <div className="text-xs font-bold text-emerald-400 mb-2">🎨 素材庫</div>
            <input
              type="text"
              placeholder="搜尋..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white"
            />
          </div>
          {/* Quick filter tabs */}
          <div className="flex gap-1 p-2 border-b border-gray-800">
            {[
              { id: '全部', label: '全部' },
              { id: 'floor', label: '🏠地板' },
              { id: 'wallL', label: '🧱左牆' },
              { id: 'wallB', label: '🧱後牆' },
              { id: 'object', label: '🪑物件' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterCat(t.id)}
                className={`text-[10px] px-2 py-1 rounded font-bold ${filterCat === t.id ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Sub-categories for objects */}
          {filterCat === 'object' && (
            <div className="flex flex-wrap gap-1 px-2 pb-2 border-b border-gray-800">
              {categories.filter(c => c !== '全部' && c !== '🏠 地板/牆壁').map(c => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${filterCat === c ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  {c.slice(0, 4)}
                </button>
              ))}
            </div>
          )}
          {/* Asset list */}
          <div className="flex-1 overflow-y-auto p-1">
            {/* Deselect button */}
            {selectedAsset && (
              <button
                onClick={() => setSelectedAsset(null)}
                className="w-full text-xs text-center py-1 mb-1 bg-red-900/30 text-red-400 rounded"
              >
                ✕ 取消選取 (選取模式)
              </button>
            )}
            {filteredAssets.map(a => (
              <button
                key={a.name}
                onClick={() => setSelectedAsset(selectedAsset === a.name ? null : a.name)}
                className={`flex items-center gap-2 w-full p-1 rounded text-left text-xs transition-colors ${
                  selectedAsset === a.name ? 'bg-emerald-600/20 text-emerald-400' : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <img
                  src={`/game-office/assets/${a.file}`}
                  alt={a.label}
                  className="w-8 h-8 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div>
                  <div className="truncate" style={{ maxWidth: '150px' }}>{a.label}</div>
                  <div className="text-[10px] text-gray-600">{a.w}×{a.h}</div>
                </div>
              </button>
            ))}
          </div>
          {/* Help */}
          <div className="p-2 border-t border-gray-800 text-[10px] text-gray-600">
            點擊素材 → 點擊場景放置<br />
            Del 刪除 | F 翻轉 | 滾輪縮放
          </div>
        </div>
      )}
    </div>
  )
}
