import { Routes, Route, Navigate } from 'react-router-dom';
import StaffLayout from '@/layouts/StaffLayout';
import StaffDashboard from '@/pages/staff/StaffDashboard';
import CheckInPage from '@/pages/staff/CheckInPage';
import FundRequestPage from '@/pages/staff/FundRequestPage';

const StaffRoutes = () => {
  return (
    <Routes>
      <Route element={<StaffLayout />}>
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="scan" element={<CheckInPage />} />
        <Route path="requests" element={<FundRequestPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default StaffRoutes;

