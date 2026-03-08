#!/usr/bin/env python3
"""
Trip.com 機票解析器 - n8n 專用版本
支援從命令列接收 base64 PDF 或從 Gmail 抓取

使用方式：
  # n8n 模式（接收 base64 PDF）
  python3 trip-flight-parser-n8n.py --pdf-base64 "JVBERi0xLjQK..."
  
  # Gmail 模式（原始功能）
  python3 trip-flight-parser-n8n.py --gmail
  
  # 單一郵件測試
  python3 trip-flight-parser-n8n.py --message-id "18d4a8c7f2e1b3a9"
"""

import json, base64, re, urllib.request, urllib.parse
import PyPDF2, io, os, sys

def refresh_token():
    """從 OAuth token 取得 access token"""
    CREDENTIALS_DIR = os.path.expanduser('~/Projects/venturo-erp/.credentials')
    TOKEN_FILE = os.path.join(CREDENTIALS_DIR, 'google-token.json')
    token_data = json.load(open(TOKEN_FILE))
    oauth_data = json.load(open(os.path.join(CREDENTIALS_DIR, 'google-oauth.json')))
    
    params = urllib.parse.urlencode({
        'refresh_token': token_data['refresh_token'],
        'client_id': oauth_data['installed']['client_id'],
        'client_secret': oauth_data['installed']['client_secret'],
        'grant_type': 'refresh_token'
    }).encode()
    
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=params, method='POST')
    return json.loads(urllib.request.urlopen(req).read())['access_token']

