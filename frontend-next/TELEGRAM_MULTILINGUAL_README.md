# Telegram Multilingual Support

This implementation adds comprehensive multilingual support (Uzbek and Russian) to the Telegram bot webhook integrated into the Next.js project.

## 🚀 Features

- **Dual Language Support**: Uzbek (uz) and Russian (ru) languages
- **Automatic Language Detection**: Detects user language from Telegram WebApp data
- **Database Integration**: Stores user language preferences in Neon PostgreSQL
- **Comprehensive Error Handling**: Graceful degradation and fallback responses
- **Mini App Integration**: Consistent language experience across bot and web app
- **Security**: Webhook signature validation and input sanitization

## 📁 File Structure

```
frontend-next/
├── app/api/telegram/route.ts          # Main webhook handler
├── lib/
│   ├── database.ts                    # Database functions for language management
│   ├── error-handler.ts               # Comprehensive error handling utilities
│   └── telegram-language.ts           # Telegram WebApp language detection
├── locales/
│   ├── uz.ts                         # Uzbek translations
│   ├── ru.ts                         # Russian translations
│   └── i18n.ts                       # Translation utility functions
├── components/Shared/
│   └── TelegramLanguageProvider.tsx   # Language detection component
├── messages/
│   ├── uz.json                       # Next.js i18n Uzbek messages
│   └── ru.json                       # Next.js i18n Russian messages
└── scripts/
    └── test-integration.ts            # Integration test script

backend/
└── add_language_column.py             # Database migration script
```

## 🛠 Setup Instructions

### 1. Environment Variables

Ensure these environment variables are set:

```bash
# Required
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=your_neon_postgresql_url

# Optional
NODE_ENV=production  # For webhook signature validation
```

### 2. Database Migration

Run the database migration to add the language column:

```bash
cd backend
python add_language_column.py
```

### 3. Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Set the webhook URL to: `https://yourdomain.com/api/telegram`
3. Configure bot commands:
   ```
   start - Start the bot
   support - Get support
   privacy - Privacy policy
   terms - Terms of service
   help - Show help
   ```

### 4. Next.js Configuration

The project uses next-intl for internationalization. Ensure your `i18n/routing.ts` includes:

```typescript
export const routing = defineRouting({
  locales: ['uz', 'ru', 'en', 'kz'],
  defaultLocale: 'uz',  // Changed to Uzbek as default
  localePrefix: 'always',
});
```

## 🎯 Usage

### Bot Commands

- `/start` - Shows language selection for new users, welcome message for existing users
- `/support` - Redirects to support channel (https://t.me/gosmilesupport)
- `/privacy` - Shows privacy policy information
- `/terms` - Shows terms of service
- `/help` - Shows available commands

### Language Selection Flow

1. **New User**: `/start` → Language selection (Uzbek/Russian) → Welcome message with role selection
2. **Existing User**: `/start` → Welcome message with role selection (in saved language)

### Mini App Integration

The Mini App automatically detects language from Telegram WebApp data:

```typescript
import { initializeTelegramWebApp } from '@/lib/telegram-language';

// Initialize and detect language
const detectedLanguage = await initializeTelegramWebApp();
```

## 🧪 Testing

### Run Integration Tests

```bash
cd frontend-next
npx ts-node scripts/test-integration.ts
```

### Manual Testing

1. **Bot Testing**: Send `/start` to your bot in Telegram
2. **Language Switching**: Test both Uzbek and Russian language flows
3. **Mini App**: Open the Mini App in Telegram to test language detection
4. **Error Handling**: Test with invalid commands or network issues

## 🔧 API Reference

### Database Functions

```typescript
// Save user language preference
await saveUserLang(chatId: string, lang: 'uz' | 'ru'): Promise<void>

// Get user language preference (defaults to 'uz')
const lang = await getUserLang(chatId: string): Promise<'uz' | 'ru'>

// Check if user exists
const exists = await userExists(chatId: string): Promise<boolean>
```

### Translation Functions

```typescript
// Basic translation
const text = t('welcome.greeting', 'uz');

// Safe translation with fallback
const text = safeTranslate('welcome.greeting', 'uz', 'Fallback text');

// Language utilities
const isSupported = isLanguageSupported('uz');
const normalized = normalizeLanguage('unknown'); // Returns 'uz'
```

### Error Handling

```typescript
// Wrap operations with error handling
const result = await withErrorHandling(
  () => someAsyncOperation(),
  { chatId, userLang: 'uz', operation: 'operationName' }
);

// Database operations with retry
const data = await withDatabaseRetry(() => databaseOperation());
```

## 🌐 Supported Languages

| Language | Code | Default | Status |
|----------|------|---------|--------|
| Uzbek    | `uz` | ✅ Yes  | ✅ Implemented |
| Russian  | `ru` | ❌ No   | ✅ Implemented |

## 🔒 Security Features

- **Webhook Signature Validation**: Verifies requests are from Telegram
- **Input Sanitization**: Validates and sanitizes all user inputs
- **Circuit Breaker**: Prevents API overload during failures
- **Rate Limiting**: Built-in protection against spam
- **Error Logging**: Comprehensive error tracking and logging

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Translation Failures**: Falls back to default language or provided text
- **Database Errors**: Retries with exponential backoff
- **API Failures**: Circuit breaker pattern with graceful degradation
- **Network Issues**: Automatic retry with timeout handling

## 📊 Monitoring

Monitor the system using:

- **Console Logs**: Structured logging with context
- **Error Tracking**: Detailed error information with stack traces
- **Performance Metrics**: Request timing and success rates
- **Database Health**: Connection status and query performance

## 🔄 Migration Notes

### From Existing Bot

If you have an existing bot:

1. Run the database migration to add language column
2. Existing users will default to Uzbek language
3. Users can change language by sending `/start` command
4. All existing functionality remains intact

### Rollback Plan

To rollback if needed:

1. Remove language column: `ALTER TABLE users DROP COLUMN language;`
2. Revert webhook URL to previous handler
3. Remove language-related code

## 🤝 Contributing

When adding new features:

1. Add translations to both `uz.ts` and `ru.ts`
2. Update message files (`uz.json`, `ru.json`)
3. Add error handling with appropriate fallbacks
4. Test in both languages
5. Update this documentation

## 📝 Troubleshooting

### Common Issues

1. **Bot not responding**: Check BOT_TOKEN and webhook URL
2. **Language not saving**: Verify database connection and migration
3. **Translation missing**: Check translation files and fallback handling
4. **Mini App language detection**: Ensure Telegram WebApp context is available

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development
```

This will:
- Skip webhook signature validation in development
- Provide detailed logging
- Show translation key paths
- Display database query information

## 📞 Support

For issues or questions:
- Telegram Support: https://t.me/gosmilesupport
- Check logs for detailed error information
- Run integration tests to verify setup