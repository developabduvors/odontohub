# Implementation Plan: Telegram Multilingual Support

## Overview

This implementation plan converts the multilingual Telegram bot design into discrete coding tasks. Each task builds incrementally toward a complete multilingual bot system with Uzbek and Russian language support, database integration, and Mini App consistency.

## Tasks

- [ ] 1. Create translation system foundation
  - [x] 1.1 Create translation files and utility functions
    - Create `/locales/uz.ts` with complete Uzbek translations for all bot messages
    - Create `/locales/ru.ts` with complete Russian translations for all bot messages  
    - Create `/locales/i18n.ts` with `t(key, lang)` translation utility function
    - Include all required message categories: welcome, commands, language selection, errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Write property test for translation function consistency
    - **Property 1: Translation Function Consistency**
    - **Validates: Requirements 1.4**

  - [ ]* 1.3 Write property test for translation content completeness
    - **Property 2: Translation Content Completeness**  
    - **Validates: Requirements 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

- [ ] 2. Implement database language support
  - [x] 2.1 Create database migration for language column
    - Add migration script to add `language` column (TEXT DEFAULT 'uz') to users table
    - Implement idempotent migration that checks if column exists before adding
    - Ensure migration preserves all existing user data
    - _Requirements: 2.1, 7.1, 7.2, 7.3_

  - [x] 2.2 Implement language database functions
    - Create `saveUserLang(chatId, lang)` function using existing Neon connection pattern
    - Create `getUserLang(chatId)` function with 'uz' default for missing users
    - Implement proper error handling for invalid chatIds and database failures
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 7.4_

  - [ ]* 2.3 Write property test for language persistence round trip
    - **Property 4: Database Language Persistence Round Trip**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 2.4 Write property test for migration idempotency
    - **Property 9: Migration Idempotency**
    - **Validates: Requirements 7.1, 7.3**

- [ ] 3. Checkpoint - Database and translations ready
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Create Telegram webhook API route
  - [x] 4.1 Set up Next.js API route structure
    - Create `/api/telegram/route.ts` with POST handler for webhook events
    - Implement Telegram webhook signature validation for security
    - Set up TypeScript interfaces for Telegram message and callback query types
    - Configure bot token from environment variables
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 4.2 Implement core webhook message processing
    - Handle `/start` command with first-time vs returning user logic
    - Process language selection callbacks (`lang_uz`, `lang_ru`)
    - Implement command handlers for `/support`, `/privacy`, `/terms`, `/help`
    - Integrate translation system with user language preferences from database
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.3 Write property test for language callback processing
    - **Property 5: Language Callback Processing**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 4.4 Write property test for localized command responses
    - **Property 6: Localized Command Responses**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 4.5 Write property test for start command language flow
    - **Property 7: Start Command Language Flow**
    - **Validates: Requirements 3.1, 3.4**

- [ ] 5. Implement webhook security and event handling
  - [x] 5.1 Complete webhook event processing
    - Handle all Telegram webhook event types (messages, callback queries)
    - Implement comprehensive error handling and fallback responses
    - Add logging for debugging and monitoring webhook activity
    - _Requirements: 6.4, 3.5_

  - [ ]* 5.2 Write property test for webhook event processing
    - **Property 10: Webhook Event Processing**
    - **Validates: Requirements 6.4**

  - [ ]* 5.3 Write property test for webhook security validation
    - **Property 11: Webhook Security Validation**
    - **Validates: Requirements 6.5**

- [ ] 6. Implement Mini App language integration
  - [x] 6.1 Add language detection to Mini App
    - Implement language detection from `window.Telegram.WebApp.initDataUnsafe?.user?.language_code`
    - Create language detection utility that falls back to 'uz' for unsupported languages
    - Integrate detected language with existing next-intl setup
    - Ensure consistency with bot translation files
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Write property test for Mini App language detection
    - **Property 8: Mini App Language Detection**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 7. Integration and error handling
  - [x] 7.1 Implement comprehensive error handling
    - Add error handling for translation system failures
    - Implement database connection error recovery
    - Add fallback responses for all error scenarios
    - Ensure graceful degradation when services are unavailable
    - _Requirements: 7.4_

  - [ ]* 7.2 Write property test for error handling
    - **Property 12: Error Handling Gracefully**
    - **Validates: Requirements 7.4**

  - [ ]* 7.3 Write unit tests for default language behavior
    - Test fallback to Uzbek for invalid/missing language parameters
    - Test error message handling in both languages
    - **Property 3: Language Default Behavior**
    - **Validates: Requirements 1.5, 2.4, 5.3**

- [ ] 8. Final integration and testing
  - [x] 8.1 Wire all components together
    - Connect webhook handler with database functions and translation system
    - Ensure Mini App uses same translation files as bot
    - Test end-to-end flow from Telegram message to database to response
    - Verify all existing bot functionality remains intact
    - _Requirements: All requirements integration_

  - [ ]* 8.2 Write integration tests
    - Test complete user journey from language selection to command usage
    - Test Mini App and bot translation consistency
    - Test database migration and language persistence

- [x] 9. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All implementation should be done in TypeScript
- Use existing project patterns for database connections and API routes
- Maintain backward compatibility with existing bot functionality
- Default language is 'uz' (Uzbek) throughout the system
- Support link redirects to https://t.me/gosmilesupport