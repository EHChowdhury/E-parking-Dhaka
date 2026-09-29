import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ParkingListing } from '../../types';
import { formatBDT } from '../../utils/currency';
import { APP_THEME } from '../../config/constants';

interface PriceDisplayProps {
  listing: ParkingListing;
  compact?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ listing, compact = false }) => {
  if (compact) {
    // Show the primary available rate (Hourly preferred, then daily)
    let rateText = '';
    if (listing.is_hourly_available && listing.hourly_price) {
      rateText = `${formatBDT(listing.hourly_price)}/hr`;
    } else if (listing.is_daily_available && listing.daily_price) {
      rateText = `${formatBDT(listing.daily_price)}/day`;
    } else if (listing.is_monthly_available && listing.monthly_price) {
      rateText = `${formatBDT(listing.monthly_price)}/mo`;
    } else if (listing.is_weekly_available && listing.weekly_price) {
      rateText = `${formatBDT(listing.weekly_price)}/wk`;
    }

    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactPrice}>{rateText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {listing.is_hourly_available && listing.hourly_price ? (
        <View style={styles.tag}>
          <Text style={styles.tagLabel}>Hourly</Text>
          <Text style={styles.tagPrice}>{formatBDT(listing.hourly_price)}</Text>
        </View>
      ) : null}

      {listing.is_daily_available && listing.daily_price ? (
        <View style={styles.tag}>
          <Text style={styles.tagLabel}>Daily</Text>
          <Text style={styles.tagPrice}>{formatBDT(listing.daily_price)}</Text>
        </View>
      ) : null}

      {listing.is_weekly_available && listing.weekly_price ? (
        <View style={styles.tag}>
          <Text style={styles.tagLabel}>Weekly</Text>
          <Text style={styles.tagPrice}>{formatBDT(listing.weekly_price)}</Text>
        </View>
      ) : null}

      {listing.is_monthly_available && listing.monthly_price ? (
        <View style={styles.tag}>
          <Text style={styles.tagLabel}>Monthly</Text>
          <Text style={styles.tagPrice}>{formatBDT(listing.monthly_price)}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  compactContainer: {
    alignItems: 'flex-end',
  },
  compactPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  tag: {
    backgroundColor: APP_THEME.colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: APP_THEME.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  tagLabel: {
    fontSize: 10,
    color: APP_THEME.colors.primaryDark,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tagPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
});
