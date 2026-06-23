import json
data = json.load(open('_lint.json', encoding='utf-8'))
from collections import Counter, defaultdict
rules = Counter()
byfile = defaultdict(Counter)
total = 0
for f in data:
    rel = f['filePath'].split('frontend-next', 1)[-1].lstrip('/\\')
    for m in f.get('messages', []):
        rules[m['ruleId']] += 1
        byfile[rel][m['ruleId']] += 1
        total += 1
print(f'Total issues: {total}')
print(f'Unique rules: {len(rules)}')
print()
print('--- Rules breakdown ---')
for r, c in rules.most_common():
    print(f'  {c:4d}x  {r}')
print()
print('--- Files with issues ---')
for f in sorted(byfile):
    print(f'  {f}:')
    for r, c in sorted(byfile[f].items(), key=lambda x: (x[0] or '') or ''):
        print(f'      {c}x  {r}')
