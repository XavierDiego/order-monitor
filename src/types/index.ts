export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer: string;
  status: OrderStatus;
  amount: number;
}


export type WebSocketEventType =
  | 'NEW_ORDER'
  | 'ORDER_UPDATED'
  | 'ORDER_CANCELLED';

export interface NewOrderEvent {
  type: 'NEW_ORDER';
  eventId: string;
  payload: Order;
}

export interface OrderUpdatedEvent {
  type: 'ORDER_UPDATED';
  eventId: string;
  payload: Order;
}

export interface OrderCancelledEvent {
  type: 'ORDER_CANCELLED';
  eventId: string;
  payload: { id: string };
}

export type WebSocketEvent =
  | NewOrderEvent
  | OrderUpdatedEvent
  | OrderCancelledEvent;


export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
