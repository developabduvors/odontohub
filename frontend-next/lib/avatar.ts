// Jins bo'yicha default avatar. Foydalanuvchi o'z rasmini yuklamagan bo'lsa shu ishlatiladi.
// gender backend'da "male" | "female" sifatida saqlanadi (PatientProfile/DentistProfile.gender).
const MALE_AVATAR = '/assets/img/photos/avatar-male.svg';
const FEMALE_AVATAR = '/assets/img/photos/avatar-female.svg';

export function defaultAvatarFor(gender?: string | null): string {
    // Ham "female"/"male" (backend), ham "Женщина"/"Мужчина" (UI) qiymatlarini qabul qiladi.
    const g = (gender || '').toLowerCase();
    if (g === 'female' || g === 'женщина') return FEMALE_AVATAR;
    return MALE_AVATAR;
}
