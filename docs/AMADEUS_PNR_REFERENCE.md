# Amadeus PNR 完整參考手冊

> **建立日期**: 2025-12-27
> **用途**: ERP 首頁 PNR 小工具開發參考
> **目標**: 離線解析 PNR，提取開票期限、航班資訊等關鍵資料

---

## 目錄

1. [PNR 概述](#1-pnr-概述)
2. [PNR 結構元素](#2-pnr-結構元素)
3. [航班段格式](#3-航班段格式)
4. [姓名元素格式](#4-姓名元素格式)
5. [票務時限 (TK/TKTL)](#5-票務時限-tktktl)
6. [狀態碼對照表](#6-狀態碼對照表)
7. [艙等代碼](#7-艙等代碼)
8. [SSR 特殊服務代碼](#8-ssr-特殊服務代碼)
9. [常用 Cryptic 指令](#9-常用-cryptic-指令)
10. [開源解析工具](#10-開源解析工具)
11. [離線實作方案](#11-離線實作方案)
12. [資料庫設計建議](#12-資料庫設計建議)

---

## 1. PNR 概述

### 什麼是 PNR？
PNR (Passenger Name Record) 是航空訂位系統中儲存旅客預訂資訊的記錄。Amadeus 是全球市佔率最高的 GDS (Global Distribution System)。

### PNR 的組成
一個完整的 PNR 包含：
- **Header Line** - PNR 識別資訊（RP + Office ID）
- **Name Elements** - 旅客姓名
- **Itinerary Segments** - 航班行程
- **Contact Elements (AP)** - 聯絡資訊
- **Ticketing Arrangement (TK)** - 票務安排
- **Remarks (RM/RC)** - 備註
- **SSR/OSI** - 特殊服務請求
- **Fare Elements** - 票價資訊

### PNR 範例
```
RP/TPETPE1234/TPETPE1234            AA/SU  25DEC24/1200Z   ABC123
  1.CHEN/WILLIAMCHIEN MR
  2  CI 100 Y 28DEC 6 TPETYO HK1  0800 1200  *1A/E*
  3  CI 101 Y 02JAN 4 TYOTPE HK1  1400 1700  *1A/E*
  4 AP TPE 02-12345678
  5 TK TL25DEC/TPETPE1234
  6 SSR VGML CI HK1/P1
  7 RM BOOKING REF ABC123
```

---

## 2. PNR 結構元素

### Header Line 格式
```
RP/OFFICE_ID/OFFICE_ID            AGENT/DATE   RECORD_LOCATOR
```

| 欄位 | 說明 | 範例 |
|------|------|------|
| RP | Responsible Party 標識 | RP |
| OFFICE_ID | 辦公室代碼（IATA 格式） | TPETPE1234 |
| AGENT | 代理人代碼 | AA |
| DATE | 建立日期 | 25DEC24 |
| RECORD_LOCATOR | PNR 代碼（6碼） | ABC123 |

### 元素類型

| 類型 | 說明 | 指令前綴 |
|------|------|----------|
| Name | 旅客姓名 | NM |
| Itinerary | 航班行程 | SS/SO |
| Contact | 聯絡方式 | AP |
| Ticketing | 票務安排 | TK |
| SSR | 特殊服務請求 | SR |
| OSI | 其他服務資訊 | OS |
| Remark | 一般備註 | RM |
| Confidential Remark | 機密備註 | RC |
| Fare | 票價資訊 | FP/FM/FO |

---

## 3. 航班段格式

### 標準格式
```
AIRLINE FLIGHT CLASS DATE DAY CITYPAIR STATUS TIME1 TIME2 EQUIPMENT
```

### 範例解析
```
CI 100 Y 28DEC 6 TPETYO HK1 0800 1200 *1A/E*
│   │   │   │   │   │    │   │    │    └─ 電子機票標識
│   │   │   │   │   │    │   │    └───── 抵達時間 (本地)
│   │   │   │   │   │    │   └───────── 出發時間 (本地)
│   │   │   │   │   │    └───────────── 狀態碼 + 人數
│   │   │   │   │   └────────────────── 城市對 (出發+抵達)
│   │   │   │   └────────────────────── 星期幾 (1=週一...7=週日)
│   │   │   └────────────────────────── 日期
│   │   └────────────────────────────── 艙等代碼
│   └────────────────────────────────── 航班號
└────────────────────────────────────── 航空公司代碼
```

### 時間格式
| 格式 | 範例 | 說明 |
|------|------|------|
| 24小時制 | 1430 | 14:30 |
| 12小時制 | 230P | 14:30 (P=PM) |
| 午夜 | 0000 或 2400 | 00:00 |
| 次日抵達 | +1 | 隔天抵達 |

### 城市對格式
城市對由 6 個字母組成：前 3 碼為出發城市，後 3 碼為抵達城市

| 城市對 | 說明 |
|--------|------|
| TPETYO | 台北→東京 |
| TPEHKG | 台北→香港 |
| SINHND | 新加坡→東京羽田 |

---

## 4. 姓名元素格式

### 基本格式
```
NM{人數}{姓}/{名} {稱謂}
```

### 範例

| 指令 | 說明 |
|------|------|
| `NM1CHEN/WILLIAM MR` | 1 位成人男性 |
| `NM1LEE/MARY MRS` | 1 位成人女性 |
| `NM2WANG/JOHN MR/JANE MRS` | 同姓的夫妻 |

### 稱謂對照
| 稱謂 | 說明 |
|------|------|
| MR | 先生 (成人男性) |
| MRS | 太太 (已婚女性) |
| MS | 女士 (女性) |
| MSTR | 小少爺 (男童) |
| MISS | 小姐 (女童) |

### 嬰兒與兒童

| 類型 | 格式 | 範例 |
|------|------|------|
| 嬰兒不佔位 | `NM1姓/名(INF/嬰兒名/生日)` | `NM1CHEN/WILLIAM MR(INF/BABY/15JAN24)` |
| 嬰兒佔位 | `NM1姓/名(INS)` | `NM1CHEN/BABY(INS)` |
| 兒童 | `NM1姓/名(CHD/生日)` | `NM1CHEN/CHILD(CHD/10MAR18)` |

---

## 5. 票務時限 (TK/TKTL)

### TK 元素類型

| 代碼 | 全稱 | 說明 |
|------|------|------|
| **TKOK** | Ticketing OK | 已開票或無開票期限 |
| **TKTL** | Ticketing Time Limit | 開票期限 |
| **TKXL** | Ticketing Cancel | 過期自動取消 |
| **TKNE** | Ticketing Entered | 票號已輸入 |

### TKTL 格式
```
TKTL{日期}/{時間}/{辦公室}
```

### 範例
```
TK TL25DEC/1200/TPETPE1234
   │  │      │      └───── 負責辦公室
   │  │      └──────────── 時間 (可選)
   │  └─────────────────── 日期
   └────────────────────── Time Limit
```

### ATL (Automated Ticketing Limits)
航空公司會自動設定開票期限：
- 若未在期限內開票，PNR 會自動取消
- 取消時 PNR 會被移到 Queue 8 (開票隊列)
- 取消時間為辦公室當地時間的午夜

### ADTK (Airline Deadline for Ticketing)
- 航空公司的開票截止日
- 透過 SSR ADTK 訊息傳送
- 從 PNR 建立日開始計算

---

## 6. 狀態碼對照表

### 確認狀態

| 代碼 | 說明 | 英文 |
|------|------|------|
| **HK** | 已確認 | Hold Confirmed |
| **KK** | 確認中 | Confirming |
| **TK** | 確認，新時間 | Confirming with new times |
| **RR** | 已重確認 | Reconfirmed |

### 候補狀態

| 代碼 | 說明 | 英文 |
|------|------|------|
| **HL** | 候補中 | Have Listed (waitlist) |
| **HN** | 需求中 | Holding Need |
| **KL** | 從候補確認 | Confirming from waitlist |
| **UU** | 無法確認，已候補 | Unable, waitlisted |

### 取消/無效狀態

| 代碼 | 說明 | 英文 |
|------|------|------|
| **HX** | 已取消 | Holding Cancelled |
| **NO** | 無動作 | No Action Taken |
| **UC** | 無法確認或候補 | Unable to Confirm |
| **UN** | 航班不運行 | Unable, flight not operating |
| **XX** | 已取消段 | Cancelled segment |

### Ghost 段落

| 代碼 | 說明 |
|------|------|
| **GK** | Ghost 確認 |
| **GL** | Ghost 候補 |
| **GN** | Ghost 需求 |

---

## 7. 艙等代碼

### IATA 標準艙等

| 代碼 | 艙等 | 說明 |
|------|------|------|
| **F** | First Class | 頭等艙全票 |
| **A** | First Class | 頭等艙折扣 |
| **P** | First Class | 頭等艙優惠 |
| **C** | Business Class | 商務艙全票 |
| **J** | Business Class | 商務艙優惠 |
| **D** | Business Class | 商務艙折扣 |
| **Y** | Economy Class | 經濟艙全票 |
| **B** | Economy Class | 經濟艙折扣 |
| **M** | Economy Class | 經濟艙特價 |
| **H** | Economy Class | 經濟艙優惠 |
| **K** | Economy Class | 經濟艙折扣 |
| **L** | Economy Class | 經濟艙低價 |
| **Q** | Economy Class | 經濟艙低價 |
| **T** | Economy Class | 經濟艙促銷 |
| **V** | Economy Class | 經濟艙促銷 |
| **W** | Premium Economy | 豪華經濟艙 |

> **注意**: 各航空公司可能有不同定義，以上為通用標準

---

## 8. SSR 特殊服務代碼

### 餐食代碼

| 代碼 | 說明 | 英文 |
|------|------|------|
| **AVML** | 亞洲素食 | Asian Vegetarian Meal |
| **BBML** | 嬰兒餐 | Baby Meal |
| **BLML** | 清淡餐 | Bland Meal |
| **CHML** | 兒童餐 | Child Meal |
| **DBML** | 糖尿病餐 | Diabetic Meal |
| **FPML** | 水果餐 | Fruit Platter Meal |
| **GFML** | 無麩質餐 | Gluten-Free Meal |
| **HNML** | 印度非素食 | Hindu Non-Vegetarian |
| **KSML** | 猶太餐 | Kosher Meal |
| **LCML** | 低卡餐 | Low Calorie Meal |
| **LFML** | 低脂餐 | Low Fat Meal |
| **LSML** | 低鈉餐 | Low Salt Meal |
| **MOML** | 穆斯林餐 | Muslim Meal |
| **NLML** | 無乳糖餐 | No Lactose Meal |
| **SPML** | 特別餐 | Special Meal |
| **VGML** | 素食餐 | Vegetarian Meal |
| **VJML** | 耆那教素食 | Vegetarian Jain |
| **VLML** | 蛋奶素 | Vegetarian Lacto-Ovo |

### 輪椅服務

| 代碼 | 說明 |
|------|------|
| **WCHR** | 可走路，需長距離協助 |
| **WCHS** | 無法上下樓梯，可走到座位 |
| **WCHC** | 完全無法行走，需全程協助 |
| **WCBD** | 乾電池輪椅 |
| **WCBW** | 濕電池輪椅 |
| **WCLB** | 鋰電池輪椅 |

### 其他服務

| 代碼 | 說明 |
|------|------|
| **BLND** | 視障旅客 |
| **DEAF** | 聽障旅客 |
| **DPNA** | 智能障礙旅客 |
| **MAAS** | 接機協助 |
| **MEDA** | 醫療協助 |
| **PETC** | 客艙寵物 |
| **AVIH** | 貨艙寵物 |
| **UMNR** | 無人陪伴兒童 |
| **EXST** | 額外座位 |

---

## 9. 常用 Cryptic 指令

### PNR 操作

| 指令 | 說明 |
|------|------|
| `RT{PNR}` | 提取 PNR |
| `RT/ABC123` | 以代碼提取 |
| `*R` | 重新顯示 PNR |
| `*A` | 顯示全部 PNR |
| `*I` | 顯示行程 |
| `*N` | 顯示姓名 |
| `*P` | 顯示聯絡 |
| `*T` | 顯示票務 |
| `RTG` | 顯示 SSR/OSI |
| `RTR` | 顯示備註 |
| `RH` | 顯示歷史 |

### 可用性查詢

| 指令 | 說明 |
|------|------|
| `AN25DECTPETYO` | 查 12/25 台北到東京 |
| `AN25DECTPETYO/ACI` | 指定華航 |
| `ANCY` | 指定經濟艙 |
| `ANCC` | 指定商務艙 |

### 姓名輸入

| 指令 | 說明 |
|------|------|
| `NM1CHEN/WILLIAM MR` | 1 位成人 |
| `NM2CHEN/WILLIAM MR/MARY MRS` | 2 位同姓 |

### 票務

| 指令 | 說明 |
|------|------|
| `TKOK` | 已開票/無期限 |
| `TKTL25DEC` | 設定開票期限 |
| `TTP` | 開票 |
| `TTP/T1` | 開票 TST 1 |

### 票價

| 指令 | 說明 |
|------|------|
| `FXP` | 計價 |
| `FXA` | 最低價 |
| `TQT` | 顯示 TST |
| `TQT/T1` | 顯示 TST 1 |

---

## 10. 開源解析工具

### JavaScript/TypeScript

#### open-pnr
- **GitHub**: https://github.com/acadea/open-pnr
- **安裝**: `npm i open-pnr`
- **功能**: 將 Amadeus PNR 轉換為 JSON
- **授權**: MIT

```javascript
import { pnrParser } from 'open-pnr';

const pnrText = `
RP/TPETPE1234/
  1.CHEN/WILLIAM MR
  2  CI 100 Y 28DEC TPETYO HK1  0800 1200
  3 TK TL25DEC/1200
`;

const parsed = pnrParser(pnrText);
console.log(parsed);
```

#### Amadeus-PNR (中文)
- **GitHub**: https://github.com/xiongdashan/Amadeus-PNR
- **功能**: Amadeus PNR 文本解析

### 第三方 API 服務

| 服務 | 網址 | 說明 |
|------|------|------|
| EasyPNR | https://www.easypnr.com | 解碼器，支援多 GDS |
| PNR Expert | https://www.pnrexpert.com | 轉換 API |
| PNR Decoder | https://www.pnrdecoder.com | 在線解碼 |

---

## 11. 離線實作方案

### 方案一：使用開源 Parser

```typescript
// 安裝 open-pnr
// npm i open-pnr

import { pnrParser } from 'open-pnr';

// 解析 PNR
const result = pnrParser(rawPnrText);

// 提取開票期限
const ticketingLimit = result.ticketing?.timeLimit;
const deadline = result.ticketing?.deadline;
```

### 方案二：自建 Parser

基於 Regex 的解析器：

```typescript
// PNR Parser 核心結構
interface ParsedPNR {
  recordLocator: string;
  passengers: Passenger[];
  segments: FlightSegment[];
  ticketing: TicketingInfo;
  contacts: Contact[];
  ssrElements: SSRElement[];
  remarks: string[];
}

interface FlightSegment {
  segmentNumber: number;
  airline: string;
  flightNumber: string;
  bookingClass: string;
  departureDate: string;
  dayOfWeek: number;
  origin: string;
  destination: string;
  status: string;
  quantity: number;
  departureTime: string;
  arrivalTime: string;
}

interface TicketingInfo {
  type: 'TKOK' | 'TKTL' | 'TKXL' | 'TKNE';
  deadline?: Date;
  office?: string;
}

// 解析航班段的 Regex
const SEGMENT_REGEX = /(\d+)\s+([A-Z]{2})\s*(\d{1,4})\s+([A-Z])\s+(\d{2}[A-Z]{3})\s+(\d)\s+([A-Z]{6})\s+(HK|HL|HN|UC|UN|GK)(\d)\s+(\d{4})\s+(\d{4})/;

// 解析票務期限的 Regex
const TKTL_REGEX = /TK\s+(TL|OK|XL|NE)(\d{2}[A-Z]{3})?\/?(\d{4})?\/?([A-Z0-9]+)?/;
```

### 方案三：半自動輸入

建立表單讓用戶手動輸入關鍵資訊：
- PNR 代碼
- 開票期限
- 航班資訊
- 旅客姓名

---

## 12. 資料庫設計建議

### 核心表格

```sql
-- PNR 記錄主表
CREATE TABLE pnr_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_locator varchar(6) NOT NULL,           -- PNR 代碼
  raw_content text,                              -- 原始 PNR 內容
  office_id varchar(20),                         -- 負責辦公室
  created_date date,                             -- PNR 建立日期
  ticketing_status varchar(10),                  -- TKOK/TKTL/TKXL
  ticketing_deadline timestamptz,                -- 開票期限
  is_ticketed boolean DEFAULT false,             -- 是否已開票
  tour_id uuid REFERENCES tours(id),             -- 關聯團號
  workspace_id uuid REFERENCES workspaces(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PNR 旅客
CREATE TABLE pnr_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnr_id uuid REFERENCES pnr_records(id) ON DELETE CASCADE,
  sequence_number integer,                        -- 旅客序號
  surname varchar(100) NOT NULL,                  -- 姓
  given_name varchar(100),                        -- 名
  title varchar(10),                              -- MR/MRS/MS
  passenger_type varchar(10) DEFAULT 'ADT',       -- ADT/CHD/INF
  date_of_birth date,
  customer_id uuid REFERENCES customers(id),      -- 關聯客戶
  created_at timestamptz DEFAULT now()
);

-- PNR 航班段
CREATE TABLE pnr_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnr_id uuid REFERENCES pnr_records(id) ON DELETE CASCADE,
  segment_number integer,
  airline_code varchar(3) NOT NULL,               -- 航空公司代碼
  flight_number varchar(6) NOT NULL,              -- 航班號
  booking_class varchar(2),                       -- 艙等
  departure_date date NOT NULL,
  day_of_week integer,                            -- 1-7
  origin varchar(3) NOT NULL,                     -- 出發機場
  destination varchar(3) NOT NULL,                -- 抵達機場
  status_code varchar(3),                         -- HK/HL/UC 等
  quantity integer DEFAULT 1,
  departure_time time,
  arrival_time time,
  arrival_day_offset integer DEFAULT 0,           -- +1 = 隔日抵達
  equipment varchar(10),                          -- 機型
  created_at timestamptz DEFAULT now()
);

-- PNR SSR 特殊服務
CREATE TABLE pnr_ssr_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnr_id uuid REFERENCES pnr_records(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES pnr_passengers(id),
  segment_id uuid REFERENCES pnr_segments(id),
  ssr_code varchar(4) NOT NULL,                   -- VGML/WCHR 等
  airline_code varchar(3),
  status varchar(3),                              -- HK/NN 等
  free_text text,
  created_at timestamptz DEFAULT now()
);

-- PNR 備註
CREATE TABLE pnr_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnr_id uuid REFERENCES pnr_records(id) ON DELETE CASCADE,
  remark_type varchar(10),                        -- RM/RC/RI
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### 參考資料表

```sql
-- 航空公司代碼
CREATE TABLE ref_airlines (
  iata_code varchar(3) PRIMARY KEY,              -- CI, BR, CX 等
  icao_code varchar(4),                           -- CAL, EVA 等
  name_en varchar(100),
  name_zh varchar(100),
  country varchar(50),
  alliance varchar(20),                           -- Star/OneWorld/SkyTeam
  is_active boolean DEFAULT true
);

-- 機場代碼
CREATE TABLE ref_airports (
  iata_code varchar(3) PRIMARY KEY,              -- TPE, NRT 等
  icao_code varchar(4),                           -- RCTP 等
  name_en varchar(200),
  name_zh varchar(200),
  city_code varchar(3),                           -- 城市代碼
  city_name_en varchar(100),
  city_name_zh varchar(100),
  country_code varchar(2),
  timezone varchar(50),                           -- Asia/Taipei
  latitude decimal(10, 6),
  longitude decimal(10, 6)
);

-- 艙等代碼
CREATE TABLE ref_booking_classes (
  code varchar(2) PRIMARY KEY,
  cabin_type varchar(20),                         -- First/Business/Economy
  description varchar(100),
  priority integer                                -- 排序用
);

-- SSR 代碼
CREATE TABLE ref_ssr_codes (
  code varchar(4) PRIMARY KEY,
  category varchar(20),                           -- Meal/Wheelchair/Other
  description_en varchar(200),
  description_zh varchar(200)
);

-- 狀態碼
CREATE TABLE ref_status_codes (
  code varchar(3) PRIMARY KEY,
  category varchar(20),                           -- Confirmed/Waitlist/Cancelled
  description_en varchar(200),
  description_zh varchar(200)
);
```

### 初始資料

```sql
-- 常用航空公司（台灣相關）
INSERT INTO ref_airlines (iata_code, icao_code, name_en, name_zh, country, alliance) VALUES
('CI', 'CAL', 'China Airlines', '中華航空', 'Taiwan', 'SkyTeam'),
('BR', 'EVA', 'EVA Air', '長榮航空', 'Taiwan', 'Star Alliance'),
('AE', 'MDA', 'Mandarin Airlines', '華信航空', 'Taiwan', NULL),
('B7', 'UIA', 'UNI Air', '立榮航空', 'Taiwan', NULL),
('IT', 'TTW', 'Tigerair Taiwan', '台灣虎航', 'Taiwan', NULL),
('JX', 'SIA', 'Starlux Airlines', '星宇航空', 'Taiwan', NULL),
('CX', 'CPA', 'Cathay Pacific', '國泰航空', 'Hong Kong', 'OneWorld'),
('KA', 'HDA', 'Cathay Dragon', '國泰港龍', 'Hong Kong', 'OneWorld'),
('SQ', 'SIA', 'Singapore Airlines', '新加坡航空', 'Singapore', 'Star Alliance'),
('TG', 'THA', 'Thai Airways', '泰國航空', 'Thailand', 'Star Alliance'),
('JL', 'JAL', 'Japan Airlines', '日本航空', 'Japan', 'OneWorld'),
('NH', 'ANA', 'All Nippon Airways', '全日空', 'Japan', 'Star Alliance'),
('KE', 'KAL', 'Korean Air', '大韓航空', 'Korea', 'SkyTeam'),
('OZ', 'AAR', 'Asiana Airlines', '韓亞航空', 'Korea', 'Star Alliance');

-- 常用機場（亞太區）
INSERT INTO ref_airports (iata_code, icao_code, name_en, name_zh, city_code, city_name_zh, country_code, timezone) VALUES
('TPE', 'RCTP', 'Taiwan Taoyuan International', '桃園國際機場', 'TPE', '台北', 'TW', 'Asia/Taipei'),
('TSA', 'RCSS', 'Taipei Songshan', '台北松山機場', 'TPE', '台北', 'TW', 'Asia/Taipei'),
('KHH', 'RCKH', 'Kaohsiung International', '高雄國際機場', 'KHH', '高雄', 'TW', 'Asia/Taipei'),
('RMQ', 'RCMQ', 'Taichung International', '台中國際機場', 'RMQ', '台中', 'TW', 'Asia/Taipei'),
('NRT', 'RJAA', 'Narita International', '成田國際機場', 'TYO', '東京', 'JP', 'Asia/Tokyo'),
('HND', 'RJTT', 'Tokyo Haneda', '羽田機場', 'TYO', '東京', 'JP', 'Asia/Tokyo'),
('KIX', 'RJBB', 'Kansai International', '關西國際機場', 'OSA', '大阪', 'JP', 'Asia/Tokyo'),
('ITM', 'RJOO', 'Osaka Itami', '大阪伊丹機場', 'OSA', '大阪', 'JP', 'Asia/Tokyo'),
('CTS', 'RJCC', 'New Chitose', '新千歲機場', 'SPK', '札幌', 'JP', 'Asia/Tokyo'),
('OKA', 'ROAH', 'Naha', '那霸機場', 'OKA', '沖繩', 'JP', 'Asia/Tokyo'),
('ICN', 'RKSI', 'Incheon International', '仁川國際機場', 'SEL', '首爾', 'KR', 'Asia/Seoul'),
('GMP', 'RKSS', 'Gimpo International', '金浦機場', 'SEL', '首爾', 'KR', 'Asia/Seoul'),
('HKG', 'VHHH', 'Hong Kong International', '香港國際機場', 'HKG', '香港', 'HK', 'Asia/Hong_Kong'),
('SIN', 'WSSS', 'Singapore Changi', '樟宜機場', 'SIN', '新加坡', 'SG', 'Asia/Singapore'),
('BKK', 'VTBS', 'Suvarnabhumi', '素萬那普機場', 'BKK', '曼谷', 'TH', 'Asia/Bangkok'),
('DMK', 'VTBD', 'Don Mueang', '廊曼機場', 'BKK', '曼谷', 'TH', 'Asia/Bangkok'),
('CNX', 'VTCC', 'Chiang Mai International', '清邁機場', 'CNX', '清邁', 'TH', 'Asia/Bangkok');

-- 艙等代碼
INSERT INTO ref_booking_classes (code, cabin_type, description, priority) VALUES
('F', 'First', '頭等艙全票', 1),
('A', 'First', '頭等艙折扣', 2),
('C', 'Business', '商務艙全票', 10),
('J', 'Business', '商務艙優惠', 11),
('D', 'Business', '商務艙折扣', 12),
('W', 'Premium Economy', '豪華經濟艙', 20),
('Y', 'Economy', '經濟艙全票', 30),
('B', 'Economy', '經濟艙折扣', 31),
('M', 'Economy', '經濟艙特價', 32),
('H', 'Economy', '經濟艙優惠', 33),
('K', 'Economy', '經濟艙折扣', 34),
('L', 'Economy', '經濟艙低價', 35),
('Q', 'Economy', '經濟艙低價', 36),
('T', 'Economy', '經濟艙促銷', 37),
('V', 'Economy', '經濟艙促銷', 38);

-- SSR 代碼
INSERT INTO ref_ssr_codes (code, category, description_en, description_zh) VALUES
('VGML', 'Meal', 'Vegetarian Meal', '素食餐'),
('AVML', 'Meal', 'Asian Vegetarian Meal', '亞洲素食'),
('KSML', 'Meal', 'Kosher Meal', '猶太餐'),
('MOML', 'Meal', 'Muslim Meal', '穆斯林餐'),
('CHML', 'Meal', 'Child Meal', '兒童餐'),
('BBML', 'Meal', 'Baby Meal', '嬰兒餐'),
('DBML', 'Meal', 'Diabetic Meal', '糖尿病餐'),
('GFML', 'Meal', 'Gluten-Free Meal', '無麩質餐'),
('LFML', 'Meal', 'Low Fat Meal', '低脂餐'),
('WCHR', 'Wheelchair', 'Wheelchair Ramp', '輪椅（可行走）'),
('WCHS', 'Wheelchair', 'Wheelchair Steps', '輪椅（不能上下樓）'),
('WCHC', 'Wheelchair', 'Wheelchair Cabin', '輪椅（完全不能行走）'),
('BLND', 'Disability', 'Blind Passenger', '視障旅客'),
('DEAF', 'Disability', 'Deaf Passenger', '聽障旅客'),
('MAAS', 'Assistance', 'Meet and Assist', '接機協助'),
('UMNR', 'Other', 'Unaccompanied Minor', '無人陪伴兒童'),
('PETC', 'Other', 'Pet in Cabin', '客艙寵物');

-- 狀態碼
INSERT INTO ref_status_codes (code, category, description_en, description_zh) VALUES
('HK', 'Confirmed', 'Hold Confirmed', '已確認'),
('KK', 'Confirmed', 'Confirming', '確認中'),
('TK', 'Confirmed', 'Confirming with new times', '確認（新時間）'),
('RR', 'Confirmed', 'Reconfirmed', '已重確認'),
('HL', 'Waitlist', 'Have Listed', '候補中'),
('HN', 'Waitlist', 'Holding Need', '需求中'),
('KL', 'Waitlist', 'Confirming from waitlist', '從候補確認'),
('UU', 'Waitlist', 'Unable, waitlisted', '無法確認，已候補'),
('HX', 'Cancelled', 'Holding Cancelled', '已取消'),
('NO', 'Cancelled', 'No Action Taken', '無動作'),
('UC', 'Unable', 'Unable to Confirm', '無法確認'),
('UN', 'Unable', 'Unable, flight not operating', '無法確認（航班不運行）'),
('GK', 'Ghost', 'Ghost Confirmed', 'Ghost 確認'),
('GL', 'Ghost', 'Ghost Waitlist', 'Ghost 候補');
```

---

## 參考資源

### 官方文件
- [Amadeus Service Hub](https://servicehub.amadeus.com) - 官方技術文件
- [Amadeus Developers](https://developers.amadeus.com) - API 開發資源

### 開源專案
- [open-pnr](https://github.com/acadea/open-pnr) - JavaScript PNR Parser
- [Amadeus-PNR](https://github.com/xiongdashan/Amadeus-PNR) - 中文 PNR 解析

### 線上工具
- [EasyPNR](https://www.easypnr.com/en/decode) - 免費 PNR 解碼器
- [PNR Expert](https://www.pnrexpert.com) - PNR 轉換工具
- [IATA Code Search](https://www.iata.org/en/publications/directories/code-search/) - 官方代碼查詢

### 教學資源
- [The Complete Amadeus Manual](https://air.flyingway.com/books/amadeus/Amadeus_Guide.pdf) - 完整手冊
- [Amadeus Quick Reference Guide](https://usermanual.wiki/Pdf/AmadeusQuickReferenceGuide.2132884153.pdf) - 快速參考

---

> **免責聲明**: 本文件僅供內部開發參考使用，不涉及任何 Amadeus API 授權。所有資訊來自公開資源。
