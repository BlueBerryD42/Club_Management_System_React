import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import StaffLayout from '@/layouts/StaffLayout';
import StaffDashboard from '@/pages/staff/StaffDashboard';
import CheckInPage from '@/pages/staff/CheckInPage';
import FundRequestPage from '@/pages/staff/FundRequestPage';

const StaffRoutes: RouteObject = {
  path: '/staff',
  element: <StaffLayout />,
  children: [
    {
      path: 'dashboard',
      element: <StaffDashboard />,
    },
    {
      path: 'scan',
      element: <CheckInPage />,
    },
    {
      path: 'requests',
      element: <FundRequestPage />,
    },
    {
      path: '*',
      element: <Navigate to="dashboard" replace />,
    },
  ],
};

export default StaffRoutes;
