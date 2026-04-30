import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] listening on :${config.port} (${config.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
