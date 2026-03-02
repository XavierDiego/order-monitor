import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OrderStatus } from '../types';

interface Props {
  status: OrderStatus;
}

const STATUS_STYLE: Record<OrderStatus, { bg: string; text: string }> = {
  pending:    { bg: '#FEF3C7', text: '#92400E' },
  processing: { bg: '#DBEAFE', text: '#1E40AF' },
  completed:  { bg: '#D1FAE5', text: '#065F46' },
  cancelled:  { bg: '#FEE2E2', text: '#991B1B' },
};

export function StatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status] ?? { bg: '#F3F4F6', text: '#374151' };
  const config = { ...style, label: t(`status.${status}`, { defaultValue: status }) };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
