-- 匯入越南車資資料
-- 根據越南車資.htm 檔案整理

BEGIN;

-- 先刪除舊的越南資料（如果有）
DELETE FROM public.transportation_rates WHERE country_name = '越南';

-- 4座車（使用 subquery 自動帶入 country_id）
INSERT INTO public.transportation_rates (country_id, country_name, category, supplier, route, trip_type, cost_vnd, price_twd, kkday_selling_price, kkday_cost, kkday_profit, vehicle_type, price, currency, unit, is_backup) VALUES
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '市區飯店－會安', '單程', 270000, 378, 600, 435, 165, '4座車', 378, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '市區飯店－會安', '往返', 520000, 728, 1000, 837, 163, '4座車', 728, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '市區飯店－巴拿山', '單程', 350000, 490, 800, 564, 237, '4座車', 490, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '市區飯店－巴拿山', '往返', 650000, 910, 1300, 1047, 254, '4座車', 910, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '機場－市區／海邊飯店', '接送', 150000, 210, 400, 242, 159, '4座車', 210, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '峴港機場－三日月日本度假村', '接送', 250000, 350, 600, 403, 198, '4座車', 350, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '峴港機場－峴港凱悅度假村', '接送', 220000, 308, 550, 354, 196, '4座車', 308, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '峴港機場－洲際飯店', '接送', 300000, 420, 700, 483, 217, '4座車', 420, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '包車1天（100公里／10小時）', '全天', 1800000, 2520, 3400, 2898, 502, '4座車', 2520, 'TWD', 'day', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '超過公里', '每公里', 10000, 14, 50, 16, 34, '4座車', 14, 'TWD', 'km', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '4座車', '', '超過時間', '每小時', 150000, 210, 300, 242, 59, '4座車', 210, 'TWD', 'hour', false);

-- 7座車
INSERT INTO public.transportation_rates (country_id, country_name, category, supplier, route, trip_type, cost_vnd, price_twd, kkday_selling_price, kkday_cost, kkday_profit, vehicle_type, price, currency, unit, is_backup) VALUES
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '市區飯店－會安', '單程', 320000, 448, 700, 515, 185, '7座車', 448, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '市區飯店－會安', '往返', 620000, 868, 1200, 998, 202, '7座車', 868, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '市區飯店－巴拿山', '單程', 400000, 560, 900, 644, 256, '7座車', 560, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '市區飯店－巴拿山', '往返', 750000, 1050, 1600, 1208, 393, '7座車', 1050, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '機場－市區／海邊飯店', '接送', 200000, 280, 500, 322, 178, '7座車', 280, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '峴港機場－三日月日本度假村', '接送', 300000, 420, 700, 483, 217, '7座車', 420, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '峴港機場－峴港凱悅度假村', '接送', 280000, 392, 650, 451, 199, '7座車', 392, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '峴港機場－洲際飯店', '接送', 350000, 490, 800, 564, 237, '7座車', 490, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '包車1天（100公里／10小時）', '全天', 2200000, 3080, 4200, 3542, 658, '7座車', 3080, 'TWD', 'day', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '超過公里', '每公里', 15000, 21, 50, 24, 26, '7座車', 21, 'TWD', 'km', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '7座車', '', '超過時間', '每小時', 150000, 210, 300, 242, 59, '7座車', 210, 'TWD', 'hour', false);

-- 16座車
INSERT INTO public.transportation_rates (country_id, country_name, category, supplier, route, trip_type, cost_vnd, price_twd, kkday_selling_price, kkday_cost, kkday_profit, vehicle_type, price, currency, unit, is_backup) VALUES
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '市區飯店－會安', '單程', 500000, 700, 1000, 805, 195, '16座車', 700, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '市區飯店－會安', '往返', 900000, 1260, 1700, 1449, 251, '16座車', 1260, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '市區飯店－巴拿山', '單程', 550000, 770, 1100, 886, 215, '16座車', 770, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '市區飯店－巴拿山', '往返', 1000000, 1400, 1900, 1610, 290, '16座車', 1400, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '機場－市區／海邊飯店', '接送', 500000, 700, 1000, 805, 195, '16座車', 700, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '峴港機場－三日月日本度假村', '接送', 600000, 840, 1200, 966, 234, '16座車', 840, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '峴港機場－峴港凱悅度假村', '接送', 550000, 770, 1100, 886, 215, '16座車', 770, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '峴港機場－洲際飯店', '接送', 700000, 980, 1400, 1127, 273, '16座車', 980, 'TWD', 'trip', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '包車1天（100公里／10小時）', '全天', 2500000, 3500, 4700, 4025, 675, '16座車', 3500, 'TWD', 'day', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '超過公里', '每公里', 18000, 25, 50, 29, 21, '16座車', 25, 'TWD', 'km', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '16座車', '', '超過時間', '每小時', 180000, 252, 300, 290, 10, '16座車', 252, 'TWD', 'hour', false);

-- VIP座車
INSERT INTO public.transportation_rates (country_id, country_name, category, supplier, route, trip_type, cost_vnd, price_twd, kkday_selling_price, kkday_cost, kkday_profit, vehicle_type, price, currency, unit, is_backup) VALUES
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', 'VIP座車', '', '包車1天（100公里／10小時）', '全天', 4500000, 6300, 8400, 7245, 1155, 'VIP座車', 6300, 'TWD', 'day', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', 'VIP座車', '', '超過公里', '每公里', 25000, 35, 100, 40, 60, 'VIP座車', 35, 'TWD', 'km', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', 'VIP座車', '', '超過時間', '每小時', 220000, 308, 500, 354, 146, 'VIP座車', 308, 'TWD', 'hour', false);

-- 中文導遊
INSERT INTO public.transportation_rates (country_id, country_name, category, supplier, route, trip_type, cost_vnd, price_twd, kkday_selling_price, kkday_cost, kkday_profit, vehicle_type, price, currency, unit, is_backup) VALUES
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '中文導遊', '', '導遊服務', '4小時', 800000, 1120, 2000, 1288, 712, '中文導遊', 1120, 'TWD', 'service', false),
((SELECT id FROM public.countries WHERE code = 'VN' LIMIT 1), '越南', '中文導遊', '', '導遊服務', '10小時', 1200000, 1680, 3000, 1932, 1068, '中文導遊', 1680, 'TWD', 'service', false);

COMMIT;
