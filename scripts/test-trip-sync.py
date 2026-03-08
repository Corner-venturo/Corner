#!/usr/bin/env python3
"""
測試 Trip.com 訂單同步系統
驗證 Parser + Google Sheets 整合
"""

import json
import urllib.request
import urllib.parse
import os
import sys

def get_access_token():
    """取得 Gmail access token"""
    CREDENTIALS_DIR = os.path.expanduser('~/Projects/venturo-erp/.credentials')
    TOKEN_FILE = os.path.join(CREDENTIALS_DIR, 'google-token.json')
    
    if not os.path.exists(TOKEN_FILE):
        print("❌ 找不到 google-token.json")
        return None
    
    token_data = json.load(open(TOKEN_FILE))
    oauth_file = os.path.join(CREDENTIALS_DIR, 'google-oauth.json')
    oauth_data = json.load(open(oauth_file))
    
    params = urllib.parse.urlencode({
        'refresh_token': token_data['refresh_token'],
        'client_id': oauth_data['installed']['client_id'],
        'client_secret': oauth_data['installed']['client_secret'],
        'grant_type': 'refresh_token'
    }).encode()
    
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=params, method='POST')
    new_token = json.loads(urllib.request.urlopen(req).read())
    
    return new_token['access_token']

def get_latest_messages(access_token, count=3):
    """取得最新的 Trip.com 郵件"""
    query = 'from:trip.com subject:機票訂單確認郵件'
    req = urllib.request.Request(
        f'https://gmail.googleapis.com/gmail/v1/users/me/messages?q={urllib.parse.quote(query)}&maxResults={count}',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    messages = json.loads(urllib.request.urlopen(req).read()).get('messages', [])
    return messages

def test_parser_on_message(message_id):
    """測試 parser 是否能正確解析郵件"""
    import subprocess
    
    cmd = [
        'python3',
        os.path.expanduser('~/Projects/venturo-erp/scripts/trip-flight-parser-n8n.py'),
        '--message-id',
        message_id
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        return json.loads(result.stdout)
    else:
        return {"error": result.stderr}

def check_google_sheet():
    """檢查 Google Sheet 是否已建立"""
    config_file = os.path.expanduser('~/Projects/venturo-erp/.credentials/trip-sheet.json')
    
    if not os.path.exists(config_file):
        return None
    
    return json.load(open(config_file))

def main():
    print("🧪 Trip.com 訂單同步系統測試\n")
    print("="*60)
    
    # 1. 檢查 Google Sheet
    print("\n📊 檢查 Google Sheet...")
    sheet_info = check_google_sheet()
    
    if sheet_info:
        print(f"✅ Google Sheet 已建立")
        print(f"   ID: {sheet_info['spreadsheet_id']}")
        print(f"   URL: {sheet_info['spreadsheet_url']}")
    else:
        print("⚠️  Google Sheet 尚未建立")
        print("   請先執行: python3 scripts/create-trip-sheet.py")
        return
    
    # 2. 取得 Gmail access token
    print("\n📡 取得 Gmail access token...")
    access_token = get_access_token()
    
    if not access_token:
        print("❌ 無法取得 access token")
        return
    
    print("✅ Access token 已取得")
    
    # 3. 取得最新郵件
    print("\n📧 取得最新 3 封 Trip.com 郵件...")
    messages = get_latest_messages(access_token, 3)
    
    if not messages:
        print("❌ 找不到 Trip.com 郵件")
        return
    
    print(f"✅ 找到 {len(messages)} 封郵件")
    
    # 4. 測試解析
    print("\n🔍 測試 PDF 解析...")
    print("-"*60)
    
    success_count = 0
    failed_count = 0
    
    for i, msg in enumerate(messages, 1):
        print(f"\n[{i}/{len(messages)}] 處理郵件 {msg['id']}...")
        
        result = test_parser_on_message(msg['id'])
        
        if 'error' in result:
            print(f"   ❌ 失敗: {result['error']}")
            failed_count += 1
        else:
            print(f"   ✅ 成功")
            print(f"      訂單: {result.get('order_no', 'N/A')}")
            print(f"      航線: {result.get('route', 'N/A')}")
            print(f"      航班: {result.get('flight_no', 'N/A')}")
            print(f"      旅客: {result.get('passenger_names', 'N/A')}")
            success_count += 1
    
    # 5. 摘要
    print("\n" + "="*60)
    print("📊 測試摘要")
    print("="*60)
    print(f"✅ 成功: {success_count}/{len(messages)}")
    print(f"❌ 失敗: {failed_count}/{len(messages)}")
    
    if success_count >= 3:
        print("\n🎉 測試通過！系統可以部署")
        print("\n下一步：")
        print("1. 安裝 n8n: docker run -d --name n8n -p 5678:5678 n8nio/n8n")
        print("2. 匯入 workflow: n8n-workflows/trip-flight-sync.json")
        print("3. 設定 credentials（Gmail OAuth2, Google Sheets OAuth2, Telegram Bot）")
        print("4. 更新 workflow 中的 Spreadsheet ID")
        print("5. 啟用 workflow")
    else:
        print("\n⚠️  測試未完全通過，請檢查錯誤訊息")
    
    print("\n💡 提示：")
    print("   - 查看完整文件: docs/n8n-trip-flight-workflow.md")
    print("   - 手動測試單一郵件: python3 scripts/trip-flight-parser-n8n.py --message-id <ID>")

if __name__ == '__main__':
    main()
