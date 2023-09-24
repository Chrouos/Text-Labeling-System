import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { webRoutes } from '../../routes/web';

const Redirect = () => {

  return ( 
    <Navigate to={webRoutes.labelData } replace />
  );
};

export default Redirect;
