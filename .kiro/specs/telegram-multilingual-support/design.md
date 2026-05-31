# Design Document

## Overview

This design outlines the implementation of multilingual support (Uzbek and Russian) for the Telegram bot webhook integrated into the Next.js project. The solution will add internationalization capabilities while maintaining all existing functionality and integrating seamlessly with the current architecture.

The design follows a layered approach:
1. **Translation Layer**: TypeScript files for managing multilingual content
2. **Database Layer**: Extended user schema with language preferences
3. **API Layer**: Next.js API route for webhook handling with i18n support
4. **Integration Layer**: Mini App language detection and consistency

## Architecture

```mermaid
graph TB
    TG[Telegram Bot] --> WH[Webhook Handler /api/telegram/route.ts]
    WH --> TL[Translation Layer]
    WH --> DB[(Neon PostgreSQL)]
    WH --> BL[Bot Logic]
    
    MA[Mini App] --> TL
    MA --> LD[Language Detection]
    
    TL --> UZ[/locales/uz.ts]
    TL --> RU[/locales/ru.ts]
    TL --> I18N[i18n.ts utility]
    
    DB --> UM[User Model + language column]
    DB --> LF[Language Functions]
    
    subgraph "Next.js Frontend"
        MA
        WH
        TL
    end
    
    subgraph "Database"
        DB
        UM
        LF
    end
```

## Components and Interfaces

### Translation System

**File Structure:**
```
/locales/
├── uz.ts          # Uzbek translations
├── ru.ts          # Russian translations  
└── i18n.ts        # Translation utility functions
```

**Translation Interface:**
```typescript
interface BotTranslations {
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
```

**Translation Function:**
```typescript
function t(key: string, lang: 'uz' | 'ru'): string
```

### Database Extensions

**User Model Extension:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'uz';
```

**Language Management Functions:**
```typescript
async function saveUserLang(chatId: string, lang: 'uz' | 'ru'): Promise<void>
async function getUserLang(chatId: string): Promise<'uz' | 'ru'>
```

### Webhook Handler

**API Route Structure:**
```
/api/telegram/route.ts
├── POST handler for webhook events
├── Message processing logic
├── Callback query handling
├── Language detection and storage
└── Response generation with i18n
```

**Core Handler Interface:**
```typescript
interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramMessage {
  chat: { id: number };
  text?: string;
  from?: TelegramUser;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}
```

### Mini App Integration

**Language Detection Logic:**
```typescript
function detectTelegramLanguage(): 'uz' | 'ru' {
  const tgData = window.Telegram?.WebApp?.initDataUnsafe;
  const langCode = tgData?.user?.language_code;
  
  if (langCode === 'ru' || langCode === 'uz') {
    return langCode;
  }
  return 'uz'; // Default fallback
}
```

## Data Models

### Extended User Schema

```typescript
interface User {
  id: number;
  phone: string;
  telegram_id?: string;
  role: 'PATIENT' | 'DENTIST';
  language: 'uz' | 'ru';  // New field
  // ... existing fields
}
```

### Translation Data Structure

```typescript
// /locales/uz.ts
export const uzTranslations: BotTranslations = {
  welcome: {
    greeting: "Salom! GoSmile botiga xush kelibsiz!",
    choose_role: "Iltimos, rolni tanlang:",
    doctor_button: "👨‍⚕️ Shifokor",
    patient_button: "🦷 Bemor"
  },
  commands: {
    support: "Yordam uchun quyidagi havolaga o'ting: https://t.me/gosmilesupport",
    privacy: "Maxfiylik siyosati haqida ma'lumot...",
    terms: "Foydalanish shartlari...",
    help: "Mavjud buyruqlar:\n/start - Botni qayta ishga tushirish\n/support - Yordam\n/privacy - Maxfiylik\n/terms - Shartlar"
  },
  language: {
    choose: "Tilni tanlang / Выберите язык:",
    uzbek_button: "🇺🇿 O'zbek tili",
    russian_button: "🇷🇺 Русский язык"
  },
  errors: {
    unknown_command: "Noma'lum buyruq. /help ni bosing.",
    server_error: "Server xatosi. Keyinroq urinib ko'ring."
  }
};

