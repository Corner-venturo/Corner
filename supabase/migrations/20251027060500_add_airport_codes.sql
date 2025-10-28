-- 新增城市機場代碼欄位並填入所有機場代碼

BEGIN;

-- ============================================
-- 1. 新增 airport_code 欄位
-- ============================================
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS airport_code varchar(3);

COMMENT ON COLUMN public.cities.airport_code IS 'Airport/City code for tour number generation (e.g., TYO, KIX)';

-- ============================================
-- 2. 日本城市機場代碼
-- ============================================

-- 北海道
UPDATE public.cities SET airport_code = 'SPK' WHERE id = 'sapporo';
UPDATE public.cities SET airport_code = 'OTR' WHERE id = 'otaru';
UPDATE public.cities SET airport_code = 'HKD' WHERE id = 'hakodate';
UPDATE public.cities SET airport_code = 'FNO' WHERE id = 'furano';
UPDATE public.cities SET airport_code = 'AKJ' WHERE id = 'asahikawa';
UPDATE public.cities SET airport_code = 'KUH' WHERE id = 'kushiro';
UPDATE public.cities SET airport_code = 'NBT' WHERE id = 'noboribetsu';
UPDATE public.cities SET airport_code = 'BIE' WHERE id = 'biei';
UPDATE public.cities SET airport_code = 'NSK' WHERE id = 'niseko';

-- 關東
UPDATE public.cities SET airport_code = 'TYO' WHERE id = 'tokyo';
UPDATE public.cities SET airport_code = 'YOK' WHERE id = 'yokohama';
UPDATE public.cities SET airport_code = 'KMK' WHERE id = 'kamakura';
UPDATE public.cities SET airport_code = 'NKO' WHERE id = 'nikko';
UPDATE public.cities SET airport_code = 'HKN' WHERE id = 'hakone';
UPDATE public.cities SET airport_code = 'KWG' WHERE id = 'kawagoe';
UPDATE public.cities SET airport_code = 'CBA' WHERE id = 'chiba';
UPDATE public.cities SET airport_code = 'ENO' WHERE id = 'enoshima';
UPDATE public.cities SET airport_code = 'KWS' WHERE id = 'kawasaki';

-- 關西
UPDATE public.cities SET airport_code = 'KIX' WHERE id = 'osaka';
UPDATE public.cities SET airport_code = 'KYO' WHERE id = 'kyoto';
UPDATE public.cities SET airport_code = 'NAR' WHERE id = 'nara';
UPDATE public.cities SET airport_code = 'KBE' WHERE id = 'kobe';
UPDATE public.cities SET airport_code = 'HMJ' WHERE id = 'himeji';
UPDATE public.cities SET airport_code = 'WKY' WHERE id = 'wakayama';
UPDATE public.cities SET airport_code = 'KYS' WHERE id = 'koyasan';
UPDATE public.cities SET airport_code = 'ISE' WHERE id = 'ise';
UPDATE public.cities SET airport_code = 'UJI' WHERE id = 'uji';
UPDATE public.cities SET airport_code = 'ARM' WHERE id = 'arashiyama';

-- 九州
UPDATE public.cities SET airport_code = 'FUK' WHERE id = 'fukuoka';
UPDATE public.cities SET airport_code = 'NGS' WHERE id = 'nagasaki';
UPDATE public.cities SET airport_code = 'KMJ' WHERE id = 'kumamoto';
UPDATE public.cities SET airport_code = 'KGS' WHERE id = 'kagoshima';
UPDATE public.cities SET airport_code = 'MYZ' WHERE id = 'miyazaki';
UPDATE public.cities SET airport_code = 'BPU' WHERE id = 'beppu';
UPDATE public.cities SET airport_code = 'YFU' WHERE id = 'yufuin';
UPDATE public.cities SET airport_code = 'ASO' WHERE id = 'aso';
UPDATE public.cities SET airport_code = 'TKH' WHERE id = 'takachiho';
UPDATE public.cities SET airport_code = 'YKS' WHERE id = 'yakushima';

-- 沖繩
UPDATE public.cities SET airport_code = 'OKA' WHERE id = 'naha';
UPDATE public.cities SET airport_code = 'ISG' WHERE id = 'ishigaki';
UPDATE public.cities SET airport_code = 'MYK' WHERE id = 'miyako';
UPDATE public.cities SET airport_code = 'TKT' WHERE id = 'taketomi';
UPDATE public.cities SET airport_code = 'ZMM' WHERE id = 'zamami';
UPDATE public.cities SET airport_code = 'IRT' WHERE id = 'iriomote';

