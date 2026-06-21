/**
 * Database functions for Telegram bot language management
 * These functions interact with the Neon PostgreSQL database to store and retrieve user language preferences
 */

import { Pool } from 'pg';

// Database connection configuration
const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return databaseUrl;
};

// Create a connection pool for better performance
let pool: Pool | null = null;

const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: {
        rejectUnauthorized: false
      },
      // Connection pool settings for Neon
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

/**
 * Save user language preference to database
 * @param chatId - Telegram chat ID (as string)
 * @param lang - Language code ('uz' or 'ru')
 * @returns Promise<void>
 */
export async function saveUserLang(chatId: string, lang: 'uz' | 'ru'): Promise<void> {
  if (!chatId) {
    throw new Error('ChatId is required');
  }
  
  if (lang !== 'uz' && lang !== 'ru') {
    throw new Error('Language must be either "uz" or "ru"');
  }

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // First, try to find user by telegram_id
    const findUserQuery = 'SELECT id FROM users WHERE telegram_id = $1';
    const findResult = await client.query(findUserQuery, [chatId]);
    
    if (findResult.rows.length > 0) {
      // User exists, update their language
      const updateQuery = 'UPDATE users SET language = $1 WHERE telegram_id = $2';
      await client.query(updateQuery, [lang, chatId]);
    } else {
      // User doesn't exist, create a new user record with minimal data
      // Note: This creates a user with telegram_id only, other fields will need to be filled later
      const insertQuery = `
        INSERT INTO users (telegram_id, language, phone, role, is_active) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (telegram_id) 
        DO UPDATE SET language = EXCLUDED.language
      `;
      // Use a placeholder phone number that will be updated when user completes registration
      const placeholderPhone = `telegram_${chatId}`;
      await client.query(insertQuery, [chatId, lang, placeholderPhone, 'PATIENT', true]);
    }
  } catch (error) {
    console.error('Error saving user language:', error);
    throw new Error(`Failed to save user language: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    client.release();
  }
}

/**
 * Get user language preference from database
 * @param chatId - Telegram chat ID (as string)
 * @returns Promise<'uz' | 'ru'> - Returns 'uz' as default if user not found or language not set
 */
export async function getUserLang(chatId: string): Promise<'uz' | 'ru'> {
  if (!chatId) {
    console.warn('ChatId is empty, returning default language');
    return 'uz';
  }

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = 'SELECT language FROM users WHERE telegram_id = $1';
    const result = await client.query(query, [chatId]);
    
    if (result.rows.length > 0) {
      const language = result.rows[0].language;
      // Ensure we return a valid language, default to 'uz' if invalid
      return (language === 'ru' || language === 'uz') ? language : 'uz';
    }
    
    // User not found, return default language
    return 'uz';
  } catch (error) {
    console.error('Error getting user language:', error);
    // Return default language on error to ensure bot continues working
    return 'uz';
  } finally {
    client.release();
  }
}

/**
 * Check if user exists in database by telegram_id
 * @param chatId - Telegram chat ID (as string)
 * @returns Promise<boolean>
 */
export async function userExists(chatId: string): Promise<boolean> {
  if (!chatId) {
    return false;
  }

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = 'SELECT 1 FROM users WHERE telegram_id = $1 LIMIT 1';
    const result = await client.query(query, [chatId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Get user information by telegram_id
 * @param chatId - Telegram chat ID (as string)
 * @returns Promise<User | null>
 */
export async function getUserByTelegramId(chatId: string): Promise<Record<string, unknown> | null> {
  if (!chatId) {
    return null;
  }

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM users WHERE telegram_id = $1';
    const result = await client.query(query, [chatId]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by telegram_id:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Close the database connection pool
 * Should be called when the application shuts down
 */
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}