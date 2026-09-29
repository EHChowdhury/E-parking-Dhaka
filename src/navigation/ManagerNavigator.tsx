import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ManagerTabParamList, ManagerStackParamList } from '../types';
import { ManagerDashboardScreen } from '../screens/manager/ManagerDashboardScreen';
import { ManagerUsersScreen } from '../screens/manager/ManagerUsersScreen';
import { ManagerListingsScreen } from '../screens/manager/ManagerListingsScreen';
import { ManagerBookingsScreen } from '../screens/manager/ManagerBookingsScreen';
import { ManagerReportsScreen } from '../screens/manager/ManagerReportsScreen';
import { ListingDetailScreen } from '../screens/customer/ListingDetailScreen';
import { OwnerBookingDetailScreen } from '../screens/owner/OwnerBookingDetailScreen';
import { APP_THEME } from '../config/constants';

const Tab = createBottomTabNavigator<ManagerTabParamList>();
const Stack = createNativeStackNavigator<ManagerStackParamList>();

const ManagerTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_THEME.colors.primary,
        tabBarInactiveTintColor: APP_THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: APP_THEME.colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="ManagerDashboard"
        component={ManagerDashboardScreen}
        options={{
          tabBarLabel: 'Metrics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManagerUsers"
        component={ManagerUsersScreen}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManagerListings"
        component={ManagerListingsScreen}
        options={{
          tabBarLabel: 'Listings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManagerBookings"
        component={ManagerBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManagerReports"
        component={ManagerReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const ManagerNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerTabs" component={ManagerTabs} />
      <Stack.Screen
        name="ManagerListingDetail"
        component={ListingDetailScreen as any}
      />
      <Stack.Screen
        name="ManagerBookingDetail"
        component={OwnerBookingDetailScreen as any}
      />
    </Stack.Navigator>
  );
};
