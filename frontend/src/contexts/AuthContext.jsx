import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, checkSupabaseHealth } from '../lib/supabase';
import { profileService } from '../services/profileService';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (userId) => {
        try {
            const prof = await profileService.getProfile(userId);
            setProfile(prof);
            return prof;
        }
        catch (err) {
            console.error('Failed to load profile for user:', userId, err);
            setProfile(null);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;
        let sessionResolved = false;

        // Run non-blocking startup database probe
        if (isSupabaseConfigured) {
            checkSupabaseHealth().catch((err) => {
                console.warn('Supabase health probe error:', err);
            });
        }

        const initAuth = async () => {
            setLoading(true);
            if (!isSupabaseConfigured) {
                if (mounted) {
                    console.log('ℹ️ No active session (Supabase not configured)');
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
                return;
            }

            console.log('🔐 Initializing authentication...');

            let timeoutId;
            try {
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => {
                    timeoutId = setTimeout(
                        () => reject(new Error('Supabase session check timed out')),
                        4000
                    );
                });

                const { data: { session }, error } = await Promise.race([
                    sessionPromise,
                    timeoutPromise
                ]);

                clearTimeout(timeoutId);

                if (error)
                    throw error;

                if (!sessionResolved && mounted) {
                    sessionResolved = true;
                    if (session?.user) {
                        console.log('✅ Existing session found');
                        setUser(session.user);
                        loadProfile(session.user.id).catch((err) => {
                            console.error('Profile loading failed:', err);
                        });
                    }
                    else {
                        console.log('ℹ️ No active session');
                        setUser(null);
                        setProfile(null);
                    }
                }
            }
            catch (err) {
                clearTimeout(timeoutId);
                console.error('❌ Session initialization error:', err);
                if (!sessionResolved && mounted) {
                    sessionResolved = true;
                    setUser(null);
                    setProfile(null);
                }
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const authListener = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted)
                return;

            console.log(`🔐 Auth event: ${event}`);
            sessionResolved = true;

            if (session?.user) {
                setUser(session.user);
                loadProfile(session.user.id).catch((err) => {
                    console.error('Profile loading failed:', err);
                });
            }
            else {
                setUser(null);
                setProfile(null);
            }

            setLoading(false);
        });

        return () => {
            mounted = false;
            if (authListener?.data?.subscription) {
                authListener.data.subscription.unsubscribe();
            }
        };
    }, []);

    const login = async (email, password) => {
        if (!isSupabaseConfigured) {
            return { error: 'Supabase is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.' };
        }
        try {
            const loginPromise = supabase.auth.signInWithPassword({ email, password });
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Sign in request timed out. Please check your internet connection.')), 8000);
            });

            const { data, error } = await Promise.race([loginPromise, timeoutPromise]);
            clearTimeout(timeoutId);

            if (error)
                return { error: error.message };
            if (data.user) {
                setUser(data.user);
                await loadProfile(data.user.id);
            }
            return {};
        }
        catch (err) {
            return { error: err?.message || 'Login failed' };
        }
    };

    const signup = async (email, password, fullName) => {
        if (!isSupabaseConfigured) {
            return { error: 'Supabase is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.' };
        }
        try {
            // Pristine reset of previous profile context
            setProfile(null);

            const signupPromise = supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Registration request timed out. Please try again.')), 8000);
            });

            const { data, error } = await Promise.race([signupPromise, timeoutPromise]);
            clearTimeout(timeoutId);

            if (error)
                return { error: error.message };

            if (data.user) {
                setUser(data.user);
                const freshProfile = {
                    user_id: data.user.id,
                    full_name: fullName,
                    degree: '',
                    college: '',
                    graduation_year: 2026,
                    target_role: '',
                    location: '',
                    career_readiness: 0,
                    onboarding_completed: false
                };
                setProfile(freshProfile);

                profileService.createProfile(data.user.id, freshProfile).then(() => {
                    loadProfile(data.user.id).catch(console.error);
                }).catch((err) => {
                    console.warn('Profile create on signup notice:', err);
                });
            }
            return {};
        }
        catch (err) {
            return { error: err?.message || 'Signup failed' };
        }
    };

    const loginWithGoogle = async () => {
        if (!isSupabaseConfigured) {
            return { error: 'Supabase is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.' };
        }
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard'
                }
            });
            if (error)
                return { error: error.message };
            return {};
        }
        catch (err) {
            return { error: err?.message || 'Google OAuth failed' };
        }
    };

    const resetPassword = async (email) => {
        if (!isSupabaseConfigured) {
            return { error: 'Supabase is not configured.' };
        }
        try {
            const resetPromise = supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/settings'
            });
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Password reset request timed out.')), 8000);
            });
            const { error } = await Promise.race([resetPromise, timeoutPromise]);
            clearTimeout(timeoutId);

            if (error)
                return { error: error.message };
            return {};
        }
        catch (err) {
            return { error: err?.message || 'Reset failed' };
        }
    };

    const logout = async () => {
        if (isSupabaseConfigured) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn('Signout notice:', e);
            }
        }
        setUser(null);
        setProfile(null);
    };

    const deleteAccount = async () => {
        if (user?.id) {
            await profileService.deleteAccount(user.id);
        }
        await logout();
    };

    const refreshProfile = async () => {
        if (user?.id) {
            await loadProfile(user.id);
        }
    };

    return (<AuthContext.Provider value={{
        user,
        profile,
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        login,
        signup,
        loginWithGoogle,
        logout,
        deleteAccount,
        resetPassword,
        refreshProfile
    }}>
        {children}
    </AuthContext.Provider>);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
