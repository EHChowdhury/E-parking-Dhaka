import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OwnerTabParamList, OwnerStackParamList } from '../types';
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { MyListingsScreen } from '../screens/owner/MyListingsScreen';
import { AddListingScreen } from '../screens/owner/AddListingScreen';
import { EditListingScreen } from '../screens/owner/EditListingScreen';
import { OwnerBookingsScreen } from '../screens/owner/OwnerBookingsScreen';
import { OwnerBookingDetailScreen } from '../screens/owner/OwnerBookingDetailScreen';
import { OwnerEarningsScreen } from '../screens/owner/OwnerEarningsScreen';
import { OwnerProfileScreen } from '../screens/owner/OwnerProfileScreen';
import { ListingDetailScreen } from '../screens/customer/ListingDetailScreen';
import { APP_THEME } from '../config/constants';

const Tab = createBottomTabNavigator<OwnerTabParamList>();
const Stack = createNativeStackNavigator<OwnerStackParamList>();

const OwnerTabs: React.FC = () => {
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
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{
          tabBarLabel: 'My Spaces',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OwnerBookings"
        component={OwnerBookingsScreen}
        options={{
          tabBarLabel: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={OwnerEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OwnerProfile"
        component={OwnerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const OwnerNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
      <Stack.Screen name="AddListing" component={AddListingScreen} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
      <Stack.Screen name="OwnerBookingDetail" component={OwnerBookingDetailScreen} />
      <Stack.Screen
        name="OwnerListingDetail"
        component={ListingDetailScreen as any}
      />
    </Stack.Navigator>
  );
};
