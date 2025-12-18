import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store/store'
import { setRehydrating, updateUser, restoreSessionFailed } from '@/store/slices/authSlice'
import { authApi } from '@/services/auth.service'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
        onBeforeLift={async () => {
          const state = store.getState();
          console.log('✓ Redux Persist onBeforeLift - rehydration complete', {
            hasToken: !!state.auth.token,
            userRole: state.auth.user?.role,
            isAuthenticated: state.auth.isAuthenticated,
          });

          // Validate restored session if token exists
          if (state.auth.token) {
            console.log('🔄 Validating restored session by calling /users/getprofile...');
            try {
              const response = await authApi.getCurrentUser();
              console.log('✅ Session validated successfully, updating user data');

              // Update user data with latest info from backend
              store.dispatch(updateUser(response.data.user));
              store.dispatch(setRehydrating(false));
            } catch (error: any) {
              console.error('❌ Session validation failed:', error.response?.status || error.message);

              // Token is invalid or expired, clear auth state
              store.dispatch(restoreSessionFailed());

              // Note: Don't redirect here, let ProtectedRoute handle it
            }
          } else {
            console.log('ℹ️ No token found, skipping session validation');
            store.dispatch(setRehydrating(false));
          }
        }}
      >
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
)
