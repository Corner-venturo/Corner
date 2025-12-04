-- 新增日本景點：河口湖、忍野八海、淺間神社
-- 使用預設 workspace_id（取現有的第一個）

-- 新增河口湖
INSERT INTO public.attractions (
  name, name_en, description, country_id, city_id, category, tags,
  duration_minutes, address, is_active, workspace_id
)
SELECT
  '河口湖',
  'Lake Kawaguchi',
  '富士五湖之一，以優美的湖光山色聞名。天氣晴朗時，可從湖面倒映欣賞富士山的壯麗景色。湖畔有許多觀景點、美術館、溫泉旅館，是欣賞富士山的絕佳地點。春季櫻花、秋季紅葉與富士山交相輝映，四季皆美。',
  co.id,
  c.id,
  '景點',
  ARRAY['富士山', '湖泊', '自然風景', '必訪景點'],
  120,
  '山梨縣南都留郡富士河口湖町',
  true,
  (SELECT id FROM public.workspaces LIMIT 1)
FROM public.countries co
JOIN public.cities c ON c.country_id = co.id
WHERE co.name = '日本'
  AND NOT EXISTS (SELECT 1 FROM public.attractions WHERE name = '河口湖')
LIMIT 1;

-- 新增忍野八海
INSERT INTO public.attractions (
  name, name_en, description, country_id, city_id, category, tags,
  duration_minutes, address, is_active, workspace_id
)
SELECT
  '忍野八海',
  'Oshino Hakkai',
  '位於山梨縣忍野村的八個清澈泉池，由富士山雪水經過地層過濾而成，水質清澈見底。已被列為日本天然紀念物和世界文化遺產的構成資產。周圍保留傳統茅草屋建築，充滿日式田園風情。',
  co.id,
  c.id,
  '景點',
  ARRAY['富士山', '世界遺產', '泉水', '傳統村落'],
  90,
  '山梨縣南都留郡忍野村忍草',
  true,
  (SELECT id FROM public.workspaces LIMIT 1)
FROM public.countries co
JOIN public.cities c ON c.country_id = co.id
WHERE co.name = '日本'
  AND NOT EXISTS (SELECT 1 FROM public.attractions WHERE name = '忍野八海')
LIMIT 1;

-- 新增淺間神社
INSERT INTO public.attractions (
  name, name_en, description, country_id, city_id, category, tags,
  duration_minutes, address, is_active, workspace_id
)
SELECT
  '淺間神社',
  'Sengen Shrine',
  '正式名稱為北口本宮富士淺間神社，是富士山信仰的重要神社。境內有高聳的杉木參道，莊嚴肅穆。本殿建築華麗，是國家重要文化財。自古以來是登富士山的起點，見證無數朝聖者的腳步。',
  co.id,
  c.id,
  '景點',
  ARRAY['神社', '世界遺產', '富士山', '歷史文化'],
  60,
  '山梨縣富士吉田市上吉田5558',
  true,
  (SELECT id FROM public.workspaces LIMIT 1)
FROM public.countries co
JOIN public.cities c ON c.country_id = co.id
WHERE co.name = '日本'
  AND NOT EXISTS (SELECT 1 FROM public.attractions WHERE name = '淺間神社')
LIMIT 1;
