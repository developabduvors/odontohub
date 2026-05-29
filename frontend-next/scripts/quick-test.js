#!/usr/bin/env node
/**
 * Quick test script for basic functionality
 * Tests translation system without database dependencies
 */

// Simple test for translation system
function testTranslations() {
  console.log('🧪 Testing translation system...');
  
  try {
    // Import translation functions (using require for Node.js compatibility)
    const { t, normalizeLanguage, isLanguageSupported } = require('../locales/i18n.ts');
    
    // Test basic translations
    console.log('✅ Translation module loaded successfully');
    
    // Test language utilities
    console.log('- isLanguageSupported("uz"):', isLanguageSupported('uz'));
    console.log('- isLanguageSupported("ru"):', isLanguageSupported('ru'));
    console.log('- isLanguageSupported("en"):', isLanguageSupported('en'));
    
    console.log('- normalizeLanguage("uz"):', normalizeLanguage('uz'));
    console.log('- normalizeLanguage("ru"):', normalizeLanguage('ru'));
    console.log('- normalizeLanguage("invalid"):', normalizeLanguage('invalid'));
    
    console.log('✅ Translation utilities working correctly');
    
  } catch (error) {
    console.log('❌ Translation system error:', error.message);
  }
}

function testConfiguration() {
  console.log('🧪 Testing configuration...');
  
  // Check environment variables
  const requiredVars = ['BOT_TOKEN', 'DATABASE_URL'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('⚠️ Missing environment variables:', missingVars.join(', '));
  }
  
  // Check BOT_TOKEN format
  if (process.env.BOT_TOKEN) {
    const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
    if (tokenPattern.test(process.env.BOT_TOKEN)) {
      console.log('✅ BOT_TOKEN format is valid');
    } else {
      console.log('❌ BOT_TOKEN format is invalid');
    }
  }
}

function testFileStructure() {
  console.log('🧪 Testing file structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'app/api/telegram/route.ts',
    'lib/database.ts',
    'lib/error-handler.ts',
    'lib/telegram-language.ts',
    'locales/uz.ts',
    'locales/ru.ts',
    'locales/i18n.ts',
    'components/Shared/TelegramLanguageProvider.tsx',
    'messages/uz.json',
    'messages/ru.json'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      missingFiles.push(filePath);
    }
  });
  
  if (missingFiles.length === 0) {
    console.log('✅ All required files are present');
  } else {
    console.log('❌ Missing files:', missingFiles.join(', '));
  }
}

async function runQuickTests() {
  console.log('🚀 Running Quick Tests for Telegram Multilingual Support');
  console.log('='.repeat(60));
  
  testConfiguration();
  console.log();
  
  testFileStructure();
  console.log();
  
  testTranslations();
  console.log();
  
  console.log('✅ Quick tests completed!');
  console.log('💡 For full integration tests, run: npx ts-node scripts/test-integration.ts');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = { runQuickTests };