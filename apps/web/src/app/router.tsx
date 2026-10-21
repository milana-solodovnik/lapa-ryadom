import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout.js';
import { NeedsPage } from '../pages/NeedsPage.js';
import { NeedDetailPage } from '../pages/NeedDetailPage.js';
import { SheltersPage } from '../pages/SheltersPage.js';
import { ShelterDetailPage } from '../pages/ShelterDetailPage.js';
import { OfferResultPage } from '../pages/OfferResultPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { ShelterDashboard } from '../pages/ShelterDashboard.js';
import { ShelterReceivePage } from '../pages/ShelterReceivePage.js';
import { AdminPage } from '../pages/AdminPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/needs" replace /> },
      { path: 'needs', element: <NeedsPage /> },
      { path: 'needs/:needId', element: <NeedDetailPage /> },
      { path: 'shelters', element: <SheltersPage /> },
      { path: 'shelters/:shelterId', element: <ShelterDetailPage /> },
      { path: 'offer/result', element: <OfferResultPage /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'shelter',
        element: <ShelterDashboard />,
      },
      { path: 'shelter/receive', element: <ShelterReceivePage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
