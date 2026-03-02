import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';


jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockNavigate = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
} as never;


beforeEach(() => jest.clearAllMocks());

describe('HomeScreen', () => {
  it('renders both navigation cards', () => {
    const { getByText } = render(<HomeScreen navigation={navigation} />);

    expect(getByText('home.viewOrders')).toBeTruthy();
    expect(getByText('home.addOrder')).toBeTruthy();
  });

  it('navigates to Orders when "Ver Pedidos" card is pressed', () => {
    const { getByLabelText } = render(<HomeScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('home.viewOrders'));

    expect(mockNavigate).toHaveBeenCalledWith('Orders');
  });

  it('navigates to AddOrder when "Novo Pedido" card is pressed', () => {
    const { getByLabelText } = render(<HomeScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('home.addOrder'));

    expect(mockNavigate).toHaveBeenCalledWith('AddOrder');
  });
});
