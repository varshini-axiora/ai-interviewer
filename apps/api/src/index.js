import http from 'node:http';
import { sendJson } from './common/http.js';
import { env } from './config/env.js';
import { handleListDomains } from './modules/domains/handlers.js';
import {
  handleCompleteInterview,
  handleCreateInterview,
  handleGetInterview,
} from './modules/interviews/handlers.js';
import { handleCreateResponse, handleGetScores } from './modules/responses/handlers.js';
import { closeDatabase, pingDatabase } from './prisma/db.js';

async function start() {
  const dbReady = await pingDatabase();

  if (process.argv.includes('--check-db')) {
    console.log(JSON.stringify({ ok: dbReady, database: 'connected' }));
    await closeDatabase();
    return;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const { pathname } = url;

      if (pathname === '/health' || pathname === '/health/db') {
        const healthy = await pingDatabase();
        sendJson(res, healthy ? 200 : 503, {
          ok: healthy,
          database: healthy ? 'connected' : 'disconnected',
        });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/v1/domains') {
        await handleListDomains(req, res);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/v1/interviews') {
        await handleCreateInterview(req, res);
        return;
      }

      const interviewMatch = pathname.match(/^\/api\/v1\/interviews\/([^/]+)$/);
      if (req.method === 'GET' && interviewMatch) {
        await handleGetInterview(req, res, interviewMatch[1]);
        return;
      }

      const responsesMatch = pathname.match(/^\/api\/v1\/interviews\/([^/]+)\/responses$/);
      if (req.method === 'POST' && responsesMatch) {
        await handleCreateResponse(req, res, responsesMatch[1]);
        return;
      }

      const scoresMatch = pathname.match(/^\/api\/v1\/interviews\/([^/]+)\/scores$/);
      if (req.method === 'GET' && scoresMatch) {
        await handleGetScores(req, res, scoresMatch[1]);
        return;
      }

      const completeMatch = pathname.match(/^\/api\/v1\/interviews\/([^/]+)\/complete$/);
      if (req.method === 'POST' && completeMatch) {
        await handleCompleteInterview(req, res, completeMatch[1]);
        return;
      }

      sendJson(res, 404, { ok: false, message: 'Not Found' });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message ?? 'Unexpected server error' });
    }
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

