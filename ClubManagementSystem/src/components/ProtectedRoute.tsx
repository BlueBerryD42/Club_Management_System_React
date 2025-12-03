import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children?: ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);
    const location = useLocation();

    // Check if user is authenticated (token exists in store/persist)
    if (!isAuthenticated || !token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check for role-based access
    if (allowedRoles && allowedRoles.length > 0 && user) {
        const hasPermission = allowedRoles.includes(user.role);
        if (!hasPermission) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
