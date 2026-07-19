import { createApp } from './app';
import { env } from './config/env';

if (env.corsOrigins.length === 0) {
  console.error(
    '[api] CORS_ORIGINS resolved to an empty list. No browser origin will be ' +
      'allowed, so all cross-origin requests (admin/customer login, cart, etc.) ' +
      'will fail with "Failed to fetch". Set CORS_ORIGINS to a comma-separated ' +
      'list of frontend URLs (e.g. https://royal-spirits-admin.onrender.com).',
  );
}

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(
    `[api] listening on http://localhost:${env.port} (${env.nodeEnv})` +
      ` | CORS origins: ${env.corsOrigins.join(', ') || '(none)'}`,
  );
});

function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
