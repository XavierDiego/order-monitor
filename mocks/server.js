const http = require('http');
const { WebSocketServer } = require('ws');


const orders = [];

let nextOrderId = 1;
let nextEventId = 1;

function newEventId() { return `evt-${nextEventId++}`; }
function newOrderId()  { return String(nextOrderId++); }


const WS_PORT = 3001;
const wss = new WebSocketServer({ port: WS_PORT });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */) client.send(message);
  });
}

wss.on('connection', (ws, req) => {
  const addr = req.socket.remoteAddress;
  console.log(`[WS]   Client connected    (${addr})`);
  ws.on('close', () => console.log(`[WS]   Client disconnected (${addr})`));
});

wss.on('listening', () => console.log(`[WS]   Listening on ws://localhost:${WS_PORT}`));


const HTTP_PORT = 3000;

function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/orders') {
    res.writeHead(200);
    res.end(JSON.stringify(orders));
    return;
  }

  if (req.method === 'POST' && req.url === '/orders') {
    readBody(req, (body) => {
      const data  = JSON.parse(body);
      const order = { id: newOrderId(), customer: String(data.customer), status: 'pending', amount: parseFloat(data.amount) };
      orders.push(order);
      broadcast({ type: 'NEW_ORDER', eventId: newEventId(), payload: order });
      console.log(`[HTTP] POST /orders   id=${order.id} customer=${order.customer}`);
      res.writeHead(201);
      res.end(JSON.stringify(order));
    }, () => badRequest(res));
    return;
  }

  const patchMatch = req.method === 'PATCH' && req.url?.match(/^\/orders\/(\w+)$/);
  if (patchMatch) {
    readBody(req, (body) => {
      const data    = JSON.parse(body);
      const idx     = orders.findIndex((o) => o.id === patchMatch[1]);
      if (idx === -1) { res.writeHead(404); res.end(JSON.stringify({ error: 'Order not found' })); return; }
      const updated = { ...orders[idx], status: String(data.status) };
      orders[idx]   = updated;
      broadcast({ type: 'ORDER_UPDATED', eventId: newEventId(), payload: updated });
      console.log(`[HTTP] PATCH /orders/${patchMatch[1]} status=${updated.status}`);
      res.writeHead(200);
      res.end(JSON.stringify(updated));
    }, () => badRequest(res));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

function readBody(req, onSuccess, onError) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => { try { onSuccess(body); } catch { onError(); } });
}

function badRequest(res) {
  res.writeHead(400);
  res.end(JSON.stringify({ error: 'Invalid JSON body' }));
}

http.createServer(handleRequest).listen(HTTP_PORT, () => {
  console.log(`[HTTP] Listening on http://localhost:${HTTP_PORT}`);
});


console.log('\n  Order Monitor — Server');
console.log('  ═══════════════════════');
console.log(`  HTTP : http://localhost:${HTTP_PORT}/orders`);
console.log(`  WS   : ws://localhost:${WS_PORT}\n`);


module.exports = { orders, broadcast, newEventId, newOrderId };
