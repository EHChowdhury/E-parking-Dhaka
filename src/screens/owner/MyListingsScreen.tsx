import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OwnerTabParamList, OwnerStackParamList, ParkingListing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listingService } from '../../services/listingService';
import { PriceDisplay } from '../../components/listings/PriceDisplay';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { APP_THEME } from '../../config/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OwnerTabParamList, 'MyListings'>,
  NativeStackScreenProps<OwnerStackParamList>
>;

export const MyListingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listingService.getOwnerListings(user.id);
      setListings(data);
    } catch (e) {
      console.error('Error fetching owner listings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleToggleActive = async (listing: ParkingListing) => {
    try {
      const updated = await listingService.updateListing(listing.id, {
        is_active: !listing.is_active,
      });
      setListings((prev) => prev.map((l) => (l.id === listing.id ? updated : l)));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update listing status.');
    }
  };

  const handleDeleteListing = (listingId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this parking listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await listingService.deleteListing(listingId);
              setListings((prev) => prev.filter((l) => l.id !== listingId));
              Alert.alert('Deleted', 'Parking space deleted.');
            } catch (err: any) {
              Alert.alert('Cannot Delete', err.message || 'Unable to delete listing. Active bookings may exist.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Parking Spaces</Text>
        <Button
          title="Add Space"
          onPress={() => navigation.navigate('AddListing')}
          size="sm"
          icon={<Ionicons name="add" size={16} color="#FFFFFF" />}
        />
      </View>

      {loading ? (
        <LoadingView message="Loading your parking listings..." />
      ) : listings.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="No Parking Spaces Added"
          description="You haven't added any garage or parking spaces to E-Parking Dhaka yet. List an empty space to start earning!"
          actionTitle="List a Parking Space"
          onAction={() => navigation.navigate('AddListing')}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[APP_THEME.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={styles.topRow}>
                <View style={styles.titleInfo}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.address}>
                    {item.area}, Dhaka • {item.address}
                  </Text>
                </View>

                <View style={styles.badgeCol}>
                  <Badge
                    label={item.is_active ? 'Active' : 'Paused'}
                    color={item.is_active ? '#059669' : '#6B7280'}
                    bgColor={item.is_active ? '#D1FAE5' : '#F3F4F6'}
                    size="sm"
                  />
                  {!item.is_approved && (
                    <Badge
                      label="Pending Review"
                      color="#D97706"
                      bgColor="#FEF3C7"
                      size="sm"
                      style={{ marginTop: 4 }}
                    />
                  )}
                </View>
              </View>

              <PriceDisplay listing={item} />

              <View style={styles.divider} />

              <View style={styles.actionRow}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {item.is_active ? 'Accepting Bookings' : 'Paused'}
                  </Text>
                  <Switch
                    value={item.is_active}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                    thumbColor={item.is_active ? APP_THEME.colors.primary : '#F1F5F9'}
                  />
                </View>

                <View style={styles.buttonsGroup}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('EditListing', { listingId: item.id, listing: item })}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="create-outline" size={18} color={APP_THEME.colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteListing(item.id)}
                    style={[styles.iconBtn, styles.deleteBtn]}
                  >
                    <Ionicons name="trash-outline" size={18} color={APP_THEME.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  listContent: {
    padding: APP_THEME.spacing.md,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleInfo: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  address: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  buttonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
});
