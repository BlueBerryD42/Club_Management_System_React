import type { RouteObject } from 'react-router-dom';
import Index from '../pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import GoogleCallbackPage from '@/pages/auth/GoogleCallbackPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import Clubs from '@/pages/mainlayout/Clubs';
import ClubDetail from '@/pages/mainlayout/ClubDetail';
import Events from '@/pages/mainlayout/Events';
import EventDetail from '@/pages/mainlayout/EventDetail';
import About from '@/pages/mainlayout/About';
import PaymentResultPage from '@/pages/payment/PaymentResultPage';

const PublicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Index />,
    },
    {
        path: '/clubs',
        element: <Clubs />,
    },
    {
        path: '/clubs/:id',
        element: <ClubDetail />,
    },
    {
        path: '/events',
        element: <Events />,
    },
    {
        path: '/events/:id',
        element: <EventDetail />,
    },
    {
        path: '/about',
        element: <About />,
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
        path: '/auth/callback',
        element: <GoogleCallbackPage />,
    },
    {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
    },
    {
        path: '/payment/result',
        element: <PaymentResultPage />,
    },
];

export default PublicRoutes;
