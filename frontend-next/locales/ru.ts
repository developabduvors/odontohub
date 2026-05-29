import { BotTranslations } from './uz';

export const ruTranslations: BotTranslations = {
  welcome: {
    greeting: "Привет! Добро пожаловать в бот GoSmile!",
    choose_role: "Пожалуйста, выберите роль:",
    doctor_button: "👨‍⚕️ Врач",
    patient_button: "🦷 Пациент"
  },
  commands: {
    support: "За помощью обратитесь по ссылке: https://t.me/gosmilesupport",
    privacy: "Информация о политике конфиденциальности. GoSmile защищает ваши личные данные и не передает их третьим лицам.",
    terms: "Условия использования. Используя сервис GoSmile, вы соглашаетесь с нашими условиями.",
    help: "Доступные команды:\n/start - Перезапустить бота\n/support - Помощь\n/privacy - Политика конфиденциальности\n/terms - Условия использования\n/help - Помощь"
  },
  language: {
    choose: "Tilni tanlang / Выберите язык:",
    uzbek_button: "🇺🇿 O'zbek tili",
    russian_button: "🇷🇺 Русский язык"
  },
  errors: {
    unknown_command: "Неизвестная команда. Для помощи нажмите /help.",
    server_error: "Произошла ошибка сервера. Пожалуйста, попробуйте позже."
  }
};