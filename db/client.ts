import { Platform } from 'react-native';
import * as schema from './schema';

let db: any;
let migrateDb: () => Promise<void>;

// STEP 1: Initialize Database Engine (Web vs Native)
if (Platform.OS === 'web') {
  console.warn('SQLite is not supported on web. Offline mode disabled.');
  // Dummy DB for web to prevent crash
  db = {
    query: { expenses: { findMany: async () => [] } },
    insert: () => ({ values: () => ({ onConflictDoUpdate: async () => { } }) }),
    update: () => ({ set: () => ({ where: async () => { } }) }),
  };
  migrateDb = async () => { /* Web skips migration */ };
} else {
  const { drizzle } = require('drizzle-orm/expo-sqlite');
  const { openDatabaseSync } = require('expo-sqlite');
  const expoDb = openDatabaseSync('dailyxpense.db');
  db = drizzle(expoDb, { schema });

  // STEP 2: Run Database Migrations (Schema Definition)
  migrateDb = async () => {
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        date INTEGER NOT NULL,
        category TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        sync_status TEXT DEFAULT 'PENDING' NOT NULL,
        deleted INTEGER DEFAULT 0 NOT NULL,
        type TEXT DEFAULT 'expense' NOT NULL -- Added in V2
      );
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        currency TEXT,
        name TEXT,
        avatar TEXT,
        budget REAL,
        notifications_enabled INTEGER,
        reminder_time TEXT,
        app_lock_enabled INTEGER,
        security_pin TEXT,
        theme TEXT,
        accent_color TEXT,
        categories TEXT,
        updated_at INTEGER NOT NULL,
        sync_status TEXT DEFAULT 'PENDING' NOT NULL,
        max_amount REAL,
        is_premium INTEGER DEFAULT 0, -- Added in V4
        locale TEXT DEFAULT 'en-IN' -- Added in V5
      );
    `);

    // STEP 3: Handle Incremental Schema Updates (Manual Migrations)
    try {
      await expoDb.execAsync("ALTER TABLE settings ADD COLUMN locale TEXT DEFAULT 'en-IN'");
    } catch (e) { }

    try {
      await expoDb.execAsync("ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'expense'");
    } catch (e) {
      // Column likely exists, ignore
    }

    try {
      await expoDb.execAsync("ALTER TABLE settings ADD COLUMN max_amount REAL");
    } catch (e) { }

    try {
      await expoDb.execAsync("ALTER TABLE settings ADD COLUMN is_premium INTEGER DEFAULT 0");
    } catch (e) { }

    try {
      await expoDb.execAsync("ALTER TABLE settings ADD COLUMN automatic_cloud_sync INTEGER DEFAULT 1");
    } catch (e) { }

    try {
      await expoDb.execAsync("ALTER TABLE settings ADD COLUMN biometrics_enabled INTEGER DEFAULT 0");
    } catch (e) { }
  };
}

export { db, migrateDb };

