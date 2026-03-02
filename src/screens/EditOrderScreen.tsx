import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { updateOrderStatus } from '../api/orders';
import { useOrdersStore } from '../store/ordersStore';
import { RootStackParamList } from '../types/navigation';
import { OrderStatus } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditOrder'>;
  route: RouteProp<RootStackParamList, 'EditOrder'>;
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  pending:    { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  processing: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  completed:  { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  cancelled:  { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function EditOrderScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { orderId } = route.params;

  const order = useOrdersStore((s) => s.orders.find((o) => o.id === orderId));

  const [selected, setSelected] = useState<OrderStatus>(order?.status ?? 'pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleSave = useCallback(async () => {
    if (!order || selected === order.status) {
      navigation.goBack();
      return;
    }

    setError(null);
    try {
      setLoading(true);
      await updateOrderStatus(orderId, selected);
      setSuccess(true);
      timerRef.current = setTimeout(() => navigation.goBack(), 1200);
    } catch {
      setError(t('error.title'));
    } finally {
      setLoading(false);
    }
  }, [order, selected, orderId, navigation, t]);

  if (!order) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>{t('editOrder.errorNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.form}>

        {/* Order info (read-only) */}
        <View
          style={styles.infoBox}
          accessibilityLabel={`Pedido de ${order.customer}, ${formatCurrency(order.amount)}`}
        >
          <Text style={styles.customer}>{order.customer}</Text>
          <Text style={styles.meta}>#{order.id} · {formatCurrency(order.amount)}</Text>
        </View>

        {/* Status selector */}
        <Text style={styles.label}>{t('editOrder.status')}</Text>
        {ALL_STATUSES.map((s) => {
          const colors = STATUS_COLORS[s];
          const isSelected = selected === s;
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.option,
                isSelected && { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
              onPress={() => setSelected(s)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={t(`status.${s}`)}
            >
              <View style={[styles.radio, isSelected && { borderColor: colors.border }]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.border }]} />}
              </View>
              <Text style={[styles.optionText, isSelected && { color: colors.text, fontWeight: '700' }]}>
                {t(`status.${s}`)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Feedback */}
        {success && (
          <View style={styles.successBanner} accessibilityLiveRegion="polite">
            <Text style={styles.successText}>✓ {t('editOrder.success')}</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
            <Text style={styles.errorBannerText}>✕ {error}</Text>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.button, (loading || success) && styles.buttonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={loading || success}
          accessibilityRole="button"
          accessibilityLabel={t('editOrder.save')}
          accessibilityState={{ disabled: loading || success, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{t('editOrder.save')}</Text>
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: '#6B7280',
  },
  form: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  customer: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
