import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import DashboardPage from '@/pages/admin/DashboardPage';
import ClubListPage from '@/pages/admin/clubs/ClubListPage';
import CreateClubPage from '@/pages/admin/clubs/CreateClubPage';
import UserListPage from '@/pages/admin/users/UserListPage';

const AdminRoutes: RouteObject = {
  path: '/admin',
  element: <AdminLayout />,
  children: [
    {
      path: 'dashboard',
      element: <DashboardPage />,
    },
    {
      path: 'clubs',
      element: <ClubListPage />,
    },
    {
      path: 'clubs/create',
      element: <CreateClubPage />,
    },
    {
      path: 'users',
      element: <UserListPage />,
    },
    {
      path: '*',
      element: <Navigate to="dashboard" replace />,
    },
  ],
};

export default AdminRoutes;
