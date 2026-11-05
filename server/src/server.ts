import 'dotenv/config';

import app from './app';
import connectDB from './config/db';
import { ensureDefaultCategories } from './utils/defaultCategories';

const PORT = Number(process.env.PORT) || 5000;

async function start(): Promise<void> {
  await connectDB();

  // Seed the shared default categories (idempotent).
  try {
    await ensureDefaultCategories();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Default categories seed skipped: ${message}`);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Instead of a raw stack trace, explain the one crash that's common in dev.
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n× Port ${PORT} is already in use.`);
      console.error('  Another instance of this server is probably still running.');
      console.error(`  Stop it first (find it with: netstat -ano | findstr :${PORT}), or set a different PORT in .env.`);
      process.exit(1);
    }
    throw err;
  });
}

void start();
