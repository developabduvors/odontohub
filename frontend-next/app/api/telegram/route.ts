import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveUserLang, getUserLang, userExists } from '@/lib/database';
import { t, type SupportedLanguage } from '@/locales/i18n';
import { 
  withErrorHandling, 
  withDatabaseRetry, 
  safeTranslate, 
  validateConfiguration,
  telegramApiCircuitBreaker,
  TelegramBotError,
  logError
} from '@/lib/error-handler';

// Telegram Bot API types
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
  chat_instance: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  inline_query?: unknown;
  chosen_inline_result?: unknown;
  shipping_query?: unknown;
  pre_checkout_query?: unknown;
}

// Telegram Bot API response types
export interface TelegramInlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface TelegramSendMessageParams {
  chat_id: number | string;
  text: string;
  reply_markup?: TelegramInlineKeyboardMarkup;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

/**
 * Verify Telegram webhook signature for security
 * @param body - Raw request body
 * @param signature - X-Telegram-Bot-Api-Secret-Token header value
 * @returns boolean indicating if signature is valid
 */
function verifyTelegramSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.warn('No Telegram signature provided');
    return false;
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.error('BOT_TOKEN environment variable not set');
    return false;
  }

  try {
    // Create HMAC using bot token as secret
    const hmac = crypto.createHmac('sha256', botToken);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying Telegram signature:', error);
    return false;
  }
}

/**
 * Send message to Telegram Bot API with circuit breaker and error handling
 * @param params - Message parameters
 * @returns Promise<boolean> indicating success
 */
async function sendTelegramMessage(params: TelegramSendMessageParams): Promise<boolean> {
  return await telegramApiCircuitBreaker.execute(async () => {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      throw new TelegramBotError('BOT_TOKEN environment variable not set', {}, false);
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API error:', response.status, errorText);
        
        // Check if it's a recoverable error
        const isRecoverable = response.status >= 500 || response.status === 429;
        throw new TelegramBotError(
          `Telegram API error: ${response.status}`,
          { operation: 'sendMessage' },
          isRecoverable
        );
      }

      const result = await response.json();
      return result.ok === true;
    } catch (error) {
      if (error instanceof TelegramBotError) {
        throw error;
      }
      
      throw new TelegramBotError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'sendMessage', originalError: error instanceof Error ? error : undefined }
      );
    }
  });
}

/**
 * Answer callback query to remove loading state from inline keyboard
 * @param callbackQueryId - Callback query ID
 * @param text - Optional text to show as notification
 * @returns Promise<boolean> indicating success
 */
async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
  return await telegramApiCircuitBreaker.execute(async () => {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      throw new TelegramBotError('BOT_TOKEN environment variable not set', {}, false);
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || '',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram answerCallbackQuery error:', response.status, errorText);
        
        const isRecoverable = response.status >= 500 || response.status === 429;
        throw new TelegramBotError(
          `Telegram API error: ${response.status}`,
          { operation: 'answerCallbackQuery' },
          isRecoverable
        );
      }

      const result = await response.json();
      return result.ok === true;
    } catch (error) {
      if (error instanceof TelegramBotError) {
        throw error;
      }
      
      throw new TelegramBotError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'answerCallbackQuery', originalError: error instanceof Error ? error : undefined }
      );
    }
  });
}

