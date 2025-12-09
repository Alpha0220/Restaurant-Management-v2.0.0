
import { config } from 'dotenv';

// Load env vars before importing db
config({ path: '.env' });

async function main() {
  console.log('Seeding database...');

  try {
    // Dynamic import to ensure env vars are loaded first
    const { db } = await import('./src/lib/db');
    const { users } = await import('./src/lib/db/schema');

    await db.insert(users).values({
      name: 'Admin User',
      username: 'admin',
      password: 'password123', // Plain text as requested
      role: 'admin',
      disable: false,
    }).onConflictDoNothing();

    console.log('Seed done');
  } catch (error) {
    console.error('Seed error:', error);
  }
  process.exit(0);
}

main();
