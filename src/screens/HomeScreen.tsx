import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.title')}</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Orders')}
          accessibilityRole="button"
          accessibilityLabel={t('home.viewOrders')}
          accessibilityHint={t('home.viewOrdersDesc')}
        >
          <Text style={styles.icon}>📋</Text>
          <Text style={styles.cardTitle}>{t('home.viewOrders')}</Text>
          <Text style={styles.cardDesc}>{t('home.viewOrdersDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddOrder')}
          accessibilityRole="button"
          accessibilityLabel={t('home.addOrder')}
          accessibilityHint={t('home.addOrderDesc')}
        >
          <Text style={styles.icon}>➕</Text>
          <Text style={styles.cardTitle}>{t('home.addOrder')}</Text>
          <Text style={styles.cardDesc}>{t('home.addOrderDesc')}</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    aspectRatio: 0.9,
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
