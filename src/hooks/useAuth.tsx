import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkApprovalStatus(session.user.id);
      } else {
        setApproved(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkApprovalStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkApprovalStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("approved")
      .eq("id", userId)
      .maybeSingle();

    console.log("Verificando aprovação para userId:", userId, "Resultado:", data, "Error:", error);

    if (error) {
      console.error("Error checking approval status:", error);
      setApproved(null);
    } else if (!data) {
      // Profile doesn't exist - user should be logged out
      console.error("Profile not found for user:", userId);
      setApproved(null);
      await supabase.auth.signOut();
    } else {
      console.log("Status de aprovação setado:", data.approved);
      setApproved(data.approved ?? null);
    }
  };

  const signOut = async () => {
    // Sign out from Supabase first
    await supabase.auth.signOut();
    
    // Clear all local storage and state
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setSession(null);
    setApproved(null);
    setLoading(false);
    
    // Navigate to auth page
    navigate('/auth');
  };

  return { user, session, loading, approved, signOut };
};
