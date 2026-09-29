import { supabase, isSupabaseConfigured } from '../config/supabase';
import { Profile, UserRole } from '../types';

export const authService = {
  /**
   * Log in with Email and Password
   */
  async login(email: string, password: string): Promise<{ profile: Profile; session: any }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('User not found.');
      }

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profileData) {
        // Fallback profile if record hasn't been created yet
        const tempProfile: Profile = {
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || 'User',
          email: data.user.email || email,
          role: (data.user.user_metadata?.role as UserRole) || 'customer',
          is_verified: true,
          is_suspended: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { profile: tempProfile, session: data.session };
      }

      if (profileData.is_suspended) {
        await supabase.auth.signOut();
        throw new Error('This account has been suspended. Please contact customer support.');
      }

      return { profile: profileData as Profile, session: data.session };
    }

    // Interactive Demo Fallback for early testing before cloud sync
    return mockAuthService.login(email, password);
  },

  /**
   * Register new user with Role and Phone
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: UserRole = 'customer'
  ): Promise<{ profile: Profile; session: any }> {
    // Only customer or owner can be selected during registration; manager cannot self-register
    const safeRole: UserRole = role === 'owner' ? 'owner' : 'customer';

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: safeRole,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Signup failed. Please try again.');
      }

      // Build profile
      const newProfile: Profile = {
        id: data.user.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: safeRole,
        is_verified: false,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try inserting into profiles table if trigger is not ready
      await supabase.from('profiles').upsert(newProfile);

      return { profile: newProfile, session: data.session };
    }

    return mockAuthService.register(email, password, fullName, phone, safeRole);
  },

  /**
   * Send Password Reset Email
   */
  async resetPassword(email: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw new Error(error.message);
      return;
    }
    // Simulation success
    await new Promise((resolve) => setTimeout(resolve, 800));
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Fetch user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return data as Profile;
    }
    return mockAuthService.getProfile(userId);
  },

  /**
   * Update profile details
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (isSupabaseConfigured) {
      // Exclude role and is_suspended from general updates to prevent privilege escalation
      const { role, is_suspended, ...safeUpdates } = updates;
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Profile;
    }
    return mockAuthService.updateProfile(userId, updates);
  },
};

// ========================================================================
// IN-MEMORY / DEMO AUTH STORE (When running in standalone test mode)
// ========================================================================
const DEMO_PROFILES: Profile[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Shane Rahman',
    email: 'customer@eparking.com',
    phone: '01711223344',
    role: 'customer',
    address: 'Road 27, Dhanmondi, Dhaka',
    area: 'Dhanmondi',
    is_verified: true,
    is_suspended: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Rafiqul Islam',
    email: 'owner@eparking.com',
    phone: '01819556677',
    role: 'owner',
    address: 'House 42, Road 11, Block D, Banani',
    area: 'Banani',
    is_verified: true,
    is_suspended: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    full_name: 'Platform Manager',
    email: 'manager@eparking.com',
    phone: '01911009988',
    role: 'manager',
    address: 'Gulshan Avenue, Dhaka',
    area: 'Gulshan',
    is_verified: true,
    is_suspended: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockAuthService = {
  async login(email: string, password: string): Promise<{ profile: Profile; session: any }> {
    await new Promise((r) => setTimeout(r, 600));
    const cleanEmail = email.trim().toLowerCase();
    const found = DEMO_PROFILES.find((p) => p.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Allow dynamic sign in with any email
      const newProf: Profile = {
        id: `user-${Date.now()}`,
        full_name: cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        phone: '01710000000',
        role: cleanEmail.includes('owner') ? 'owner' : cleanEmail.includes('manager') ? 'manager' : 'customer',
        is_verified: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      DEMO_PROFILES.push(newProf);
      return { profile: newProf, session: { user: { id: newProf.id } } };
    }

    if (found.is_suspended) {
      throw new Error('This account has been suspended.');
    }

    return { profile: found, session: { user: { id: found.id } } };
  },

  async register(
    email: string,
    _password: string,
    fullName: string,
    phone: string,
    role: UserRole
  ): Promise<{ profile: Profile; session: any }> {
    await new Promise((r) => setTimeout(r, 600));
    const cleanEmail = email.trim().toLowerCase();
    const exists = DEMO_PROFILES.some((p) => p.email.toLowerCase() === cleanEmail);
    if (exists) {
      throw new Error('An account with this email already exists.');
    }

    const newProf: Profile = {
      id: `user-${Date.now()}`,
      full_name: fullName,
      email: cleanEmail,
      phone,
      role,
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DEMO_PROFILES.push(newProf);
    return { profile: newProf, session: { user: { id: newProf.id } } };
  },

  async getProfile(userId: string): Promise<Profile | null> {
    return DEMO_PROFILES.find((p) => p.id === userId) || null;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const idx = DEMO_PROFILES.findIndex((p) => p.id === userId);
    if (idx === -1) throw new Error('User not found');
    DEMO_PROFILES[idx] = {
      ...DEMO_PROFILES[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return DEMO_PROFILES[idx];
  },
};
