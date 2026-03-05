import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { Profile, PlatformRole } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
    session: Session | null;
    user: SupabaseUser | null;
    profile: Profile | null;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signInWithOtp: (phone: string) => Promise<void>;
    verifyOtp: (phone: string, token: string) => Promise<void>;
    signInWithProvider: (provider: 'google' | 'apple' | 'slack_oidc') => Promise<void>;
    signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
    });

    // Fetch profile from public.profiles
    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Failed to fetch profile:', error.message);
            return null;
        }

        return {
            id: data.id,
            email: data.email,
            fullName: data.full_name,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
            phone: data.phone,
            platformRole: data.platform_role as PlatformRole,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    };

    // Bootstrap: get initial session
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            let profile: Profile | null = null;
            if (session?.user) {
                profile = await fetchProfile(session.user.id);
            }
            setState({ session, user: session?.user ?? null, profile, isLoading: false });
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            let profile: Profile | null = null;
            if (session?.user) {
                profile = await fetchProfile(session.user.id);
            }
            setState((prev) => ({
                ...prev,
                session,
                user: session?.user ?? null,
                profile,
                isLoading: false,
            }));
        });

        return () => subscription.unsubscribe();
    }, []);

    // ─── Auth methods ────────────────────────────────────────────────────

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signInWithOtp = async (phone: string) => {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
    };

    const verifyOtp = async (phone: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
        if (error) throw error;
    };

    const signInWithProvider = async (provider: 'google' | 'apple' | 'slack_oidc') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
    };

    const signUp = async (
        email: string,
        password: string,
        metadata?: Record<string, string>,
    ) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata },
        });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const refreshProfile = async () => {
        if (!state.user) return;
        const profile = await fetchProfile(state.user.id);
        setState((prev) => ({ ...prev, profile }));
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                signInWithEmail,
                signInWithOtp,
                verifyOtp,
                signInWithProvider,
                signUp,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

export function useRequireAuth() {
    const auth = useAuth();
    if (!auth.isLoading && !auth.user) {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
    return auth;
}
