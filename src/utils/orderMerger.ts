import { Order, WebSocketEvent } from '../types';

export function applyOrderEvent(
  orders: Order[],
  event: WebSocketEvent,
): Order[] {
  switch (event.type) {
    case 'NEW_ORDER': {
      if (orders.some((o) => o.id === event.payload.id)) {
        return orders;
      }
      return [event.payload, ...orders];
    }

    case 'ORDER_UPDATED': {
      return orders.map((o) =>
        o.id === event.payload.id ? { ...o, ...event.payload } : o,
      );
    }

    case 'ORDER_CANCELLED': {
      return orders.filter((o) => o.id !== event.payload.id);
    }

    default: {

      const _exhaustive: never = event;
      console.warn('[orderMerger] Unknown event type:', _exhaustive);
      return orders;
    }
  }
}
