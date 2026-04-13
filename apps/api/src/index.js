import http from 'node:http';
import { env } from './config/env.js';
import { closeDatabase, pingDatabase } from './prisma/db.js';

async function start() {
  const dbReady = await pingDatabase();

  if (process.argv.includes('--check-db')) {
    console.log(JSON.stringify({ ok: dbReady, database: 'connected' }));
    await closeDatabase();
    return;
  }

  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/health/db') {
      try {
        const healthy = await pingDatabase();
        res.writeHead(healthy ? 200 : 503, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: healthy, database: healthy ? 'connected' : 'disconnected' }));
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, message: 'Not Found' }));
  });

  server.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
    console.log(`Database status: ${dbReady ? 'connected' : 'disconnected'}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (error) => {
  console.error(error);
  await closeDatabase();
  process.exit(1);
});