// /locales/ru.ts  
export const ruTranslations: BotTranslations = {
  welcome: {
    greeting: "Привет! Добро пожаловать в бот GoSmile!",
    choose_role: "Пожалуйста, выберите роль:",
    doctor_button: "👨‍⚕️ Врач",
    patient_button: "🦷 Пациент"
  },
  commands: {
    support: "За помощью обратитесь по ссылке: https://t.me/gosmilesupport",
    privacy: "Информация о политике конфиденциальности...",
    terms: "Условия использования...",
    help: "Доступные команды:\n/start - Перезапустить бота\n/support - Помощь\n/privacy - Конфиденциальность\n/terms - Условия"
  },
  language: {
    choose: "Tilni tanlang / Выберите язык:",
    uzbek_button: "🇺🇿 O'zbek tili", 
    russian_button: "🇷🇺 Русский язык"
  },
  errors: {
    unknown_command: "Неизвестная команда. Нажмите /help.",
    server_error: "Ошибка сервера. Попробуйте позже."
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property-Based Testing Analysis

Based on the requirements analysis, the following properties ensure system correctness:

**Property 1: Translation Function Consistency**
*For any* valid translation key and supported language ('uz' or 'ru'), the translation function t(key, lang) should return a non-empty string that matches the expected language
**Validates: Requirements 1.4**

**Property 2: Translation Content Completeness**
*For any* supported language, all required translation keys (welcome messages, commands, language selection, error messages) should exist and contain non-empty values
**Validates: Requirements 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

**Property 3: Language Default Behavior**
*For any* invalid or missing language parameter, the translation system should default to Uzbek ('uz') language
**Validates: Requirements 1.5, 2.4, 5.3**

**Property 4: Database Language Persistence Round Trip**
*For any* valid chatId and language ('uz' or 'ru'), saving a language preference and then retrieving it should return the same language value
**Validates: Requirements 2.2, 2.3**

**Property 5: Language Callback Processing**
*For any* language callback (lang_uz or lang_ru), the webhook handler should save the corresponding language to the database and respond with a localized welcome message
**Validates: Requirements 3.2, 3.3**

**Property 6: Localized Command Responses**
*For any* supported command (/support, /privacy, /terms, /help) and any user with a set language preference, the response should be in the user's preferred language
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

**Property 7: Start Command Language Flow**
*For any* user sending /start command, if no language is set, language selection should be shown; if language is already set, welcome message should be shown directly
**Validates: Requirements 3.1, 3.4**

**Property 8: Mini App Language Detection**
*For any* Telegram WebApp initData, the Mini App should correctly detect and use supported languages or default to Uzbek for unsupported languages
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 9: Migration Idempotency**
*For any* database state, running the language column migration multiple times should be safe and preserve all existing user data
**Validates: Requirements 7.1, 7.3**

**Property 10: Webhook Event Processing**
*For any* valid Telegram webhook event (message or callback query), the handler should process it correctly and respond appropriately
**Validates: Requirements 6.4**

**Property 11: Webhook Security Validation**
*For any* webhook request, only requests with valid Telegram signatures should be processed, while invalid requests should be rejected
**Validates: Requirements 6.5**

**Property 12: Error Handling Gracefully**
*For any* invalid chatId or database error, the language functions should handle errors gracefully without crashing the system
**Validates: Requirements 7.4**

## Error Handling

### Translation System Errors
- **Missing Translation Keys**: Fall back to default language (Uzbek) if key not found
- **Invalid Language Codes**: Default to 'uz' for any unsupported language
- **File Loading Errors**: Provide fallback error messages in both languages

### Database Errors
- **Connection Failures**: Retry with exponential backoff, fall back to default language
- **Invalid ChatId**: Log error and return default language without crashing
- **Migration Conflicts**: Check existing schema before applying changes

### Webhook Processing Errors
- **Invalid Signatures**: Reject request with 401 status
- **Malformed Requests**: Log error and return generic error response
- **Database Unavailable**: Queue requests for retry or return temporary error message

### Mini App Integration Errors
- **Missing Telegram Data**: Fall back to default language detection
- **Invalid Language Codes**: Use default Uzbek language
- **Translation Loading Failures**: Show error message and retry

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit tests for specific scenarios with property-based tests for comprehensive coverage:

**Unit Tests Focus:**
- Specific translation key-value pairs
- Database migration edge cases  
- Webhook signature validation examples
- Mini App integration with mock Telegram data
- Error handling for specific failure scenarios

**Property-Based Tests Focus:**
- Translation function behavior across all keys and languages (Property 1)
- Content completeness validation (Property 2)
- Language persistence round-trip testing (Property 4)
- Command response localization (Property 6)
- Webhook event processing (Property 10)
- Security validation with generated signatures (Property 11)

**Property Test Configuration:**
- Use fast-check library for TypeScript property-based testing
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: telegram-multilingual-support, Property N: [property description]**
- Generate random chatIds, language codes, translation keys, and webhook events
- Mock Telegram WebApp data for Mini App testing

**Integration Testing:**
- End-to-end webhook flow testing with real Telegram message formats
- Database migration testing on test database instances
- Mini App language detection with various Telegram user data scenarios
- Cross-component consistency between bot and Mini App translations