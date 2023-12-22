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
  Typography,
  Checkbox,
  Switch,
} from 'antd';
import { UploadOutlined, CheckOutlined, DeleteOutlined, CloseOutlined, DownloadOutlined, DownOutlined, UpOutlined, ClearOutlined, MonitorOutlined} from '@ant-design/icons';

import { handleErrorResponse } from '../../utils';
import { defaultHttp } from '../../utils/http';
import { processDataRoutes } from '../../routes/api';
import './index.css'

const CheckboxGroup = Checkbox.Group;
import { HorizontalBarChart } from './horizontalBarChart';

// - 定義類型
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
type SelectType = { value: string; label: string; };
type ProcessedContentType = { fileName:string, content: string; processed?: ProcessedFieldsType[]; };
type ProcessedFieldsType = { name: string; value: string; the_surrounding_words: string; regular_expression_match: string, regular_expression_formula: string, gpt_value: string };

const compareData = () => {


    // -------------------------------------------------- Fields Settings
    // - Global Settings
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState<boolean[]>([false, true, true, true, false]);
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
    const [contentList, setContentList] = useState<ProcessedContentType[]>([]); 
    const [processedFields, setProcessedFields] = useState<ProcessedFieldsType[]>([]); 

    // - Processed Fields
    const [processedFieldsLabelList, setProcessedLabelList] = useState<SelectType[]>([])
    const [currentSelectedLabel, setCurrentSelectedLabel] = useState<string>("");
    const [formattersMethodList, ] = useState<SelectType[]>([
        { label: "轉換為金錢(Integer)", value: "number" },
        { label: "轉換為民國(YYY-mm)", value: "ROC" },
    ]);
    const [currentFormatterMethod, setCurrentFormatterMethod] = useState<string>("");

    // - other options.
    const [isLockingCheckedAll, setIsLockingCheckedAll] = useState<boolean>(false);
    const [processLabelCheckedList, setProcessLabelCheckedList] = useState<CheckboxValueType[]>([]);
    const [processLabelOptions, setProcessLabelOptions] = useState<string[]>([]);

    // - Chart settings.
    const [compareLabels, setCompareLabels] = useState<string[]>([]);
    const [groundTruthValueDatasets, setGroundTruthValueDatasets] = useState<number[]>([]);
    const [compareREDatasets, setCompareREDatasets] = useState<number[]>([]);
    const [compareGPTDatasets, setCompareGPTDatasets] = useState<number[]>([]);


    // -------------------------------------------------- API Settings

    // ----- API -> 抓取在 uploads/files 裡面的資料名稱
    const fetchFilesName = async () => {
        defaultHttp.get(processDataRoutes.fetchUploadsFileName, {})
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
    
        defaultHttp.post(processDataRoutes.fetchProcessedContent, request)
        .then((response) => {
            setContentList(response.data);
            if (response?.data?.[readTheCurrentPage(currentPage)]?.processed) {
                const processedData = response.data[readTheCurrentPage(currentPage)].processed;
                const processedFieldsLabel = processedData.map((item:ProcessedFieldsType) => ({
                    value: item.name,
                    label: item.name
                }));

                setProcessedFields(processedData);
                setProcessedLabelList(processedFieldsLabel);

                // @ Options 選擇要顯示的欄位
                const processedNameList = processedData.map((item:ProcessedFieldsType) => (
                    item.name
                ));
                setProcessLabelOptions(processedNameList);

                // @ 確認是否全選
                if (isLockingCheckedAll) {
                    setProcessLabelCheckedList(processedNameList);
                }
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
            preFormatterLabel: currentSelectedLabel as string,
            preFormatterMethod: currentFormatterMethod as string
        }
    
        defaultHttp.post(processDataRoutes.formatterProcessedContent, request)
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
        setCurrentSelectedLabel(selectedValue);
    }

    // ----- 選擇轉換格式
    const chooseFormatters = (selectedValue: string) => {
        setCurrentFormatterMethod(selectedValue);
    }

    // ----- 換頁
    const changePage = (page: number) => {
        setCurrentPage(page);
        setProcessedFields(contentList[page]?.processed || []);
    }

    // ----- Filter -> 選擇檔案 
    const labelValue_selectedFilterOption = (input: string, option?: { label: string; value: string }) => {
        if (!option) { return false; }
        return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
    };

    // ----- handle -> 鎖定全選
    const handleLockingCheckedAll = (isLocking: boolean) => {
        setIsLockingCheckedAll(!isLockingCheckedAll);
        if (isLocking) { 
            setProcessLabelCheckedList(processLabelOptions);
        }
    }

    // ----- handle -> Check ALL Processed Label Checkboxes
    const handleCheckAllChange = (e: CheckboxChangeEvent) => {
        setProcessLabelCheckedList(e.target.checked ? processLabelOptions : []);
    };

    // ----- handle -> 若修改了 Processed Label
    const handleChange = (list: CheckboxValueType[]) => {
        if (!isLockingCheckedAll) {
            setProcessLabelCheckedList(list);
        }
    };

    // ----- TODO: 比較距離
    const compareData = () => {


        // - Change The Labels.
        const stringValues = processLabelCheckedList.map(value => String(value)) as string[];
        setCompareLabels(stringValues);

        // - Change the Dataset.

        // @ value
        const newCompareValueDatasets: number[] = [];
        stringValues.forEach((label) => {
            let sum = 0;

            contentList.forEach((content) => {
                content.processed?.forEach((field) => {
                    if ( field.name === label ) {
                        sum += parseFloat(field.value)
                    }
                })
            })

            newCompareValueDatasets.push(sum);
        })

        // @ RE
        const newCompareREDatasets: number[] = [];
        stringValues.forEach((label) => {
            let sum = 0;

            contentList.forEach((content) => {
                content.processed?.forEach((field) => {
                    if ( field.name === label ) {
                        sum += parseFloat(field.regular_expression_match)
                    }
                })
            })

            newCompareREDatasets.push(sum);
        })

        // @ GPT
        const newCompareGPTDatasets: number[] = [];
        stringValues.forEach((label) => {
            let sum = 0;

            contentList.forEach((content) => {
                content.processed?.forEach((field) => {
                    if ( field.name === label ) {
                        sum += parseFloat(field.gpt_value)
                    }
                })
            })
            newCompareGPTDatasets.push(sum);
        })


        // @ RE - GroundTruth v.s. GPT - GroundTruth
        setGroundTruthValueDatasets(newCompareValueDatasets);

        const reVsGroundTruth: number[] = [];
        const gptVsGroundTruth: number[] = [];

        for (let i = 0; i < newCompareValueDatasets.length; i++) {
            const groundTruthValue = newCompareValueDatasets[i];
            const reValue = newCompareREDatasets[i];
            const gptValue = newCompareGPTDatasets[i];

            const reDifference = Math.abs(reValue - groundTruthValue) / contentList.length;
            const gptDifference = Math.abs(gptValue - groundTruthValue) / contentList.length;

            reVsGroundTruth.push(reDifference);
            gptVsGroundTruth.push(gptDifference);

        }

        setCompareREDatasets(reVsGroundTruth);
        setCompareGPTDatasets(gptVsGroundTruth);

    };

    // ----- 初始化
    useEffect(() => {
        fetchFilesName();
    }, [])

    // ----- 偵測 contentList
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await compareData();
            setIsLoading(false);
        };
        fetchData();
    }, [contentList, processLabelCheckedList])

    // -------------------------------------------------- Visual Return
    return (
        <Spin spinning={isLoading} tip="Loading...">
            <div className='mb-4 space-x-2'>
                <Button onClick={chooseIsVisible(0)} className={isVisible[0] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Transform File</Button>
                <Button onClick={chooseIsVisible(1)} className={isVisible[1] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Files</Button>
                <Button onClick={chooseIsVisible(2)} className={isVisible[2] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Compare</Button>
                <Button onClick={chooseIsVisible(3)} className={isVisible[3] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Labels Checked</Button>
                <Button onClick={chooseIsVisible(4)} className={isVisible[4] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Processed Json</Button>

            </div>
            
            <Row gutter={24}>
            
                <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24}} >

                { isVisible[0] && <>
                    <Card title="Transform File" className="w-full cursor-default grid gap-4 mb-4" 
                        extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(0)}></Button>} >
                        <p>1. 將金錢轉換為數字 (如: 一千元 → 1000, 一萬500元 → 10500)</p>
                        <p>2. 將日期轉成固定結構 (89年4月5日 → 89-04, 2021年08月12日15時 → 111-08)</p>

                        <div className='w-full grid gap-4 grid-cols-2'>
                            <Select 
                                className='w-full mb-4 mt-4' 
                                placeholder="選擇欄位"
                                filterOption={labelValue_selectedFilterOption}
                                options={processedFieldsLabelList}
                                onChange={chooseTransformLabel}
                                value={currentSelectedLabel}
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
                                    disabled={currentSelectedLabel == "" || currentFormatterMethod == "" || true}> 
                                轉換 
                            </Button>
                        </div>
                    </Card>
                </>}

                { isVisible[2] && <>
                    <Card title="Transform File" className="w-full cursor-default grid gap-4 mb-4" 
                        extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(2)}></Button>} >
                    
                        {/* 比較與 ground truth 的差距 */}
                        <HorizontalBarChart
                        labels={compareLabels}
                        datasets={[
                            {label: "RE", data: compareREDatasets, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)'},
                            {label: "GPT", data: compareGPTDatasets,  borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.5)',}
                        ]} />

                    </Card>
                </> }
                    
                </Col>

                <Col xl={12} lg={12} md={12} sm={24} xs={24} style={{ marginBottom: 24, height: '100vh', overflowY: 'auto'}} >
                    { isVisible[1] && <>
                        <Card title="Files" className="w-full cursor-default grid gap-4 mb-4" 
                            extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(1)}></Button>} >

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
                    </>}

                    {isVisible[3] && <>
                        <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"Labels Checked"} 
                            extra={ <div> 
                                        <Switch className='switch-checkedAll' unCheckedChildren="關閉鎖定全選" checkedChildren="鎖定全選"  onChange={handleLockingCheckedAll} /> 
                                        <Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(3)}></Button>
                                    </div>}>                

                            <Checkbox 
                                className='mb-4'
                                indeterminate={processLabelCheckedList.length > 0 && processLabelCheckedList.length < processLabelOptions.length} 
                                checked={processLabelOptions.length === processLabelCheckedList.length}
                                onChange={handleCheckAllChange}
                                disabled={isLockingCheckedAll}
                                >
                                Check all
                            </Checkbox>

                            <CheckboxGroup 
                                options={processLabelOptions} 
                                value={processLabelCheckedList} onChange={handleChange} />

                        </Card>
                    </>}
                    
                    {isVisible[4] && <>
                        <Card   
                            title="Processed Json" className="w-full cursor-default grid gap-4 mb-4" 
                            extra={ <div style={{display: 'flex', alignItems: 'center'}}> 
                                    <Pagination 
                                        simple 
                                        current={currentPage}  
                                        total={contentList.length} 
                                        onChange={(page, pageSize) => changePage(page)}  
                                        pageSize={1} /> 
                                    <Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(4)}></Button>
                                    </div> } 
                            style={{maxHeight: '80vh', overflowY: 'auto'}} >  
                    
                            <Typography>
                                <pre>{JSON.stringify(processedFields, null, 2)}</pre>
                            </Typography>
                        </Card>
                    </>}


                    

                </Col>
            </Row>
        </Spin>
    );
};

export default compareData;

