import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import PublicRoutes from './PublicRoutes';
import AdminRoutes from './AdminRoutes';
import ClubLeaderRoutes from './ClubLeaderRoutes';
import MemberRoutes from './MemberRoutes';

const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            ...PublicRoutes,
            AdminRoutes,
            ClubLeaderRoutes,
            MemberRoutes,
        ],
    },
]);

export default router;
