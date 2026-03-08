#!/usr/bin/env python3
"""
建立 Google Sheet：Trip.com 機票訂單
並授權給 Venturo ERP 服務帳號
"""

import json
import urllib.request
import urllib.parse
import os

def get_access_token():
    """從 OAuth token 取得 access token"""
    CREDENTIALS_DIR = os.path.expanduser('~/Projects/venturo-erp/.credentials')
    TOKEN_FILE = os.path.join(CREDENTIALS_DIR, 'google-token.json')
    
    if not os.path.exists(TOKEN_FILE):
        print("❌ 找不到 google-token.json")
        print("請先執行 google-auth-init.py 進行初次認證")
        exit(1)
    
    token_data = json.load(open(TOKEN_FILE))
    
    # 如果 token 過期，refresh
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

def create_spreadsheet(access_token):
    """建立 Google Sheet"""
    
    spreadsheet_body = {
        "properties": {
            "title": "Trip.com 機票訂單"
        },
        "sheets": [
            {
                "properties": {
                    "title": "訂單列表",
                    "gridProperties": {
                        "frozenRowCount": 2  # 凍結前兩行（標題+說明）
                    }
                },
                "data": [
                    {
                        "startRow": 0,
                        "startColumn": 0,
                        "rowData": [
                            {
                                # 第一行：欄位說明
                                "values": [
                                    {"userEnteredValue": {"stringValue": "訂單編號"}},
                                    {"userEnteredValue": {"stringValue": "航線"}},
                                    {"userEnteredValue": {"stringValue": "航班號"}},
                                    {"userEnteredValue": {"stringValue": "PNR"}},
                                    {"userEnteredValue": {"stringValue": "出發日期"}},
                                    {"userEnteredValue": {"stringValue": "出發時間"}},
                                    {"userEnteredValue": {"stringValue": "航空公司"}},
                                    {"userEnteredValue": {"stringValue": "旅客"}},
                                    {"userEnteredValue": {"stringValue": "機票號碼"}},
                                    {"userEnteredValue": {"stringValue": "狀態"}},
                                    {"userEnteredValue": {"stringValue": "同步時間"}}
                                ]
                            },
                            {
                                # 第二行：欄位說明註釋
                                "values": [
                                    {"userEnteredValue": {"stringValue": "Trip.com 13位數訂單編號"}},
                                    {"userEnteredValue": {"stringValue": "如：台北 - 東京"}},
                                    {"userEnteredValue": {"stringValue": "航空公司代碼+數字"}},
                                    {"userEnteredValue": {"stringValue": "6位英數字訂位代號"}},
                                    {"userEnteredValue": {"stringValue": "YYYY-MM-DD"}},
                                    {"userEnteredValue": {"stringValue": "HH:MM"}},
                                    {"userEnteredValue": {"stringValue": "如：捷星日本航空"}},
                                    {"userEnteredValue": {"stringValue": "姓/名，多人用逗號分隔"}},
                                    {"userEnteredValue": {"stringValue": "電子機票號碼"}},
                                    {"userEnteredValue": {"stringValue": "已確認/已取消"}},
                                    {"userEnteredValue": {"stringValue": "最後同步的時間"}}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
    
    # 建立 spreadsheet
    req = urllib.request.Request(
        'https://sheets.googleapis.com/v4/spreadsheets',
        data=json.dumps(spreadsheet_body).encode(),
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    
    response = json.loads(urllib.request.urlopen(req).read())
    spreadsheet_id = response['spreadsheetId']
    spreadsheet_url = response['spreadsheetUrl']
    
    print(f"✅ Google Sheet 已建立")
    print(f"   ID: {spreadsheet_id}")
    print(f"   URL: {spreadsheet_url}")
    
    return spreadsheet_id, spreadsheet_url

def format_header(access_token, spreadsheet_id):
    """格式化標題行"""
    
    requests = [
        {
            # 標題行加粗、背景色
            "repeatCell": {
                "range": {
                    "sheetId": 0,
                    "startRowIndex": 0,
                    "endRowIndex": 1
                },
                "cell": {
                    "userEnteredFormat": {
                        "backgroundColor": {"red": 0.2, "green": 0.6, "blue": 0.8},
                        "textFormat": {
                            "bold": True,
                            "foregroundColor": {"red": 1, "green": 1, "blue": 1}
                        },
                        "horizontalAlignment": "CENTER"
                    }
                },
                "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
            }
        },
        {
            # 說明行淺灰色背景
            "repeatCell": {
                "range": {
                    "sheetId": 0,
                    "startRowIndex": 1,
                    "endRowIndex": 2
                },
                "cell": {
                    "userEnteredFormat": {
                        "backgroundColor": {"red": 0.95, "green": 0.95, "blue": 0.95},
                        "textFormat": {
                            "italic": True,
                            "fontSize": 9
                        }
                    }
                },
                "fields": "userEnteredFormat(backgroundColor,textFormat)"
            }
        }
    ]
    
    req = urllib.request.Request(
        f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}:batchUpdate',
        data=json.dumps({"requests": requests}).encode(),
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    
    urllib.request.urlopen(req)
    print("✅ 標題格式已設定")

def share_with_service_account(access_token, spreadsheet_id):
    """授權給服務帳號"""
    
    CREDENTIALS_DIR = os.path.expanduser('~/Projects/venturo-erp/.credentials')
    SA_FILE = os.path.join(CREDENTIALS_DIR, 'service-account.json')
    
    if not os.path.exists(SA_FILE):
        print("⚠️  找不到 service-account.json，跳過服務帳號授權")
        print("   請稍後手動分享 Sheet 給服務帳號 email")
        return
    
    sa_data = json.load(open(SA_FILE))
    sa_email = sa_data['client_email']
    
    permission = {
        "type": "user",
        "role": "writer",
        "emailAddress": sa_email
    }
    
    req = urllib.request.Request(
        f'https://www.googleapis.com/drive/v3/files/{spreadsheet_id}/permissions',
        data=json.dumps(permission).encode(),
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    
    urllib.request.urlopen(req)
    print(f"✅ 已授權給服務帳號: {sa_email}")

def save_sheet_info(spreadsheet_id, spreadsheet_url):
    """儲存 Sheet 資訊到設定檔"""
    
    config_file = os.path.expanduser('~/Projects/venturo-erp/.credentials/trip-sheet.json')
    
    config = {
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_url": spreadsheet_url,
        "sheet_name": "訂單列表",
        "created_at": "2026-03-07"
    }
    
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Sheet 資訊已儲存到: {config_file}")

def main():
    print("🚀 建立 Trip.com 機票訂單 Google Sheet\n")
    
    try:
        # 1. 取得 access token
        print("📡 取得 Google API access token...")
        access_token = get_access_token()
        
        # 2. 建立 spreadsheet
        print("\n📝 建立 Google Sheet...")
        spreadsheet_id, spreadsheet_url = create_spreadsheet(access_token)
        
        # 3. 格式化標題
        print("\n🎨 設定標題格式...")
        format_header(access_token, spreadsheet_id)
        
        # 4. 授權給服務帳號
        print("\n🔐 授權給服務帳號...")
        share_with_service_account(access_token, spreadsheet_id)
        
        # 5. 儲存設定
        print("\n💾 儲存設定...")
        save_sheet_info(spreadsheet_id, spreadsheet_url)
        
        print("\n" + "="*60)
        print("✅ 完成！")
        print("="*60)
        print(f"\n📊 Google Sheet URL:")
        print(f"   {spreadsheet_url}")
        print(f"\n📝 Spreadsheet ID:")
        print(f"   {spreadsheet_id}")
        print(f"\n💡 下一步：執行 n8n workflow 開始自動同步")
        
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == '__main__':
    main()
