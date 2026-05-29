/**
 * Comprehensive error handling utilities for the Telegram bot
 * Provides graceful degradation and fallback responses
 */

import { t, type SupportedLanguage } from '@/locales/i18n';
import { sendTelegramMessage } from '@/app/api/telegram/route';

export interface ErrorContext {
  chatId?: number;
  userLang?: SupportedLanguage;
  operation?: string;
  originalError?: Error;
}

export class TelegramBotError extends Error {
  public readonly context: ErrorContext;
  public readonly isRecoverable: boolean;

  constructor(message: string, context: ErrorContext = {}, isRecoverable = true) {
    super(message);
    this.name = 'TelegramBotError';
    this.context = context;
    this.isRecoverable = isRecoverable;
  }
}

/**
 * Handle translation system failures with fallback
 * @param key - Translation key
 * @param lang - User language
 * @param fallbackText - Fallback text if translation fails
 * @returns Translated text or fallback
 */
export function safeTranslate(key: string, lang: SupportedLanguage = 'uz', fallbackText?: string): string {
  try {
    const translation = t(key, lang);
    
    // Check if translation failed (returns error message format)
    if (translation.startsWith('[') && translation.includes('translation')) {
      throw new Error(`Translation failed for key: ${key}`);
    }
    
    return translation;
  } catch (error) {
    console.warn(`Translation failed for key "${key}" in language "${lang}":`, error);
    
    // Try fallback to Uzbek if we were using Russian
    if (lang === 'ru') {
      try {
        const fallbackTranslation = t(key, 'uz');
        if (!fallbackTranslation.startsWith('[')) {
          return fallbackTranslation;
        }
      } catch (fallbackError) {
        console.warn('Fallback translation also failed:', fallbackError);
      }
    }
    
    // Use provided fallback text or generic message
    return fallbackText || getGenericErrorMessage(lang);
  }
}

/**
 * Get generic error message in the specified language
 * @param lang - User language
 * @returns Generic error message
 */
function getGenericErrorMessage(lang: SupportedLanguage): string {
  switch (lang) {
    case 'ru':
      return 'Произошла ошибка. Попробуйте позже.';
    case 'uz':
    default:
      return 'Xatolik yuz berdi. Keyinroq urinib ko\'ring.';
  }
}

/**
 * Handle database connection errors with retry logic
 * @param operation - Database operation function
 * @param maxRetries - Maximum number of retries
 * @param delay - Delay between retries in milliseconds
 * @returns Promise with operation result
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new TelegramBotError(
    `Database operation failed after ${maxRetries} attempts`,
    { operation: 'database', originalError: lastError! },
    false
  );
}

/**
 * Send error message to user with fallback handling
 * @param chatId - Chat ID
 * @param error - Error object
 * @param userLang - User language
 * @returns Promise<boolean> indicating success
 */
export async function sendErrorMessage(
  chatId: number,
  error: Error | TelegramBotError,
  userLang: SupportedLanguage = 'uz'
): Promise<boolean> {
  try {
    let errorMessage: string;
    
    if (error instanceof TelegramBotError) {
      // Use specific error message if available
      errorMessage = error.message;
    } else {
      // Use generic error message for unknown errors
      errorMessage = safeTranslate('errors.server_error', userLang);
    }
    
    return await sendTelegramMessage({
      chat_id: chatId,
      text: errorMessage,
    });
  } catch (sendError) {
    console.error('Failed to send error message to user:', sendError);
    return false;
  }
}

/**
 * Log error with context information
 * @param error - Error object
 * @param context - Error context
 */
export function logError(error: Error, context: ErrorContext = {}): void {
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  };
  
  console.error('Telegram Bot Error:', JSON.stringify(logData, null, 2));
  
  // In production, you might want to send this to an external logging service
  // Example: sendToLoggingService(logData);
}

/**
 * Wrapper for async operations with comprehensive error handling
 * @param operation - Async operation to execute
 * @param context - Error context
 * @returns Promise with operation result or error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const botError = error instanceof TelegramBotError 
      ? error 
      : new TelegramBotError(
          error instanceof Error ? error.message : 'Unknown error',
          { ...context, originalError: error instanceof Error ? error : undefined }
        );
    
    // Log the error
    logError(botError, botError.context);
    
    // Send error message to user if chat ID is available
    if (context.chatId) {
      await sendErrorMessage(context.chatId, botError, context.userLang);
    }
    
    // Return null for recoverable errors, rethrow for non-recoverable
    if (botError.isRecoverable) {
      return null;
    } else {
      throw botError;
    }
  }
}

/**
 * Validate environment variables and configuration
 * @returns Object with validation results
 */
export function validateConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required environment variables
  if (!process.env.BOT_TOKEN) {
    errors.push('BOT_TOKEN environment variable is not set');
  }
  
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL environment variable is not set');
  }
  
  // Validate BOT_TOKEN format (should be like "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")
  if (process.env.BOT_TOKEN && !/^\d+:[A-Za-z0-9_-]+$/.test(process.env.BOT_TOKEN)) {
    errors.push('BOT_TOKEN format is invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Circuit breaker pattern for external API calls
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new TelegramBotError('Circuit breaker is open', {}, false);
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Global circuit breaker for Telegram API calls
export const telegramApiCircuitBreaker = new CircuitBreaker(5, 60000);