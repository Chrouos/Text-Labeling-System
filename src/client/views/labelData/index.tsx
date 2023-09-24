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
  Radio,
  Pagination
} from 'antd';
import { message } from 'antd';
import type { UploadProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined, CheckOutlined, DeleteOutlined, CloseOutlined, DownloadOutlined, DownOutlined, UpOutlined} from '@ant-design/icons';
import Highlighter from "react-highlight-words";

import { webRoutes } from '../../routes/web';
import { Link } from 'react-router-dom';
import { defaultHttp } from '../../utils/http';
import { apiRoutes } from '../../routes/api';
import { handleErrorResponse } from '../../utils';
import './index.css'

const { TextArea } = Input;
const { Option } = Select;

// - 定義型態
type FileNameItem = { value: string; label: string; };
type FieldsNameItem = { name: string; value: string; };
type ProcessedContent = { fileName:string, content: string; processed?: FieldsNameItem[]; };


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
  const [currentFileName, setCurrentFileName] = useState<string>("");

  const [fileContentFields, setFileContentFields] = useState<string[]>([]); // = 目前檔案的 所有欄位名稱
  const [fileContentKey, setFileContentKey] = useState<string>(""); // = 目前選擇的欄位
  const [fileContentList, setFileContentList] = useState([]); // = 原始檔案內容
  const [processContentList, setProcessContentList] = useState<ProcessedContent[]>([]); // = 擷取後的檔案
  
  const [currentFileContentPage, setCurrentFileContentPage] = useState(1);
  const [currentFileContentJson, setCurrentFileContentJson] = useState<Record<string, any>>({});
  const [currentFileContentDisplay, setCurrentFileContentDisplay] = useState<string>("");

  const [newLabel, setNewLabel] = useState<string>("") // = 新增的欄位名稱.
  const [labelFields, setLabelFields] = useState<FieldsNameItem[]>([]); // = 已新增的欄位 Fields.
  const [currentSelectedNewLabel, setCurrentSelectedNewLabel] = useState<string>(""); // = 選擇的新欄位

  const [isVisible, setIsVisible] = useState<boolean[]>([true, true, true]);
  const chooseIsVisible = (index: number) => {
    return (event: React.MouseEvent<HTMLElement>) => {
      const newIsVisible = [...isVisible];
      newIsVisible[index] = !newIsVisible[index];
      setIsVisible(newIsVisible);
    };
  }
  
  

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
  
  // ----- API -> 抓取指定 fileName 的內容 -> Json
  const fetchFileContent = async (fileName: string) => {
    
    const request = {
      fileName: fileName as string,
    }

    defaultHttp.post(apiRoutes.fetchFileContentJson, request)
      .then((response) => {
        setFileContentList(response.data);
        // setProcessContentList(response.data)

        setFileContentFields(Object.keys(response.data[0]));
        setFileContentKey(fileContentFields[0])

        setCurrentFileContentJson(response.data[0]); // = 目前檔案內容
        setCurrentFileContentPage(1); 
        
      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {});
  }

  const fetchProcessedFileContent = async (fileName: string) => {
    
    const request = {
      fileName: fileName as string,
    }

    defaultHttp.post(apiRoutes.fetchUploadsProcessedFileName, request)
      .then((response) => {
        setProcessContentList(response.data);
        setLabelFields(response.data[0].processed || [])
      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {});
  }

  // ----- API -> 上傳擷取檔案
  const uploadProcessedFile = async () => {
    
    const request = {
      fileName: currentFileName,
      content:processContentList
    }

    defaultHttp.post(apiRoutes.uploadProcessedFile, request)
      .then((response) => { })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {});
  }

    // ----- API -> 下載檔案
    const downloadProcessedFile = async () => {
    
      const request = {
        fileName: currentFileName,
      }
  
      defaultHttp.post(apiRoutes.downloadProcessedFile, request)
        .then((response) => {

            console.log(response)

            // - 假設 response.data 為 binary
            const blob = new Blob([response.data], { type: 'application/octet-stream' }); // 請根據你的檔案類型調整 MIME 類型
            const url = URL.createObjectURL(blob);

            // - 創建一個 <a> 標籤來觸發檔案下載
            const a = document.createElement('a');
            a.href = url;

            // - 增加下載時間
            const contentDisposition = response.headers['content-disposition'];
            let fileName = currentFileName;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?$/);
                if (match && match[1]) {
                    fileName = match[1];
                }
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // - 釋放 URL
            URL.revokeObjectURL(url);

         })
        .catch((error) => {
          handleErrorResponse(error);
        }).finally(() => {});
    }


  // ----- API -> 刪除檔案
  const deleteFile = async () => {
    
    const request = { fileName: currentFileName, }

    defaultHttp.post(apiRoutes.deleteFile, request)
      .then((response) => { 
        fetchFiles();
        setCurrentFileName("");
        messageApi.success("刪除成功");

      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {});
  }
    

  // ----- 選擇檔案
  const chooseTheFile = (selectedValue: string) => {
    fetchFileContent(selectedValue);
    fetchProcessedFileContent(selectedValue);
    setCurrentFileName(selectedValue);
  }

  // ----- 上傳檔案的資料
  const uploadFileProps: UploadProps = {
    name: 'file',
    beforeUpload: (file: UploadFile) => {
      const isTxt = file.type === 'text/plain';
      if (!isTxt) { messageApi.error(`${file.name} is not a "txt" file`); }
  
      const isFileNameExisting = fileNameList.some(entry => entry.value === file.name);
      
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

  // ----- 修改新欄位的 Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLabel(e.target.value);
  };

  // ----- 對要擷取內容 HighLight, 並修改相關資訊，送到 Fields Input 中
  const handleTextSelection = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

    if (selectedText) {
      
        const updatedLabelFields = labelFields.map(field => {
            if (field.name === currentSelectedNewLabel) {

                // 使用正規表示法擷取前後文
                const surroundingText = textarea.value.slice(Math.max(0, textarea.selectionStart - 50), textarea.selectionEnd + 50);
                const regex = new RegExp(`([^，。、]*[，。、]*[^，。、]*${selectedText}[^，。、]*[，。、]*[^，。、]*)`);
                const match = surroundingText.match(regex);
                const regular_expression = match ? match[0] : "";

                return { 
                    ...field, 
                    value: selectedText, 
                    regular_expression: regular_expression 
                };
            }
            return field;
        });
        setLabelFields(updatedLabelFields || []);

        // - 更新 processContentList[currentFileContentPage] 的內容
        const updatedProcessContentList = [...processContentList];
        const currentContent = updatedProcessContentList[currentFileContentPage-1];
        updatedProcessContentList[currentFileContentPage-1] = {
            ...currentContent,
            processed: updatedLabelFields
        };
        setProcessContentList(updatedProcessContentList); 
    }
  } 


  const changePage = (page: number) => {
    const index = page - 1; // 將頁碼轉換為索引
    setCurrentFileContentPage(page);
    setCurrentFileContentJson(fileContentList[index]);
    setCurrentFileContentDisplay(fileContentList[index][fileContentKey]);
    uploadProcessedFile();

    
    const clearedLabelFields = labelFields.map(field => ({
      ...field,
      value: ""
    }));
  
    setLabelFields(processContentList[index].processed || clearedLabelFields);
  
  }


  const addLabel = (text: string) => {

    // - 檢查是否有重複的
    const isExisting = labelFields.some(labelField => labelField.name === text);
    if(isExisting) {
      messageApi.error(`${text} already exists in the list.`);
      return;
    }

    // - 確認可儲存
    const newLabel: FieldsNameItem = { name:text, value:"" };
    setLabelFields(prevLabelFields => [...prevLabelFields, newLabel]);
    setNewLabel("");
  };

  // ----- show return.
  const showLabelList = () => {

    const handleDelete = (indexToDelete: number) => {
      const updatedLabelFields = labelFields.filter((_, index) => index !== indexToDelete);
      setLabelFields(updatedLabelFields); 
    };
    
    return (
      <>
        {labelFields.map((labelField: FieldsNameItem, index: number) => (
          <div key={index} onClick={() => setCurrentSelectedNewLabel(labelField.name)} >
            <Form.Item 
              label={
                <span style={{  color: labelField.name === currentSelectedNewLabel ? 'red' : 'black'  }}>
                  {labelField.name}
                </span>
              } 
            >
              <div className='grid grid-cols-12 gap-4'>
                <TextArea value={labelField.value} className="col-span-11" />
                <button onClick={() => handleDelete(index)}><DeleteOutlined /></button> 
              </div>
            </Form.Item>
          </div>
        ))}
      </>
    );
  }

  
  // ----- 進入網頁執行一次
  useEffect(() => {
    fetchFiles();
  }, []);
  
  return (
    <BasePageContainer breadcrumb={breadcrumb} transparent={true} 
      extra={ <>
        <Button onClick={chooseIsVisible(0)} className={isVisible[0] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>選擇檔案</Button>
        <Button onClick={chooseIsVisible(1)} className={isVisible[1] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>選擇欄位</Button>
        <Button onClick={chooseIsVisible(2)} className={isVisible[2] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>新增欄位</Button>
      </> } >
      <Row gutter={24}>
        
        <Col xl={14} lg={14} md={14} sm={24} xs={24} style={{ marginBottom: 24 }} >
          <Card bordered={false} className="w-full h-full cursor-default">
          <Pagination 
            className='mb-4' 
            pageSize={1} 
            current={currentFileContentPage} 
            total={fileContentList.length} 
            defaultCurrent={1}
            onChange={(page, pageSize) => changePage(page)}
            simple />

            <TextArea
              className='h-full'
              showCount
              style={{ height: 500, marginBottom: 24 }}
              placeholder="欲標記內容"
              value={currentFileContentDisplay}
              onSelect={handleTextSelection} />
          </Card>
        </Col >

        <Col xl={10} lg={10} md={10} sm={24} xs={24} style={{ marginBottom: 24 }}>

          {/* 選擇檔案 + 上傳 */}
          {isVisible[0] && <>
            <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"選擇檔案 or 上傳"} 
              extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(0)}></Button>}>
                <div className='grid grid-cols-4 gap-4'>
                    <Select className='w-full mb-4 col-span-2' 
                      placeholder="Select the File Name"
                      optionFilterProp="children"
                      filterOption={fileName_filterOption}
                      options={fileNameList}
                      onChange={chooseTheFile}
                      value={currentFileName}
                      showSearch  />
                    <Button className="w-full ant-btn-check"  icon={<DownloadOutlined />} onClick={downloadProcessedFile}> 
                      <span className="btn-text">Down</span> 
                    </Button>
                    <Button className="w-full ant-btn-delete"  icon={<DeleteOutlined />} onClick={deleteFile} > 
                      <span className="btn-text">Delete</span> 
                    </Button>
                </div>
                <Upload maxCount={1} {...uploadFileProps}  >
                  <Button type="dashed" className="w-full" danger icon={<UploadOutlined />}> Click to Upload </Button>
                  {/* // ! 目前有名字太長跑板問題  */}
                </Upload>
            </Card>
          </> }

          {/* 選擇欄位 */}
          { isVisible[1] && <>
            <Card bordered={false} title="選擇欄位" className="w-full cursor-default grid gap-4 mb-4"
              extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(1)}></Button>}>
            
              <Radio.Group defaultValue={fileContentFields[0] || ""}
                  onChange={(e) => {
                      const selectedKey = e.target.value;
                      setFileContentKey(selectedKey);
                      setCurrentFileContentDisplay(currentFileContentJson[selectedKey]);
                  }}>
                  {
                      fileContentFields.map((field, index) => (
                          <Radio.Button key={index} value={field}>
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                          </Radio.Button>
                      ))
                  }
              </Radio.Group>
           
            </Card>
           </> }

          {/* 新增欄位 */}
          { isVisible[2] && <>
            <Card bordered={false} title="新增欄位" className="w-full cursor-default grid gap-4 mb-4" 
              extra={<p>{currentSelectedNewLabel} <Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(2)}></Button></p>}>
              
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

                  <Form.Item noStyle shouldUpdate >
                    {() => (
                      <Typography>
                        <pre>{JSON.stringify(labelFields, null, 2)}</pre>
                      </Typography>

                    )}
                  </Form.Item>

                </Form>
            </Card>
          </> }

        </Col>

      </Row>

      {contextHolder}

    </BasePageContainer>
  );
};

export default labelData;

