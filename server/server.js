require('dotenv').config();
const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./src/websocket');
const runMigrations = require('./src/migrations/runMigrations');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

setupWebSocket(server);

async function startServer() {
  try {
    if (process.env.RUN_MIGRATIONS_ON_START !== 'false') {
      await runMigrations();
    }

    server.listen(PORT, () => console.log(`Gradix API running on port ${PORT} (HTTP + WebSocket)`));
  } catch (err) {
    console.error('Failed to start Gradix API:', err.message);
    process.exit(1);
  }
}

startServer();
