import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { botManager } from './server/telegramBot.ts';
import { resolveAnyLink } from './server/unifiedResolver.ts';
import { extractDiskWalaId } from './server/diskwalaResolver.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- API Routes ---

  // Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DiskWala Telegram Bot Engine',
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  });

  // Bot Status
  app.get('/api/bot/status', (req, res) => {
    res.json({
      ok: true,
      data: botManager.getStatus(),
    });
  });

  // Bot Configure Token
  app.post('/api/bot/configure', async (req, res) => {
    const { token, autoStart = true } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ ok: false, error: 'Token is required' });
      return;
    }

    const isValid = await botManager.verifyToken(token);
    if (!isValid) {
      res.status(400).json({
        ok: false,
        error: 'Invalid Telegram bot token. Please check that you copied the complete token from @BotFather.',
      });
      return;
    }

    if (autoStart) {
      await botManager.startPolling();
    }

    res.json({
      ok: true,
      message: 'Bot token successfully configured and verified.',
      data: botManager.getStatus(),
    });
  });

  // Bot Start Polling
  app.post('/api/bot/start', async (req, res) => {
    const success = await botManager.startPolling();
    if (success) {
      res.json({ ok: true, message: 'Bot polling started', data: botManager.getStatus() });
    } else {
      res.status(400).json({ ok: false, error: 'Could not start bot. Make sure a valid token is configured.' });
    }
  });

  // Bot Stop
  app.post('/api/bot/stop', (req, res) => {
    botManager.stop();
    res.json({ ok: true, message: 'Bot stopped', data: botManager.getStatus() });
  });

  // Set Webhook
  app.post('/api/bot/set-webhook', async (req, res) => {
    const { webhookUrl } = req.body;
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      res.status(400).json({ ok: false, error: 'Webhook URL is required' });
      return;
    }
    const success = await botManager.setWebhook(webhookUrl);
    if (success) {
      res.json({ ok: true, message: 'Webhook registered successfully', data: botManager.getStatus() });
    } else {
      res.status(400).json({ ok: false, error: 'Failed to set webhook. Verify your bot token and URL.' });
    }
  });

  // Telegram Webhook Handler
  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      if (req.body && req.body.update_id !== undefined) {
        await botManager.processUpdate(req.body);
      }
      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Webhook error]:', msg);
      res.status(200).json({ ok: false, error: msg }); // Always return 200 to Telegram so it doesn't spam retries
    }
  });

  // Activity Logs
  app.get('/api/bot/logs', (req, res) => {
    res.json({
      ok: true,
      logs: botManager.getLogs(),
    });
  });

  // Resolve DiskWala or TeraBox Link directly
  app.post('/api/resolve', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing "url" parameter in request body' });
      return;
    }

    botManager.addLog('info', 'resolver', `Resolving link via Web UI: ${url}`);
    const result = await resolveAnyLink(url);
    if (result.ok && result.result) {
      botManager.addLog('success', 'resolver', `Successfully resolved "${result.result.title}"`);
    } else {
      botManager.addLog('error', 'resolver', `Resolution failed for "${url}": ${result.message}`);
    }

    res.json(result);
  });

  // Proxy download stream (useful when direct links have CORS or hotlinking headers)
  app.get('/api/proxy-download', async (req, res) => {
    const targetUrl = req.query.url as string;
    const fileName = (req.query.filename as string) || 'diskwala-download';

    if (!targetUrl) {
      res.status(400).send('Missing url parameter');
      return;
    }

    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.diskwala.com/',
        },
      });

      if (!upstream.ok) {
        res.status(upstream.status).send(`Upstream download failed with status ${upstream.status}`);
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const contentLength = upstream.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      // Stream arrayBuffer or body
      if (upstream.body) {
        const reader = upstream.body.getReader();
        const stream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        };
        await stream();
      } else {
        const buffer = await upstream.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).send(`Proxy download error: ${msg}`);
    }
  });

  // --- Vite Middleware / Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DiskWala Telegram Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
