import { createBrowserRouter } from 'react-router-dom';

import ErrorPage from '../components/errorPage';
import NotFoundPage from '../components/notfoundPage';
import Redirect from '../components/layout/Redirect';
import Layout from '../components/layout';
import ProgressBar from '../components/loader/progressBar';
import loadable from '@loadable/component';

import { webRoutes } from './web';

const errorElement = <ErrorPage />;
const fallbackElement = <ProgressBar />;

const LabelData = loadable(() => import('../views/labelData'), {
  fallback: fallbackElement,
});
const CompareData = loadable(() => import('../views/compareData'), {
  fallback: fallbackElement,
});
const Login = loadable(() => import('../views/login'), {
  fallback: fallbackElement,
});

const storedAccount = sessionStorage.getItem('account');

export const browserRouter = createBrowserRouter([

  { 
    path: webRoutes.home,
    element: <Redirect />,
    errorElement: errorElement,
  },

  { 
    path: webRoutes.login,
    element: <Login />,
    errorElement: errorElement,
  },

  {
    element: (
      <Layout />
    ),
    errorElement: errorElement,
    children: [
      {
        path: webRoutes.labelData,
        element: <LabelData />,
      },
      {
        path: webRoutes.compareData,
        element: <CompareData />,
      },
    ],
  },

  // 404
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: errorElement,
  },
]);