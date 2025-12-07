import { createBrowserRouter } from 'react-router-dom';
import PublicRoutes from './PublicRoutes';
import AdminRoutes from './AdminRoutes';
import ClubLeaderRoutes from './ClubLeaderRoutes';
import MemberRoutes from './MemberRoutes';
import NotFound from '@/pages/mainlayout/NotFound';

const router = createBrowserRouter([
    ...PublicRoutes,
    AdminRoutes,
    ClubLeaderRoutes,
    MemberRoutes,
    // Catch-all route for 404
    {
        path: '*',
        element: <NotFound />,
    },
]);

export default router;
