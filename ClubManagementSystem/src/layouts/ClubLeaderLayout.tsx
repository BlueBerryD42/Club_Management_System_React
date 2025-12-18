import { Outlet, Navigate, useParams } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

const ClubLeaderLayout = () => {
    const { clubId } = useParams<{ clubId: string }>();
    const { isAuthenticated, user } = useAppSelector((s) => s.auth);

    // Not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Must be leader of this club to access
    const isLeaderOfClub = !!user?.memberships?.some(
        (m) => m.clubId === clubId && m.role === 'LEADER' && m.status === 'ACTIVE'
    );

    if (!isLeaderOfClub) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ClubLeaderLayout;