-- 東北
UPDATE public.cities SET airport_code = 'SDJ' WHERE id = 'sendai';
UPDATE public.cities SET airport_code = 'AOJ' WHERE id = 'aomori';
UPDATE public.cities SET airport_code = 'AXT' WHERE id = 'akita';
UPDATE public.cities SET airport_code = 'GAJ' WHERE id = 'yamagata';
UPDATE public.cities SET airport_code = 'MOR' WHERE id = 'morioka';
UPDATE public.cities SET airport_code = 'MTM' WHERE id = 'matsushima';
UPDATE public.cities SET airport_code = 'HRK' WHERE id = 'hirosaki';
UPDATE public.cities SET airport_code = 'KKN' WHERE id = 'kakunodate';

-- 中部
UPDATE public.cities SET airport_code = 'NGO' WHERE id = 'nagoya';
UPDATE public.cities SET airport_code = 'KNZ' WHERE id = 'kanazawa';
UPDATE public.cities SET airport_code = 'TKY' WHERE id = 'takayama';
UPDATE public.cities SET airport_code = 'SKG' WHERE id = 'shirakawago';
UPDATE public.cities SET airport_code = 'MMJ' WHERE id = 'matsumoto';
UPDATE public.cities SET airport_code = 'TOY' WHERE id = 'toyama';
UPDATE public.cities SET airport_code = 'FKI' WHERE id = 'fukui';
UPDATE public.cities SET airport_code = 'KMK' WHERE id = 'kamikochi';
UPDATE public.cities SET airport_code = 'TTY' WHERE id = 'tateyama';
UPDATE public.cities SET airport_code = 'GER' WHERE id = 'gero';

-- 中國
UPDATE public.cities SET airport_code = 'HIJ' WHERE id = 'hiroshima';
UPDATE public.cities SET airport_code = 'OKJ' WHERE id = 'okayama';
UPDATE public.cities SET airport_code = 'KRS' WHERE id = 'kurashiki';
UPDATE public.cities SET airport_code = 'TTR' WHERE id = 'tottori';
UPDATE public.cities SET airport_code = 'SMN' WHERE id = 'shimane';
UPDATE public.cities SET airport_code = 'YGJ' WHERE id = 'yamaguchi';
UPDATE public.cities SET airport_code = 'ONO' WHERE id = 'onomichi';

-- 四國
UPDATE public.cities SET airport_code = 'TAK' WHERE id = 'takamatsu';
UPDATE public.cities SET airport_code = 'MYJ' WHERE id = 'matsuyama';
UPDATE public.cities SET airport_code = 'KCZ' WHERE id = 'kochi';
UPDATE public.cities SET airport_code = 'TKS' WHERE id = 'tokushima';
UPDATE public.cities SET airport_code = 'KTH' WHERE id = 'kotohira';
UPDATE public.cities SET airport_code = 'NRT' WHERE id = 'naruto';
UPDATE public.cities SET airport_code = 'UWJ' WHERE id = 'uwajima';

-- ============================================
-- 3. 泰國城市機場代碼
-- ============================================
UPDATE public.cities SET airport_code = 'BKK' WHERE id = 'bangkok';
UPDATE public.cities SET airport_code = 'CNX' WHERE id = 'chiang-mai';
UPDATE public.cities SET airport_code = 'HKT' WHERE id = 'phuket';
UPDATE public.cities SET airport_code = 'AYT' WHERE id = 'ayutthaya';
UPDATE public.cities SET airport_code = 'PYX' WHERE id = 'pattaya';
UPDATE public.cities SET airport_code = 'HHQ' WHERE id = 'hua-hin';
UPDATE public.cities SET airport_code = 'CEI' WHERE id = 'chiang-rai';
UPDATE public.cities SET airport_code = 'PAI' WHERE id = 'pai';
UPDATE public.cities SET airport_code = 'KBV' WHERE id = 'krabi';
UPDATE public.cities SET airport_code = 'USM' WHERE id = 'koh-samui';
UPDATE public.cities SET airport_code = 'KPN' WHERE id = 'koh-phangan';

