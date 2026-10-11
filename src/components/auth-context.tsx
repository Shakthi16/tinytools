import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
const AuthContext=createContext<{user:User|null;loading:boolean}>({user:null,loading:true});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    try {
      const authState = supabase?.auth?.onAuthStateChange?.((event, session) => {
        if (active) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          void router.invalidate();
          if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
        }
      });

      void supabase?.auth?.getUser?.().then(({ data }) => {
        if (active) {
          setUser(data?.user ?? null);
          setLoading(false);
        }
      }).catch(() => {
        if (active) setLoading(false);
      });

      return () => {
        active = false;
        authState?.data?.subscription?.unsubscribe?.();
      };
    } catch {
      if (active) {
        setUser(null);
        setLoading(false);
      }
    }
  }, [router, queryClient]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
