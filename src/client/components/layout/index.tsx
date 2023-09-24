import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { webRoutes } from '../../routes/web';
import { Dropdown } from 'antd';
import { ProLayout, ProLayoutProps } from '@ant-design/pro-components';
import Icon, { LogoutOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
// import { logout } from '../../store/slices/adminSlice';
import { memo } from 'react';
import { sidebar } from './sidebar';
import { apiRoutes } from '../../routes/api';
// import http from '../../utils/http';
// import { handleErrorResponse } from '../../utils';
import { RiShieldUserFill } from 'react-icons/ri';

const Layout = () => {

  const location = useLocation();
  const navigate = useNavigate();

  // = 左邊欄位的 Props.
  const defaultProps: ProLayoutProps = {
    title: CONFIG.appName,
    fixedHeader: true,
    fixSiderbar: true,
    layout: CONFIG.theme.sidebarLayout,
    route: {
      routes: sidebar,
    },
  };

  return (
    <div className="h-screen">
      <ProLayout {...defaultProps} 
        location={location} 
        onMenuHeaderClick={() => navigate(webRoutes.labelData)}
        token={{sider: {colorMenuBackground: 'white'},}}

        menuItemRender={(item, dom) => (
          <a
            onClick={(e) => {
              e.preventDefault();
              item.path && navigate(item.path);
            }}
            href={item.path}
          >
            {dom}
          </a>
        )}
      >
        <Outlet />
      </ProLayout>
    </div>
  );
};

export default memo(Layout);
