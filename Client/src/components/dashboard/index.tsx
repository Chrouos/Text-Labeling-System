import { useEffect, useState } from 'react';
import BasePageContainer from '../layout/PageContainer';
import {
  Avatar,
  BreadcrumbProps,
  Card,
  Col,
  List,
  Progress,
  Rate,
  Row,
  Table,
  Tag,
  Input,
  Select,
} from 'antd';
import { webRoutes } from '../../routes/web';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';
import { AiOutlineStar, AiOutlineTeam } from 'react-icons/ai';
import Icon from '@ant-design/icons';
import { BiCommentDetail, BiPhotoAlbum } from 'react-icons/bi';
import { MdOutlineArticle, MdOutlinePhoto } from 'react-icons/md';
import { StatisticCard } from '@ant-design/pro-components';
import LazyImage from '../lazy-image';
import { User } from '../../interfaces/models/user';
import http from '../../utils/http';
import { apiRoutes } from '../../routes/api';
import { handleErrorResponse } from '../../utils';
import { Review } from '../../interfaces/models/review';
const { TextArea } = Input;


const breadcrumb: BreadcrumbProps = {
  items: [
    {
      key: webRoutes.dashboard,
      title: <Link to={webRoutes.dashboard}>Dashboard</Link>,
    },
  ],
};

const Dashboard = () => {
  
  const folderPath = './pre-process'; // = 存放檔案的資料夾
  const fileNameList: string[] = [];

  const fileName_filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) {return false; }
    return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
  };
  
  return (
    <BasePageContainer breadcrumb={breadcrumb} transparent={true}>
      <Row gutter={24}>
        
        <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24 }} >
          <Card bordered={false} className="w-full h-full cursor-default">
            <TextArea
              showCount
              style={{ height: 600, resize: 'none' }}
              placeholder="disable resize"
            />
          </Card>
        </Col >

        <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24 }}>
          <Card bordered={false} className="w-full cursor-default">
            <Select className='w-full' showSearch placeholder="Select the File Name"
            optionFilterProp="children"
            filterOption={fileName_filterOption}
            options={[
              {
                value: 'jack',
                label: 'Jack',
              },
              {
                value: 'lucy',
                label: 'Lucy',
              },
              {
                value: 'tom',
                label: 'Tom',
              },
            ]}
          />
          </Card>
        </Col>

      </Row>
    </BasePageContainer>
  );
};

export default Dashboard;


/*

1. 選擇檔案 -> 選擇檔案類型 (jsonLine, jsonFile, line, text) -> 若為 Json 格式選擇欄位，之後顯示行數與內容
2. 建立想要標記的欄位
3. 利用滑鼠選取行數 -> Enter 就是下一個

*/