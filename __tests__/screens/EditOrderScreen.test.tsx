import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { EditOrderScreen } from '../../src/screens/EditOrderScreen';
import { updateOrderStatus } from '../../src/api/orders';
import { useOrdersStore } from '../../src/store/ordersStore';
import { Order } from '../../src/types';


jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../src/api/orders', () => ({
  updateOrderStatus: jest.fn(),
}));

const mockGoBack = jest.fn();
const navigation = { navigate: jest.fn(), goBack: mockGoBack } as never;

const mockedUpdateOrderStatus = updateOrderStatus as jest.MockedFunction<typeof updateOrderStatus>;


const ORDER: Order = { id: '1', customer: 'Alice', status: 'pending', amount: 120 };

function makeRoute(orderId: string) {
  return { params: { orderId }, key: 'EditOrder', name: 'EditOrder' } as never;
}


beforeEach(() => {
  jest.clearAllMocks();
  useOrdersStore.setState({ orders: [ORDER] });
});

describe('EditOrderScreen', () => {
  it('renders the order customer name', () => {
    const { getByText } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('1')} />,
    );

    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders exactly 4 status radio options', () => {
    const { getAllByRole } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('1')} />,
    );

    expect(getAllByRole('radio')).toHaveLength(4);
  });

  it('shows a "not found" message for an unknown orderId', () => {
    const { getByText } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('999')} />,
    );

    expect(getByText('editOrder.errorNotFound')).toBeTruthy();
  });

  it('goes back immediately when the status has not changed', () => {
    const { getByLabelText } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('1')} />,
    );

    fireEvent.press(getByLabelText('editOrder.save'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockedUpdateOrderStatus).not.toHaveBeenCalled();
  });

  it('calls updateOrderStatus with the selected status', async () => {
    mockedUpdateOrderStatus.mockResolvedValue({ ...ORDER, status: 'completed' });
    const { getByLabelText } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('1')} />,
    );

    fireEvent.press(getByLabelText('status.completed'));
    fireEvent.press(getByLabelText('editOrder.save'));

    await waitFor(() =>
      expect(mockedUpdateOrderStatus).toHaveBeenCalledWith('1', 'completed'),
    );
  });

  it('shows a success banner after saving', async () => {
    mockedUpdateOrderStatus.mockResolvedValue({ ...ORDER, status: 'completed' });
    const { getByLabelText, getByText } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('1')} />,
    );

    fireEvent.press(getByLabelText('status.completed'));
    fireEvent.press(getByLabelText('editOrder.save'));

    await waitFor(() => expect(getByText('✓ editOrder.success')).toBeTruthy());
  });

  it('navigates back after 1 200 ms on success', async () => {
    jest.useFakeTimers();
    mockedUpdateOrderStatus.mockResolvedValue({ ...ORDER, status: 'completed' });
    const { getByLabelText } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('1')} />,
    );

    fireEvent.press(getByLabelText('status.completed'));
    fireEvent.press(getByLabelText('editOrder.save'));

    await act(async () => {
      // Flush the mock Promise so handleSave's post-await code runs,
      // registering setTimeout(goBack, 1200) before we advance the clock.
      await Promise.resolve();
      jest.advanceTimersByTime(1200);
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('shows an error banner when updateOrderStatus throws', async () => {
    mockedUpdateOrderStatus.mockRejectedValue(new Error('Network error'));
    const { getByLabelText, getByText } = render(
      <EditOrderScreen navigation={navigation} route={makeRoute('1')} />,
    );

    fireEvent.press(getByLabelText('status.cancelled'));
    fireEvent.press(getByLabelText('editOrder.save'));

    await waitFor(() => expect(getByText('✕ error.title')).toBeTruthy());
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});