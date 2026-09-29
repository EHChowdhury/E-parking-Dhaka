import { supabase, isSupabaseConfigured } from '../config/supabase';
import { Payment, PaymentStatus } from '../types';

export const paymentService = {
  /**
   * Get payments for an Owner
   */
  async getOwnerPayments(ownerId: string): Promise<Payment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            *,
            listing:parking_listings(title, area),
            customer:profiles!bookings_customer_id_fkey(full_name, phone)
          )
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Payment[];
    }

    return mockPaymentStore.getOwnerPayments(ownerId);
  },

  /**
   * Get payments for a Customer
   */
  async getCustomerPayments(customerId: string): Promise<Payment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            *,
            listing:parking_listings(title, area),
            owner:profiles!bookings_owner_id_fkey(full_name, phone)
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Payment[];
    }

    return mockPaymentStore.getCustomerPayments(customerId);
  },

  /**
   * Mark Cash on Delivery as collected/paid by Owner or Manager
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    notes?: string
  ): Promise<Payment> {
    if (isSupabaseConfigured) {
      const updateData: any = {
        payment_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Also update the linked booking payment_status
      if (data?.booking_id) {
        await supabase
          .from('bookings')
          .update({ payment_status: status, updated_at: new Date().toISOString() })
          .eq('id', data.booking_id);
      }

      return data as Payment;
    }

    return mockPaymentStore.updatePaymentStatus(paymentId, status, notes);
  },
};

// ========================================================================
// MOCK PAYMENT STORE
// ========================================================================
let MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    booking_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    customer_id: '33333333-3333-3333-3333-333333333333',
    owner_id: '11111111-1111-1111-1111-111111111111',
    amount: 240,
    currency: 'BDT',
    payment_method: 'cash_on_delivery',
    payment_status: 'paid',
    paid_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Cash received at parking gate.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const mockPaymentStore = {
  async getOwnerPayments(ownerId: string): Promise<Payment[]> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_PAYMENTS.filter((p) => p.owner_id === ownerId);
  },

  async getCustomerPayments(customerId: string): Promise<Payment[]> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_PAYMENTS.filter((p) => p.customer_id === customerId);
  },

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    notes?: string
  ): Promise<Payment> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_PAYMENTS.findIndex((p) => p.id === paymentId);
    if (idx === -1) {
      // create entry if missing
      const newPay: Payment = {
        id: paymentId,
        booking_id: 'sample',
        customer_id: 'sample',
        owner_id: 'sample',
        amount: 300,
        currency: 'BDT',
        payment_method: 'cash_on_delivery',
        payment_status: status,
        paid_at: status === 'paid' ? new Date().toISOString() : undefined,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_PAYMENTS.push(newPay);
      return newPay;
    }

    MOCK_PAYMENTS[idx] = {
      ...MOCK_PAYMENTS[idx],
      payment_status: status,
      paid_at: status === 'paid' ? new Date().toISOString() : MOCK_PAYMENTS[idx].paid_at,
      notes: notes || MOCK_PAYMENTS[idx].notes,
      updated_at: new Date().toISOString(),
    };

    return MOCK_PAYMENTS[idx];
  },
};
