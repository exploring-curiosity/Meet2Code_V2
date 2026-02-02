const http = require('http');
const WebSocket = require('ws');
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;

const port = process.env.PORT || 1234;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  console.log('[yjs] New connection:', req.url);
  setupWSConnection(conn, req);
});

wss.on('error', (error) => {
  console.error('[yjs] WebSocket error:', error);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[yjs] WebSocket server listening on ws://0.0.0.0:${port}`);
});
