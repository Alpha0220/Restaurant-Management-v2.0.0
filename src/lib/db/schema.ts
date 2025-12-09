
import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Plain text as requested
  role: text('role').default('staff').notNull(),
  disable: boolean('disable').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
