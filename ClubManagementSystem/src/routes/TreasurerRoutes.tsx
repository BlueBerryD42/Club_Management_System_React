import type { RouteObject } from 'react-router-dom';
import TreasurerLayout from '@/layouts/TreasurerLayout';
import Dashboard from '@/pages/treasurer/Dashboard';
import PendingFundRequestsPage from '@/pages/treasurer/PendingFundRequestsPage';
import FundRequestDetailPage from '@/pages/treasurer/FundRequestDetailPage';
import LedgerPage from '@/pages/treasurer/LedgerPage';
import TransactionsPage from '@/pages/treasurer/TransactionsPage';
import ReportsPage from '@/pages/treasurer/ReportsPage';

const TreasurerRoutes: RouteObject = {
    path: '/treasurer/:clubId',
    element: <TreasurerLayout />,
    children: [
        {
            path: 'dashboard',
            element: <Dashboard />,
        },
        {
            path: 'fund-requests',
            element: <PendingFundRequestsPage />,
        },
        {
            path: 'fund-requests/:eventId',
            element: <FundRequestDetailPage />,
        },
        {
            path: 'ledger',
            element: <LedgerPage />,
        },
        {
            path: 'transactions',
            element: <TransactionsPage />,
        },
        {
            path: 'reports',
            element: <ReportsPage />,
        },
    ],
};

export default TreasurerRoutes;





