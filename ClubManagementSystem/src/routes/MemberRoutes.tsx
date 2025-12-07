import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import MemberLayout from '@/layouts/MemberLayout';
import Dashboard from '@/pages/student/Dashboard';
import Profile from '@/pages/student/Profile';
import MyClubs from '@/pages/student/MyClubs';
import MyEvents from '@/pages/student/MyEvents';
import Fees from '@/pages/student/Fees';

const MemberRoutes: RouteObject = {
    path: '/member',
    element: (
        <ProtectedRoute allowedRoles={['MEMBER']}>
            <MemberLayout />
        </ProtectedRoute>
    ),
    children: [
        {
            path: 'dashboard',
            element: <Dashboard />,
        },
        {
            path: 'profile',
            element: <Profile />,
        },
        {
            path: 'my-clubs',
            element: <MyClubs />,
        },
        {
            path: 'my-events',
            element: <MyEvents />,
        },
        {
            path: 'fees',
            element: <Fees />,
        },
    ],
};

export default MemberRoutes;
