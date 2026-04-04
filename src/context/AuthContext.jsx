import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setUserData(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle(); // Use maybeSingle to avoid error if no profile exists yet

      if (error) {
        console.warn('Profile fetch error - might not exist yet:', error.message);
      }

      if (data) {
        // Map snake_case DB columns to camelCase for component compatibility
        const mapped = {
          uid: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          uniqueId: data.unique_id,
          hostelBlock: data.hostel_block,
          roomNo: data.room_no,
          createdAt: data.created_at,
        };
        setUserData(mapped);
        setUserRole(data.role);
      } else {
        // No profile found, set defaults or keep as null
        setUserData(null);
        setUserRole(null);
      }
    } catch (err) {
      console.error('Critical Profile Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    userData,
    userRole,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