/**
 * Main webhook handler for Telegram bot
 * Processes incoming updates and routes them to appropriate handlers
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate configuration on startup
    const configValidation = validateConfiguration();
    if (!configValidation.isValid) {
      console.error('Configuration validation failed:', configValidation.errors);
      return NextResponse.json({ 
        error: 'Configuration error', 
        details: configValidation.errors 
      }, { status: 500 });
    }

    // Get request body and signature
    const body = await request.text();
    const signature = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    
    console.log('Webhook request received:', {
      bodyLength: body.length,
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    });

    // Verify webhook signature for security (skip in development if no signature)
    if (process.env.NODE_ENV === 'production' || signature) {
      if (!verifyTelegramSignature(body, signature)) {
        console.warn('Invalid Telegram webhook signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse the update
    let update: TelegramUpdate;
    try {
      update = JSON.parse(body);
    } catch (error) {
      console.error('Error parsing Telegram update:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate update structure
    if (!update.update_id) {
      console.error('Invalid update: missing update_id');
      return NextResponse.json({ error: 'Invalid update format' }, { status: 400 });
    }

    // Log the update for debugging (but limit size for large updates)
    const logUpdate = { ...update };
    if (JSON.stringify(logUpdate).length > 1000) {
      logUpdate.message = logUpdate.message ? { ...logUpdate.message, text: logUpdate.message.text?.substring(0, 100) + '...' } : undefined;
    }
    console.log('Processing Telegram update:', JSON.stringify(logUpdate, null, 2));

    // Process the update with error handling
    const success = await withErrorHandling(
      () => processUpdate(update),
      { operation: 'processUpdate' }
    );
    
    const processingTime = Date.now() - startTime;
    console.log(`Update processed in ${processingTime}ms:`, { success, updateId: update.update_id });

    if (success !== null) {
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'webhook',
    });
    
    console.error(`Webhook error after ${processingTime}ms:`, error);
    
    // Return a generic error to Telegram
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Process incoming Telegram update
 * Routes messages and callback queries to appropriate handlers
 * @param update - Telegram update object
 * @returns Promise<boolean> indicating success
 */
async function processUpdate(update: TelegramUpdate): Promise<boolean> {
  try {
    // Log update for debugging
    console.log('Processing update type:', Object.keys(update).filter(key => key !== 'update_id'));
    
    if (update.message) {
      return await handleMessage(update.message);
    } else if (update.callback_query) {
      return await handleCallbackQuery(update.callback_query);
    } else if (update.edited_message) {
      // Handle edited messages (optional)
      console.log('Received edited message, ignoring');
      return true;
    } else if (update.channel_post) {
      // Handle channel posts (optional)
      console.log('Received channel post, ignoring');
      return true;
    } else if (update.edited_channel_post) {
      // Handle edited channel posts (optional)
      console.log('Received edited channel post, ignoring');
      return true;
    } else if (update.inline_query) {
      // Handle inline queries (optional)
      console.log('Received inline query, ignoring');
      return true;
    } else if (update.chosen_inline_result) {
      // Handle chosen inline results (optional)
      console.log('Received chosen inline result, ignoring');
      return true;
    } else if (update.shipping_query) {
      // Handle shipping queries (optional)
      console.log('Received shipping query, ignoring');
      return true;
    } else if (update.pre_checkout_query) {
      // Handle pre-checkout queries (optional)
      console.log('Received pre-checkout query, ignoring');
      return true;
    } else {
      console.log('Unhandled update type:', Object.keys(update));
      return true; // Return true for unhandled but valid updates
    }
  } catch (error) {
    console.error('Error processing update:', error);
    
    // Try to send error message to user if we can identify the chat
    try {
      let chatId: number | null = null;
      
      if (update.message?.chat?.id) {
        chatId = update.message.chat.id;
      } else if (update.callback_query?.message?.chat?.id) {
        chatId = update.callback_query.message.chat.id;
      }
      
      if (chatId) {
        const userLang = await getUserLang(chatId.toString()).catch(() => 'uz' as SupportedLanguage);
        await sendTelegramMessage({
          chat_id: chatId,
          text: safeTranslate('errors.server_error', userLang),
        });
      }
    } catch (errorHandlingError) {
      console.error('Error sending error message to user:', errorHandlingError);
    }
    
    return false;
  }
}

/**
 * Handle incoming text messages
 * @param message - Telegram message object
 * @returns Promise<boolean> indicating success
 */
async function handleMessage(message: TelegramMessage): Promise<boolean> {
  const chatId = message.chat.id;
  const text = message.text?.trim();

  // Log message details for debugging
  console.log(`Received message from ${chatId}:`, {
    text: text,
    messageId: message.message_id,
    from: message.from?.username || message.from?.first_name,
    chatType: message.chat.type
  });

  if (!text) {
    // Handle non-text messages (photos, documents, etc.)
    console.log('Received non-text message, ignoring');
    return true;
  }

  // Handle commands
  if (text.startsWith('/')) {
    return await handleCommand(chatId, text);
  }

  // Handle regular text messages
  return await handleTextMessage(chatId, text);
}

/**
 * Handle bot commands
 * @param chatId - Chat ID
 * @param command - Command text
 * @returns Promise<boolean> indicating success
 */
