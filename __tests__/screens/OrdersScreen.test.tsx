import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OrdersScreen } from '../../src/screens/OrdersScreen';
import { useOrders } from '../../src/hooks/useOrders';
import { useOrdersStore } from '../../src/store/ordersStore';
import { Order } from '../../src/types';


jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../src/hooks/useOrders', () => ({ useOrders: jest.fn() }));

jest.mock('../../src/hooks/useWebSocket', () => ({ useWebSocket: jest.fn() }));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const mockedUseOrders = useOrders as jest.MockedFunction<typeof useOrders>;


const ORDERS: Order[] = [
  { id: '1', customer: 'Alice', status: 'pending',   amount: 100 },
  { id: '2', customer: 'Bob',   status: 'completed', amount: 200 },
];

const mockLoadOrders = jest.fn();


beforeEach(() => {
  jest.clearAllMocks();
  useOrdersStore.setState({ connectionStatus: 'connected' });
});

describe('OrdersScreen', () => {
  it('renders all order customer names', () => {
    mockedUseOrders.mockReturnValue({
      orders: ORDERS,
      isLoading: false,
      error: null,
      loadOrders: mockLoadOrders,
    });

    const { getByText } = render(<OrdersScreen />);

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('shows EmptyState when there are no orders and not loading', () => {
    mockedUseOrders.mockReturnValue({
      orders: [],
      isLoading: false,
      error: null,
      loadOrders: mockLoadOrders,
    });

    const { getByText } = render(<OrdersScreen />);

    expect(getByText('empty.title')).toBeTruthy();
  });

  it('shows ErrorState when there is an error', () => {
    mockedUseOrders.mockReturnValue({
      orders: [],
      isLoading: false,
      error: 'Network error',
      loadOrders: mockLoadOrders,
    });

    const { getByText } = render(<OrdersScreen />);

    expect(getByText('Network error')).toBeTruthy();
    expect(getByText('error.retry')).toBeTruthy();
  });

  it('calls loadOrders when the retry button is pressed', () => {
    mockedUseOrders.mockReturnValue({
      orders: [],
      isLoading: false,
      error: 'Network error',
      loadOrders: mockLoadOrders,
    });

    const { getByText } = render(<OrdersScreen />);

    fireEvent.press(getByText('error.retry'));

    expect(mockLoadOrders).toHaveBeenCalled();
  });

  it('shows the ConnectionBadge with the current status', () => {
    useOrdersStore.setState({ connectionStatus: 'reconnecting' });
    mockedUseOrders.mockReturnValue({
      orders: [],
      isLoading: false,
      error: null,
      loadOrders: mockLoadOrders,
    });

    const { getByText } = render(<OrdersScreen />);

    expect(getByText('connection.reconnecting')).toBeTruthy();
  });
});
