import json
mine = [
 "Bosh sahifa/Hero.tsx","Bosh sahifa/Analytics.tsx","Bosh sahifa/PatientSearch.tsx","Bosh sahifa/Section.tsx",
 "Doctors/DoctorsList.tsx","DoctorProfile/ServicesSection.tsx","DoctorProfile/ScheduleCard.tsx","DoctorProfile/WorksSection.tsx",
 "Chat/ChatsView.tsx","Services/ServiceModal.tsx","Shared/EditProfileModal.tsx","Shared/TelegramAuthWrapper.tsx",
 "Shared/TelegramLanguageProvider.tsx","Shared/Toast.tsx","EditDoctorProfile/MapModal.tsx","PatientSearch/SearchResultsView.tsx",
 "Settings/PrivacySettings.tsx",
]
data = json.load(open('_lint.json', encoding='utf-8-sig'))
for f in data:
    rel = f['filePath'].split('frontend-next', 1)[-1].replace('\\', '/')
    if not any(rel.endswith(m) for m in mine):
        continue
    if not f['messages']:
        continue
    print('###', rel)
    for m in f['messages']:
        r = (m.get('ruleId') or 'parse').split('/')[-1]
        print(f"  {m.get('line')}:{m.get('column')}  {r}  | {m.get('message').splitlines()[0][:80]}")
