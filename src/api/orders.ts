import { Order, OrderStatus } from '../types';
import { apiClient } from './client';

export async function fetchOrders(): Promise<Order[]> {
  return apiClient.get<Order[]>('/orders');
}

export async function createOrder(data: {
  customer: string;
  amount: number;
}): Promise<Order> {
  return apiClient.post<Order>('/orders', { ...data, status: 'pending' });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiClient.patch<Order>(`/orders/${id}`, { status });
}
