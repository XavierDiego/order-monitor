const { orders, broadcast, newEventId, newOrderId } = require('./server');


const CUSTOMERS = ['João', 'Pedro', 'Diana', 'Ana', 'Alice', 'Gustavo', 'Ema', 'Isadora'];
const STATUSES  = ['pending', 'processing', 'completed'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function simulateEvent() {
  if (orders.length === 0) return;

  const eventId = newEventId();
  const roll    = Math.random();

  if (roll < 0.33) {
    const order = { id: newOrderId(), customer: randomFrom(CUSTOMERS), status: 'pending', amount: parseFloat((Math.random() * 500 + 10).toFixed(2)) };
    orders.push(order);
    broadcast({ type: 'NEW_ORDER', eventId, payload: order });
    console.log(`[EVT]  NEW_ORDER       id=${order.id} customer=${order.customer}`);

  } else if (roll < 0.66) {
    const order   = randomFrom(orders);
    const updated = { ...order, status: randomFrom(STATUSES) };
    orders[orders.findIndex((o) => o.id === order.id)] = updated;
    broadcast({ type: 'ORDER_UPDATED', eventId, payload: updated });
    console.log(`[EVT]  ORDER_UPDATED   id=${order.id} status=${updated.status}`);

  } else {
    if (orders.length <= 1) return;
    const order = randomFrom(orders);
    orders.splice(orders.findIndex((o) => o.id === order.id), 1);
    broadcast({ type: 'ORDER_CANCELLED', eventId, payload: { id: order.id } });
    console.log(`[EVT]  ORDER_CANCELLED id=${order.id}`);
  }
}

setInterval(simulateEvent, 3_000);

console.log('  Sim  : events every 3s\n');
