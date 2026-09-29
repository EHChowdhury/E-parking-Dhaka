import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '../../types';
import { formatDate } from '../../utils/date';
import { StarRating } from './StarRating';
import { APP_THEME } from '../../config/constants';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {review.customer?.full_name ? review.customer.full_name[0].toUpperCase() : 'C'}
          </Text>
        </View>

        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {review.customer?.full_name || 'Verified Customer'}
          </Text>
          <Text style={styles.dateText}>{formatDate(review.created_at)}</Text>
        </View>

        <StarRating rating={review.rating} size={15} />
      </View>

      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      {review.owner_reply ? (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <Ionicons name="return-down-forward" size={14} color={APP_THEME.colors.primary} />
            <Text style={styles.replyTitle}>Response from Parking Owner</Text>
          </View>
          <Text style={styles.replyText}>{review.owner_reply}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: APP_THEME.spacing.md,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    color: APP_THEME.colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  dateText: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  comment: {
    fontSize: 13,
    color: APP_THEME.colors.text,
    lineHeight: 19,
    marginVertical: 4,
  },
  replyBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: APP_THEME.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: APP_THEME.colors.primary,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  replyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  replyText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    lineHeight: 18,
  },
});