-- ============================================
-- 4. 韓國城市機場代碼
-- ============================================
UPDATE public.cities SET airport_code = 'SEL' WHERE id = 'seoul';
UPDATE public.cities SET airport_code = 'PUS' WHERE id = 'busan';
UPDATE public.cities SET airport_code = 'CJU' WHERE id = 'jeju';
UPDATE public.cities SET airport_code = 'ICN' WHERE id = 'incheon';
UPDATE public.cities SET airport_code = 'SWN' WHERE id = 'suwon';
UPDATE public.cities SET airport_code = 'GYG' WHERE id = 'gyeongju';
UPDATE public.cities SET airport_code = 'DGU' WHERE id = 'daegu';
UPDATE public.cities SET airport_code = 'GWJ' WHERE id = 'gwangju';
UPDATE public.cities SET airport_code = 'GWN' WHERE id = 'gangneung';

-- ============================================
-- 5. 中國城市機場代碼
-- ============================================
UPDATE public.cities SET airport_code = 'HRB' WHERE id = 'harbin';
UPDATE public.cities SET airport_code = 'CTU' WHERE id = 'chengdu';
UPDATE public.cities SET airport_code = 'SHA' WHERE id = 'shanghai';
UPDATE public.cities SET airport_code = 'PEK' WHERE id = 'beijing';
UPDATE public.cities SET airport_code = 'XMN' WHERE id = 'xiamen';
UPDATE public.cities SET airport_code = 'SYX' WHERE id = 'sanya';
UPDATE public.cities SET airport_code = 'XIY' WHERE id = 'xian';
UPDATE public.cities SET airport_code = 'KMG' WHERE id = 'kunming';
UPDATE public.cities SET airport_code = 'LJG' WHERE id = 'lijiang';
UPDATE public.cities SET airport_code = 'CAN' WHERE id = 'guangzhou';
UPDATE public.cities SET airport_code = 'SZX' WHERE id = 'shenzhen';
UPDATE public.cities SET airport_code = 'WUH' WHERE id = 'wuhan';
UPDATE public.cities SET airport_code = 'CSX' WHERE id = 'changsha';
UPDATE public.cities SET airport_code = 'HGH' WHERE id = 'hangzhou';
UPDATE public.cities SET airport_code = 'NKG' WHERE id = 'nanjing';
UPDATE public.cities SET airport_code = 'SZV' WHERE id = 'suzhou';
UPDATE public.cities SET airport_code = 'CGO' WHERE id = 'zhengzhou';
UPDATE public.cities SET airport_code = 'LYA' WHERE id = 'luoyang';
UPDATE public.cities SET airport_code = 'DLC' WHERE id = 'dalian';
UPDATE public.cities SET airport_code = 'SHE' WHERE id = 'shenyang';
UPDATE public.cities SET airport_code = 'CGQ' WHERE id = 'changchun';
UPDATE public.cities SET airport_code = 'TNA' WHERE id = 'jinan';
UPDATE public.cities SET airport_code = 'TAO' WHERE id = 'qingdao';
UPDATE public.cities SET airport_code = 'NNG' WHERE id = 'nanning';
UPDATE public.cities SET airport_code = 'KWL' WHERE id = 'guilin';
UPDATE public.cities SET airport_code = 'URC' WHERE id = 'urumqi';
UPDATE public.cities SET airport_code = 'LXA' WHERE id = 'lhasa';
UPDATE public.cities SET airport_code = 'CKG' WHERE id = 'chongqing';
UPDATE public.cities SET airport_code = 'GYS' WHERE id = 'guangyuan';
UPDATE public.cities SET airport_code = 'LZH' WHERE id = 'liuzhou';
UPDATE public.cities SET airport_code = 'ZUH' WHERE id = 'zhuhai';

-- ============================================
-- 6. 越南城市機場代碼
-- ============================================
UPDATE public.cities SET airport_code = 'HAN' WHERE id = 'hanoi';
UPDATE public.cities SET airport_code = 'SGN' WHERE id = 'ho-chi-minh';
UPDATE public.cities SET airport_code = 'DAD' WHERE id = 'da-nang';
UPDATE public.cities SET airport_code = 'CXR' WHERE id = 'nha-trang';
UPDATE public.cities SET airport_code = 'VII' WHERE id = 'hoi-an';
UPDATE public.cities SET airport_code = 'VDO' WHERE id = 'ha-long';
UPDATE public.cities SET airport_code = 'HUI' WHERE id = 'hue';
UPDATE public.cities SET airport_code = 'VCA' WHERE id = 'can-tho';
UPDATE public.cities SET airport_code = 'DLI' WHERE id = 'dalat';
UPDATE public.cities SET airport_code = 'PQC' WHERE id = 'phu-quoc';
UPDATE public.cities SET airport_code = 'VDH' WHERE id = 'dong-hoi';
UPDATE public.cities SET airport_code = 'HPH' WHERE id = 'hai-phong';
UPDATE public.cities SET airport_code = 'UIH' WHERE id = 'quy-nhon';

