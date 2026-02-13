import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';

export interface UserProfile {
  id: string;
  email: string | null;
  onboarding_complete: boolean;
  quit_date: string | null;
  cigarettes_per_day: number | null;
  triggers: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isSubscribed: boolean;
  refreshProfile: () => Promise<void>;
  setSubscriptionStatus: (status: boolean) => void;
}

const PROFILE_COLUMNS = 'id, email, onboarding_complete, quit_date, cigarettes_per_day, triggers, created_at, updated_at';
const PROFILE_QUERY_KEY = (userId: string | null) => ['profile', userId];

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: true,
  isSubscribed: false,
  refreshProfile: async () => {},
  setSubscriptionStatus: () => {},
});

const fetchProfileFromApi = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as UserProfile | null;
};

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const userId = user?.id ?? null;
  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY(userId),
    queryFn: () => {
      if (!userId) return Promise.resolve(null);
      return fetchProfileFromApi(userId);
    },
    enabled: Boolean(userId),
  });

  const refreshProfile = useCallback(
    async () => {
      if (!userId) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
      await queryClient.refetchQueries({ queryKey: PROFILE_QUERY_KEY(userId), type: 'active' });
    },
    [queryClient, userId]
  );

  useEffect(() => {
    if (!userId) {
      setIsSubscribed(false);
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  }, [queryClient, userId]);

  useEffect(() => {
    if (profileQuery.error) {
      console.error('Error fetching profile:', profileQuery.error);
    }
  }, [profileQuery.error]);

  const value = useMemo(
    () => ({
      profile: profileQuery.data ?? null,
      isLoading: Boolean(userId) && profileQuery.isPending,
      isSubscribed,
      refreshProfile,
      setSubscriptionStatus: setIsSubscribed,
    }),
    [isSubscribed, profileQuery.data, profileQuery.isPending, refreshProfile, userId]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