async function handleCommand(chatId: number, command: string): Promise<boolean> {
  const chatIdStr = chatId.toString();
  
  return await withErrorHandling(async () => {
    // Get user's language preference with database retry
    const userLang = await withDatabaseRetry(() => getUserLang(chatIdStr));
    
    switch (command.toLowerCase()) {
      case '/start':
        return await handleStartCommand(chatId, userLang);
      
      case '/support':
        return await handleSupportCommand(chatId, userLang);
      
      case '/privacy':
        return await handlePrivacyCommand(chatId, userLang);
      
      case '/terms':
        return await handleTermsCommand(chatId, userLang);
      
      case '/help':
        return await handleHelpCommand(chatId, userLang);
      
      default:
        // Unknown command
        await sendTelegramMessage({
          chat_id: chatId,
          text: safeTranslate('errors.unknown_command', userLang),
        });
        return true;
    }
  }, { chatId, userLang: 'uz', operation: 'handleCommand' }) !== null;
}

/**
 * Handle /start command - show language selection for new users or welcome for existing users
 * @param chatId - Chat ID
 * @param currentLang - Current user language
 * @returns Promise<boolean> indicating success
 */
async function handleStartCommand(chatId: number, currentLang: SupportedLanguage): Promise<boolean> {
  const chatIdStr = chatId.toString();
  
  return await withErrorHandling(async () => {
    // Check if user exists and has set a language preference
    const exists = await withDatabaseRetry(() => userExists(chatIdStr));
    
    if (!exists) {
      // New user - show language selection
      return await showLanguageSelection(chatId);
    } else {
      // Existing user - show welcome message with role selection
      return await showWelcomeMessage(chatId, currentLang);
    }
  }, { chatId, userLang: currentLang, operation: 'handleStartCommand' }) !== null;
}

/**
 * Show language selection keyboard for new users
 * @param chatId - Chat ID
 * @returns Promise<boolean> indicating success
 */
async function showLanguageSelection(chatId: number): Promise<boolean> {
  const keyboard: TelegramInlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: safeTranslate('language.uzbek_button', 'uz'),
          callback_data: 'lang_uz'
        },
        {
          text: safeTranslate('language.russian_button', 'uz'),
          callback_data: 'lang_ru'
        }
      ]
    ]
  };

  return await sendTelegramMessage({
    chat_id: chatId,
    text: safeTranslate('language.choose', 'uz'),
    reply_markup: keyboard,
  });
}

/**
 * Show welcome message with doctor/patient role selection
 * @param chatId - Chat ID
 * @param lang - User language
 * @returns Promise<boolean> indicating success
 */
async function showWelcomeMessage(chatId: number, lang: SupportedLanguage): Promise<boolean> {
  const keyboard: TelegramInlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: safeTranslate('welcome.doctor_button', lang),
          callback_data: 'role_doctor'
        },
        {
          text: safeTranslate('welcome.patient_button', lang),
          callback_data: 'role_patient'
        }
      ]
    ]
  };

  const welcomeText = `${safeTranslate('welcome.greeting', lang)}\n\n${safeTranslate('welcome.choose_role', lang)}`;

  return await sendTelegramMessage({
    chat_id: chatId,
    text: welcomeText,
    reply_markup: keyboard,
  });
}

/**
 * Handle /support command
 * @param chatId - Chat ID
 * @param lang - User language
 * @returns Promise<boolean> indicating success
 */
async function handleSupportCommand(chatId: number, lang: SupportedLanguage): Promise<boolean> {
  return await sendTelegramMessage({
    chat_id: chatId,
    text: safeTranslate('commands.support', lang),
  });
}

/**
 * Handle /privacy command
 * @param chatId - Chat ID
 * @param lang - User language
 * @returns Promise<boolean> indicating success
 */
async function handlePrivacyCommand(chatId: number, lang: SupportedLanguage): Promise<boolean> {
  return await sendTelegramMessage({
    chat_id: chatId,
    text: safeTranslate('commands.privacy', lang),
  });
}

/**
 * Handle /terms command
 * @param chatId - Chat ID
 * @param lang - User language
 * @returns Promise<boolean> indicating success
 */
async function handleTermsCommand(chatId: number, lang: SupportedLanguage): Promise<boolean> {
  return await sendTelegramMessage({
    chat_id: chatId,
    text: safeTranslate('commands.terms', lang),
  });
}

/**
 * Handle /help command
 * @param chatId - Chat ID
 * @param lang - User language
 * @returns Promise<boolean> indicating success
 */
