# 車庫管理系統設計

## 目標
為車行公司建立完整的車輛管理系統，包含：
1. 車輛基本資料管理
2. 定期檢查追蹤（驗車、保養）
3. 駕照到期提醒
4. 文件上傳管理
5. 機器人自動提醒

## 使用者故事

```
車行老闆登入系統：
┌─────────────────────────────────────────────────────────────┐
│ 🚌 車庫管理                                    [+ 新增車輛] │
├─────────────────────────────────────────────────────────────┤
│ 📋 待處理提醒                                               │
│ ⚠️ ABC-1234 驗車將於 3 天後到期（1/15）                     │
│ ⚠️ 王大明 駕照將於 7 天內到期（1/20）                       │
│ ✅ DEF-5678 保養已完成（1/10）                              │
├─────────────────────────────────────────────────────────────┤
│  車牌      │ 車型  │ 司機   │ 驗車到期  │ 保養到期  │ 狀態  │
│ ─────────────────────────────────────────────────────────── │
│  ABC-1234 │ 45人大巴│ 王大明 │ ⚠️ 1/15  │ ✅ 3/20  │ 🟢    │
│  DEF-5678 │ 28人中巴│ 李小華 │ ✅ 6/30  │ ✅ 4/15  │ 🟢    │
│  GHI-9999 │ 45人大巴│ 張三   │ ✅ 8/20  │ ⚠️ 1/25  │ 🔧    │
└─────────────────────────────────────────────────────────────┘

點擊車輛 → 查看詳細資料、上傳文件、更新記錄
```

## 資料庫設計

### 1. 車輛表 `fleet_vehicles`

```sql
CREATE TABLE public.fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- 車輛基本資訊
  license_plate VARCHAR(20) NOT NULL,      -- 車牌號碼
  vehicle_name VARCHAR(50),                 -- 車輛名稱（1號車、A車）
  vehicle_type VARCHAR(20) NOT NULL,        -- 車型：large_bus, medium_bus, mini_bus, van
  brand VARCHAR(50),                        -- 廠牌（HINO、FUSO）
  model VARCHAR(50),                        -- 型號
  year INTEGER,                             -- 出廠年份
  capacity INTEGER NOT NULL DEFAULT 45,     -- 座位數
  vin VARCHAR(50),                          -- 車身號碼

  -- 預設司機
  default_driver_id UUID REFERENCES employees(id),

  -- 重要日期
  registration_date DATE,                   -- 領牌日期
  inspection_due_date DATE,                 -- 驗車到期日
  insurance_due_date DATE,                  -- 保險到期日
  last_maintenance_date DATE,               -- 上次保養日期
  next_maintenance_date DATE,               -- 下次保養日期
  next_maintenance_km INTEGER,              -- 下次保養里程
  current_mileage INTEGER DEFAULT 0,        -- 目前里程數

  -- 文件（JSON 存放多個文件）
  documents JSONB DEFAULT '[]',
  -- 格式：[{ type: 'registration', name: '行照', url: '...', uploaded_at: '...' }]

  -- 狀態
  status VARCHAR(20) DEFAULT 'available',   -- available, in_use, maintenance, retired
  notes TEXT,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id)
);

-- 索引
CREATE INDEX idx_fleet_vehicles_workspace ON fleet_vehicles(workspace_id);
CREATE INDEX idx_fleet_vehicles_plate ON fleet_vehicles(license_plate);
CREATE INDEX idx_fleet_vehicles_inspection ON fleet_vehicles(inspection_due_date);
```

### 2. 司機表 `fleet_drivers`

```sql
CREATE TABLE public.fleet_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- 關聯到員工（如果是公司員工）
  employee_id UUID REFERENCES employees(id),

  -- 司機基本資訊（外包司機用）
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  id_number VARCHAR(20),                    -- 身分證號

  -- 駕照資訊
  license_number VARCHAR(30),               -- 駕照號碼
  license_type VARCHAR(20),                 -- 駕照類型：professional, regular
  license_expiry_date DATE,                 -- 駕照到期日
  license_image_url TEXT,                   -- 駕照照片

  -- 職業駕照（大客車）
  professional_license_number VARCHAR(30),
  professional_license_expiry DATE,
  professional_license_image_url TEXT,

  -- 健康檢查
  health_check_date DATE,                   -- 上次體檢日期
  health_check_expiry DATE,                 -- 體檢到期日
  health_check_document_url TEXT,

  -- 狀態
  status VARCHAR(20) DEFAULT 'active',      -- active, inactive, suspended
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fleet_drivers_workspace ON fleet_drivers(workspace_id);
CREATE INDEX idx_fleet_drivers_license_expiry ON fleet_drivers(license_expiry_date);
```

