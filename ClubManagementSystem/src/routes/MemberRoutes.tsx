import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import MemberLayout from '@/layouts/MemberLayout';

// Placeholder page
const MemberProfile = () => <div>Member Profile</div>;

const MemberRoutes: RouteObject = {
    path: '/member',
    element: (
        <ProtectedRoute allowedRoles={['MEMBER']}>
            <MemberLayout />
        </ProtectedRoute>
    ),
    children: [
        {
            path: 'profile',
            element: <MemberProfile />,
        },
    ],
};

export default MemberRoutes;
