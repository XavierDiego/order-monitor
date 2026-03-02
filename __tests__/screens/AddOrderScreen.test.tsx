import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AddOrderScreen } from '../../src/screens/AddOrderScreen';
import { createOrder } from '../../src/api/orders';
import { Order } from '../../src/types';


jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../src/api/orders', () => ({
  createOrder: jest.fn(),
}));

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate, goBack: jest.fn() } as never;

const mockedCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>;

const CREATED_ORDER: Order = { id: '5', customer: 'Alice', status: 'pending', amount: 50 };


beforeEach(() => jest.clearAllMocks());

describe('AddOrderScreen', () => {
  it('renders customer and amount inputs and submit button', () => {
    const { getByLabelText } = render(<AddOrderScreen navigation={navigation} />);

    expect(getByLabelText('addOrder.customer')).toBeTruthy();
    expect(getByLabelText('addOrder.amount')).toBeTruthy();
    expect(getByLabelText('addOrder.submit')).toBeTruthy();
  });

  it('shows a validation error when both fields are empty', () => {
    const { getByLabelText, getByText } = render(<AddOrderScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('addOrder.submit'));

    expect(getByText('✕ addOrder.errorRequired')).toBeTruthy();
    expect(mockedCreateOrder).not.toHaveBeenCalled();
  });

  it('shows a validation error when amount is not a valid number', () => {
    const { getByLabelText, getByText } = render(<AddOrderScreen navigation={navigation} />);

    fireEvent.changeText(getByLabelText('addOrder.customer'), 'Alice');
    fireEvent.changeText(getByLabelText('addOrder.amount'), 'abc');
    fireEvent.press(getByLabelText('addOrder.submit'));

    expect(getByText('✕ addOrder.errorInvalidAmount')).toBeTruthy();
    expect(mockedCreateOrder).not.toHaveBeenCalled();
  });

  it('shows a validation error when amount is zero or negative', () => {
    const { getByLabelText, getByText } = render(<AddOrderScreen navigation={navigation} />);

    fireEvent.changeText(getByLabelText('addOrder.customer'), 'Alice');
    fireEvent.changeText(getByLabelText('addOrder.amount'), '0');
    fireEvent.press(getByLabelText('addOrder.submit'));

    expect(getByText('✕ addOrder.errorInvalidAmount')).toBeTruthy();
  });

  it('calls createOrder with trimmed customer and parsed amount', async () => {
    mockedCreateOrder.mockResolvedValue(CREATED_ORDER);
    const { getByLabelText } = render(<AddOrderScreen navigation={navigation} />);

    fireEvent.changeText(getByLabelText('addOrder.customer'), '  Alice  ');
    fireEvent.changeText(getByLabelText('addOrder.amount'), '50,00');
    fireEvent.press(getByLabelText('addOrder.submit'));

    await waitFor(() =>
      expect(mockedCreateOrder).toHaveBeenCalledWith({ customer: 'Alice', amount: 50 }),
    );
  });

  it('shows a success banner after a successful submit', async () => {
    mockedCreateOrder.mockResolvedValue(CREATED_ORDER);
    const { getByLabelText, getByText } = render(<AddOrderScreen navigation={navigation} />);

    fireEvent.changeText(getByLabelText('addOrder.customer'), 'Alice');
    fireEvent.changeText(getByLabelText('addOrder.amount'), '50');
    fireEvent.press(getByLabelText('addOrder.submit'));

    await waitFor(() => expect(getByText('✓ addOrder.success')).toBeTruthy());
  });

  it('resets the form after 1 500 ms on success', async () => {
    jest.useFakeTimers();
    mockedCreateOrder.mockResolvedValue(CREATED_ORDER);
    const { getByLabelText, queryByText } = render(<AddOrderScreen navigation={navigation} />);

    fireEvent.changeText(getByLabelText('addOrder.customer'), 'Alice');
    fireEvent.changeText(getByLabelText('addOrder.amount'), '50');
    fireEvent.press(getByLabelText('addOrder.submit'));

    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(1500);
    });

    expect(queryByText('✓ addOrder.success')).toBeNull();
    jest.useRealTimers();
  });

  it('shows an error banner when createOrder throws', async () => {
    mockedCreateOrder.mockRejectedValue(new Error('Network error'));
    const { getByLabelText, getByText } = render(<AddOrderScreen navigation={navigation} />);

    fireEvent.changeText(getByLabelText('addOrder.customer'), 'Alice');
    fireEvent.changeText(getByLabelText('addOrder.amount'), '50');
    fireEvent.press(getByLabelText('addOrder.submit'));

    await waitFor(() => expect(getByText('✕ error.title')).toBeTruthy());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
