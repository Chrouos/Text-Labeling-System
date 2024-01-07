import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { webRoutes } from '../../routes/web';
import { Menu, Select } from 'antd';
import { ProLayout, ProLayoutProps } from '@ant-design/pro-components';
import { LogoutOutlined } from '@ant-design/icons';
import { memo, useEffect, useState } from 'react';
import { sidebar } from './sidebar';
import { defaultHttp } from '../../utils/http';
import { loginRoutes } from '../../routes/api';

import { useAccount } from '../../store/accountContext';


type SelectType = { value: string; label: string; };
const Layout = () => {

    const { setAccount } = useAccount();

    const location = useLocation();
    const navigate = useNavigate();
    const storedAccount = sessionStorage.getItem('account');

    const [isOpenChangeAccount, setIsOpenChangeAccount] = useState<Boolean>(false);
    const [accountList, setAccountList] = useState<SelectType[]>([])
    const [currentTempAccount, setCurrentTempAccount] = useState<string>();

    const fetchAccountList = async () => {

        try {
            const response = await defaultHttp.get(loginRoutes.accountList, {},);
            const defaultTempAccount = response.data[1]

            sessionStorage.setItem('temp-account', defaultTempAccount);
            setCurrentTempAccount(defaultTempAccount)

            const newAccountList = response.data.map((account: string) => ({ value: account, label: account }));
            setAccountList(newAccountList)
            
        }
        catch (error) { }
        finally { }
    }

    const chooseAccount = (selectedValue: string) => {
        sessionStorage.setItem('temp-account', selectedValue);
        if (currentTempAccount != selectedValue && selectedValue != null) {
            setCurrentTempAccount(selectedValue);
            setAccount(selectedValue); // 更新 Context
        }
    }

    // -v- Filter - 選擇檔案 
    const accountList_selectedFilterOption = (input: string, option?: { label: string; value: string }) => {
        if (!option) { return false; }
        return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
    };

    useEffect(() => {
        if (storedAccount == 'admin') { setIsOpenChangeAccount(true); fetchAccountList(); }
    }, [])

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
            <>
                {isOpenChangeAccount && 
                    <Select
                        style={{width: '15vh'}}
                        filterOption={accountList_selectedFilterOption}
                        options={accountList}
                        value={currentTempAccount}
                        onChange={chooseAccount}
                    />
                }

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
            </>
        ),
    };


    // -v- 登出邏輯
    const handleLogout = () => {    
        sessionStorage.clear();     // 清除 sessionStorage
        navigate(webRoutes.login);  // 重定向到登入頁面
    };

    return (
        <div className="h-screen">
            <ProLayout {...defaultProps}
                location={location}
                onMenuHeaderClick={() => navigate(webRoutes.home)}
                token={{ sider: { colorMenuBackground: 'white' }, }}

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
