import json
from collections import Counter, defaultdict

data = json.load(open('_lint.json', encoding='utf-8-sig'))
rules = Counter(); byfile = defaultdict(Counter); total = 0
for f in data:
    rel = f['filePath'].split('frontend-next', 1)[-1].replace('\\', '/')
    for m in f['messages']:
        total += 1
        r = m.get('ruleId') or 'parse'
        rules[r] += 1
        byfile[rel][r] += 1

print('TOTAL:', total)
print('=== by rule ===')
for r, c in rules.most_common():
    print(f'  {c:4}  {r}')
print('=== files (count) ===')
for fp, cc in sorted(byfile.items(), key=lambda x: -sum(x[1].values())):
    print(f'  {sum(cc.values()):3}  {fp}')
