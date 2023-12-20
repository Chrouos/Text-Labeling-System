import { createBrowserRouter } from 'react-router-dom';

import ErrorPage from '../components/errorPage';
import NotFoundPage from '../components/notfoundPage';
import Redirect from '../components/layout/Redirect';
import Layout from '../components/layout';
import ProgressBar from '../components/loader/progressBar';
import loadable from '@loadable/component';

import { Navigate } from 'react-router-dom';
import { webRoutes } from './web';
import React, { ComponentType, FC } from 'react';

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

// 高階組件，用於檢查存儲賬號
const withAuth = <P extends object>(Component: ComponentType<P>): FC<P> => {
  return (props: P) => {
    const storedAccount = sessionStorage.getItem('account');
    if (!storedAccount) {
      // 如果沒有賬號，重定向到登入頁面
      return <Navigate to={webRoutes.login} replace />;
    }
    // 否則渲染傳入的組件
    return <Component {...props} />;
  };
};

// 使用高階組件包裝您的頁面組件
const LabelDataProtected = withAuth(LabelData);
const CompareDataProtected = withAuth(CompareData);

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
        element: <LabelDataProtected />,
      },
      {
        path: webRoutes.compareData,
        element: <CompareDataProtected />,
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