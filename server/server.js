require('dotenv').config();
const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./src/websocket');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

setupWebSocket(server);

server.listen(PORT, () => console.log(`Gradix API running on port ${PORT} (HTTP + WebSocket)`));
