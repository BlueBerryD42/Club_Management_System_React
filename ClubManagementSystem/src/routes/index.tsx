import { createBrowserRouter } from 'react-router-dom';
import PublicRoutes from './PublicRoutes';
import AdminRoutes from './AdminRoutes';
import ClubLeaderRoutes from './ClubLeaderRoutes';
import MemberRoutes from './MemberRoutes';

const router = createBrowserRouter([
    ...PublicRoutes,
    AdminRoutes,
    ClubLeaderRoutes,
    MemberRoutes,
]);

export default router;
