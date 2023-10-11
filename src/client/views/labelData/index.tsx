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
  Typography,
  Radio,
  Pagination,
  Progress,
  Modal,
  Spin
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
import { FormItemInputContext } from 'antd/es/form/context';
import { current } from '@reduxjs/toolkit';
import Item from 'antd/es/list/Item';

const { TextArea } = Input;
const { Option } = Select;

// - 定義型態
type FileNameItem = { value: string; label: string; };
type FieldsNameItem = { name: string; value: string; the_surrounding_words: string; regular_expression_match: string, regular_expression_formula: string, gpt_value: string };
type ProcessedContent = { fileName:string, content: string; processed?: FieldsNameItem[]; };
type ModalFormatter = {
  isOpen: boolean;
  title: string;
  ok: { onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void; };
  cancel: { onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void; };
  icon: JSX.Element;
  confirmLoading: boolean;
  message: string;
};


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

  // -------------------------------------------------- Fields Setting 

  const [addLabelForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // @ loading to stop user action.
  const [isLoading, setIsLoading] = useState(false);

  // @ Regular Expression Loading Progress
  const [actionLoading_RE, setActionLoading_RE] = useState(false);
  const [actionLoading_Progress, setActionLoading_Progress] = useState(0);

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

  const [REFormula, setReFormula] = useState<string>("");

  const [isVisible, setIsVisible] = useState<boolean[]>([true, true, true, false, false]);
  const chooseIsVisible = (index: number) => {
    return (event: React.MouseEvent<HTMLElement>) => {
      const newIsVisible = [...isVisible];
      newIsVisible[index] = !newIsVisible[index];
      setIsVisible(newIsVisible);
    };
  }

  const [modal, modalContextHolder] = Modal.useModal();
  const [modalSetting, setModalSetting] = useState<ModalFormatter>({
    isOpen: false, 
    title: "Titles", 
    ok: {
      onClick: () => {console.log("OK!")}
    }, 
    cancel: {
      onClick: () => closeModal()
    }, 
    icon: <CheckOutlined />, 
    confirmLoading: false, 
    message: "This is the default modal setting."
  });
  const closeModal = () => {
    setModalSetting((prevState: ModalFormatter) => ({...prevState, isOpen: false}))
  }
  

  // -------------------------------------------------- API

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

    setIsLoading(true);
    
    const request = {
      fileName: fileName as string,
    }

    defaultHttp.post(apiRoutes.fetchFileContentJson, request)
      .then((response) => {
        setFileContentList(response.data);
        // setProcessContentList(response.data)

        const keysWithoutProcessed = Object.keys(response.data[0]).filter(key => key !== 'processed');
        setFileContentFields(keysWithoutProcessed);
        setFileContentKey(fileContentFields[0])

        setCurrentFileContentJson(response.data[0]); // = 目前檔案內容
        setCurrentFileContentPage(1); 

      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {
        setIsLoading(false); // 加載完成
      });
  }

  const fetchProcessedFileContent = async (fileName: string) => {

    setIsLoading(true); 
    
    const request = {
      fileName: fileName as string,
    }

    defaultHttp.post(apiRoutes.fetchUploadsProcessedFileName, request)
      .then((response) => {
        setProcessContentList(response.data);
        if (response?.data?.[currentFileContentPage - 1]?.processed) {
          setLabelFields(response.data[currentFileContentPage - 1].processed);
        }
      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => { setIsLoading(false); });
  }

  // ----- API -> 上傳擷取檔案
  const uploadProcessedFile = async () => {

    setIsLoading(true);

    const request = {
      fileName: currentFileName,
      content: processContentList
    }

    defaultHttp.post(apiRoutes.uploadProcessedFile, request)
      .then((response) => {
        fetchProcessedFileContent(currentFileName);
       })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {
        setIsLoading(false);
      });
  }

  // ----- API -> 增加欄位
  const addNewLabel_all = async (newLabel: string) => {

    setIsLoading(true);
    
    const request = {
      fileName: currentFileName,
      content:processContentList,
      newLabel: newLabel
    }

    defaultHttp.post(apiRoutes.addNewLabel_all, request)
      .then((response) => { 
        fetchProcessedFileContent(currentFileName);
      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {
        setIsLoading(false);
      });
  }

  // ----- API -> 刪除欄位
  const removeLabel_all = async (labelToRemove: string) => {
    
    setIsLoading(true);
    const request = {
      fileName: currentFileName,
      content:processContentList,
      labelToRemove: labelToRemove
    }

    defaultHttp.post(apiRoutes.removeLabel_all, request)
      .then((response) => {
        fetchProcessedFileContent(currentFileName);
       })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {
        setIsLoading(false);
      });
  }

  // ----- API -> 下載檔案
  const downloadProcessedFile = async () => {

    setIsLoading(true);
    
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
      }).finally(() => { setIsLoading(false); });
  }


  // ----- API -> 刪除檔案
  const deleteFile = async () => {
    
    setIsLoading(true);
    const request = { fileName: currentFileName, }

    defaultHttp.post(apiRoutes.deleteFile, request)
      .then((response) => { 
        fetchFiles();
        setCurrentFileName("");
        setCurrentFileContentDisplay("");
        setFileContentFields([]);
        messageApi.success("刪除成功");
        
      })
      .catch((error) => {
        handleErrorResponse(error);
      }).finally(() => {
        setIsLoading(false);
      });

  }


  // ----- API -> GPT 搜索
  const GPTAction = async() => {

    setIsLoading(true);

    const request = {
      labelFields: labelFields,
      content: currentFileContentDisplay 
    }

    defaultHttp.post(apiRoutes.gptRetrieve, request)
      .then((response) => {

        type respGPTValue = { name: string, gpt_value: string}
        response.data.labelFields.forEach((responseItem: respGPTValue) => {
          labelFields.forEach(labelField => {
            if (labelField.name === responseItem.name) {
              labelField.gpt_value = responseItem.gpt_value;
            }
          });
        });

        const updatedContentList: ProcessedContent[] = [...processContentList];
        if (currentFileContentPage >= 0 && currentFileContentPage < updatedContentList.length) {
          const currentContent = updatedContentList[currentFileContentPage - 1];
          if (currentContent) {
              currentContent.processed = labelFields;
          }
        }
        setProcessContentList(updatedContentList);

      })
      .catch((error) => {})
      .finally(() => { setIsLoading(false); })
  }

    // ----- API -> GPT 全部 搜索
    const GPTAction_all = async() => {

      setIsLoading(true);
  
      const request = {
        content:  processContentList,
        contentKey: fileContentKey
      }

      defaultHttp.post(apiRoutes.gptRetrieve_all, request)
        .then((response) => { 
          type responseList = []
          type responseItem = {name: string, gpt_value: string}
          response.data.map((responseList: responseList, responseListIndex:number) => {
            responseList.map((responseItem: responseItem, responseItemIndex) => {
              processContentList[responseListIndex].processed?.forEach((item, index) => {
                if (item.name === responseItem.name){
                  item.gpt_value = responseItem.gpt_value;
                }
              })  
            })
          });
          setProcessContentList(processContentList)
        })
        .catch((error) => {})
        .finally(() => { setIsLoading(false); })
    }
  
  // -------------------------------------------------- General Functions.

  // ----- 選擇檔案
  const chooseTheFile = (selectedValue: string) => {
    setCurrentFileContentPage(1);
    fetchFileContent(selectedValue);
    fetchProcessedFileContent(selectedValue);
    setCurrentFileName(selectedValue);
    setLabelFields([]);
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

  // ----- handle -> 修改新欄位的 Input
  const handleNewLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLabel(e.target.value);
  };

  // ----- handle -> 修改 re 公式
  const handleREFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReFormula(e.target.value);
  }

  // ----- handle -> 對要擷取內容 HighLight, 並修改相關資訊，送到 Fields Input 中
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
                const the_surrounding_words = match ? match[0] : "";

                return { 
                    ...field, 
                    value: selectedText, 
                    the_surrounding_words: the_surrounding_words,
                };
            }

            return field;
        });
        setLabelFields(updatedLabelFields);

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

  // ----- 換頁
  const changePage = (page: number) => {
    
    const index = page - 1; // 將頁碼轉換為索引 = 原因是因為index從0開始，page從1開始
    setCurrentFileContentPage(page);
    setCurrentFileContentJson(fileContentList[index]);
    setCurrentFileContentDisplay(fileContentList[index][fileContentKey]);
    

    // - 修改 processed List. 
    const clearedLabelFields = labelFields.map(field => ({
      name: field.name,
      value: "",
      the_surrounding_words: "",
      regular_expression_match: "",
      regular_expression_formula: "",
      gpt_value: ""
    }));

    let newClearedLabelFields: FieldsNameItem[] = [...clearedLabelFields]; 
    const processed = processContentList[index]?.processed;
    if (processed) {
      for (let item of processed) {

        // 檢查 clearedLabelFields 是否已經有該項目
        const exists = newClearedLabelFields.some(field => field.name === item.name);
        
        // 如果 clearedLabelFields 中沒有該項目，則新增
        if (!exists) {
          newClearedLabelFields.push({
              ...item
          });
       }
        // 如果 clearedLabelFields 中已有該項目，則覆蓋
        else {
          const indexToUpdate = newClearedLabelFields.findIndex(field => field.name === item.name);
          if (indexToUpdate !== -1) {
            Object.assign(newClearedLabelFields[indexToUpdate], item);
          }
        }
      }
    } 
    
    setLabelFields(newClearedLabelFields);
  }

  const reAction  = () => {

    // - Loading Progress
    setActionLoading_RE(true);
    setActionLoading_Progress(10); // 開始進度條至 10%
    
    const rExp: RegExp = new RegExp(REFormula, 'g');

    // - for - 透過迴圈將每一個 fileContentList 的元素進行擷取
    const newLabelFields = processContentList.map((processContent, index) => {

      const preREContent = fileContentList[index][fileContentKey]
      const match = rExp.exec(preREContent)
      if (processContent['processed'] ) {

        // 搜尋並更新 process 中的適當物件
        processContent['processed'].forEach((field: FieldsNameItem) => {
          if (field.name === currentSelectedNewLabel) {

            field.regular_expression_formula = REFormula;

            if(match) field.regular_expression_match = match[1] || "";
            else field.regular_expression_match = "";
          }
        });
      }

      setActionLoading_Progress(10 + (90 * (index + 1) / processContentList.length)); // 設定進度條根據目前的迴圈狀態
      return processContent;
    });

    async function handleProcessAndUpload() {
      await setProcessContentList(newLabelFields);
      uploadProcessedFile();
    }
  
    handleProcessAndUpload();
    // setActionLoading_RE(false);

  }

  const addItem = (text: string) => {

    setIsLoading(true);

    // - 檢查是否有重複的
    const isExisting = labelFields.some(labelField => labelField.name === text);
    if(isExisting) {
      messageApi.error(`${text} already exists in the list.`);
      setIsLoading(false);
      return;
    }

    // - 確認可儲存
    const newLabel: FieldsNameItem = { 
      name:text, 
      value:"", 
      the_surrounding_words: "", regular_expression_match: "", regular_expression_formula: "",
      gpt_value: ""
    };
    setLabelFields(prevLabelFields => [...prevLabelFields, newLabel]);
    setNewLabel("");
    addNewLabel_all(text);
  };

  // ----- show return.
  const showLabelList = () => {

    const handleDelete = (indexToDelete: number, labelName:string) => {
      const updatedLabelFields = labelFields.filter((_, index) => index !== indexToDelete);
      setLabelFields(updatedLabelFields); 
      removeLabel_all(labelName);
    };
    
    return (
      <>
        {labelFields.map((labelField: FieldsNameItem, index: number) => (
          <div key={index} onClick={() => {
            if(labelField.name == currentSelectedNewLabel) setCurrentSelectedNewLabel("")
            else setCurrentSelectedNewLabel(labelField.name) }} >

            <Form.Item 
              label={
                <span style={{  color: labelField.name === currentSelectedNewLabel ? 'red' : 'black'  }}>
                  {labelField.name}
                </span>
              } 
            >
              <div className='grid grid-cols-12 gap-4'>
                <TextArea value={labelField.value} className="col-span-11" />
                <button onClick={() => handleDelete(index, labelField.name)} type="button"><DeleteOutlined /></button> 
              </div>
            </Form.Item>
          </div>
        ))}
      </>
    );
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight": // 右鍵
        if (currentFileContentPage < fileContentList.length) {
          changePage(currentFileContentPage + 1);
        }
        break;
      case "ArrowLeft": // 左鍵
        if (currentFileContentPage > 1) {
          changePage(currentFileContentPage - 1);
        }
        break;

    }
  };

  
  // useEffect(() => {
  //   window.addEventListener("keydown", handleKeyDown);
  
  //   // 清除事件監聽器
  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, []);
  
  // ----- 進入網頁執行一次
  useEffect(() => {
    fetchFiles();
  }, []);
  
  return (
    <Spin spinning={isLoading} tip="Loading...">

    <BasePageContainer breadcrumb={breadcrumb} transparent={true} 
      extra={ <>
        <Button onClick={chooseIsVisible(0)} className={isVisible[0] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>Uploads</Button>
        <Button onClick={chooseIsVisible(1)} className={isVisible[1] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>Fields</Button>
        <Button onClick={chooseIsVisible(2)} className={isVisible[2] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>Add Label</Button>
        <Button onClick={chooseIsVisible(3)} className={isVisible[3] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>Regular Expression</Button>
        <Button onClick={chooseIsVisible(4)} className={isVisible[4] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>GPT</Button>
      </> } >
      <Row gutter={24}>
        
        <Col xl={14} lg={14} md={14} sm={24} xs={24} style={{ marginBottom: 24 }} >
          <Card bordered={false} className="w-full h-full cursor-default">
          <div className='grid gap-2 mb-4 grid-cols-5'>
            <Pagination 
              className='w-full mb-4 col-span-4' 
              pageSize={1} 
              current={currentFileContentPage} 
              total={fileContentList.length} 
              defaultCurrent={1}
              onChange={(page, pageSize) => changePage(page)}
              simple />

              <Button className="w-full ant-btn-check" disabled={currentFileName == ""} onClick={uploadProcessedFile}>Store</Button>
          </div>

            <TextArea
              className='h-full'
              showCount
              style={{ height: 600, marginBottom: 24 }}
              placeholder="欲標記內容"
              value={currentFileContentDisplay}
              onSelect={handleTextSelection} />

            
          </Card>
        </Col >

        <Col xl={10} lg={10} md={10} sm={24} xs={24} style={{ marginBottom: 24 }}>

          {/* 選擇檔案 + 上傳 */}
          {isVisible[0] && <>
            <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"Uploads"} 
              extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(0)}></Button>}>
                <div className='grid grid-cols-4 gap-4'>
                    <Select className='w-full mb-4 col-span-2' 
                      placeholder="Select the File Name"
                      optionFilterProp="children"
                      filterOption={fileName_filterOption}
                      options={fileNameList}
                      onChange={chooseTheFile}
                      value={currentFileName}
                      showSearch
                      loading={isLoading}
                      />
                    <Button className="w-full ant-btn-check"  icon={<DownloadOutlined />} onClick={downloadProcessedFile}> 
                      <span className="btn-text">Down</span> 
                    </Button>
                    <Button 
                      className="w-full ant-btn-delete"  
                      icon={<DeleteOutlined />} 
                      disabled={!currentFileName}
                      onClick={ () => {
                        setModalSetting((prevState: ModalFormatter) => ({
                          ...prevState,
                          isOpen: true,
                          title: "刪除",
                          ok: {
                            onClick: async () => {
                              await deleteFile();
                              closeModal();
                            }
                          },
                          icon: <DeleteOutlined />,
                          confirmLoading: false,
                          message: "你確定要刪除這個檔案嗎?"
                        }))
                    }} > 
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
            <Card bordered={false} title="Fields" className="w-full cursor-default grid gap-4 mb-4"
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
            <Card bordered={false} title="Add Label" className="w-full cursor-default grid gap-4 mb-4" 
              extra={<p>{currentSelectedNewLabel} <Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(2)}></Button></p>}>
              
                <Form form={addLabelForm} name="dynamic_label_form" >
                  <Form.List name="labels">
                    {(labelFields) => (
                      <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
                        {showLabelList()}

                        <div className='grid grid-cols-2 gap-4'>
                          <Input addonBefore="name" value={newLabel} onChange={handleNewLabelChange} />
                          <Button type="dashed" onClick={() => {addItem(newLabel)}} block disabled={!newLabel} htmlType="submit" > 
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

          { isVisible[3] && <>
            <Card bordered={false} title="Regular Expression" className="w-full cursor-default grid gap-4 mb-4"
              extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(3)}></Button>}>

                <div className='grid gap-2 mb-4 grid-cols-5'>
                  <Input 
                    className='w-full mb-4 col-span-4'
                    addonBefore="/" addonAfter="/g" value={REFormula} onChange={handleREFormulaChange}/>
                  <Button className="w-full ant-btn-action" 
                    disabled={ fileContentKey == "" || fileContentKey == undefined || currentFileName == undefined || currentFileName == "" || currentSelectedNewLabel == "" } 
                    onClick={reAction}>Action</Button>
                </div>
                {actionLoading_RE && <Progress percent={actionLoading_Progress} />}
            </Card>
           </> }

           
          { isVisible[4] && <>
            <Card bordered={false} title="GPT - Retrieve" className="w-full cursor-default grid gap-4 mb-4"
              extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(4)}></Button>}>

              <Button className="w-full ant-btn-action mb-4" onClick={GPTAction} disabled={!currentFileContentDisplay}>current - GPT retrieve</Button>
              <Button className="w-full ant-btn-all_gpt" onClick={GPTAction_all} disabled={!currentFileContentDisplay}>all - GPT retrieve</Button>

            </Card>
           </> }

        </Col>

      </Row>

      <Modal 
        open={modalSetting.isOpen} 
        onCancel={modalSetting.cancel.onClick} 
        title= {<> {modalSetting.icon} {modalSetting.title}</>}
        okButtonProps={{className: "ant-btn-check"}}
        onOk={modalSetting.ok.onClick}
      >
        {modalSetting.message}
      </Modal>

      {contextHolder}

    </BasePageContainer>
    </Spin>
  );
};

export default labelData;

