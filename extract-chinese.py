#!/usr/bin/env python3
"""
v5 - Respects existing labels imports. Uses existing variable names and labels files.
"""
import re, os, sys, subprocess

def chinese_to_key(text):
    h = abs(hash(text)) % 9999
    fm = {
        '載入中': 'LOADING', '處理中': 'PROCESSING', '請稍候': 'PLEASE_WAIT',
        '新增': 'ADD', '編輯': 'EDIT', '刪除': 'DELETE', '儲存': 'SAVE',
        '取消': 'CANCEL', '確認': 'CONFIRM', '確定': 'CONFIRM', '搜尋': 'SEARCH',
        '匯出': 'EXPORT', '匯入': 'IMPORT', '上傳': 'UPLOAD', '下載': 'DOWNLOAD',
        '返回': 'BACK', '關閉': 'CLOSE', '提交': 'SUBMIT', '重設': 'RESET',
        '清除': 'CLEAR', '全部': 'ALL', '預覽': 'PREVIEW', '列印': 'PRINT',
        '複製': 'COPY', '選擇': 'SELECT', '選填': 'OPTIONAL', '必填': 'REQUIRED',
        '操作': 'ACTIONS', '設定': 'SETTINGS', '總計': 'TOTAL', '備註': 'REMARKS',
        '名稱': 'NAME', '標題': 'TITLE', '日期': 'DATE', '時間': 'TIME',
        '金額': 'AMOUNT', '數量': 'QUANTITY', '狀態': 'STATUS', '類型': 'TYPE',
        '建立': 'CREATE', '更新': 'UPDATE', '管理': 'MANAGE',
    }
    if text in fm: return fm[text]
    if '請選擇' in text: return f'PLEASE_SELECT_{h}'
    if '請輸入' in text: return f'PLEASE_ENTER_{h}'
    if '搜尋' in text: return f'SEARCH_{h}'
    if '新增' in text: return f'ADD_{h}'
    if '編輯' in text: return f'EDIT_{h}'
    if '刪除' in text: return f'DELETE_{h}'
    if '載入' in text: return f'LOADING_{h}'
    if '處理' in text: return f'PROCESSING_{h}'
    if '上傳' in text: return f'UPLOADING_{h}'
    if '儲存' in text: return f'SAVING_{h}'
    if '找不到' in text or '沒有' in text: return f'NOT_FOUND_{h}'
    if '尚無' in text or '暫無' in text: return f'EMPTY_{h}'
    if '管理' in text: return f'MANAGE_{h}'
    if '總' in text: return f'TOTAL_{h}'
    if '選擇' in text: return f'SELECT_{h}'
    if '確定' in text or '確認' in text: return f'CONFIRM_{h}'
    if '計算' in text or '計時' in text: return f'CALCULATING_{h}'
    if '查詢' in text: return f'QUERYING_{h}'
    if '生成' in text: return f'GENERATING_{h}'
    if '複製' in text: return f'COPYING_{h}'
    if '發送' in text: return f'SENDING_{h}'
    if '設定' in text: return f'SETTINGS_{h}'
    if '篩選' in text: return f'FILTER_{h}'
    if '匯出' in text: return f'EXPORT_{h}'
    if '列印' in text: return f'PRINT_{h}'
    if '預覽' in text: return f'PREVIEW_{h}'
    if '例如' in text: return f'EXAMPLE_{h}'
    return f'LABEL_{h}'


