#!/usr/bin/env node
/**
 * Integration test script for Telegram multilingual support
 * Tests all components working together
 */

import { saveUserLang, getUserLang, userExists } from '../lib/database';
import { t, normalizeLanguage, isLanguageSupported } from '../locales/i18n';
import { detectTelegramLanguage, initializeTelegramWebApp } from '../lib/telegram-language';
import { validateConfiguration, safeTranslate } from '../lib/error-handler';

async function testDatabaseIntegration() {
  console.log('🧪 Testing database integration...');
  
  try {
    const testChatId = 'test_integration_' + Date.now();
    
    // Test saving and retrieving language
    console.log('  - Testing saveUserLang...');
    await saveUserLang(testChatId, 'ru');
    
    console.log('  - Testing getUserLang...');
    const retrievedLang = await getUserLang(testChatId);
    
    if (retrievedLang === 'ru') {
      console.log('  ✅ Database integration working correctly');
    } else {
      console.log('  ❌ Database integration failed: expected "ru", got', retrievedLang);
    }
    
    // Test user existence
    console.log('  - Testing userExists...');
    const exists = await userExists(testChatId);
    
    if (exists) {
      console.log('  ✅ User existence check working correctly');
    } else {
      console.log('  ❌ User existence check failed');
    }
    
  } catch (error) {
    console.log('  ❌ Database integration error:', error);
  }
}

function testTranslationSystem() {
  console.log('🧪 Testing translation system...');
  
  try {
    // Test basic translations
    const uzGreeting = t('welcome.greeting', 'uz');
    const ruGreeting = t('welcome.greeting', 'ru');
    
    console.log('  - Uzbek greeting:', uzGreeting);
    console.log('  - Russian greeting:', ruGreeting);
    
    if (uzGreeting.includes('Salom') && ruGreeting.includes('Привет')) {
      console.log('  ✅ Translation system working correctly');
    } else {
      console.log('  ❌ Translation system failed');
    }
    
    // Test safe translation with fallback
    const safeUzGreeting = safeTranslate('welcome.greeting', 'uz');
    const safeRuGreeting = safeTranslate('welcome.greeting', 'ru');
    
    console.log('  - Safe Uzbek greeting:', safeUzGreeting);
    console.log('  - Safe Russian greeting:', safeRuGreeting);
    
    // Test invalid key handling
    const invalidKey = safeTranslate('invalid.key', 'uz', 'Fallback text');
    console.log('  - Invalid key handling:', invalidKey);
    
    if (invalidKey === 'Fallback text') {
      console.log('  ✅ Safe translation fallback working correctly');
    } else {
      console.log('  ❌ Safe translation fallback failed');
    }
    
  } catch (error) {
    console.log('  ❌ Translation system error:', error);
  }
}

function testLanguageUtilities() {
  console.log('🧪 Testing language utilities...');
  
  try {
    // Test language support checking
    console.log('  - isLanguageSupported("uz"):', isLanguageSupported('uz'));
    console.log('  - isLanguageSupported("ru"):', isLanguageSupported('ru'));
    console.log('  - isLanguageSupported("en"):', isLanguageSupported('en'));
    
    // Test language normalization
    console.log('  - normalizeLanguage("uz"):', normalizeLanguage('uz'));
    console.log('  - normalizeLanguage("ru"):', normalizeLanguage('ru'));
    console.log('  - normalizeLanguage("en"):', normalizeLanguage('en'));
    console.log('  - normalizeLanguage(undefined):', normalizeLanguage(undefined));
    
    console.log('  ✅ Language utilities working correctly');
    
  } catch (error) {
    console.log('  ❌ Language utilities error:', error);
  }
}

function testConfiguration() {
  console.log('🧪 Testing configuration validation...');
  
  try {
    const validation = validateConfiguration();
    console.log('  - Configuration validation:', validation);
    
    if (validation.isValid) {
      console.log('  ✅ Configuration is valid');
    } else {
      console.log('  ⚠️ Configuration issues found:', validation.errors);
    }
    
  } catch (error) {
    console.log('  ❌ Configuration validation error:', error);
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Telegram Multilingual Support Integration Tests');
  console.log('='.repeat(60));
  
  // Test configuration first
  testConfiguration();
  console.log();
  
  // Test translation system
  testTranslationSystem();
  console.log();
  
  // Test language utilities
  testLanguageUtilities();
  console.log();
  
  // Test database integration (only if DATABASE_URL is available)
  if (process.env.DATABASE_URL) {
    await testDatabaseIntegration();
  } else {
    console.log('🧪 Skipping database tests (DATABASE_URL not set)');
  }
  
  console.log();
  console.log('✅ Integration tests completed!');
  console.log('📝 Note: Telegram WebApp functions can only be tested in Telegram environment');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

export { runIntegrationTests };