import type { RouteObject } from 'react-router-dom';
import ClubLeaderLayout from '@/layouts/ClubLeaderLayout';
import Dashboard from '@/pages/clubleader/Dashboard';
import Settings from '@/pages/clubleader/Settings';
import MemberManagement from '@/pages/clubleader/MemberManagement';
import EventManagement from '@/pages/clubleader/EventManagement';
import JoinRequests from '@/pages/clubleader/JoinRequests';
import EventAttendees from '@/pages/clubleader/EventAttendees';
import EventDetailManagement from '@/pages/clubleader/EventDetailManagement';
import FeeManagement from '@/pages/clubleader/FeeManagement';

const ClubLeaderRoutes: RouteObject = {
    path: '/club-leader/:clubId',
    element: (
        <ClubLeaderLayout />
    ),
    children: [
        {
            path: 'dashboard',
            element: <Dashboard />,
        },
        {
            path: 'settings',
            element: <Settings />,
        },
        {
            path: 'members',
            element: <MemberManagement />,
        },
        {
            path: 'events',
            element: <EventManagement />,
        },
        {
            path: 'events/:eventId/manage',
            element: <EventDetailManagement />,
        },
        {
            path: 'events/:eventId/attendees',
            element: <EventAttendees />,
        },
        {
            path: 'requests',
            element: <JoinRequests />,
        },
        {
            path: 'fees',
            element: <FeeManagement />,
        },
    ],
};

export default ClubLeaderRoutes;
