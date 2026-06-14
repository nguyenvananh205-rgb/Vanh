import { useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "../types";
import {
  supabase,
  isSupabaseConfigured,
  signUp as dbSignUp,
  signIn as dbSignIn,
  signOut as dbSignOut,
  getProfile,
} from "../lib/supabase";

export interface UseAuthReturn {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (sess: Session | null) => {
    if (!sess || !isSupabaseConfigured) {
      setUser(null);
      return;
    }
    try {
      const profile = await getProfile(sess.user.id);
      setUser({
        id: profile.id,
        phone: profile.phone,
        display_name: profile.display_name ?? undefined,
      });
    } catch {
      // Profile may not exist yet — set minimal info from auth
      setUser({
        id: sess.user.id,
        phone: sess.user.phone ?? "",
      });
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session).finally(() => setLoading(false));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        setSession(sess);
        await loadProfile(sess);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (phone: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await dbSignIn(phone, password);
      // session will be set via onAuthStateChange
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("Invalid login credentials")) {
        setError("Số điện thoại hoặc mật khẩu không đúng");
      } else if (msg.includes("Phone not confirmed")) {
        setError("Tài khoản chưa được xác nhận");
      } else {
        setError(msg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (phone: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await dbSignUp(phone, password);
      // session will be set via onAuthStateChange
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("User already")) {
        setError("Số điện thoại đã được đăng ký. Vui lòng đăng nhập.");
      } else if (msg.includes("Password should be at least")) {
        setError("Mật khẩu phải có ít nhất 6 ký tự");
      } else {
        setError(msg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setError(null);
    try {
      await dbSignOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { user, session, loading, error, signIn, signUp, signOut: handleSignOut, clearError };
}
