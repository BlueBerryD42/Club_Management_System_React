import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClubLeaderLayout from '@/layouts/ClubLeaderLayout';

// Placeholder page
const ClubLeaderDashboard = () => <div>Club Leader Dashboard</div>;

const ClubLeaderRoutes: RouteObject = {
    path: 'club-leader',
    element: (
        <ProtectedRoute allowedRoles={['CLUB_LEADER']}>
            <ClubLeaderLayout />
        </ProtectedRoute>
    ),
    children: [
        {
            path: 'dashboard',
            element: <ClubLeaderDashboard />,
        },
    ],
};

export default ClubLeaderRoutes;
