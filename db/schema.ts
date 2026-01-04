import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(), // UUID
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(), // SQLite stores dates as numbers
  category: text('category').notNull(),
  userId: text('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),

  // Sync fields
  syncStatus: text('sync_status', { enum: ['PENDING', 'SYNCED'] }).default('PENDING').notNull(),
  deleted: integer('deleted', { mode: 'boolean' }).default(false).notNull(),
  type: text('type', { enum: ['expense', 'income'] }).default('expense').notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(), // Usually user_id or 'local_settings'
  userId: text('user_id').notNull(), // To link to Supabase user
  currency: text('currency'),
  locale: text('locale'),
  name: text('name'),
  avatar: text('avatar'),
  budget: real('budget'),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }),
  reminderTime: text('reminder_time'),
  appLockEnabled: integer('app_lock_enabled', { mode: 'boolean' }),
  securityPin: text('security_pin'),
  biometricsEnabled: integer('biometrics_enabled', { mode: 'boolean' }),
  theme: text('theme'),
  accentColor: text('accent_color'),
  categories: text('categories'), // JSON string
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncStatus: text('sync_status', { enum: ['PENDING', 'SYNCED'] }).default('PENDING').notNull(),
  maxAmount: real('max_amount'),
  isPremium: integer('is_premium', { mode: 'boolean' }).default(false),
  automaticCloudSync: integer('automatic_cloud_sync', { mode: 'boolean' }).default(true),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