def parse_pdf(pdf_data):
    """解析 PDF - 最終修正版（與 trip-flight-parser-final.py 相同）"""
    pdf = PyPDF2.PdfReader(io.BytesIO(pdf_data))
    text = "".join(p.extract_text() for p in pdf.pages)
    
    data = {}
    
    # 1. 訂單編號
    m = re.search(r'訂單編號\s+(\d{13,})', text)
    if not m:
        return None
    data['order_no'] = m.group(1)
    
    # 2. 找航段標題
    route_headers = list(re.finditer(r'([^\n]{2,20})\s*-\s*([^\n]{2,20})\n姓名', text))
    
    # 3. 提取所有旅客（統一邏輯）
    all_passengers = []
    
    # 格式1：姓名 艙等 PNR（無機票號）
    for pm in re.finditer(r'([A-Z]+)\s+\(姓\)\s+([A-Z]+)\s+\(名\)\s*(經濟艙|商務艙|頭等艙)\s+([A-Z0-9]{6})(?:\s|$|\n)', text):
        all_passengers.append({
            'name': f"{pm.group(1)}/{pm.group(2)}",
            'cabin': pm.group(3),
            'pnr': pm.group(4),
            'pos': pm.start()
        })
    
    # 格式2：姓名 艙等 機票號PNR（緊鄰，無空格）
    for pm in re.finditer(r'([A-Z]+)\s+\(姓\)\s+([A-Z]+)\s+\(名\)\s*(經濟艙|商務艙|頭等艙)\s+([\d\-]+)([A-Z0-9]{6})(?:\s|$|\n)', text):
        all_passengers.append({
            'name': f"{pm.group(1)}/{pm.group(2)}",
            'cabin': pm.group(3),
            'ticket_no': pm.group(4),
            'pnr': pm.group(5),
            'pos': pm.start()
        })
    
    # 格式3：姓名 艙等 機票號 PNR（有空格，非貪婪）
    for pm in re.finditer(r'([A-Z]+)\s+\(姓\)\s+([A-Z]+)\s+\(名\)\s*(經濟艙|商務艙|頭等艙)\s+([\d\-\s]+?)\s+([A-Z0-9]{6})(?:\s|$|\n)', text):
        all_passengers.append({
            'name': f"{pm.group(1)}/{pm.group(2)}",
            'cabin': pm.group(3),
            'ticket_no': pm.group(4).replace(' ', '').strip(),
            'pnr': pm.group(5),
            'pos': pm.start()
        })
    
    # 4. 組織航段
    segments = []
    
    if route_headers:
        # 多航段
        for i, route in enumerate(route_headers):
            seg = {
                'route': f"{route.group(1).strip()} - {route.group(2).strip()}",
                'departure_city': route.group(1).strip(),
                'arrival_city': route.group(2).strip()
            }
            
            # 找屬於這個航段的旅客（在航段區塊範圍內）
            start = route.end()
            end = route_headers[i+1].start() if i+1 < len(route_headers) else len(text)
            
            seg_passengers = [p for p in all_passengers if start <= p['pos'] < end]
            if seg_passengers:
                # 去掉 pos（只用於分組）
                for p in seg_passengers:
                    del p['pos']
                seg['passengers'] = seg_passengers
                seg['pnr'] = seg_passengers[0]['pnr']
                seg['cabin_class'] = seg_passengers[0]['cabin']
                if 'ticket_no' in seg_passengers[0]:
                    seg['ticket_no'] = seg_passengers[0]['ticket_no']
            
            segments.append(seg)
    else:
        # 單航段
        seg = {}
        
        if all_passengers:
            for p in all_passengers:
                del p['pos']
            seg['passengers'] = all_passengers
            seg['pnr'] = all_passengers[0]['pnr']
            seg['cabin_class'] = all_passengers[0]['cabin']
            if 'ticket_no' in all_passengers[0]:
                seg['ticket_no'] = all_passengers[0]['ticket_no']
        
        # 路線
        m = re.search(r'([^\n]{2,15})\s*-\s*([^\n]{2,15})', text)
        if m:
            seg['route'] = f"{m.group(1).strip()} - {m.group(2).strip()}"
            seg['departure_city'] = m.group(1).strip()
            seg['arrival_city'] = m.group(2).strip()
        
        segments.append(seg)
    
    # 5. 航班資訊（分段匹配）
    dep_positions = [m.start() for m in re.finditer(r'出發\s+\d{4}', text)]
    
    flight_blocks = []
    for dep_pos in dep_positions:
        block = text[dep_pos:dep_pos+500]
        fm = re.search(
            r'出發\s+(\d{4}).+?(\d{1,2}).+?(\d{1,2}).+?(\d{2}):(\d{2}),\s*([^\n]+?)\s+(T\d+)?'
            r'.*?'
            r'抵達\s+(\d{4}).+?(\d{1,2}).+?(\d{1,2}).+?(\d{2}):(\d{2}),\s*([^\n]+?)\s+(T\d+)?'
            r'.*?'
            r'航空公司\s+([^\n]+?)\s+([A-Z]{2}\d{3,4})',
            block, re.DOTALL
        )
        if fm:
            flight_blocks.append(fm)
    
    for i, seg in enumerate(segments):
        if i < len(flight_blocks):
            fb = flight_blocks[i]
            seg['departure_date'] = f"{fb.group(1)}-{fb.group(2).zfill(2)}-{fb.group(3).zfill(2)}"
            seg['departure_time'] = f"{fb.group(4)}:{fb.group(5)}"
            seg['departure_airport'] = fb.group(6).strip()
            if fb.group(7):
                seg['departure_terminal'] = fb.group(7)
            
            seg['arrival_date'] = f"{fb.group(8)}-{fb.group(9).zfill(2)}-{fb.group(10).zfill(2)}"
            seg['arrival_time'] = f"{fb.group(11)}:{fb.group(12)}"
            seg['arrival_airport'] = fb.group(13).strip()
            if fb.group(14):
                seg['arrival_terminal'] = fb.group(14)
            
            seg['airline'] = fb.group(15).strip()
            seg['flight_no'] = fb.group(16)
    
    data['segments'] = segments
    
    # 6. 頂層欄位
    if segments:
        first = segments[0]
        data.update({
            'route': first.get('route', ''),
            'pnr': first.get('pnr', ''),
            'flight_no': first.get('flight_no', ''),
            'departure_date': first.get('departure_date', ''),
            'departure_time': first.get('departure_time', ''),
            'cabin_class': first.get('cabin_class', ''),
            'airline': first.get('airline', '')
        })
        
        # 旅客去重
        all_pax = []
        seen = set()
        for seg in segments:
            for p in seg.get('passengers', []):
                if p['name'] not in seen:
                    seen.add(p['name'])
                    all_pax.append(p)
        
        data['passengers'] = all_pax
        data['passenger_names'] = ', '.join(p['name'] for p in all_pax)
    
    return data

