import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios'
import { store } from '../store/store'
import { logout } from '../store/slices/authSlice'

// Sử dụng VITE_API_URL trực tiếp, không qua Gateway
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

console.log('API URL:', API_URL)

const attachInterceptors = (client: AxiosInstance) => {
    // Public endpoints that don't require authentication
    const publicEndpoints = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/confirm-email',
        '/resend-confirmation',
        '/refresh',
    ]

    const isPublicEndpoint = (url: string | undefined): boolean => {
        if (!url) return false
        return publicEndpoints.some(endpoint => url.includes(endpoint))
    }

    // Request interceptor - thêm token từ Redux store vào header
    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const state = store.getState()
            const token = state.auth.token

            // Skip token check for public endpoints
            if (isPublicEndpoint(config.url)) {
                return config
            }

            if (token) {
                config.headers = config.headers ?? {}
                config.headers.Authorization = `Bearer ${token}`
                console.log('✓ Adding Authorization header to request:', config.url)
            } else {
                // Only warn for protected endpoints that need authentication
                console.warn('⚠ No token found for protected endpoint:', config.url)
            }
            return config
        },
        (error: AxiosError) => Promise.reject(error)
    )

    // Response interceptor - xử lý lỗi chung
    client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
            // Xử lý lỗi 401 - Unauthorized
            if (error.response?.status === 401) {
                console.error('401 Unauthorized - Clearing tokens and redirecting to login')
                console.error('  Request URL:', error.config?.url)

                // Dispatch logout action to clear Redux state
                store.dispatch(logout())

                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    window.location.href = '/login'
                }
            }

            // Xử lý lỗi 403 - Forbidden
            if (error.response?.status === 403) {
                console.error('Access denied - insufficient permissions')
            }

            // Xử lý lỗi 500 - Server Error
            if (error.response?.status && error.response.status >= 500) {
                console.error('Server error:', error.response.data)
            }

            return Promise.reject(error)
        }
    )
}

export const createApiClient = () => {
    const client = axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 30000,
    })

    attachInterceptors(client)
    return client
}

const apiClient = createApiClient()

export default apiClient
