import type { RouteObject } from 'react-router-dom';
import MemberLayout from '@/layouts/MemberLayout';
import Dashboard from '@/pages/member/Dashboard';
import Profile from '@/pages/member/Profile';
import MyClubs from '@/pages/member/MyClubs';
import MyEvents from '@/pages/member/MyEvents';
import Fees from '@/pages/member/Fees';

// TODO: Thêm lại ProtectedRoute khi kết nối API authentication
const MemberRoutes: RouteObject = {
    path: '/member',
    element: (
        <MemberLayout />
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
