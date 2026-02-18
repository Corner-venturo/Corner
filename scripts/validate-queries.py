#!/usr/bin/env python3
"""
Validate all Supabase .from().select() queries against actual DB schema.
Usage: python3 scripts/validate-queries.py [--online]
"""

import json, re, glob, sys, subprocess, os

def get_db_schema():
    """Fetch real DB schema from Supabase API"""
    cred_path = os.path.expanduser('~/Projects/venturo-erp/.claude/SUPABASE_CREDENTIALS.md')
    with open(cred_path) as f:
        content = f.read()
    token = re.search(r'sbp_[a-zA-Z0-9]+', content).group(0)
    
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://api.supabase.com/v1/projects/pfqvdacxowpgfamuvnsn/database/query',
        '-H', f'Authorization: Bearer {token}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"query": "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position"})
    ], capture_output=True, text=True)
    
    data = json.loads(result.stdout)
    tables = {}
    for row in data:
        tables.setdefault(row['table_name'], []).append(row['column_name'])
    return tables

def scan_queries(src_dir, db):
    """Scan .from().select() patterns and validate against schema"""
    issues = []
    files = glob.glob(f'{src_dir}/**/*.ts', recursive=True) + glob.glob(f'{src_dir}/**/*.tsx', recursive=True)
    
    for fpath in files:
        if 'node_modules' in fpath or '.test.' in fpath:
            continue
        try:
            content = open(fpath).read()
        except:
            continue
        
        for m in re.finditer(r"\.from\(['\"](\w+)['\"]\)", content):
            table = m.group(1)
            line = content[:m.start()].count('\n') + 1
            
            if table not in db:
                issues.append(('TABLE_MISSING', table, None, fpath, line))
                continue
            
            # Find .select() in chain
            after = content[m.end():m.end()+300]
            cut = len(after)
            for stop in [re.search(r';', after), re.search(r'\.from\(', after)]:
                if stop and stop.start() < cut:
                    cut = stop.start()
            after = after[:cut]
            
            sel = re.search(r"\.select\(['\"]([^'\"]+)['\"]\)", after)
            if not sel or sel.group(1) == '*':
                continue
            
            # Remove join aliases and nested selects
            cleaned = re.sub(r'\w+:\w+\([^)]*\)', '', sel.group(1))
            cleaned = re.sub(r'\w+\([^)]*\)', '', cleaned)
            fields = [f.strip() for f in cleaned.split(',') if f.strip()]
            fields = [f for f in fields if re.match(r'^[a-z_]+$', f)]
            
            for field in fields:
                if field in db:  # It's a relation name
                    continue
                if field not in db[table]:
                    issues.append(('COLUMN_MISSING', table, field, fpath, line))
    
    return issues

if __name__ == '__main__':
    is_online = '--online' in sys.argv
    src_dir = os.path.expanduser('~/Projects/venturo-online/src' if is_online else '~/Projects/venturo-erp/src')
    label = 'Online' if is_online else 'ERP'
    
    print(f'🔍 Fetching DB schema...')
    db = get_db_schema()
    print(f'   {len(db)} tables loaded')
    
    print(f'\n🔍 Scanning {label} queries in {src_dir}...')
    issues = scan_queries(src_dir, db)
    
    # Deduplicate
    unique = list(dict.fromkeys(issues))
    
    tables_missing = [i for i in unique if i[0] == 'TABLE_MISSING']
    cols_missing = [i for i in unique if i[0] == 'COLUMN_MISSING']
    
    if not unique:
        print(f'\n✅ {label}: All queries valid!')
    else:
        if tables_missing:
            print(f'\n❌ Missing tables ({len(tables_missing)}):')
            for _, tbl, _, fpath, line in tables_missing:
                print(f'   {tbl} — {fpath}:{line}')
        if cols_missing:
            print(f'\n❌ Missing columns ({len(cols_missing)}):')
            for _, tbl, col, fpath, line in cols_missing:
                print(f'   {tbl}.{col} — {fpath}:{line}')
    
    sys.exit(1 if unique else 0)