def find_chinese_in_jsx(content):
    extractions = []
    lines = content.split('\n')
    in_block_comment = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if '/*' in stripped: in_block_comment = True
        if '*/' in stripped: in_block_comment = False; continue
        if in_block_comment or stripped.startswith('//') or stripped.startswith('*'): continue
        skip = ['toast.', 'toast(', 'console.', 'throw ', 'new Error(', 'logger.', 'LABELS.', 'LABELS[']
        if any(x in line for x in skip): continue
        if not re.search(r'[\u4e00-\u9fff]', line): continue
        if re.search(r'Record<|Promise<|Partial<|Array<|Set<|Map<|\.length\s*>', line): continue
        
        # >text</
        for m in re.finditer(r'>\s*([\u4e00-\u9fff][\u4e00-\u9fff\w\s（）()、，。：:／/\-·「」【】～~%《》\*\.…！？]*?)\s*</', line):
            ch = m.group(1).strip()
            if ch: extractions.append({'line': i+1, 'text': ch, 'type': 'jsx_text'})
        
        # >text{
        for m in re.finditer(r'>\s*([\u4e00-\u9fff][\u4e00-\u9fff\w\s（）()、，。：:／/\-·「」【】～~%《》\*\.…！？]*?)\s*\{', line):
            ch = m.group(1).strip()
            if ch: extractions.append({'line': i+1, 'text': ch, 'type': 'jsx_text'})
        
        # >text at end of line
        m = re.search(r'>\s*([\u4e00-\u9fff][\u4e00-\u9fff\w\s（）()、，。：:／/\-·「」【】～~%《》\*\.…！？]*?)\s*$', line)
        if m:
            ch = m.group(1).strip()
            if ch: extractions.append({'line': i+1, 'text': ch, 'type': 'jsx_text'})
        
        # standalone Chinese line in JSX
        m = re.match(r'^\s*([\u4e00-\u9fff][\u4e00-\u9fff\w\s（）()、，。：:／/\-·「」【】～~%《》\*\.…！？]*?)\s*$', line)
        if m and i > 0:
            ch = m.group(1).strip()
            prev = lines[i-1].strip() if i > 0 else ''
            nxt = lines[i+1].strip() if i < len(lines)-1 else ''
            if ('>' in prev) and ('<' in nxt or '{' in nxt or nxt.startswith('</')):
                extractions.append({'line': i+1, 'text': ch, 'type': 'jsx_multiline'})
        
        # JSX string props
        if '<' in line or 'className' in line or re.search(r'^\s+\w+=', line):
            for m in re.finditer(r'(?<=\s)(title|placeholder|label|description|header|alt|aria-label|buttonText|emptyText|heading|subheading)\s*=\s*"([^"]*[\u4e00-\u9fff][^"]*)"', line):
                extractions.append({'line': i+1, 'text': m.group(2), 'type': 'prop', 'prop_name': m.group(1)})
    
    seen = set()
    unique = []
    for ext in extractions:
        if ext['text'] not in seen:
            seen.add(ext['text'])
            unique.append(ext)
    return unique


def find_existing_labels_import(content, filepath):
    """Find if this file already imports from a labels file.
    Returns (alias_name, original_name, labels_file_path) or (None, None, None).
    alias_name = what's used in the TSX code
    original_name = what's exported in labels.ts
    """
    # Check for aliased imports first: import { X as Y } from '...'
    for m in re.finditer(r"import\s+\{\s*(\w+)\s+as\s+(\w+)\s*\}\s+from\s+'([^']*labels[^']*)'", content):
        original = m.group(1)
        alias = m.group(2)
        import_path = m.group(3)
        dirpath = os.path.dirname(filepath)
        abs_path = os.path.normpath(os.path.join(dirpath, import_path + '.ts'))
        if os.path.exists(abs_path):
            return alias, original, abs_path
    
    # Regular imports
    for m in re.finditer(r"import\s+\{[^}]*?(\w+)\s*\}\s+from\s+'([^']*labels[^']*)'", content):
        var_name = m.group(1)
        import_path = m.group(2)
        dirpath = os.path.dirname(filepath)
        abs_path = os.path.normpath(os.path.join(dirpath, import_path + '.ts'))
        if os.path.exists(abs_path):
            return var_name, var_name, abs_path
    
    return None, None, None


def get_labels_var_name(dirpath):
    dirname = os.path.basename(dirpath)
    if dirname in ('components', 'sections', 'tabs', 'hooks', 'editors'):
        dirname = os.path.basename(os.path.dirname(dirpath))
    if dirname in ('components', 'sections', 'tabs', 'hooks'):
        dirname = os.path.basename(os.path.dirname(os.path.dirname(dirpath)))
    dirname = dirname.strip('[]')
    dirname = re.sub(r'[^a-zA-Z0-9]', '_', dirname)
    dirname = re.sub(r'_+', '_', dirname).strip('_').upper()
    if not dirname: dirname = 'PAGE'
    return f'{dirname}_LABELS'


