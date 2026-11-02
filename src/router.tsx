import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AllPlaysPage } from './pages/AllPlaysPage';
import { ErrorPage } from './pages/ErrorPage';
import { HistoryDetailPage } from './pages/HistoryDetailPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { NewPlayPage, PlayEditPage, PlayStagePage } from './pages/PlayEditorPages';
import { TrashDetailPage } from './pages/TrashDetailPage';
import { TrashPage } from './pages/TrashPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'plays', element: <AllPlaysPage /> },
          { path: 'plays/new', element: <NewPlayPage /> },
          { path: 'plays/:id/stages/:stage', element: <PlayStagePage /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'history/:id', element: <HistoryDetailPage /> },
          { path: 'history/:id/edit/:stage', element: <PlayEditPage /> },
          { path: 'trash', element: <TrashPage /> },
          { path: 'trash/:id', element: <TrashDetailPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
