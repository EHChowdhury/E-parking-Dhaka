import { supabase, isSupabaseConfigured } from '../config/supabase';
import { Review } from '../types';

export const reviewService = {
  /**
   * Get reviews for a listing
   */
  async getListingReviews(listingId: string): Promise<Review[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:profiles!reviews_customer_id_fkey(id, full_name, avatar_url)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Review[];
    }

    return mockReviewStore.getListingReviews(listingId);
  },

  /**
   * Submit a review for a completed booking
   */
  async submitReview(params: {
    bookingId: string;
    customerId: string;
    listingId: string;
    ownerId: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    if (params.rating < 1 || params.rating > 5) {
      throw new Error('Rating must be between 1 and 5 stars.');
    }

    if (params.customerId === params.ownerId) {
      throw new Error('Owners cannot review their own parking space.');
    }

    if (isSupabaseConfigured) {
      // Check if user has completed booking
      const { data: booking, error: bError } = await supabase
        .from('bookings')
        .select('id, status, customer_id')
        .eq('id', params.bookingId)
        .single();

      if (bError || !booking) {
        throw new Error('Associated booking not found.');
      }

      if (booking.status !== 'completed') {
        throw new Error('You can only review a parking space after the booking has been completed.');
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: params.bookingId,
          customer_id: params.customerId,
          listing_id: params.listingId,
          owner_id: params.ownerId,
          rating: params.rating,
          comment: params.comment.trim(),
        })
        .select(`
          *,
          customer:profiles!reviews_customer_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data as Review;
    }

    return mockReviewStore.submitReview(params);
  },

  /**
   * Owner replies to a review
   */
  async replyToReview(reviewId: string, replyText: string): Promise<Review> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          owner_reply: replyText.trim(),
          owner_replied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Review;
    }

    return mockReviewStore.replyToReview(reviewId, replyText);
  },
};

// ========================================================================
// MOCK REVIEW STORE
// ========================================================================
let MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    booking_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    customer_id: '33333333-3333-3333-3333-333333333333',
    listing_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    owner_id: '11111111-1111-1111-1111-111111111111',
    rating: 5,
    comment:
      'Excellent garage in Banani! Clean, easy to park, and the guard was very helpful with directions.',
    owner_reply: 'Thank you Shane! You are always welcome to park here.',
    owner_replied_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    customer: {
      id: '33333333-3333-3333-3333-333333333333',
      full_name: 'Shane Rahman',
      email: 'customer@eparking.com',
      role: 'customer',
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

const mockReviewStore = {
  async getListingReviews(listingId: string): Promise<Review[]> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_REVIEWS.filter((r) => r.listing_id === listingId);
  },

  async submitReview(params: any): Promise<Review> {
    await new Promise((r) => setTimeout(r, 400));
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      booking_id: params.bookingId,
      customer_id: params.customerId,
      listing_id: params.listingId,
      owner_id: params.ownerId,
      rating: params.rating,
      comment: params.comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer: {
        id: params.customerId,
        full_name: 'Shane Rahman',
        email: 'customer@eparking.com',
        role: 'customer',
        is_verified: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    MOCK_REVIEWS.unshift(newRev);
    return newRev;
  },

  async replyToReview(reviewId: string, replyText: string): Promise<Review> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_REVIEWS.findIndex((r) => r.id === reviewId);
    if (idx === -1) throw new Error('Review not found');

    MOCK_REVIEWS[idx] = {
      ...MOCK_REVIEWS[idx],
      owner_reply: replyText,
      owner_replied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return MOCK_REVIEWS[idx];
  },
};