### 3. 車輛記錄表 `fleet_vehicle_logs`

```sql
CREATE TABLE public.fleet_vehicle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,

  -- 記錄類型
  log_type VARCHAR(30) NOT NULL,
  -- inspection: 驗車
  -- maintenance: 保養
  -- repair: 維修
  -- insurance: 保險
  -- mileage: 里程更新
  -- incident: 事故
  -- fuel: 加油

  -- 記錄內容
  log_date DATE NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2),                      -- 費用
  mileage INTEGER,                          -- 當時里程
  next_due_date DATE,                       -- 下次到期日（驗車、保養用）
  next_due_mileage INTEGER,                 -- 下次里程（保養用）

  -- 文件
  documents JSONB DEFAULT '[]',
  -- 格式：[{ name: '維修單據', url: '...' }]

  -- 追蹤
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),

  notes TEXT
);

CREATE INDEX idx_fleet_logs_vehicle ON fleet_vehicle_logs(vehicle_id);
CREATE INDEX idx_fleet_logs_type ON fleet_vehicle_logs(log_type);
CREATE INDEX idx_fleet_logs_date ON fleet_vehicle_logs(log_date DESC);
```

### 4. 車輛調度表 `fleet_schedules`

```sql
CREATE TABLE public.fleet_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id),
  driver_id UUID REFERENCES fleet_drivers(id),

  -- 調度日期
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 客戶/團資訊
  client_workspace_id UUID REFERENCES workspaces(id),  -- 旅行社 workspace
  client_name VARCHAR(100),
  tour_id UUID,                              -- 關聯旅遊團
  tour_name VARCHAR(200),
  tour_code VARCHAR(50),
  contact_person VARCHAR(50),
  contact_phone VARCHAR(20),

  -- 路線資訊
  pickup_location TEXT,
  destination TEXT,
  route_notes TEXT,

  -- 費用
  rental_fee DECIMAL(10, 2),

  -- 狀態
  status VARCHAR(20) DEFAULT 'confirmed',   -- pending, confirmed, in_progress, completed, cancelled
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 防止同一車輛日期衝突
CREATE INDEX idx_fleet_schedules_vehicle_dates ON fleet_schedules(vehicle_id, start_date, end_date);
```

## UI 設計

### 頁面結構

```
/garage                          -- 車庫管理首頁（儀表板）
/garage/vehicles                 -- 車輛列表
/garage/vehicles/[id]            -- 車輛詳情（Dialog）
/garage/drivers                  -- 司機管理
/garage/schedules                -- 調度日曆
/garage/reports                  -- 報表（里程、費用統計）
```

### 車庫首頁儀表板

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🚌 車庫管理                                         以琳車行        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │  🚌 12      │ │  ⚠️ 3       │ │  🔧 1       │ │  📅 8     │ │
│  │  總車輛數    │ │  待處理提醒  │ │  維修中      │ │  本週派車  │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│                                                                     │
│  📋 待處理事項                                          [查看全部]  │
│  ├─ ⚠️ ABC-1234 驗車到期 (1/15)              [更新驗車]            │
│  ├─ ⚠️ 王大明 駕照到期 (1/20)                [更新駕照]            │
│  └─ ⚠️ DEF-5678 保養到期 (1/25)              [記錄保養]            │
│                                                                     │
│  📅 本週派車                                            [調度日曆]  │
│  ├─ 1/15 ABC-1234 → 清邁五日遊 (角落旅遊)                          │
│  ├─ 1/16 DEF-5678 → 日月潭二日遊 (勁揚旅遊)                        │
│  └─ 1/17 GHI-9999 → 曼谷四日遊 (角落旅遊)                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 車輛詳情 Dialog

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🚌 ABC-1234                                              [編輯] [X] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  基本資訊                                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 車牌：ABC-1234          車型：45人大巴                         │ │
│  │ 廠牌：HINO              型號：RK8JSKA                          │ │
│  │ 出廠：2020年            里程：125,000 km                       │ │
│  │ 預設司機：王大明                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  重要日期                                            [更新] [提醒]  │
│  ├─ 驗車到期：2024/01/15  ⚠️ 即將到期                             │
│  ├─ 保險到期：2024/06/30  ✅                                       │
│  ├─ 下次保養：2024/03/20 或 130,000km  ✅                          │
│  └─ 上次保養：2023/12/10 (120,000km)                               │
│                                                                     │
│  文件管理                                               [上傳文件]  │
│  ├─ 📄 行照.pdf                              [下載] [刪除]         │
│  ├─ 📄 保險單.pdf                            [下載] [刪除]         │
│  └─ 📄 驗車證明.pdf                          [下載] [刪除]         │
│                                                                     │
│  維護記錄                                               [新增記錄]  │
│  ├─ 2023/12/10  保養  更換機油、濾芯  NT$ 8,500                    │
│  ├─ 2023/11/05  維修  更換煞車皮      NT$ 12,000                   │
│  └─ 2023/10/15  驗車  定期驗車        NT$ 450                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 機器人提醒功能

