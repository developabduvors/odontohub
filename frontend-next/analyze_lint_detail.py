import json
data = json.load(open('_lint.json', encoding='utf-8'))
for f in data:
    rel = f['filePath'].split('frontend-next', 1)[-1].lstrip('/\\')
    for m in f.get('messages', []):
        print(f'{rel}:{m["line"]}:{m.get("endLine",m["line"])}  {m["ruleId"] or "unknown"}  {m.get("message","")}')
