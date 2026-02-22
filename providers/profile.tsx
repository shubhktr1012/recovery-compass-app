import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/providers/auth';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export interface UserProfile {
  id: string;
  email: string | null;
  onboarding_complete: boolean;
  quit_date: string | null;
  cigarettes_per_day: number | null;
  triggers: string[] | null;
  created_at: string;
  updated_at: string;
  expo_push_token?: string | null;
  push_opt_in?: boolean;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isSubscribed: boolean;
  refreshProfile: () => Promise<void>;
  setSubscriptionStatus: (status: boolean) => void;
}

const PROFILE_COLUMNS = 'id, email, onboarding_complete, quit_date, cigarettes_per_day, triggers, created_at, updated_at, expo_push_token, push_opt_in';
export const PROFILE_QUERY_KEY = (userId: string | null) => ['profile', userId];

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: true,
  isSubscribed: false,
  refreshProfile: async () => { },
  setSubscriptionStatus: () => { },
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
  const shouldRegisterPush = Boolean(userId && profileQuery.data?.onboarding_complete);
  const { expoPushToken, permissionStatus, error: pushError } = usePushNotifications({
    enabled: shouldRegisterPush,
  });

  useEffect(() => {
    if (!userId) return;

    const profile = profileQuery.data;
    if (!profile?.onboarding_complete) return;

    const token = expoPushToken?.data ?? null;
    const shouldClearPush =
      permissionStatus === 'denied' &&
      Boolean(profile.expo_push_token || profile.push_opt_in);

    let nextToken: string | null = null;
    let nextOptIn = false;

    if (token) {
      nextToken = token;
      nextOptIn = true;
    } else if (shouldClearPush) {
      nextToken = null;
      nextOptIn = false;
    } else {
      return;
    }

    if (
      profile.expo_push_token === nextToken &&
      Boolean(profile.push_opt_in) === nextOptIn
    ) {
      return;
    }

    let isCancelled = false;

    const syncPushState = async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          expo_push_token: nextToken,
          push_opt_in: nextOptIn,
        })
        .eq('id', userId);

      if (error) throw error;
    };

    void syncPushState()
      .then(() => {
        if (isCancelled) return;
        queryClient.setQueryData<UserProfile | null>(
          PROFILE_QUERY_KEY(userId),
          (currentProfile) =>
            currentProfile
              ? {
                  ...currentProfile,
                  expo_push_token: nextToken,
                  push_opt_in: nextOptIn,
                }
              : currentProfile
        );
      })
      .catch((syncError) => {
        if (isCancelled) return;
        console.error('Failed to sync push notification state', syncError);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    expoPushToken?.data,
    permissionStatus,
    profileQuery.data,
    queryClient,
    userId,
  ]);

  // Check RevenueCat Entitlements
  const checkEntitlements = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // Look for the specific entitlement exactly as named in the RevenueCat dashboard
      if (typeof customerInfo.entitlements.active['Recovery Compass Pro'] !== "undefined") {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch (e) {
      console.error("Error fetching Customer Info from RevenueCat:", e);
      setIsSubscribed(false);
    }
  }, []);

  // Listen to CustomerInfo updates globally
  useEffect(() => {
    // Initial fetch when mounted
    checkEntitlements();

    // Subscribe to ongoing updates (e.g. when a purchase completes)
    const updateListener = (customerInfo: CustomerInfo) => {
      if (typeof customerInfo.entitlements.active['Recovery Compass Pro'] !== "undefined") {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    };

    Purchases.addCustomerInfoUpdateListener(updateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(updateListener);
    };
  }, [checkEntitlements]);

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

  useEffect(() => {
    if (pushError) {
      console.error('Push registration error:', pushError);
    }
  }, [pushError]);

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
