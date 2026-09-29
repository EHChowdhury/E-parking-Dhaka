import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomerStackParamList, ParkingListing, Review } from '../../types';
import { listingService } from '../../services/listingService';
import { reviewService } from '../../services/reviewService';
import { formatBDT } from '../../utils/currency';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StarRating } from '../../components/reviews/StarRating';
import { ReviewCard } from '../../components/reviews/ReviewCard';
import { LoadingView } from '../../components/common/LoadingView';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ListingDetail'>;

export const ListingDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { listingId, listing: initialListing } = route.params;
  const [listing, setListing] = useState<ParkingListing | null>(initialListing || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialListing);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [lData, rData] = await Promise.all([
          listingService.getListingById(listingId),
          reviewService.getListingReviews(listingId),
        ]);
        if (lData) setListing(lData);
        setReviews(rData);
      } catch (err) {
        console.error('Error fetching listing details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [listingId]);

  if (loading || !listing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading parking space details..." />
      </SafeAreaView>
    );
  }

  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={APP_THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {listing.area} Parking
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <View style={styles.photoContainer}>
          {photos.length > 0 ? (
            <Image
              source={{ uri: photos[activePhotoIdx] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noPhotoBox}>
              <Ionicons name="car-outline" size={60} color={APP_THEME.colors.textMuted} />
              <Text style={styles.noPhotoText}>Photo not uploaded by owner</Text>
            </View>
          )}

          <View style={styles.areaBadgeOverlay}>
            <Badge
              label={listing.area}
              color="#FFFFFF"
              bgColor="rgba(13, 122, 87, 0.9)"
            />
          </View>
        </View>

        {photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {photos.map((uri, idx) => (
              <TouchableOpacity
                key={uri}
                onPress={() => setActivePhotoIdx(idx)}
                style={[
                  styles.thumbnailWrapper,
                  activePhotoIdx === idx && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Content Body */}
        <View style={styles.body}>
          <Text style={styles.title}>{listing.title}</Text>

          {listing.property_name ? (
            <View style={styles.propertyRow}>
              <Ionicons name="business-outline" size={15} color={APP_THEME.colors.textSecondary} />
              <Text style={styles.propertyName}>{listing.property_name}</Text>
            </View>
          ) : null}

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color={APP_THEME.colors.textSecondary} />
            <Text style={styles.addressText}>{listing.address}</Text>
          </View>

          {/* Rating Summary */}
          {listing.average_rating ? (
            <View style={styles.ratingRow}>
              <StarRating rating={listing.average_rating} size={16} />
              <Text style={styles.ratingScore}>{listing.average_rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Flexible Pricing Options */}
          <Text style={styles.sectionHeading}>Pricing Options</Text>
          <View style={styles.pricingGrid}>
            {listing.is_hourly_available && listing.hourly_price ? (
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTypeLabel}>Hourly</Text>
                <Text style={styles.pricingAmount}>{formatBDT(listing.hourly_price)}</Text>
                <Text style={styles.pricingUnit}>per hour</Text>
              </View>
            ) : null}

            {listing.is_daily_available && listing.daily_price ? (
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTypeLabel}>Daily</Text>
                <Text style={styles.pricingAmount}>{formatBDT(listing.daily_price)}</Text>
                <Text style={styles.pricingUnit}>per day</Text>
              </View>
            ) : null}

            {listing.is_weekly_available && listing.weekly_price ? (
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTypeLabel}>Weekly</Text>
                <Text style={styles.pricingAmount}>{formatBDT(listing.weekly_price)}</Text>
                <Text style={styles.pricingUnit}>per week</Text>
              </View>
            ) : null}

            {listing.is_monthly_available && listing.monthly_price ? (
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTypeLabel}>Monthly</Text>
                <Text style={styles.pricingAmount}>{formatBDT(listing.monthly_price)}</Text>
                <Text style={styles.pricingUnit}>per month</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* Parking Specs */}
          <Text style={styles.sectionHeading}>Parking Specifications</Text>
          <View style={styles.specsBox}>
            <View style={styles.specItem}>
              <Ionicons name="cube-outline" size={18} color={APP_THEME.colors.primary} />
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>Parking Type</Text>
                <Text style={styles.specValue}>
                  {listing.parking_type.replace('_', ' ').toUpperCase()}
                  {listing.slot_number_or_info ? ` (${listing.slot_number_or_info})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.specItem}>
              <Ionicons name="car-sport-outline" size={18} color={APP_THEME.colors.primary} />
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>Suitable Vehicles</Text>
                <Text style={styles.specValue}>
                  {listing.vehicle_types.map((v) => v.toUpperCase()).join(', ')}
                </Text>
              </View>
            </View>

            {listing.vehicle_size_limitations ? (
              <View style={styles.specItem}>
                <Ionicons name="resize-outline" size={18} color={APP_THEME.colors.primary} />
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Size Limitations</Text>
                  <Text style={styles.specValue}>{listing.vehicle_size_limitations}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.specItem}>
              <Ionicons name="time-outline" size={18} color={APP_THEME.colors.primary} />
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>Operational Hours</Text>
                <Text style={styles.specValue}>{listing.available_hours || '24/7'}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {listing.description ? (
            <>
              <Text style={styles.sectionHeading}>Description</Text>
              <Text style={styles.descriptionText}>{listing.description}</Text>
            </>
          ) : null}

          {/* Security & Rules */}
          {(listing.security_info || listing.rules) && (
            <>
              <Text style={styles.sectionHeading}>Security & Premises Rules</Text>
              {listing.security_info ? (
                <View style={styles.infoCard}>
                  <Ionicons name="shield-checkmark" size={16} color={APP_THEME.colors.primary} />
                  <Text style={styles.infoCardText}>{listing.security_info}</Text>
                </View>
              ) : null}

              {listing.rules ? (
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={16} color={APP_THEME.colors.accent} />
                  <Text style={styles.infoCardText}>{listing.rules}</Text>
                </View>
              ) : null}
            </>
          )}

          <View style={styles.divider} />

          {/* Owner Info */}
          <Text style={styles.sectionHeading}>Hosted By</Text>
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerInitial}>
                {listing.owner?.full_name ? listing.owner.full_name[0] : 'O'}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>
                {listing.owner?.full_name || 'Dhaka Property Owner'}
              </Text>
              <Text style={styles.ownerStatus}>Verified Property Owner</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Customer Reviews */}
          <View style={styles.reviewHeaderRow}>
            <Text style={styles.sectionHeading}>Customer Reviews ({reviews.length})</Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>
              No reviews yet for this parking space. Be the first customer to park and review!
            </Text>
          ) : (
            reviews.map((rev) => <ReviewCard key={rev.id} review={rev} />)
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>Starting from</Text>
          <Text style={styles.bottomPriceValue}>
            {listing.is_hourly_available && listing.hourly_price
              ? `${formatBDT(listing.hourly_price)}/hr`
              : listing.is_daily_available && listing.daily_price
              ? `${formatBDT(listing.daily_price)}/day`
              : `${formatBDT(listing.monthly_price)}/mo`}
          </Text>
        </View>

        <Button
          title="Book This Space"
          onPress={() => navigation.navigate('Booking', { listing })}
          style={styles.bookButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  photoContainer: {
    height: 230,
    backgroundColor: '#000000',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  noPhotoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  noPhotoText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginTop: 8,
  },
  areaBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  thumbnailRow: {
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  thumbnailWrapper: {
    width: 60,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: APP_THEME.colors.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: APP_THEME.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
    lineHeight: 26,
    marginBottom: 6,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  reviewCount: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 12,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pricingCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1.5,
    borderColor: APP_THEME.colors.borderLight,
    alignItems: 'center',
  },
  pricingTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.textSecondary,
    textTransform: 'uppercase',
  },
  pricingAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
    marginVertical: 4,
  },
  pricingUnit: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  specsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginTop: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: APP_THEME.borderRadius.sm,
    padding: 10,
    gap: 8,
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 13,
    color: APP_THEME.colors.text,
    flex: 1,
    lineHeight: 18,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_THEME.colors.primaryDark,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  ownerStatus: {
    fontSize: 12,
    color: APP_THEME.colors.primary,
    fontWeight: '600',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
  },
  bookButton: {
    flex: 1.3,
  },
});
