import express from 'express';
import http from 'http';
import cors from 'cors';
import { initWebSocketServer } from './ws-handler';
import filesRouter from './routes/files';
import forgeRouter from './routes/forge';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/files', filesRouter);
app.use('/api/forge', forgeRouter);

// file read/write routes are on filesRouter but need /api/file path
app.use('/api', filesRouter);

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'studio', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`[MonadicStudio] Backend running on http://localhost:${PORT}`);
  console.log(`[MonadicStudio] WebSocket ready on ws://localhost:${PORT}`);
});
