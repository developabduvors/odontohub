export interface BotTranslations {
  welcome: {
    greeting: string;
    choose_role: string;
    doctor_button: string;
    patient_button: string;
  };
  commands: {
    support: string;
    privacy: string;
    terms: string;
    help: string;
  };
  language: {
    choose: string;
    uzbek_button: string;
    russian_button: string;
  };
  errors: {
    unknown_command: string;
    server_error: string;
  };
}

export const uzTranslations: BotTranslations = {
  welcome: {
    greeting: "Salom! GoSmile botiga xush kelibsiz!",
    choose_role: "Iltimos, rolni tanlang:",
    doctor_button: "👨‍⚕️ Shifokor",
    patient_button: "🦷 Bemor"
  },
  commands: {
    support: "Yordam uchun quyidagi havolaga o'ting: https://t.me/gosmilesupport",
    privacy: "Maxfiylik siyosati haqida ma'lumot. GoSmile sizning shaxsiy ma'lumotlaringizni himoya qiladi va ularni uchinchi shaxslarga bermaydi.",
    terms: "Foydalanish shartlari. GoSmile xizmatidan foydalanish orqali siz bizning shartlarimizga rozilik bildirasiz.",
    help: "Mavjud buyruqlar:\n/start - Botni qayta ishga tushirish\n/support - Yordam\n/privacy - Maxfiylik siyosati\n/terms - Foydalanish shartlari\n/help - Yordam"
  },
  language: {
    choose: "Tilni tanlang / Выберите язык:",
    uzbek_button: "🇺🇿 O'zbek tili",
    russian_button: "🇷🇺 Русский язык"
  },
  errors: {
    unknown_command: "Noma'lum buyruq. Yordam uchun /help ni bosing.",
    server_error: "Server xatosi yuz berdi. Iltimos, keyinroq urinib ko'ring."
  }
};