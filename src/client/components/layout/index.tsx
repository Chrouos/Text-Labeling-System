import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { webRoutes } from '../../routes/web';
import { Dropdown, Menu } from 'antd';
import { ProLayout, ProLayoutProps } from '@ant-design/pro-components';
import Icon, { LogoutOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
// import { logout } from '../../store/slices/adminSlice';
import { memo } from 'react';
import { sidebar } from './sidebar';
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
    rightContentRender: () => (
      <Menu mode="horizontal" items={[
        {
          key: 'logout',
          label: (
            <>
              <LogoutOutlined />
              登出
            </>
          ),
          onClick: handleLogout,
        },
      ]}>
      </Menu>
    ),
  };

  const handleLogout = () => {
    // 登出邏輯...
    sessionStorage.clear(); // 例如清除 sessionStorage
    navigate(webRoutes.login); // 重定向到登入頁面
  };


  return (
    <div className="h-screen">
      <ProLayout {...defaultProps} 
        location={location} 
        onMenuHeaderClick={() => navigate(webRoutes.home)}
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
