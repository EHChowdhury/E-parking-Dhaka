import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomerStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { StarRating } from '../../components/reviews/StarRating';
import { Button } from '../../components/common/Button';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<CustomerStackParamList, 'AddReview'>;

export const AddReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { booking } = route.params;
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to leave a review.');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Please select a star rating between 1 and 5.');
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.submitReview({
        bookingId: booking.id,
        customerId: user.id,
        listingId: booking.listing_id,
        ownerId: booking.owner_id,
        rating,
        comment: comment.trim(),
      });

      Alert.alert('Review Submitted', 'Thank you for rating this parking space!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Unable to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (r: number): string => {
    switch (r) {
      case 5:
        return 'Outstanding & Highly Recommended';
      case 4:
        return 'Very Good & Smooth Parking';
      case 3:
        return 'Average / Satisfactory';
      case 2:
        return 'Needs Improvement';
      case 1:
        return 'Poor Experience';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Review Parking</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.listingHeader}>
          <Text style={styles.listingTitle}>{booking.listing?.title}</Text>
          <Text style={styles.listingArea}>
            {booking.listing?.area}, Dhaka • {booking.listing?.address}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.ratingTitle}>Tap to Rate</Text>

          <View style={styles.starsWrapper}>
            <StarRating
              rating={rating}
              size={36}
              interactive
              onRatingChange={(newR) => setRating(newR)}
            />
          </View>

          <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>

          <Text style={styles.commentPrompt}>Describe your experience (optional):</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="How was the entrance, security guard, parking space, and cleanliness?"
            placeholderTextColor={APP_THEME.colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Button
            title="Submit Review"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 10,
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
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    padding: APP_THEME.spacing.md,
  },
  listingHeader: {
    marginBottom: 16,
  },
  listingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  listingArea: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 16,
  },
  starsWrapper: {
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  commentPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  commentInput: {
    width: '100%',
    minHeight: 110,
    backgroundColor: '#F8FAFC',
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    padding: 12,
    fontSize: 14,
    color: APP_THEME.colors.text,
    marginBottom: 20,
  },
  submitBtn: {
    width: '100%',
  },
});
