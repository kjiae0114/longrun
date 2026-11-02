import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorPage } from './pages/ErrorPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { NewPlayPage, PlayStagePage } from './pages/PlayEditorPages';
import { TrashPage } from './pages/TrashPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'plays/new', element: <NewPlayPage /> },
          { path: 'plays/:id/stages/:stage', element: <PlayStagePage /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'trash', element: <TrashPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
