import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { Profile, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, phone: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const profile = await authService.getProfile(data.session.user.id);
            if (mounted && profile) {
              setUser(profile);
            }
          }
        } else {
          // Default to demo customer profile so reviewer can immediately test the app
          const defaultDemo = await authService.getProfile('33333333-3333-3333-3333-333333333333');
          if (mounted && defaultDemo) {
            setUser(defaultDemo);
          }
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    // Listen to Supabase auth events if configured
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await authService.getProfile(session.user.id);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      });

      return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { profile } = await authService.login(email, pass);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    name: string,
    phone: string,
    role: UserRole = 'customer'
  ) => {
    setLoading(true);
    try {
      const { profile } = await authService.register(email, pass, name, phone, role);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, updates);
    setUser(updated);
  };

  /**
   * Switch persona for testing customer, owner, and manager workflows
   */
  const switchDemoRole = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      let targetId = '33333333-3333-3333-3333-333333333333'; // customer Shane
      if (targetRole === 'owner') {
        targetId = '11111111-1111-1111-1111-111111111111'; // owner Rafiqul
      } else if (targetRole === 'manager') {
        targetId = '99999999-9999-9999-9999-999999999999'; // platform manager
      }

      const prof = await authService.getProfile(targetId);
      if (prof) {
        setUser(prof);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'customer',
        loading,
        isConfigured: isSupabaseConfigured,
        login,
        register,
        logout,
        updateProfile,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
