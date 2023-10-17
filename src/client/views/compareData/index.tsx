import { useEffect, useState } from 'react';
import {
  Spin,
  Card,
  Row,
  Col,
  Button,
  Select,
  Pagination,
  Input,
  Typography
} from 'antd';

import { handleErrorResponse } from '../../utils';
import { defaultHttp } from '../../utils/http';
import { apiRoutes } from '../../routes/api';
import './index.css'


// - 定義類型
type SelectType = { value: string; label: string; };
type ProcessedContentType = { fileName:string, content: string; processed?: ProcessedFieldsType[]; };
type ProcessedFieldsType = { name: string; value: string; the_surrounding_words: string; regular_expression_match: string, regular_expression_formula: string, gpt_value: string };

const compareData = () => {

    // -------------------------------------------------- Fields Settings

    // - Global Settings
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState<boolean[]>([true, true, true, false, false]);
    const chooseIsVisible = (index: number) => {
      return (event: React.MouseEvent<HTMLElement>) => {
        const newIsVisible = [...isVisible];
        newIsVisible[index] = !newIsVisible[index];
        setIsVisible(newIsVisible);
      };
    }
    
    // - File List
    const [filesNameList, setFilesNameList] = useState<SelectType[]>([]);
    const [currentFileName, setCurrentFileName] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const readTheCurrentPage = (page: number) => {
        const fileIndex = (page > 0) ? page - 1 : 0;
        return fileIndex;
    }

    // - Processed Content
    const [processContentList, setProcessContentList] = useState<ProcessedContentType[]>([]); 
    const [processedFields, setProcessedFields] = useState<ProcessedFieldsType[]>([]); 

    // - Processed Fields
    const [processedFieldsLabelList, setProcessedFieldsLabelList] = useState<SelectType[]>([])
    const [currentFieldsLabel, setCurrentFieldsLabel] = useState<string>("");
    const [formattersMethodList, ] = useState<SelectType[]>([
        { label: "轉換為金錢(Integer)", value: "number" },
        { label: "轉換為民國(YYY-mm)", value: "ROC" },
    ]);
    const [currentFormatterMethod, setCurrentFormatterMethod] = useState<string>("");

    // -------------------------------------------------- API Settings

    // ----- API -> 抓取在 uploads/files 裡面的資料名稱
    const fetchFilesName = async () => {
        defaultHttp.get(apiRoutes.fetchUploadsFileName, {})
        .then((response) => {
            const newFileNames = response.data.map((fileName: string) => ({ value: fileName, label: fileName }));
            setFilesNameList(newFileNames);
        })
        .catch((error) => {
            handleErrorResponse(error);
        }).finally(() => {});
    }

    // ----- API -> 讀取 processed 的內容
    const fetchProcessedFileContent = async (fileName: string) => {

        setIsLoading(true); 
        const request = {
            fileName: fileName as string,
        }
    
        defaultHttp.post(apiRoutes.fetchUploadsProcessedFileName, request)
        .then((response) => {
            setProcessContentList(response.data);
            if (response?.data?.[readTheCurrentPage(currentPage)]?.processed) {
                const processedData = response.data[readTheCurrentPage(currentPage)].processed;
                const processedFieldsLabel = processedData.map((item:ProcessedFieldsType) => ({
                    value: item.name,
                    label: item.name
                }));
  
                setProcessedFields(processedData);
                setProcessedFieldsLabelList(processedFieldsLabel);
            }
        })
        .catch((error) => {
            handleErrorResponse(error);
        }).finally(() => { setIsLoading(false); });
    }

    // ----- API -> 轉換格式
    const updateFormatters = async () => {

        setIsLoading(true); 
        const request = {
            fileName: currentFileName as string,
            preFormatterLabel: currentFieldsLabel as string,
            preFormatterMethod: currentFormatterMethod as string
        }
    
        defaultHttp.post(apiRoutes.formatterProcessedContent, request)
        .then((response) => {
           
        })
        .catch((error) => {
            handleErrorResponse(error);
        }).finally(() => { setIsLoading(false); });
    }

    // -------------------------------------------------- Other Functions

    // ----- 選擇檔案
    const chooseTheFile = (selectedValue: string) => {
        setCurrentFileName(selectedValue);
        fetchProcessedFileContent(selectedValue);
    }
    
    // ----- 選擇欄位
    const chooseTransformLabel = (selectedValue: string) => {
        setCurrentFieldsLabel(selectedValue);
    }

    // ----- 選擇轉換格式
    const chooseFormatters = (selectedValue: string) => {
        setCurrentFormatterMethod(selectedValue);
    }

    // ----- 換頁
    const changePage = (page: number) => {
        setCurrentPage(page);
        setProcessedFields(processContentList[page]?.processed || []);
    }

    // ----- Filter -> 選擇檔案 
    const labelValue_selectedFilterOption = (input: string, option?: { label: string; value: string }) => {
        if (!option) { return false; }
        return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
    };

    // ----- 初始化
    useEffect(() => {
        fetchFilesName();
    }, [])

    // -------------------------------------------------- Visual Return
    return (
        <Spin spinning={isLoading} tip="Loading...">

            <div className='mb-4'>
                <Button onClick={chooseIsVisible(0)} className={isVisible[0] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>Files</Button>
                <Button onClick={chooseIsVisible(1)} className={isVisible[1] ? 'ant-btn-beChosen' : 'ant-btn-notChosen'}>Processed Json</Button>
            </div>
            
            <Row gutter={24}>
                <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24}} >
                    <Card title="Transform File">
                        <p>1. 將金錢轉換為數字 (如: 一千元 → 1000, 一萬500元 → 10500)</p>
                        <p>2. 將日期轉成固定結構 (89年4月5日 → 89-04, 2021年08月12日15時 → 111-08)</p>

                        <div className='w-full grid gap-4 grid-cols-2'>
                            <Select 
                                className='w-full mb-4 mt-4' 
                                placeholder="選擇欄位"
                                filterOption={labelValue_selectedFilterOption}
                                options={processedFieldsLabelList}
                                onChange={chooseTransformLabel}
                                value={currentFieldsLabel}
                                loading={isLoading}
                                showSearch />

                            <Select
                                className='w-full mb-4 mt-4'
                                placeholder="選擇轉換單位"
                                filterOption={labelValue_selectedFilterOption}
                                options={formattersMethodList}
                                onChange={chooseFormatters}
                                value={currentFormatterMethod}
                                loading={isLoading}
                                showSearch />
                        </div>

                        
                        <div className='w-full grid mt-4'>
                            <Button className='w-full' 
                                    onClick={updateFormatters} 
                                    disabled={currentFieldsLabel == "" || currentFormatterMethod == ""}> 
                                轉換 
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24, height: '80vh', overflowY: 'auto'}} >
                    <Card title="Files" className="w-full cursor-default grid gap-4 mb-4">
                        <Select 
                            className='w-full mb-4 col-span-2' 
                            placeholder="Select the File Name"
                            optionFilterProp="children"
                            filterOption={labelValue_selectedFilterOption}
                            options={filesNameList}
                            onChange={chooseTheFile}
                            value={currentFileName}
                            loading={isLoading} 
                            showSearch />
                    </Card>

                    <Card   title="Processed Json" className="w-full cursor-default grid gap-4 mb-4" 
                            extra={ <Pagination 
                                simple 
                                current={currentPage}  
                                total={processContentList.length} 
                                onChange={(page, pageSize) => changePage(page)}  
                                pageSize={1} /> } >
                        
                        <Typography>
                            <pre>{JSON.stringify(processedFields, null, 2)}</pre>
                        </Typography>

                    </Card>
                </Col>
            </Row>
            
        
        </Spin>
    );
};

export default compareData;

