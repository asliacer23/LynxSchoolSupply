import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, RoleName } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: RoleName[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    roles: [],
    loading: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setState(prev => ({
            ...prev,
            profile: null,
            roles: [],
            loading: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role_id, roles(name)')
          .eq('user_id', userId),
      ]);

      // Handle profile fetch errors
      if (profileResult.error) {
        console.error('❌ Profile fetch error:', profileResult.error);
      }

      // Handle roles fetch errors
      if (rolesResult.error) {
        console.error('❌ Roles fetch error:', rolesResult.error);
        console.error('   Error code:', rolesResult.error.code);
        console.error('   Error message:', rolesResult.error.message);
      }

      const roles = (rolesResult.data ?? [])
        .map((r: any) => r.roles?.name)
        .filter(Boolean) as RoleName[];

      setState(prev => ({
        ...prev,
        profile: profileResult.data as Profile | null,
        roles,
        loading: false,
      }));

      // Log role info for debugging
      if (roles.length === 0) {
        console.warn('⚠️ User has no roles assigned:', userId);
      } else {
        console.log('✅ User roles loaded:', roles);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/auth/login`;
    
    try {
      // Create Supabase auth user
      // Supabase will automatically send confirmation email
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
        },
      });

      if (error) {
        return { error };
      }

      // Create profile and assign role in background
      // Don't block signup flow even if this fails
      if (authData.user?.id) {
        createProfileAndRoleAsync(authData.user.id, fullName, email);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const createProfileAndRoleAsync = async (userId: string, fullName: string, email: string) => {
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          email: email,
          is_active: true,
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return;
      }

      // Get user role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'user')
        .single();

      // Assign user role
      if (roleData) {
        await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role_id: roleData.id,
          }, {
            onConflict: 'user_id,role_id',
          });
        
        console.log('✅ Profile and role created for user:', userId);
      }
    } catch (error) {
      console.error('Background profile/role creation failed:', error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Refresh profile data - useful for updating after changes
  const refreshProfile = async () => {
    if (state.user) {
      await fetchUserData(state.user.id);
    }
  };

  // Role checking functions
  const hasRole = (role: RoleName) => state.roles.includes(role);
  const isAdmin = () => hasRole('superadmin') || hasRole('owner');
  const isCashier = () => hasRole('cashier');
  const isStaff = () => isAdmin() || isCashier();
  const isCustomer = () => hasRole('user') && !isStaff();

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    hasRole,
    isAdmin,
    isCashier,
    isStaff,
    isCustomer,
  };
}
