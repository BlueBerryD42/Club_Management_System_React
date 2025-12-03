import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: any | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    token: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ token: string; refreshToken: string; user: any }>
        ) => {
            const { token, refreshToken, user } = action.payload;
            state.token = token;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.token = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
        },
        updateToken: (state, action: PayloadAction<{ token: string }>) => {
            state.token = action.payload.token;
        }
    },
});

export const { setCredentials, logout, updateToken } = authSlice.actions;

export default authSlice.reducer;