def parse_single_message(message_id, access_token):
    """解析單一郵件（用於測試）"""
    try:
        # 取得郵件
        req = urllib.request.Request(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
            headers={'Authorization': f'Bearer {access_token}'}
        )
        message = json.loads(urllib.request.urlopen(req).read())
        
        # 找 PDF 附件
        def find_pdfs(parts):
            pdfs = []
            for part in parts:
                if part.get('filename', '').endswith('.pdf'):
                    if aid := part.get('body', {}).get('attachmentId'):
                        pdfs.append({'fn': part['filename'], 'id': aid})
                if 'parts' in part:
                    pdfs.extend(find_pdfs(part['parts']))
            return pdfs
        
        pdfs = find_pdfs(message.get('payload', {}).get('parts', []))
        itinerary = next((p for p in pdfs if '行程單' in p['fn']), None)
        
        if not itinerary:
            return {"error": "找不到行程單.pdf 附件"}
        
        # 下載 PDF
        req = urllib.request.Request(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/attachments/{itinerary['id']}",
            headers={'Authorization': f'Bearer {access_token}'}
        )
        att = json.loads(urllib.request.urlopen(req).read())
        pdf_data = base64.urlsafe_b64decode(att['data'])
        
        # 解析
        result = parse_pdf(pdf_data)
        
        if result:
            # 加上郵件資訊
            headers = {h['name']: h['value'] for h in message.get('payload', {}).get('headers', [])}
            result['email_id'] = message_id
            result['email_date'] = headers.get('Date', '')
            result['email_subject'] = headers.get('Subject', '')
            return result
        else:
            return {"error": "PDF 解析失敗"}
    
    except Exception as e:
        return {"error": str(e)}

def main():
    """主程式 - 支援多種模式"""
    
    # 解析命令列參數
    if len(sys.argv) < 2:
        print(json.dumps({"error": "請指定模式：--pdf-base64 | --gmail | --message-id"}))
        sys.exit(1)
    
    mode = sys.argv[1]
    
    try:
        if mode == '--pdf-base64':
            # n8n 模式：接收 base64 PDF
            if len(sys.argv) < 3:
                print(json.dumps({"error": "缺少 PDF base64 資料"}))
                sys.exit(1)
            
            pdf_base64 = sys.argv[2]
            pdf_data = base64.b64decode(pdf_base64)
            result = parse_pdf(pdf_data)
            
            if result:
                print(json.dumps(result, ensure_ascii=False))
                sys.exit(0)
            else:
                print(json.dumps({"error": "PDF 解析失敗"}))
                sys.exit(1)
        
        elif mode == '--message-id':
            # 單一郵件測試
            if len(sys.argv) < 3:
                print(json.dumps({"error": "缺少 message ID"}))
                sys.exit(1)
            
            message_id = sys.argv[2]
            access_token = refresh_token()
            result = parse_single_message(message_id, access_token)
            
            print(json.dumps(result, ensure_ascii=False, indent=2))
            sys.exit(0 if 'error' not in result else 1)
        
        elif mode == '--gmail':
            # Gmail 批次模式（執行原始的 main 邏輯）
            print(json.dumps({"error": "Gmail 批次模式請使用 trip-flight-parser-final.py"}))
            sys.exit(1)
        
        else:
            print(json.dumps({"error": f"未知模式: {mode}"}))
            sys.exit(1)
    
    except Exception as e:
        import traceback
        error_detail = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_detail, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()
