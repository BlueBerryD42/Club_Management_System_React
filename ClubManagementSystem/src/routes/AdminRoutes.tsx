import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardPage from '@/pages/admin/DashboardPage';

import AdminLayout from '@/layouts/AdminLayout';

const AdminRoutes: RouteObject = {
    path: 'admin',
    element: (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
        </ProtectedRoute>
    ),
    children: [
        {
            path: 'dashboard',
            element: <DashboardPage />,
        },
        // Add more admin routes here
    ],
};

export default AdminRoutes;
