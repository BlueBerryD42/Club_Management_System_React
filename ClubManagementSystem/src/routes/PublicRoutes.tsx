import type { RouteObject } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

const PublicRoutes: RouteObject[] = [
    {
        index: true,
        element: <HomePage />,
    },
    {
        path: 'login',
        element: <LoginPage />,
    },
    {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
    },
];

export default PublicRoutes;
