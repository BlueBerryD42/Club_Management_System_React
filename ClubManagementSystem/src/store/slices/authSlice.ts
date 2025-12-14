import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'USER';
    phone?: string;
    studentCode?: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
    memberships?: Array<{
        clubId: string;
        role: 'LEADER' | 'MEMBER' | 'STAFF' | 'TREASURER';
        status: string;
    }>;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isRehydrating: boolean;
}

const initialState: AuthState = {
    token: null,
    user: null,
    isAuthenticated: false,
    isRehydrating: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ token: string; user: User }>
        ) => {
            const { token, user } = action.payload;
            state.token = token;
            state.user = user;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isRehydrating = false;
        },
        updateToken: (state, action: PayloadAction<{ token: string }>) => {
            state.token = action.payload.token;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        setRehydrating: (state, action: PayloadAction<boolean>) => {
            state.isRehydrating = action.payload;
        },
        restoreSessionFailed: (state) => {
            // Clear auth state when restored session validation fails
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isRehydrating = false;
        }
    },
});

export const { setCredentials, logout, updateToken, updateUser, setRehydrating, restoreSessionFailed } = authSlice.actions;

export default authSlice.reducer;
