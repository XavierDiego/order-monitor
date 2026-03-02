import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OrderCard } from '../../src/components/OrderCard';
import { Order } from '../../src/types';


jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));


const ORDER: Order = { id: '42', customer: 'Alice', status: 'pending', amount: 100 };


beforeEach(() => jest.clearAllMocks());

describe('OrderCard', () => {
  it('renders the customer name and order id', () => {
    const { getByText } = render(<OrderCard order={ORDER} />);

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('#42')).toBeTruthy();
  });

  it('renders the amount formatted in pt-BR / BRL', () => {
    const { getByText } = render(<OrderCard order={ORDER} />);

    expect(getByText(/100/)).toBeTruthy();
  });

  it('navigates to EditOrder with the correct orderId on press', () => {
    const { getByRole } = render(<OrderCard order={ORDER} />);

    fireEvent.press(getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('EditOrder', { orderId: '42' });
  });

  it('navigates with the right id for a different order', () => {
    const other: Order = { ...ORDER, id: '99', customer: 'Bob' };
    const { getByRole } = render(<OrderCard order={other} />);

    fireEvent.press(getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('EditOrder', { orderId: '99' });
  });
});
