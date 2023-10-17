import { webRoutes } from '../../routes/web';
import { BiHomeAlt2 } from 'react-icons/bi';
import Icon, { UserOutlined, AimOutlined } from '@ant-design/icons';

export const sidebar = [
  {
    path: webRoutes.labelData,
    key: webRoutes.labelData,
    name: '標記資料',
    icon: <Icon component={BiHomeAlt2} />,
  },
  {
    path: webRoutes.compareData,
    key: webRoutes.compareData,
    name: '轉換資料',
    icon: <AimOutlined />,
  },
  // {
  //   path: webRoutes.about,
  //   key: webRoutes.about,
  //   name: 'About',
  //   icon: <InfoCircleOutlined />,
  // },
];
