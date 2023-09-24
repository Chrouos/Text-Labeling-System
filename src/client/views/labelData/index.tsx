import { useEffect, useState } from 'react';
import BasePageContainer from '../../components/layout/PageContainer';
import {
  BreadcrumbProps,
  Card,
  Col,
  Row,
  Input,
  Select,
  Upload,
  Button,
  Form,
  Space, 
  Typography,
  Radio
} from 'antd';
import { message } from 'antd';
import type { UploadProps } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined, CheckOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';

import { webRoutes } from '../../routes/web';
import { Link } from 'react-router-dom';
import { defaultHttp } from '../../utils/http';
import { apiRoutes } from '../../routes/api';
import { handleErrorResponse } from '../../utils';
import './index.css'

const { TextArea } = Input;

// - 定義型態
type FileNameItem = { value: string; label: string; };
type FieldsNameItem = { name: string; value: string; };


// - 頁面順序
const breadcrumb: BreadcrumbProps = {
  items: [
    {
      key: webRoutes.labelData,
      title: <Link to={webRoutes.labelData}>標記資料</Link>,
    },
  ],
};


const labelData = () => {

  const [addLabelForm] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();
  const [fileNameList, setFileNameList] = useState<FileNameItem[]>([]);
  const [fileContentList, setFileContentList] = useState([]);
  const [fileContentFields, setFileContentFields] = useState<string[]>([]); // = 目前檔案的 所有欄位名稱
  const [fileContentKey, setFileContentKey] = useState<string>(""); // = 目前選擇的欄位
  
  const [currentFileContentNumber, setCurrentFileContentNumber] = useState(0);
  const [currentFileContentJson, setCurrentFileContentJson] = useState<Record<string, any>>({});
  const [currentFileContentDisplay, setCurrentFileContentDisplay] = useState<string>("");

  const [newLabel, setNewLabel] = useState<string>("") // = 新增的欄位名稱.
  const [labelFields, setLabelFields] = useState<FieldsNameItem[]>([]); // = 已新增的欄位 Fields.

  // ----- API -> 抓取在 uploads/files 裡面的資料名稱
  const fetchFiles = async () => {
    defaultHttp.get(apiRoutes.fetchUploadsFileName, {})
      .then((response) => {
        const newFileNames = response.data.map((fileName: string) => ({ value: fileName, label: fileName }));
        setFileNameList(newFileNames);
      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {});
  }
  
  // ----- API - >抓取指定 fileName 的內容 -> Json
  const fetchFileContent = async (fileName: string) => {
    
    const request = {
      fileName: fileName as string,
    }

    defaultHttp.post(apiRoutes.fetchFileContentJson, request)
      .then((response) => {
        setFileContentList(response.data);

        setFileContentFields(Object.keys(response.data[0]));
        setFileContentKey(fileContentFields[0])

        setCurrentFileContentJson(response.data[0]); // = 目前檔案內容
        setCurrentFileContentNumber(0);
        
      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {});
  }

  // ----- 選擇檔案
  const chooseTheFile = (selectedValue: string) => {
    fetchFileContent(selectedValue);
  }


  // ----- 上傳檔案的資料
  const uploadFileProps: UploadProps = {
    name: 'file',
    beforeUpload: (file: UploadFile) => {
      const isTxt = file.type === 'text/plain';
      if (!isTxt) { messageApi.error(`${file.name} is not a "txt" file`); }
  
      const isFileNameExisting = fileNameList.some(entry => entry.value === file.name);
      console.log(isFileNameExisting, isTxt)
      
      if (isFileNameExisting) {
        messageApi.error(`${file.name} already exists in the list.`);
      }
  
      return isTxt && !isFileNameExisting;
    },
    action: apiRoutes.uploadTheFile,
    method: 'POST',

    onChange(info) {
      if (info.file.status === 'done') {
        fetchFiles();
        messageApi.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        messageApi.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  const fileName_filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) { return false; }
    return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLabel(e.target.value);
  };

  const addLabel = (text: string) => {

    // - 檢查是否有重複的
    const isExisting = labelFields.some(labelField => labelField.name === text);
    if(isExisting) {
      messageApi.error(`${text} already exists in the list.`);
      return;
    }

    // - 確認可儲存
    const newLabel: FieldsNameItem = { name:text, value:text };
    setLabelFields(prevLabelFields => [...prevLabelFields, newLabel]);
    setNewLabel("");
  };

  // ----- show return.
  const showLabelList = () => {
    return labelFields.map((labelField: FieldsNameItem, index: number) => (
      <Form.Item label={labelField.name} name={labelField.name} key={index}>
        <Input />
      </Form.Item>
    ));
  }
  
  // ----- 進入網頁執行一次
  useEffect(() => {
    fetchFiles();
  }, []);
  
  return (
    <BasePageContainer breadcrumb={breadcrumb} transparent={true}>
      <Row gutter={24}>
        
        <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24 }} >
          <Card bordered={false} className="w-full h-full cursor-default">
            <TextArea
              showCount
              style={{ height: 600, resize: 'none' }}
              placeholder="欲標記內容"
              value={currentFileContentDisplay}
            />
          </Card>
        </Col >

        <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24 }}>

          {/* 選擇檔案 + 上傳 */}
          <Card bordered={false} title=" 選擇檔案 or 上傳" className="w-full cursor-default grid gap-4 mb-4">
            <div className='grid grid-cols-5 gap-4'>
              <Select className='w-full mb-4 col-span-3' 
                placeholder="Select the File Name"
                optionFilterProp="children"
                filterOption={fileName_filterOption}
                options={fileNameList}
                onChange={chooseTheFile}
                showSearch 
              />
              <Button className="w-full ant-btn-check"  icon={<CheckOutlined />} > 
                <span className="btn-text">Check</span> 
              </Button>
              <Button className="w-full ant-btn-delete"  icon={<DeleteOutlined />} > 
                <span className="btn-text">Delete</span> 
              </Button>
            </div>

            <Upload maxCount={1} {...uploadFileProps}  >
              <Button type="dashed" className="w-full" danger icon={<UploadOutlined />}> Click to Upload </Button>
              {/* // ! 目前有名字太長跑板問題  */}
            </Upload>
          </Card>

          {/* 選擇欄位 */}
          <Card bordered={false} title="選擇欄位" className="w-full cursor-default grid gap-4 mb-4">
            <Radio.Group defaultValue={fileContentFields[0] || ""}
                onChange={(e) => {
                    const selectedKey = e.target.value;
                    setFileContentKey(selectedKey);
                    setCurrentFileContentDisplay(currentFileContentJson[selectedKey]);
                }}
            >
                {
                    fileContentFields.map((field, index) => (
                        <Radio.Button key={index} value={field}>
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                        </Radio.Button>
                    ))
                }
            </Radio.Group>
          </Card>

          {/* 新增欄位 */}
          <Card bordered={false} title="新增欄位" className="w-full cursor-default grid gap-4 mb-4">
            <Form form={addLabelForm} name="dynamic_label_form" >
              <Form.List name="labels">
                {(labelFields) => (
                  <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
                    {showLabelList()}

                    <div className='grid grid-cols-2 gap-4'>
                      <Input addonBefore="name" value={newLabel} onChange={handleChange}/>
                      <Button type="dashed" onClick={() => {addLabel(newLabel)}} block disabled={!newLabel}> 
                        + Add Item 
                      </Button>
                    </div>
                  </div>
                )}
              </Form.List>

              <Form.Item noStyle shouldUpdate>
                {() => (
                  <Typography>
                    <pre>{JSON.stringify(addLabelForm.getFieldsValue(), null, 2)}</pre>
                  </Typography>
                )}
              </Form.Item>
            </Form>
          </Card>

        </Col>

      </Row>

      {contextHolder}
    </BasePageContainer>
  );
};

export default labelData;


/*

1. 選擇檔案 -> 選擇檔案類型 (jsonLine, jsonFile, line, text) -> 若為 Json 格式選擇欄位，之後顯示行數與內容
2. 建立想要標記的欄位
3. 利用滑鼠選取行數 -> Enter 就是下一個

*/