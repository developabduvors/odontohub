# Requirements Document

## Introduction

This document outlines the requirements for adding multilingual support (Uzbek and Russian) to the existing Telegram bot webhook integrated into a Next.js project. The feature will enable users to interact with the bot in their preferred language while maintaining all existing functionality.

## Glossary

- **Telegram_Bot**: The Telegram bot webhook system that handles user interactions
- **Translation_System**: The internationalization (i18n) system that manages multilingual content
- **Language_Selector**: UI component that allows users to choose their preferred language
- **User_Database**: The Neon PostgreSQL database storing user information
- **Mini_App**: The Next.js web application that serves as the Telegram Mini App
- **Webhook_Handler**: The Next.js API route that processes Telegram webhook requests

## Requirements

### Requirement 1: Translation File Management

**User Story:** As a developer, I want to manage bot message translations in structured files, so that I can easily maintain and update multilingual content.

#### Acceptance Criteria

1. THE Translation_System SHALL store Uzbek translations in /locales/uz.ts file
2. THE Translation_System SHALL store Russian translations in /locales/ru.ts file
3. WHEN translation files are created, THE Translation_System SHALL include all bot message texts including welcome, support, privacy, terms, choose_language, doctor, patient, and help commands
4. THE Translation_System SHALL provide a function t(key, lang) that returns the correct translation for a given key and language
5. THE Translation_System SHALL default to Uzbek language when no language is specified

### Requirement 2: Database Language Support

**User Story:** As a system administrator, I want to store user language preferences in the database, so that the bot can remember each user's preferred language.

#### Acceptance Criteria

1. WHEN the database migration runs, THE User_Database SHALL add a 'language' column with TEXT type and DEFAULT 'uz' to the users table if it doesn't exist
2. THE User_Database SHALL provide a saveUserLang(chatId, lang) function to store user language preferences
3. THE User_Database SHALL provide a getUserLang(chatId) function to retrieve user language preferences
4. WHEN a user's language is not found, THE User_Database SHALL return 'uz' as the default language
5. THE User_Database SHALL use the existing Neon database connection pattern

### Requirement 3: Webhook Language Selection

**User Story:** As a Telegram bot user, I want to select my preferred language when I first start the bot, so that I can interact with it in my native language.

#### Acceptance Criteria

1. WHEN a user sends /start command for the first time, THE Webhook_Handler SHALL display language selection buttons for Uzbek and Russian
2. WHEN a user clicks lang_uz callback, THE Webhook_Handler SHALL save 'uz' language to database and show welcome message with doctor/patient buttons
3. WHEN a user clicks lang_ru callback, THE Webhook_Handler SHALL save 'ru' language to database and show welcome message with doctor/patient buttons
4. WHEN a user sends /start command after language is set, THE Webhook_Handler SHALL skip language selection and show welcome message directly
5. THE Webhook_Handler SHALL preserve all existing bot logic and functionality

### Requirement 4: Command Localization

**User Story:** As a Telegram bot user, I want to receive bot responses in my selected language, so that I can understand the information provided.

#### Acceptance Criteria

1. WHEN a user sends /support command, THE Webhook_Handler SHALL retrieve user language from database and redirect user to https://t.me/gosmilesupport
2. WHEN a user sends /privacy command, THE Webhook_Handler SHALL retrieve user language from database and return localized privacy message
3. WHEN a user sends /terms command, THE Webhook_Handler SHALL retrieve user language from database and return localized terms message
4. WHEN a user sends /help command, THE Webhook_Handler SHALL retrieve user language from database and return localized help message
5. THE Webhook_Handler SHALL maintain backward compatibility with existing command handlers

### Requirement 5: Mini App Localization

**User Story:** As a Mini App user, I want the interface to automatically detect and use my Telegram language preference, so that I have a consistent multilingual experience.

#### Acceptance Criteria

1. WHEN the Mini App loads, THE Mini_App SHALL detect language from window.Telegram.WebApp.initDataUnsafe?.user?.language_code
2. WHEN the detected language is supported (uz/ru), THE Mini_App SHALL use the corresponding locale files for UI translations
3. WHEN the detected language is not supported, THE Mini_App SHALL default to Uzbek language
4. THE Mini_App SHALL use the same translation files (/locales/uz.ts and /locales/ru.ts) as the bot
5. THE Mini_App SHALL maintain consistency with the existing next-intl internationalization setup

### Requirement 6: API Route Implementation

**User Story:** As a system architect, I want the Telegram webhook to be implemented as a Next.js API route, so that it integrates seamlessly with the existing frontend architecture.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL be implemented at /api/telegram/route.ts in the Next.js application
2. WHEN webhook requests are received, THE Webhook_Handler SHALL process them using TypeScript
3. THE Webhook_Handler SHALL use the existing database connection pattern from the project
4. THE Webhook_Handler SHALL handle all Telegram webhook events including messages and callback queries
5. THE Webhook_Handler SHALL maintain security by validating webhook authenticity

### Requirement 7: Data Integrity and Migration

**User Story:** As a database administrator, I want to safely add language support to existing users, so that no data is lost during the migration.

#### Acceptance Criteria

1. WHEN the migration runs, THE User_Database SHALL check if the language column already exists before adding it
2. WHEN adding the language column, THE User_Database SHALL set DEFAULT 'uz' for all existing users
3. THE User_Database SHALL preserve all existing user data during the migration
4. WHEN language functions are called with invalid chatId, THE User_Database SHALL handle errors gracefully
5. THE User_Database SHALL maintain referential integrity with existing user records

### Requirement 8: Translation Content Completeness

**User Story:** As a content manager, I want comprehensive translations for all bot interactions, so that users have a complete multilingual experience.

#### Acceptance Criteria

1. THE Translation_System SHALL include welcome messages for both doctor and patient user types
2. THE Translation_System SHALL include support redirect message directing users to https://t.me/gosmilesupport
3. THE Translation_System SHALL include privacy policy explanations and links
4. THE Translation_System SHALL include terms of service information
5. THE Translation_System SHALL include help command responses with available bot features
6. THE Translation_System SHALL include language selection prompts and button labels
7. THE Translation_System SHALL include error messages and fallback responses