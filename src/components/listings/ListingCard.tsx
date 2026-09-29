import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingListing } from '../../types';
import { APP_THEME } from '../../config/constants';
import { PriceDisplay } from './PriceDisplay';
import { Badge } from '../common/Badge';

interface ListingCardProps {
  listing: ParkingListing;
  onPress: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onPress }) => {
  const primaryImage = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.cardContainer}
    >
      <View style={styles.imageWrapper}>
        {primaryImage ? (
          <Image source={{ uri: primaryImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="car-outline" size={48} color={APP_THEME.colors.textMuted} />
            <Text style={styles.placeholderText}>Parking Space in {listing.area}</Text>
          </View>
        )}

        <View style={styles.badgeTopLeft}>
          <Badge
            label={listing.area}
            color="#FFFFFF"
            bgColor="rgba(13, 122, 87, 0.9)"
            size="sm"
          />
        </View>

        {listing.average_rating ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {listing.average_rating.toFixed(1)}
              {listing.review_count ? ` (${listing.review_count})` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
        </View>

        {listing.property_name ? (
          <Text style={styles.propertyText} numberOfLines={1}>
            <Ionicons name="business-outline" size={12} color={APP_THEME.colors.textSecondary} />{' '}
            {listing.property_name}
          </Text>
        ) : null}

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {listing.address}
          </Text>
        </View>

        <View style={styles.vehicleChipsRow}>
          {listing.vehicle_types.map((v) => (
            <View key={v} style={styles.vehicleChip}>
              <Text style={styles.vehicleChipText}>{v.toUpperCase()}</Text>
            </View>
          ))}
          {listing.available_hours ? (
            <View style={styles.hoursChip}>
              <Ionicons name="time-outline" size={11} color={APP_THEME.colors.textSecondary} />
              <Text style={styles.hoursChipText}>{listing.available_hours}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <PriceDisplay listing={listing} compact />
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={APP_THEME.colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    marginHorizontal: APP_THEME.spacing.md,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 160,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  placeholderText: {
    marginTop: 6,
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: APP_THEME.borderRadius.full,
    gap: 4,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: APP_THEME.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    flex: 1,
  },
  propertyText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  addressText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    flex: 1,
  },
  vehicleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  vehicleChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  vehicleChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  hoursChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  hoursChipText: {
    fontSize: 10,
    color: APP_THEME.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
  },
});