-- ============================================
-- 7. 埃及城市機場代碼
-- ============================================
UPDATE public.cities SET airport_code = 'CAI' WHERE id = 'cairo';
UPDATE public.cities SET airport_code = 'LXR' WHERE id = 'luxor';
UPDATE public.cities SET airport_code = 'ASW' WHERE id = 'aswan';
UPDATE public.cities SET airport_code = 'HRG' WHERE id = 'hurghada';
UPDATE public.cities SET airport_code = 'ALY' WHERE id = 'alexandria';
UPDATE public.cities SET airport_code = 'GZA' WHERE id = 'giza';
UPDATE public.cities SET airport_code = 'SSH' WHERE id = 'sharm-el-sheikh';
UPDATE public.cities SET airport_code = 'MRS' WHERE id = 'marsa-alam';
UPDATE public.cities SET airport_code = 'DBB' WHERE id = 'dahab';
UPDATE public.cities SET airport_code = 'RMF' WHERE id = 'marsa-matruh';

-- ============================================
-- 8. 土耳其城市機場代碼
-- ============================================
UPDATE public.cities SET airport_code = 'IST' WHERE id = 'istanbul';
UPDATE public.cities SET airport_code = 'CAP' WHERE id = 'cappadocia';
UPDATE public.cities SET airport_code = 'PAM' WHERE id = 'pamukkale';
UPDATE public.cities SET airport_code = 'AYT' WHERE id = 'antalya';
UPDATE public.cities SET airport_code = 'ANK' WHERE id = 'ankara';
UPDATE public.cities SET airport_code = 'ESB' WHERE id = 'eskisehir';
UPDATE public.cities SET airport_code = 'IZM' WHERE id = 'izmir';
UPDATE public.cities SET airport_code = 'BDM' WHERE id = 'bodrum';
UPDATE public.cities SET airport_code = 'DLM' WHERE id = 'dalaman';
UPDATE public.cities SET airport_code = 'TZX' WHERE id = 'trabzon';
UPDATE public.cities SET airport_code = 'KYS' WHERE id = 'kayseri';
UPDATE public.cities SET airport_code = 'GZT' WHERE id = 'gaziantep';

-- ============================================
-- 9. 法國城市機場代碼
-- ============================================
UPDATE public.cities SET airport_code = 'PAR' WHERE id = 'paris';
UPDATE public.cities SET airport_code = 'VRS' WHERE id = 'versailles';
UPDATE public.cities SET airport_code = 'AVN' WHERE id = 'avignon';
UPDATE public.cities SET airport_code = 'AIX' WHERE id = 'aix-en-provence';
UPDATE public.cities SET airport_code = 'MSM' WHERE id = 'mont-saint-michel';
UPDATE public.cities SET airport_code = 'TRS' WHERE id = 'tours';
UPDATE public.cities SET airport_code = 'NCE' WHERE id = 'nice';
UPDATE public.cities SET airport_code = 'CNS' WHERE id = 'cannes';
UPDATE public.cities SET airport_code = 'MCM' WHERE id = 'monaco';
UPDATE public.cities SET airport_code = 'LYS' WHERE id = 'lyon';
UPDATE public.cities SET airport_code = 'CHM' WHERE id = 'chamonix';
UPDATE public.cities SET airport_code = 'ANC' WHERE id = 'annecy';
UPDATE public.cities SET airport_code = 'DIJ' WHERE id = 'dijon';
UPDATE public.cities SET airport_code = 'BJN' WHERE id = 'beaune';
UPDATE public.cities SET airport_code = 'RNS' WHERE id = 'rennes';
UPDATE public.cities SET airport_code = 'SMO' WHERE id = 'saint-malo';
UPDATE public.cities SET airport_code = 'SXB' WHERE id = 'strasbourg';
UPDATE public.cities SET airport_code = 'CLM' WHERE id = 'colmar';
UPDATE public.cities SET airport_code = 'MRS' WHERE id = 'marseille';
UPDATE public.cities SET airport_code = 'BDX' WHERE id = 'bordeaux';
UPDATE public.cities SET airport_code = 'TLS' WHERE id = 'toulouse';
UPDATE public.cities SET airport_code = 'CRN' WHERE id = 'carcassonne';

COMMIT;
