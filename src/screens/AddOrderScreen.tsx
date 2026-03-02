import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { createOrder } from '../api/orders';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddOrder'>;
};

export function AddOrderScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!customer.trim() || !amount.trim()) {
      setError(t('addOrder.errorRequired'));
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('addOrder.errorInvalidAmount'));
      return;
    }

    try {
      setLoading(true);
      await createOrder({ customer: customer.trim(), amount: parsedAmount });
      setSuccess(true);
      timerRef.current = setTimeout(() => navigation.navigate('Orders'), 1500);
    } catch {
      setError(t('error.title'));
    } finally {
      setLoading(false);
    }
  }, [customer, amount, navigation, t]);

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('addOrder.customer')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addOrder.customerPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={customer}
              onChangeText={setCustomer}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!success}
              accessibilityLabel={t('addOrder.customer')}
              accessibilityHint={t('addOrder.customerPlaceholder')}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('addOrder.amount')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addOrder.amountPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              returnKeyType="done"
              editable={!success}
              accessibilityLabel={t('addOrder.amount')}
              accessibilityHint={t('addOrder.amountPlaceholder')}
            />
          </View>

          {success ? (
            <View style={styles.successBanner} accessibilityLiveRegion="polite">
              <Text style={styles.successText}>✓ {t('addOrder.success')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
              <Text style={styles.errorText}>✕ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, (loading || success) && styles.buttonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading || success}
            accessibilityRole="button"
            accessibilityLabel={t('addOrder.submit')}
            accessibilityState={{ disabled: loading || success, busy: loading }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('addOrder.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
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
