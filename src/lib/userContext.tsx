import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSessionUserId, pool } from './db';

interface UserProfile {
  weight_kg?: number;
  height_cm?: number;
  age?: number;
  gender?: string;
  activity_level?: string;
  target_weight_kg?: number;
  goal?: string;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from Neon DB on load
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = getSessionUserId();
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const result = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
        if (result.rows.length > 0) {
          setProfile(result.rows[0]);
        }
      } catch (e) {
        console.error('Failed to fetch user profile from DB', e);
        // Fallback to localStorage if DB fails
        const stored = localStorage.getItem(`user_profile_${userId}`);
        if (stored) setProfile(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const userId = getSessionUserId();
    
    // Optimistic UI update
    setProfile((prev) => {
      const newProfile = { ...prev, ...updates };
      if (userId) {
        localStorage.setItem(`user_profile_${userId}`, JSON.stringify(newProfile));
      }
      return newProfile;
    });

    if (!userId) return;

    try {
      // Upsert the profile changes into the database
      // Build the SET clause dynamically based on what was updated
      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      
      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = keys.map((key) => (updates as any)[key]);
      
      // We first ensure a profile row exists, then update it. Or use an INSERT ON CONFLICT.
      const insertKeys = keys.join(', ');
      const insertValuesPlaceholders = keys.map((_, i) => `$${i + 2}`).join(', ');
      
      const query = `
        INSERT INTO user_profiles (user_id, ${insertKeys}) 
        VALUES ($1, ${insertValuesPlaceholders}) 
        ON CONFLICT (user_id) 
        DO UPDATE SET ${setClause};
      `;
      
      await pool.query(query, [userId, ...values]);
    } catch (e) {
      console.error('Failed to update user profile in DB', e);
    }
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