def find_export_block(content, var_name):
    """Find the start and end positions of an export const block using brace counting."""
    pattern = rf'export\s+const\s+{re.escape(var_name)}\s*=\s*\{{'
    m = re.search(pattern, content)
    if not m: return None, None
    start = m.end()  # right after the opening {
    depth = 1; pos = start
    while pos < len(content) and depth > 0:
        ch = content[pos]
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
        # Skip string literals
        elif ch in ("'", '"', '`'):
            quote = ch; pos += 1
            while pos < len(content):
                if content[pos] == '\\': pos += 2; continue
                if content[pos] == quote: break
                if quote == '`' and content[pos] == '$' and pos+1 < len(content) and content[pos+1] == '{':
                    # Skip template expression entirely
                    pos += 2  # skip ${
                    tdepth = 1
                    while pos < len(content) and tdepth > 0:
                        if content[pos] == '{': tdepth += 1
                        elif content[pos] == '}': tdepth -= 1
                        elif content[pos] in ("'", '"', '`'):
                            q2 = content[pos]; pos += 1
                            while pos < len(content) and content[pos] != q2:
                                if content[pos] == '\\': pos += 1
                                pos += 1
                        pos += 1
                    continue
                pos += 1
        pos += 1
    return start, pos - 1  # pos-1 is the closing }

def read_existing_labels(labels_file, target_var=None):
    if not os.path.exists(labels_file): return None, {}
    with open(labels_file, 'r') as f: content = f.read()
    
    if target_var:
        start, end = find_export_block(content, target_var)
        if start is not None:
            block = content[start:end]
            existing = {}
            for m2 in re.finditer(r"(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'", block): existing[m2.group(2)] = m2.group(1)
            for m2 in re.finditer(r'(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"', block): existing[m2.group(2)] = m2.group(1)
            return target_var, existing
        return target_var, {}
    
    m = re.search(r'export\s+const\s+(\w+)\s*=\s*\{', content)
    var_name = m.group(1) if m else None
    existing = {}
    for m in re.finditer(r"(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'", content): existing[m.group(2)] = m.group(1)
    for m in re.finditer(r'(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"', content): existing[m.group(2)] = m.group(1)
    return var_name, existing


def append_labels(labels_file, var_name, new_labels):
    if not new_labels: return
    os.makedirs(os.path.dirname(labels_file), exist_ok=True)
    if os.path.exists(labels_file):
        with open(labels_file, 'r') as f: lc = f.read()
        
        start, close_pos = find_export_block(lc, var_name)
        if close_pos is not None:
            before = lc[:close_pos].rstrip()
            needs_comma = not before.endswith(',') and not before.endswith('{')
            insert = ''
            if needs_comma: insert += ','
            insert += '\n'
            for key, text in new_labels.items():
                insert += f"  {key}: '{text.replace(chr(39), chr(92)+chr(39))}',\n"
            lc = lc[:close_pos] + insert + lc[close_pos:]
        else:
            # var_name not found in file - append new export
            insert = f"\n\nexport const {var_name} = {{\n"
            for key, text in new_labels.items():
                insert += f"  {key}: '{text.replace(chr(39), chr(92)+chr(39))}',\n"
            insert += '}\n'
            lc += insert
        
        with open(labels_file, 'w') as f: f.write(lc)
    else:
        lines = [f"export const {var_name} = {{"]
        for key, text in new_labels.items():
            lines.append(f"  {key}: '{text.replace(chr(39), chr(92)+chr(39))}',")
        lines.append('}'); lines.append('')
        with open(labels_file, 'w') as f: f.write('\n'.join(lines))


def find_last_import_position(content):
    lines = content.split('\n')
    last = -1; depth = 0; in_import = False
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith('import '):
            in_import = True; depth += s.count('{') - s.count('}')
            if depth <= 0: last = i; in_import = False; depth = 0
        elif in_import:
            depth += s.count('{') - s.count('}')
            if depth <= 0: last = i; in_import = False; depth = 0
    return last


