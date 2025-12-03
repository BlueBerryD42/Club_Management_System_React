import type { RouteObject } from 'react-router-dom';
import Index from '../pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

const PublicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Index />,
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
    {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
    },
];

export default PublicRoutes;
