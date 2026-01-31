# Seed Data Scripts

## 機場資料 (ref_airports)

### 資料來源
- [OpenFlights](https://openflights.org/data.html) - 全球 7000+ 機場
- 常用機場中文名稱手動維護（約 80 個）

### 執行方式

```bash
# 確保環境變數設定
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 執行 seed
npx tsx scripts/seed-data/seed-airports.ts
```

### 資料欄位

| 欄位 | 說明 | 範例 |
|-----|------|------|
| iata_code | IATA 機場代碼 (PK) | NRT |
| icao_code | ICAO 機場代碼 | RJAA |
| english_name | 英文名稱 | Narita International Airport |
| name_zh | 中文名稱 | 成田國際機場 |
| city_name_en | 城市英文名 | Tokyo |
| city_name_zh | 城市中文名 | 東京 |
| country_code | 國家代碼 (ISO) | JP |
| latitude | 緯度 | 35.7647 |
| longitude | 經度 | 140.3864 |
| timezone | 時區 | Asia/Tokyo |

### 常用機場清單

已設定中文名稱的機場：

**台灣**: TPE, TSA, KHH, RMQ
**日本**: NRT, HND, KIX, ITM, NGO, CTS, FUK, OKA, KOJ, HIJ, SDJ, KMQ, TOY, MMY, ISG
**韓國**: ICN, GMP, PUS, CJU
**中港澳**: PEK, PKX, PVG, SHA, CAN, SZX, HKG, MFM
**東南亞**: BKK, DMK, CNX, HKT, SIN, KUL, MNL, SGN, HAN, DAD, REP, DPS, CGK, RGN
**歐洲**: LHR, CDG, FRA, AMS, FCO, MAD, BCN, MUC, ZRH, VIE, PRG, IST
**美加**: LAX, SFO, JFK, YVR, YYZ
**大洋洲**: SYD, MEL, AKL
**中東**: DXB, DOH
**南美**: LPB, GRU

### 新增中文名稱

編輯 `seed-airports.ts` 中的 `CHINESE_NAMES` 物件：

```typescript
const CHINESE_NAMES: Record<string, { name_zh: string; city_name_zh: string }> = {
  // 新增機場
  XXX: { name_zh: '機場中文名', city_name_zh: '城市中文名' },
}
```

然後重新執行 seed script（會自動 upsert 更新）。
