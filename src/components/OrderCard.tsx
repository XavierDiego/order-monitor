import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Order } from '../types';
import { RootStackParamList } from '../types/navigation';
import { StatusBadge } from './StatusBadge';

interface Props {
  order: Order;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const OrderCard = memo(function OrderCard({ order }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = useCallback(() => {
    navigation.navigate('EditOrder', { orderId: order.id });
  }, [navigation, order.id]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Pedido de ${order.customer}, ${formatCurrency(order.amount)}`}
      accessibilityHint="Toque para editar o status do pedido"
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.customer} numberOfLines={1}>
            {order.customer}
          </Text>
          <Text style={styles.id}>#{order.id}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(order.amount)}</Text>
      </View>

      <View style={styles.footer}>
        <StatusBadge status={order.status} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  customer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  id: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
