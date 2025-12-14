import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { authApi, type UserProfile } from '@/services/auth.service';

/**
 * Hook to fetch and manage current user profile
 * Automatically updates Redux store with profile data
 */
export const useUserProfile = () => {
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);

    // Fetch user profile from API
    const { data: profileResponse, isLoading, error, refetch } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const response = await authApi.getProfile();
            return response.data;
        },
        enabled: isAuthenticated, // Only fetch if user is authenticated
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 1,
    });

    // Update Redux store when profile is fetched
    useEffect(() => {
        if (profileResponse?.user) {
            const u = profileResponse.user as UserProfile & { auth_role?: 'ADMIN'|'USER' };
            dispatch(updateUser({
                id: u.id,
                email: u.email,
                fullName: u.fullName,
                phone: u.phone,
                studentCode: u.studentCode,
                role: u.auth_role || u.role || 'USER',
                avatarUrl: u.avatarUrl,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
                memberships: u.memberships,
            }));
        }
    }, [profileResponse, dispatch]);

    return {
        user,
        profile: profileResponse?.user,
        isLoading,
        error,
        refetch,
    };
};
