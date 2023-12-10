import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { webRoutes } from '../../routes/web';

// interface UserState { account: string | null; }
// interface AppState { user?: UserState; }  // 使 user 可選，以防它在某些情況下是未定義的

const Redirect = () => {
  // const account = useSelector((state: AppState) => state.user?.account); // 使用可選鏈
  const storedAccount = sessionStorage.getItem('account');

  if (storedAccount) {
    return <Navigate to={webRoutes.labelData} replace />;
  } else {
    return <Navigate to={webRoutes.login} replace />;
  }
};

export default Redirect;
