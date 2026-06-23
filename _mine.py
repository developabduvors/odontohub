import json
data = json.load(open('_lint.json', encoding='utf-8-sig'))
mine = ['/layouts/Doshboard.tsx', '/guards/RoleGuard.tsx', '/(patient)/booking/page.tsx',
        '/(doctor)/notifications/page.tsx', '/(doctor)/patients/page.tsx',
        '/(doctor)/profile/edit/page.tsx', '/(doctor)/profile/page.tsx',
        '/(doctor)/settings/page.tsx', '/booking/checkup-preview/page.tsx',
        '/(patient)/doctor-services/page.tsx', '/(patient)/my-dentist/page.tsx',
        '/(patient)/profile_pat/page.tsx', '/(patient)/appointment/[id]/page.tsx',
        '/(patient)/doctors/page.tsx', '/(public)/login/page.tsx', '/magic/[token]/page.tsx']
for f in data:
    rel = f['filePath'].split('frontend-next', 1)[-1].replace(chr(92), '/')
    if any(s in rel for s in mine) and f['messages']:
        print('###', rel)
        for m in f['messages']:
            print(f"  {m.get('line')}:{m.get('column')} [{m.get('ruleId') or 'parse'}] {m.get('message')[:95]}")
