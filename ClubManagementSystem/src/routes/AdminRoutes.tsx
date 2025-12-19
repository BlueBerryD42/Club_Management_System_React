import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardPage from '@/pages/admin/DashboardPage';
import ClubListPage from '@/pages/admin/clubs/ClubListPage';
import CreateClubPage from '@/pages/admin/clubs/CreateClubPage';
import ClubDetailPage from '@/pages/admin/clubs/ClubDetailPage';
import EditClubPage from '@/pages/admin/clubs/EditClubPage';
import UserListPage from '@/pages/admin/users/UserListPage';
import FundRequestListPage from '@/pages/admin/finance/FundRequestListPage';
import FundRequestDetailPage from '@/pages/admin/finance/FundRequestDetailPage';
import AuditLogPage from '@/pages/admin/audit/AuditLogPage';

const AdminRoutes: RouteObject = {
  path: '/admin',
  element: (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminLayout />
    </ProtectedRoute>
  ),
  children: [
    { path: 'dashboard', element: <DashboardPage /> },
    { path: 'clubs', element: <ClubListPage /> },
    { path: 'clubs/create', element: <CreateClubPage /> },
    { path: 'clubs/:clubId/edit', element: <EditClubPage /> },
    { path: 'clubs/:id', element: <ClubDetailPage /> },
    { path: 'users', element: <UserListPage /> },
    { path: 'finance/requests', element: <FundRequestListPage /> },
    { path: 'finance/requests/:id', element: <FundRequestDetailPage /> },
    { path: 'audit', element: <AuditLogPage /> },
    { path: '*', element: <Navigate to="dashboard" replace /> },
  ],
};

export default AdminRoutes;
