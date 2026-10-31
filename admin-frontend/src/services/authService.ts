import { createClient } from '@supabase/supabase-js';
import { adminFetch, getSessionAuth, setSessionAuth, SessionAuth } from './apiClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mkegptssjhjchwcpatnp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export interface FounderProfile {
  authenticated: boolean;
  email: string;
  role: string;
  auth_method: 'bearer_jwt' | 'api_key';
}

class AuthService {
  private currentFounder: FounderProfile | null = null;
  private listeners: Array<(founder: FounderProfile | null) => void> = [];

  constructor() {
    const existing = getSessionAuth();
    if (existing) {
      this.currentFounder = {
        authenticated: true,
        email: existing.email || 'founder@careeros.ai',
        role: 'founder',
        auth_method: existing.type === 'admin_key' ? 'api_key' : 'bearer_jwt'
      };
    }
    window.addEventListener('careeros:auth_expired', () => {
      this.logout();
    });
  }

  public subscribe(cb: (founder: FounderProfile | null) => void) {
    this.listeners.push(cb);
    cb(this.currentFounder);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    for (const cb of this.listeners) {
      cb(this.currentFounder);
    }
  }

  public getFounder(): FounderProfile | null {
    return this.currentFounder;
  }

  public isAuthenticated(): boolean {
    return !!this.currentFounder && this.currentFounder.authenticated;
  }

  /**
   * Verifies existing session with backend /api/admin/auth/me.
   * If token is invalid or expired, session is cleared immediately.
   */
  public async verifySession(): Promise<FounderProfile | null> {
    const existing = getSessionAuth();
    if (!existing) {
      this.currentFounder = null;
      this.notify();
      return null;
    }

    try {
      const res = await adminFetch<{
        status: string;
        authenticated: boolean;
        email: string;
        role: string;
        auth_method: 'bearer_jwt' | 'api_key';
      }>('/api/admin/auth/me');

      if (res && res.authenticated) {
        this.currentFounder = {
          authenticated: true,
          email: res.email || existing.email || 'founder@careeros.ai',
          role: res.role || 'founder',
          auth_method: res.auth_method
        };
        this.notify();
        return this.currentFounder;
      }
    } catch {
      this.logout();
    }

    return null;
  }

  /**
   * Authenticates founder using Supabase Email & Password.
   * Cryptographically validates that the account possesses founder or admin authority on the backend.
   */
  public async loginWithSupabase(email: string, pass: string): Promise<FounderProfile> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass
    });

    if (error || !data.session?.access_token) {
      throw new Error(error?.message || 'Authentication failed: Invalid credentials.');
    }

    const token = data.session.access_token;
    const authRecord: SessionAuth = {
      type: 'bearer',
      token,
      email: data.user?.email
    };

    setSessionAuth(authRecord);

    try {
      // Validate permissions server-side
      const verifyRes = await adminFetch<{
        status: string;
        authenticated: boolean;
        email: string;
        role: string;
        auth_method: 'bearer_jwt' | 'api_key';
      }>('/api/admin/auth/me');

      if (!verifyRes.authenticated) {
        throw new Error('Access Denied: Your account does not have founder privileges.');
      }

      this.currentFounder = {
        authenticated: true,
        email: verifyRes.email,
        role: verifyRes.role,
        auth_method: 'bearer_jwt'
      };
      this.notify();
      return this.currentFounder;
    } catch (err: any) {
      this.logout();
      throw new Error(err.message || 'Access Denied: Not authorized as founder.');
    }
  }

  /**
   * Authenticates founder using the direct Master Secret Admin Key.
   */
  public async loginWithAdminKey(key: string): Promise<FounderProfile> {
    const cleanKey = key.trim();
    if (!cleanKey) {
      throw new Error('Admin API Key cannot be empty.');
    }

    const authRecord: SessionAuth = {
      type: 'admin_key',
      token: cleanKey,
      email: 'founder@careeros.ai'
    };

    setSessionAuth(authRecord);

    try {
      const verifyRes = await adminFetch<{
        status: string;
        authenticated: boolean;
        email: string;
        role: string;
        auth_method: 'bearer_jwt' | 'api_key';
      }>('/api/admin/auth/me');

      if (!verifyRes.authenticated) {
        throw new Error('Access Denied: Invalid Master Admin Key.');
      }

      this.currentFounder = {
        authenticated: true,
        email: verifyRes.email,
        role: verifyRes.role,
        auth_method: 'api_key'
      };
      this.notify();
      return this.currentFounder;
    } catch (err: any) {
      this.logout();
      throw new Error(err.message || 'Access Denied: Invalid Master Admin Key.');
    }
  }

  public logout() {
    setSessionAuth(null);
    this.currentFounder = null;
    this.notify();
  }
}

export const authService = new AuthService();

