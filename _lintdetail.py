import json, sys
data = json.load(open('_lint.json', encoding='utf-8-sig'))
want = sys.argv[1] if len(sys.argv) > 1 else None
for f in data:
    rel = f['filePath'].split('frontend-next', 1)[-1].replace('\\', '/')
    for m in f['messages']:
        r = m.get('ruleId') or 'parse'
        if want and r != want:
            continue
        print(f"{rel}:{m.get('line')}:{m.get('column')}  [{r}]  {m.get('message')[:100]}")
