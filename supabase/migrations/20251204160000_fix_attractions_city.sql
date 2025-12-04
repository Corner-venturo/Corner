-- 修正河口湖、忍野八海、淺間神社的城市為東京

UPDATE public.attractions
SET city_id = (
  SELECT c.id
  FROM public.cities c
  JOIN public.countries co ON c.country_id = co.id
  WHERE co.name = '日本' AND c.name = '東京'
  LIMIT 1
)
WHERE name IN ('河口湖', '忍野八海', '淺間神社');
