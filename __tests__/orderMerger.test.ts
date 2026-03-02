import { applyOrderEvent } from '../src/utils/orderMerger';
import { Order, WebSocketEvent } from '../src/types';


const BASE_ORDERS: Order[] = [
  { id: '1', customer: 'John Doe', status: 'pending', amount: 120.5 },
  { id: '2', customer: 'Jane Smith', status: 'completed', amount: 89.9 },
];

function makeEvent(
  type: WebSocketEvent['type'],
  payload: WebSocketEvent['payload'],
  eventId = 'evt-test',
): WebSocketEvent {
  return { type, eventId, payload } as WebSocketEvent;
}


describe('NEW_ORDER', () => {
  const newOrderPayload: Order = {
    id: '3',
    customer: 'Alice',
    status: 'pending',
    amount: 42,
  };

  it('prepends the new order to the list', () => {
    const event = makeEvent('NEW_ORDER', newOrderPayload);
    const result = applyOrderEvent(BASE_ORDERS, event);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(newOrderPayload);
  });

  it('does NOT mutate the original array', () => {
    const event = makeEvent('NEW_ORDER', newOrderPayload);
    const copy = [...BASE_ORDERS];
    applyOrderEvent(BASE_ORDERS, event);

    expect(BASE_ORDERS).toEqual(copy);
  });

  it('ignores duplicate orders (idempotent insert)', () => {
    const duplicate = makeEvent('NEW_ORDER', { ...BASE_ORDERS[0] });
    const result = applyOrderEvent(BASE_ORDERS, duplicate);

    expect(result).toHaveLength(2);
    expect(result).toEqual(BASE_ORDERS);
  });

  it('works on an empty list', () => {
    const event = makeEvent('NEW_ORDER', newOrderPayload);
    const result = applyOrderEvent([], event);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(newOrderPayload);
  });
});


describe('ORDER_UPDATED', () => {
  it('updates the matching order', () => {
    const updated: Order = { id: '1', customer: 'John Doe', status: 'completed', amount: 120.5 };
    const event = makeEvent('ORDER_UPDATED', updated);
    const result = applyOrderEvent(BASE_ORDERS, event);

    expect(result).toHaveLength(2);
    expect(result.find((o) => o.id === '1')?.status).toBe('completed');
  });

  it('merges partial updates without overriding other fields', () => {
    const partial: Order = { id: '1', customer: 'John Doe', status: 'processing', amount: 120.5 };
    const event = makeEvent('ORDER_UPDATED', partial);
    const result = applyOrderEvent(BASE_ORDERS, event);

    const updated = result.find((o) => o.id === '1')!;
    expect(updated.customer).toBe('John Doe');
    expect(updated.amount).toBe(120.5);
  });

  it('does NOT mutate the original array', () => {
    const event = makeEvent('ORDER_UPDATED', { ...BASE_ORDERS[0], status: 'completed' });
    applyOrderEvent(BASE_ORDERS, event);

    expect(BASE_ORDERS[0].status).toBe('pending');
  });

  it('is a no-op when the order id is not found', () => {
    const phantom: Order = { id: '999', customer: 'Ghost', status: 'completed', amount: 0 };
    const event = makeEvent('ORDER_UPDATED', phantom);
    const result = applyOrderEvent(BASE_ORDERS, event);

    expect(result).toHaveLength(2);
    expect(result).toEqual(BASE_ORDERS);
  });
});


describe('ORDER_CANCELLED', () => {
  it('removes the order with the given id', () => {
    const event = makeEvent('ORDER_CANCELLED', { id: '2' });
    const result = applyOrderEvent(BASE_ORDERS, event);

    expect(result).toHaveLength(1);
    expect(result.find((o) => o.id === '2')).toBeUndefined();
  });

  it('does NOT mutate the original array', () => {
    const event = makeEvent('ORDER_CANCELLED', { id: '1' });
    applyOrderEvent(BASE_ORDERS, event);

    expect(BASE_ORDERS).toHaveLength(2);
  });

  it('is a no-op when the order id is not found', () => {
    const event = makeEvent('ORDER_CANCELLED', { id: '999' });
    const result = applyOrderEvent(BASE_ORDERS, event);

    expect(result).toHaveLength(2);
    expect(result).toEqual(BASE_ORDERS);
  });

  it('handles cancellation on an empty list gracefully', () => {
    const event = makeEvent('ORDER_CANCELLED', { id: '1' });
    const result = applyOrderEvent([], event);

    expect(result).toHaveLength(0);
  });
});


describe('List integrity', () => {
  it('preserves order of remaining items on cancel', () => {
    const threeOrders: Order[] = [
      { id: 'a', customer: 'A', status: 'pending', amount: 1 },
      { id: 'b', customer: 'B', status: 'pending', amount: 2 },
      { id: 'c', customer: 'C', status: 'pending', amount: 3 },
    ];
    const result = applyOrderEvent(
      threeOrders,
      makeEvent('ORDER_CANCELLED', { id: 'b' }),
    );

    expect(result.map((o) => o.id)).toEqual(['a', 'c']);
  });

  it('new order appears at the head of the list', () => {
    const newOrder: Order = { id: 'z', customer: 'Z', status: 'pending', amount: 99 };
    const result = applyOrderEvent(BASE_ORDERS, makeEvent('NEW_ORDER', newOrder));

    expect(result[0].id).toBe('z');
  });
});
