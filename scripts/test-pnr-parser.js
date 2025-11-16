// 測試 PNR 解析器
const rawPNR = `6 APE SALES@CORNERTRAVEL.COM.TW
7 APM 886925929203
8 TK TL16NOV/TPEW123ML
9 OPW-20NOV:2038/1C7/BR REQUIRES TICKET ON OR BEFORE 23NOV:2038 TPE TIME ZONE/TKT/S3-4
10 OPC-23NOV:2038/1C8/BR CANCELLATION DUE TO NO TICKET TPE TIME ZONE/TKT/S3-4/P1-2
* ES/G 16NOV/WTGS/TPEW123ML
  TPEW12535-B`;

// 模擬解析邏輯
const lines = rawPNR.split('\n').map(line => line.trim()).filter(Boolean);

console.log('總行數:', lines.length);
console.log('\n逐行檢查:');

for (const line of lines) {
  console.log('\n檢查行:', line);

  // 測試 OPW 匹配
  const opwMatch = line.match(/(?:ON OR BEFORE|BEFORE)\s+(\d{2})([A-Z]{3}):?\d*/i);
  if (opwMatch) {
    console.log('✅ 找到 OPW 匹配!');
    console.log('  日期:', opwMatch[1]);
    console.log('  月份:', opwMatch[2]);
  }
}
