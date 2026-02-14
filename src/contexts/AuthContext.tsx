import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getSupabaseClient } from '@/lib/supabaseClient'; 
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>; 
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const handleAuth = async () => {

    supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log("-----------------------------------");
      console.log(`🚀 APP RECOVERY: Logged in as ${session.user.email}`);
      console.log(`🛡️ RECOVERED ROLE: ${session.user.user_metadata?.role}`);
      console.log("-----------------------------------");
      
      const metadata = session.user.user_metadata;
      setUser({
        ...session.user,
        // @ts-ignore
        name: metadata?.full_name || session.user.email || 'Staff Member',
        role: metadata?.role || 'librarian'
      });
    } else {
      console.log("🚫 NO SESSION FOUND: Redirecting to login...");
      setUser(null);
    }
    setIsLoading(false);
      });
      // 1. Check URL for token_hash and type (Magic Link Support)
      const params = new URLSearchParams(window.location.search);
      const token_hash = params.get('token_hash'); // Corrected key name
      const typeParam = params.get('type') as any; // renamed to 'typeParam' to avoid conflict

      if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: typeParam || 'magiclink', // 'magiclink' is the standard Supabase type
        });
        
        if (!error) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      // 2. Persistent Session Check
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);

      // 3. Auth State Listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user){
          const metadata = session.user.user_metadata;

          // Set user with all properties before turning off isLoading
          setUser({
            ...session.user,
            // @ts-ignore
            name: metadata?.full_name || session.user.email || 'Staff Member',
            role: metadata?.role || 'librarian'
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
    };

    handleAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    setIsLoading(true);
    
    const client = rememberMe ? supabase : getSupabaseClient(false);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Login Error:", error.message);
      setIsLoading(false);
      return false;
    }

    if (data.user) {
      console.log(`🔐 LOGGED IN AS: ${data.user.email} | ROLE: ${data.user.user_metadata?.role || 'librarian'}`);
    const metadata = data.user.user_metadata;
    const fallbackName = metadata?.full_name || data.user.email || 'Staff Member';
      // Mapping metadata to the 'name' and 'role' properties your Header/ProtectedRoutes expect
      setUser({
        ...data.user,
        // @ts-ignore
        name: fallbackName,
        role: metadata?.role || 'librarian'
      });
    }

    setIsLoading(false);
    return !!data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};