### 提醒類型

```typescript
interface FleetReminder {
  type: 'inspection' | 'maintenance' | 'insurance' | 'license' | 'health_check'
  target: 'vehicle' | 'driver'
  targetId: string
  targetName: string
  dueDate: Date
  daysUntilDue: number
}
```

### 提醒邏輯

```
每日早上 9:00 檢查：
1. 驗車到期：提前 30, 14, 7, 3, 1 天提醒
2. 保險到期：提前 30, 14, 7 天提醒
3. 保養到期：提前 14, 7 天或里程差 1000km 提醒
4. 駕照到期：提前 60, 30, 14, 7 天提醒
5. 體檢到期：提前 30, 14, 7 天提醒
```

### 機器人訊息範例

```
🚌 車輛提醒

⚠️ 以下車輛需要注意：

🔴 驗車到期
• ABC-1234 - 1月15日到期（剩餘 3 天）

🟡 保養提醒
• DEF-5678 - 下次保養 1月25日（剩餘 13 天）

🔵 駕照提醒
• 王大明 - 職業駕照 1月20日到期（剩餘 8 天）

點擊下方按鈕更新記錄：
[更新驗車] [更新保養] [更新駕照]
```

## 檔案結構

```
src/
├── app/(main)/garage/
│   ├── page.tsx                    -- 儀表板
│   ├── vehicles/page.tsx           -- 車輛列表
│   ├── drivers/page.tsx            -- 司機列表
│   └── schedules/page.tsx          -- 調度日曆
│
├── features/garage/
│   ├── components/
│   │   ├── GarageDashboard.tsx     -- 儀表板組件
│   │   ├── VehicleList.tsx         -- 車輛列表
│   │   ├── VehicleDetailDialog.tsx -- 車輛詳情
│   │   ├── VehicleForm.tsx         -- 新增/編輯車輛
│   │   ├── DriverList.tsx          -- 司機列表
│   │   ├── DriverForm.tsx          -- 新增/編輯司機
│   │   ├── MaintenanceLogDialog.tsx-- 維護記錄
│   │   ├── DocumentUpload.tsx      -- 文件上傳
│   │   └── ScheduleCalendar.tsx    -- 調度日曆
│   │
│   ├── hooks/
│   │   ├── useVehicles.ts
│   │   ├── useDrivers.ts
│   │   ├── useVehicleLogs.ts
│   │   └── useFleetSchedules.ts
│   │
│   └── types/
│       └── fleet.types.ts
│
├── stores/
│   └── fleet-store.ts
│
└── app/api/
    ├── fleet/
    │   ├── vehicles/route.ts
    │   ├── drivers/route.ts
    │   ├── logs/route.ts
    │   └── schedules/route.ts
    │
    └── bot/
        └── fleet-reminder/route.ts  -- 機器人提醒 API
```

## 實作步驟

### Phase 1：基礎架構
1. 建立資料庫表格（migration）
2. 建立 TypeScript 類型
3. 建立基礎 Store/Hooks

### Phase 2：車輛管理
1. 車輛列表頁面
2. 新增/編輯車輛
3. 車輛詳情 Dialog
4. 文件上傳功能

### Phase 3：司機管理
1. 司機列表
2. 駕照追蹤
3. 體檢追蹤

### Phase 4：維護記錄
1. 維護記錄列表
2. 新增各類記錄（驗車、保養、維修）
3. 自動更新到期日

### Phase 5：調度功能
1. 調度日曆視圖
2. 新增調度
3. 衝突檢查

### Phase 6：機器人提醒
1. 到期檢查 API
2. 機器人訊息格式
3. Cron Job 設定

## 權限設計

```typescript
// 車行公司專屬功能
const GARAGE_PERMISSIONS = {
  'garage:view': '查看車庫',
  'garage:manage': '管理車輛',
  'garage:schedule': '調度車輛',
  'garage:report': '查看報表',
}

// 只有 vehicle_supplier 類型的 workspace 顯示車庫功能
if (workspace.type === 'vehicle_supplier') {
  showGarageMenu = true
}
```

## 與旅行社的互動

```
旅行社下單流程：
1. 旅行社在「交通安排」選擇車行
2. 車行收到通知
3. 車行在調度日曆安排車輛和司機
4. 確認後旅行社可以看到派車資訊

資料流向：
旅行社 Tour → 選擇車行 → 車行 Schedule → 確認派車
```
