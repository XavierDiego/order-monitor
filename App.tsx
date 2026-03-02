import './src/i18n';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { AddOrderScreen } from './src/screens/AddOrderScreen';
import { EditOrderScreen } from './src/screens/EditOrderScreen';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { t } = useTranslation();
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#111827',
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: '#F3F4F6' },
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Orders"
              component={OrdersScreen}
              options={{ title: t('nav.orders') }}
            />
            <Stack.Screen
              name="AddOrder"
              component={AddOrderScreen}
              options={{ title: t('nav.addOrder') }}
            />
            <Stack.Screen
              name="EditOrder"
              component={EditOrderScreen}
              options={{ title: t('nav.editOrder') }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