async function handleHelpCommand(chatId: number, lang: SupportedLanguage): Promise<boolean> {
  return await sendTelegramMessage({
    chat_id: chatId,
    text: safeTranslate('commands.help', lang),
  });
}

/**
 * Handle regular text messages
 * @param chatId - Chat ID
 * @param text - Message text
 * @returns Promise<boolean> indicating success
 */
async function handleTextMessage(chatId: number, text: string): Promise<boolean> {
  const chatIdStr = chatId.toString();
  
  try {
    // Get user language
    const userLang = await getUserLang(chatIdStr);
    
    console.log(`Handling text message: ${text} for chat ${chatId} in language ${userLang}`);
    
    // For now, just acknowledge the message
    // In a full implementation, this would handle various text inputs
    await sendTelegramMessage({
      chat_id: chatId,
      text: t('errors.unknown_command', userLang),
    });

    return true;
  } catch (error) {
    console.error('Error handling text message:', error);
    return false;
  }
}

/**
 * Handle callback queries from inline keyboards
 * @param callbackQuery - Telegram callback query object
 * @returns Promise<boolean> indicating success
 */
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<boolean> {
  const chatId = callbackQuery.message?.chat.id;
  const data = callbackQuery.data;

  if (!chatId || !data) {
    await answerCallbackQuery(callbackQuery.id, 'Invalid callback data');
    return false;
  }

  console.log(`Received callback query from ${chatId}: ${data}`);

  try {
    // Handle language selection callbacks
    if (data === 'lang_uz' || data === 'lang_ru') {
      return await handleLanguageSelection(chatId, data, callbackQuery.id);
    }
    
    // Handle role selection callbacks
    if (data === 'role_doctor' || data === 'role_patient') {
      return await handleRoleSelection(chatId, data, callbackQuery.id);
    }

    // Unknown callback data
    await answerCallbackQuery(callbackQuery.id, 'Unknown action');
    return true;
  } catch (error) {
    console.error('Error handling callback query:', error);
    await answerCallbackQuery(callbackQuery.id, 'Error processing request');
    return false;
  }
}

/**
 * Handle language selection callback
 * @param chatId - Chat ID
 * @param data - Callback data ('lang_uz' or 'lang_ru')
 * @param callbackQueryId - Callback query ID
 * @returns Promise<boolean> indicating success
 */
async function handleLanguageSelection(chatId: number, data: string, callbackQueryId: string): Promise<boolean> {
  const chatIdStr = chatId.toString();
  const lang: SupportedLanguage = data === 'lang_ru' ? 'ru' : 'uz';
  
  try {
    // Save user language preference
    await saveUserLang(chatIdStr, lang);
    
    // Answer the callback query
    await answerCallbackQuery(callbackQueryId, t('language.choose', lang));
    
    // Show welcome message with role selection
    return await showWelcomeMessage(chatId, lang);
  } catch (error) {
    console.error('Error handling language selection:', error);
    await answerCallbackQuery(callbackQueryId, 'Error saving language preference');
    return false;
  }
}

/**
 * Handle role selection callback
 * @param chatId - Chat ID
 * @param data - Callback data ('role_doctor' or 'role_patient')
 * @param callbackQueryId - Callback query ID
 * @returns Promise<boolean> indicating success
 */
async function handleRoleSelection(chatId: number, data: string, callbackQueryId: string): Promise<boolean> {
  const chatIdStr = chatId.toString();
  
  try {
    // Get user language
    const userLang = await getUserLang(chatIdStr);
    
    // Answer the callback query
    await answerCallbackQuery(callbackQueryId);
    
    // Send confirmation message based on role
    const role = data === 'role_doctor' ? 'doctor' : 'patient';
    const confirmationText = role === 'doctor' 
      ? `${t('welcome.greeting', userLang)} ${t('welcome.doctor_button', userLang)}!`
      : `${t('welcome.greeting', userLang)} ${t('welcome.patient_button', userLang)}!`;
    
    return await sendTelegramMessage({
      chat_id: chatId,
      text: confirmationText,
    });
  } catch (error) {
    console.error('Error handling role selection:', error);
    await answerCallbackQuery(callbackQueryId, 'Error processing role selection');
    return false;
  }
}

// Export helper functions for testing
export { sendTelegramMessage, answerCallbackQuery, verifyTelegramSignature };