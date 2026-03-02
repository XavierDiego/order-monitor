import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ConnectionStatus } from '../types';

interface Props {
  status: ConnectionStatus;
}

const STATUS_STYLE: Record<ConnectionStatus, { color: string; dotColor: string }> = {
  connected:    { color: '#D1FAE5', dotColor: '#10B981' },
  reconnecting: { color: '#FEF3C7', dotColor: '#F59E0B' },
  disconnected: { color: '#FEE2E2', dotColor: '#EF4444' },
};

export function ConnectionBadge({ status }: Props) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status];
  const config = { ...style, label: t(`connection.${status}`) };

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text style={[styles.label, { color: config.dotColor }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
