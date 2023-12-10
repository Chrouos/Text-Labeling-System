import { 
    Input,
    Button,
    Form,
    Card,
    message
} from 'antd';

import { loginRoutes } from '../../routes/api';
import { defaultHttp } from '../../utils/http';
import { handleErrorResponse } from '../../utils';
import { useNavigate } from 'react-router-dom';


import './index.css'
import CustomFormItem from './customFormItem';
import { useState } from 'react';
import { webRoutes } from '../../routes/web';

const login = () => {

    // -------------------------------------------------- Fields Settings
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();

    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");

    // -------------------------------------------------- API Settings
    // ----- API -> 確認帳號密碼是否存在
    const isLogin = async () => {
        const request = {
            account: account,
            password: password
        }
        defaultHttp.post(loginRoutes.checkAccountExist, request)
        .then((response) => {

            if (response.data.exists) {
                messageApi.success("登入成功");
                sessionStorage.setItem('account', account);
                navigate(webRoutes.labelData)
            }
            else {
                sessionStorage.setItem('account', '');
                messageApi.error("登入失敗");
            }
        })
        .catch((error) => {
            handleErrorResponse(error);
        }).finally(() => {});
    }

    // -------------------------------------------------- Other Functions

    // - 更新帳號密碼
    interface LoginFormValues { account: string; password: string; }
    const onFormValuesChange = (allValues:LoginFormValues) => {
        setAccount(allValues.account || account);
        setPassword(allValues.password || password);
    };

    return (
        <div className='containerStyle'>
            <Card bordered={false} className="cardStyle" bodyStyle={{height: '100%', width: '100%'}}>
                <Form 
                    className='formStyle'  
                    onValuesChange={onFormValuesChange} >
                    <div className=''>
                        <CustomFormItem
                            label="帳號"
                            name="account"
                            rules={[{ required: true, message: '帳號不能空白！' }]}
                        />
                        
                        <CustomFormItem
                            label="密碼"
                            name="password"
                            rules={[{ required: true, message: '密碼不能空白！' }]}
                            inputType="password"
                        />
                    </div>
                    
                    <div >
                        <Form.Item style={{textAlign: 'center'}}>
                            <Button style={{ height: '50px', width: '80px' }} htmlType="submit" onClick={isLogin}>登入</Button>
                        </Form.Item>   
                    </div>
                </Form>
            </Card>


            {contextHolder}
        </div>
    )
};

export default login;