def process_file(filepath, dry_run=False):
    """Process a single file."""
    with open(filepath, 'r') as f: content = f.read()
    
    exts = find_chinese_in_jsx(content)
    if not exts: return False
    
    # Find existing labels import
    alias_name, original_name, labels_file = find_existing_labels_import(content, filepath)
    # alias_name = used in TSX, original_name = exported in labels.ts
    
    if not labels_file:
        # No existing import - create new labels in same directory
        dirpath = os.path.dirname(filepath)
        labels_dir = os.path.join(dirpath, 'constants')
        labels_file = os.path.join(labels_dir, 'labels.ts')
        
        if os.path.exists(labels_file):
            file_var, _ = read_existing_labels(labels_file)
            original_name = file_var or get_labels_var_name(dirpath)
        else:
            original_name = get_labels_var_name(dirpath)
        alias_name = original_name  # No alias for new imports
    
    var_name = alias_name  # Used in TSX code
    export_name = original_name  # Used in labels.ts
    
    # Read existing labels from the target file for the specific export
    _, existing_map = read_existing_labels(labels_file, export_name)
    
    new_labels = {}
    used_keys = set(existing_map.values())
    
    for ext in exts:
        text = ext['text']
        if text in existing_map:
            ext['key'] = existing_map[text]
        else:
            found = False
            for k, v in new_labels.items():
                if v == text: ext['key'] = k; found = True; break
            if not found:
                key = chinese_to_key(text)
                orig = key; c = 1
                while key in used_keys: key = f'{orig}_{c}'; c += 1
                used_keys.add(key)
                new_labels[key] = text
                ext['key'] = key
    
    if dry_run:
        for ext in exts:
            print(f"  L{ext['line']}: '{ext['text']}' -> {var_name}.{ext['key']}")
        return True
    
    # Append new labels to the correct export in the file
    append_labels(labels_file, export_name, new_labels)
    
    # Replace in TSX
    modified = content
    for ext in exts:
        key = ext['key']; text = ext['text']
        escaped = re.escape(text)
        ref = f'{var_name}.{key}'
        
        if ext['type'] == 'jsx_text':
            for pattern, repl in [
                (r'>([\s]*)' + escaped + r'([\s]*)</', lambda m: f'>{m.group(1)}{{{ref}}}{m.group(2)}</'),
                (r'>([\s]*)' + escaped + r'([\s]*)<(?!/)', lambda m: f'>{m.group(1)}{{{ref}}}{m.group(2)}<'),
                (r'>([\s]*)' + escaped + r'([\s]*)\{', lambda m: f'>{m.group(1)}{{{ref}}}{m.group(2)}{{'),
                (r'>([\s]*)' + escaped + r'(\s*)$', lambda m: f'>{m.group(1)}{{{ref}}}{m.group(2)}'),
            ]:
                new = re.sub(pattern, repl, modified, count=1, flags=re.MULTILINE)
                if new != modified: modified = new; break
        elif ext['type'] == 'jsx_multiline':
            modified = re.sub(r'^(\s*)' + escaped + r'\s*$', rf'\1{{{ref}}}', modified, count=1, flags=re.MULTILINE)
        elif ext['type'] == 'prop':
            prop = ext['prop_name']
            modified = re.sub(rf'({prop}\s*=\s*)["\']' + escaped + r'["\']', rf'\1{{{ref}}}', modified, count=1)
    
    # Add import if needed
    if var_name not in content:
        rel_path = os.path.relpath(labels_file, os.path.dirname(filepath))
        if not rel_path.startswith('.'): rel_path = './' + rel_path
        rel_path = rel_path.replace('.ts', '').replace('\\', '/')
        import_line = f"import {{ {var_name} }} from '{rel_path}'"
        
        lines = modified.split('\n')
        insert_idx = find_last_import_position(modified) + 1
        lines.insert(insert_idx, import_line)
        modified = '\n'.join(lines)
    
    with open(filepath, 'w') as f: f.write(modified)
    return True


def main():
    dry_run = '--dry-run' in sys.argv
    
    result = subprocess.run(['grep', '-rln', '[\u4e00-\u9fff]', 'src/', '--include=*.tsx'], capture_output=True, text=True)
    all_files = [f for f in result.stdout.strip().split('\n') if f and '/constants/' not in f and '/labels.' not in f]
    
    total = 0
    for f in sorted(all_files):
        if process_file(f, dry_run):
            total += 1
            if not dry_run:
                print(f"  ✓ {f}")
    
    print(f"\nTotal: {total} files processed")


if __name__ == '__main__':
    main()
