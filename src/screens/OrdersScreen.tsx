import React, { useCallback, useEffect } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { OrderCard } from '../components/OrderCard';
import { useOrders } from '../hooks/useOrders';
import { useWebSocket } from '../hooks/useWebSocket';
import { useOrdersStore } from '../store/ordersStore';
import { Order } from '../types';

export function OrdersScreen() {
  const { t } = useTranslation();
  const { orders, isLoading, error, loadOrders } = useOrders();
  const connectionStatus = useOrdersStore((s) => s.connectionStatus);

  useWebSocket(loadOrders);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const renderItem = useCallback<ListRenderItem<Order>>(
    ({ item }) => <OrderCard order={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('screen.title')}</Text>
          <Text style={styles.subtitle}>
            {t('screen.orderCount', { count: orders.length })}
          </Text>
        </View>
        <ConnectionBadge status={connectionStatus} />
      </View>

      {/* Content */}
      {error && !isLoading ? (
        <ErrorState message={error} onRetry={loadOrders} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={
            orders.length === 0 ? styles.emptyContent : styles.listContent
          }
          ListEmptyComponent={!isLoading ? <EmptyState /> : null}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadOrders}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          removeClippedSubviews
          initialNumToRender={15}
          windowSize={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyContent: {
    flex: 1,
  },
});
