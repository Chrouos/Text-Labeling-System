import { useEffect, useState } from 'react';
import DragSorting from './dragSorting';
import {
    Card,
    Col,
    Row,
    Input,
    Select,
    Upload,
    Button,
    Form,
    Typography,
    Pagination,
    Modal,
    Spin,
    Checkbox, Divider,
    Switch, Space, InputNumber
} from 'antd';
import { message } from 'antd';
import type { UploadProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined, CheckOutlined, DeleteOutlined, CloseOutlined, DownloadOutlined, DownOutlined, UpOutlined, ClearOutlined, MonitorOutlined} from '@ant-design/icons';


import { webRoutes } from '../../routes/web';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { defaultHttp } from '../../utils/http';
import { processDataRoutes } from '../../routes/api';
import { handleErrorResponse } from '../../utils';
import './index.css'
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { storedHeaders } from '../../utils/storedHeaders';

const { TextArea } = Input;
const CheckboxGroup = Checkbox.Group;

// - 定義類型
type SelectType = { value: string; label: string; };
type FileContentType = { [key: string]: string; };
type ProcessedFieldsType = { name: string; value: string; the_surrounding_words: string; regular_expression_match: string, regular_expression_formula: string, gpt_value: string }; 
type ProcessedListType = {
    processed: ProcessedFieldsType[];
}

type ModalFormatterType = {
    isOpen: boolean;
    title: string;
    ok: { onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void; };
    cancel: { onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void; };
    icon: JSX.Element;
    confirmLoading: boolean;
    message: string;
};

const labelData = () => {

  // -------------------------------------------------- Fields Settings

    // - Global Settings
    const [extraction_label_form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const navigate = useNavigate();

    const storedAccount = sessionStorage.getItem('account');

    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState<boolean[]>([false, true, false, true, false]);
    const chooseIsVisible = (index: number) => {
        return (event: React.MouseEvent<HTMLElement>) => {
            const newIsVisible = [...isVisible];
            newIsVisible[index] = !newIsVisible[index];
            setIsVisible(newIsVisible);
        };
    }
    const [modalSetting, setModalSetting] = useState<ModalFormatterType>({
        // = Default Modal Settings 
        isOpen: false, 
        title: "Titles", 
        ok: { onClick: () => {console.log("OK!")} }, 
        cancel: { onClick: () => closeModal() }, 
        icon: <CheckOutlined />, 
        confirmLoading: false, 
        message: "This is the default modal setting."
    });
    const closeModal = () => { setModalSetting((prevState: ModalFormatterType) => ({...prevState, isOpen: false})) } 

    // - File List
    const [currentPage, setCurrentPage] = useState(1);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);
    const [filesNameList, setFilesNameList] = useState<SelectType[]>([]);
    const [currentFileContentVisual, setCurrentFileContentVisual] = useState<string>("");
    const [isBreakSentence, setIsBreakSentence] = useState<boolean>(true);
    const [isAutoSave, setIsAutoSave] = useState<boolean>(true);
    const breakSentence_CurrentFileContentVisual = () => {

        if (isBreakSentence == false)
            return currentFileContentVisual
    
        let sentences = [];
        let sentence = "";
        let currentFileContentArray = Array.from(currentFileContentVisual);
    
        for (let i = 0; i < currentFileContentArray.length; i++) {


            let char = currentFileContentArray[i];
            let nextChar = currentFileContentArray[i + 1]; // 取得下一個字符
            let add_char = char;
    
            if (char === '（' || char === '(' ) {
                add_char = '\t' + add_char
            }
    
            sentence += add_char;
            if ((char === '。' || char === '？' || char === '！') && !(nextChar === '「' || nextChar === '」')) {
                sentences.push(sentence + "\n\t");
                sentence = "";
            }

        }
        if (sentence) sentences.push(sentence); // 確保最後一句也被加入
        return sentences.join("");
    }
    
    const readTheCurrentPage = (page: number) => {
        const fileIndex = (page > 0) ? page - 1 : 0;
        return fileIndex;
    }

    // - Processed Content
    const [contentList, setContentList] = useState<FileContentType[]>([]);
    const [fileFieldsList, setFileFieldsList] = useState<SelectType[]>([]); // = 可選擇內容
    const [currentContentFieldKey, setCurrentContentFieldKey] = useState<string>("");

    // - Processed Fields
    const [processedList, setProcessedList] = useState<ProcessedListType[]>([]);
    const [currentSelectedLabel, setCurrentSelectedLabel] = useState<string>(""); // = 選擇的新欄位
    
    // - other options.
    const [processLabelCheckedList, setProcessLabelCheckedList] = useState<CheckboxValueType[]>([]);
    const [processLabelOptions, setProcessLabelOptions] = useState<string[]>([]);

    const [newExtractionLabel, setNewExtractionLabel] = useState<string>("");
    const [isLockingCheckedAll, setIsLockingCheckedAll] = useState<boolean>(false);
    const [REFormula, setReFormula] = useState<string>("");
    const [textAreaPx, setTextAreaPx] = useState<number | null>(18);

    // - Table Viewer
    const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);


    const [sortOptions, setSortOptions] = useState<string[]>([]);
    const [defaultCheck, setDefaultCheck] = useState<CheckboxValueType[]>([]);

    // -------------------------------------------------- API Settings

    // -v- API - 抓取在 uploads/files 裡面的資料名稱
    const fetchFilesName = async () => {
        try {
            setIsLoading(true);
            const response = await defaultHttp.get(processDataRoutes.fetchUploadsFileName, {
                headers: storedHeaders()
            });
            const newFileNames = response.data.map((fileName: string) => ({ value: fileName, label: fileName }));
            setFilesNameList(newFileNames);
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setIsLoading(false);
        }
    }
    
    // -v- API - 讀取 processed 的內容
    const fetchProcessedContent = async (fileName: string) => {
        setIsLoading(true); 
    
        const request = {
            fileName: fileName,
        };
    
        try {
            const defaultPage = readTheCurrentPage(currentPage) // = 預設頁數

            // @ 處理 file 內容
            const file_response = await defaultHttp.post(processDataRoutes.fetchFileContent, request, { headers: storedHeaders() });

            const keysWithoutProcessed = Object.keys(file_response.data[defaultPage]); // = file -v- 裡面的所有欄位 (LIST)
            const formattedKeys = keysWithoutProcessed.map(key => ({
                value: key,
                label: key
            }));
            setFileFieldsList(formattedKeys)
            setCurrentContentFieldKey(keysWithoutProcessed[defaultPage])                                        // = 預設當前選擇 Field Key 
            setCurrentFileContentVisual(file_response.data[defaultPage][keysWithoutProcessed[defaultPage]])     // = 預設當前選擇 Visual
            setContentList(file_response.data);


            // @ 處理 processed 內容
            const processed_response = await defaultHttp.post(processDataRoutes.fetchProcessedContent, request, { headers: storedHeaders() });
            if (processed_response?.data?.[defaultPage]?.processed) {
                const currentProcessedData = processed_response.data[defaultPage].processed;
                setProcessedList(processed_response.data)
                
                // @ Options 選擇要顯示的欄位
                processOptions(currentProcessedData);
            }

            setNewExtractionLabel("");
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setIsLoading(false);
        }
    }

    // -v- void - 根據 process 讀取要顯示的 Label
    const processOptions = (currentProcessedData: ProcessedFieldsType[]) => {
        const processedNameList = currentProcessedData.map((item:ProcessedFieldsType) => item.name);
        setProcessLabelOptions(processedNameList);
        setSortOptions(processedNameList);
    };


    // -v- API - 存擋
    const uploadProcessedFile = async () => {
        setIsLoading(true);

        const request = {
            fileName: currentFileName,
            processed: processedList
        };
    
        try {
            const response = await defaultHttp.post(processDataRoutes.uploadProcessedFile, request, { headers: storedHeaders() });

            messageApi.success(response.data)
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setIsLoading(false);
        }
    };

    // -v- API - 下載檔案
    const downloadProcessedFile = async () => {

        setIsLoading(true);

        const request = {
            fileName: currentFileName,
        }

        defaultHttp.post(processDataRoutes.downloadProcessedFile, request, {
            headers: storedHeaders()
        })
        .then((response) => {

            // @ 假設 response.data 為 binary
            const blob = new Blob([response.data], { type: 'application/octet-stream' }); // 請根據你的檔案類型調整 MIME 類型
            const url = URL.createObjectURL(blob);

            // @ 創建一個 <a> 標籤來觸發檔案下載
            const a = document.createElement('a');
            a.href = url;

            // @ 增加下載時間
            const contentDisposition = response.headers['content-disposition'];
            let fileName = currentFileName;
            if (contentDisposition) {
                console.log(contentDisposition)
                const match = contentDisposition.match(/filename="?(.*?)"?$/);
                if (match && match[1]) {
                    fileName = match[1];
                }
                console.log(fileName)
            }

            a.download = fileName || "";
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

    // -v- API - 刪除檔案
    const deleteFile = async () => {
        try {
            setIsLoading(true);
    
            const request = { fileName: currentFileName };
            const response = await defaultHttp.post(processDataRoutes.deleteFile, request, { headers: storedHeaders() });
            fetchFilesName();
        
            messageApi.success(response.data);
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setIsLoading(false);
        }
    }
    

    // -v- API - 增加欄位
    const addExtractionLabel_all = async () => {
        setIsLoading(true);
    
        const request = {
            fileName: currentFileName,
            labelToAdd: newExtractionLabel
        };
    
        try {
            const response = await defaultHttp.post(processDataRoutes.addExtractionLabel_all, request, { headers: storedHeaders() });
            if (currentFileName) await fetchProcessedContent(currentFileName);

            messageApi.success(response.data);
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setIsLoading(false);
        }
    }

    // -v- API - 刪除欄位
    const removeLabel_all = async (labelToRemove: string) => {
        setIsLoading(true);

        const request = {
            fileName: currentFileName,
            labelToRemove: labelToRemove
        };
    
        try {
            const response = await defaultHttp.post(processDataRoutes.removeLabel_all, request, { headers: storedHeaders() });
            if (currentFileName) await fetchProcessedContent(currentFileName);

            messageApi.success(response.data);
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setIsLoading(false);
        }
    }

    // -------------------------------------------------- Other Setting.
    
    // -v- Props 上傳檔案的資料
    const uploadFileProps: UploadProps = { 
        name: 'file', 
        beforeUpload: (file: UploadFile) => {
            const isTxt = file.type === 'text/plain';
            if (!isTxt) { messageApi.error(`${file.name} is not a "txt" file`); }

            const isFileNameExisting = filesNameList.some(entry => entry.value === file.name);
            
            if (isFileNameExisting) {
                messageApi.error(`${file.name} already exists in the list.`);
            }
            return isTxt && !isFileNameExisting;
        },  
        
        action: processDataRoutes.uploadTheFile,
        method: 'POST',
        headers: storedHeaders(),

        onChange(info) {
            if (info.file.status === 'done') {
                fetchFilesName();
                messageApi.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === 'error') {
                messageApi.error(`${info.file.name} file upload failed.`);
            }
        },
    };

    // -v- 排序 & 預設勾選 儲存
    const handleClickOK = async () => {
        
        setProcessLabelCheckedList(defaultCheck);
        setIsLoading(true); 

        const request = {
            fileName: currentFileName,
            sortOptions: sortOptions,
        }

        try {
            const response = await defaultHttp.post(processDataRoutes.uploadFileSort, request, { headers: storedHeaders() });
            if (currentFileName) await fetchProcessedContent(currentFileName);

            messageApi.success(response.data);
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setIsLoading(false);
        }
    }

    // -v- autoVariable -v- 自動生成
    const ProcessedFieldsTemplate = <T extends Partial<ProcessedFieldsType>>(fields: T): ProcessedFieldsType => {

        const exampleProcessedFields: ProcessedFieldsType = {
            name: "",
            value: "",
            the_surrounding_words: "",
            regular_expression_match: "",
            regular_expression_formula: "",
            gpt_value: "",
        };
        
          // 使用 Object.keys 在這個示例對象上，以獲取所有的鍵
        const defaultFields = Object.keys(exampleProcessedFields).reduce((acc, key) => {
            acc[key as keyof ProcessedFieldsType] = "";
            return acc;
        }, {} as ProcessedFieldsType);

        return {
            ...defaultFields,
            ...fields
        };
    }

    // void - 更新 currentProcessed 到指定 index of processedList 
    const updateCurrentProcessedToList = (updatedProcessedFields: ProcessedFieldsType[]) => {

        const temp_ProcessedList = [...processedList];
        temp_ProcessedList[readTheCurrentPage(currentPage)].processed = updatedProcessedFields;
        setProcessedList(temp_ProcessedList);
        return temp_ProcessedList
    }

    // -------------------------------------------------- Other Functions

    // -v- 選擇檔案
    const chooseTheFile = (selectedValue: string) => {
        setCurrentFileName(selectedValue);
        fetchProcessedContent(selectedValue);
    }
    
    // -v- 換頁
    const changePage = (page: number) => {
        const indexPage = readTheCurrentPage(page);

        setCurrentPage(page);
        setCurrentFileContentVisual(contentList[indexPage][currentContentFieldKey]);

        // @ 若沒有鎖定
        if (!isLockingCheckedAll) {
            setProcessLabelCheckedList(defaultCheck); // = 按照預設
            processOptions(processedList[indexPage].processed);

            // 查看內容有重複欄位顯示在 CheckedList.
            // const filteredList = processLabelOptions.filter((item:string) => {
            //     return contentList[indexPage][currentContentFieldKey].includes(item);
            // });
            // setProcessLabelCheckedList(filteredList);
        }

        if (isAutoSave) {
            uploadProcessedFile();
        }
    }

    // -v- 增加處理欄位
    const addExtractionLabel = () => {

        setIsLoading(true);

        // @ 檢查是否重複
        const indexPage = readTheCurrentPage(currentPage);
        const isExisting = processedList[indexPage].processed.some(processedField => processedField.name === newExtractionLabel );
        if (isExisting) {
            messageApi.error(`${newExtractionLabel} 已經存在了.`);
            setIsLoading(false);
            return;
        }

        // @ 確認可以儲存
        addExtractionLabel_all();
        // const temp_newExtractionLabel = ProcessedFieldsTemplate({name: newExtractionLabel});
        // setCurrentProcessed(prevLabelFields => [...prevLabelFields, temp_newExtractionLabel]);
        // setNewExtractionLabel("");
        // const allLabelOptions = [...processLabelOptions, newExtractionLabel]
        // setProcessLabelOptions(allLabelOptions);
        // if (!isLockingCheckedAll){
        //     setProcessLabelCheckedList([...processLabelCheckedList, newExtractionLabel])
        // }

        
    }

    // -v- Filter - 選擇檔案 
    const labelValue_selectedFilterOption = (input: string, option?: { label: string; value: string }) => {
        if (!option) { return false; }
        return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
    };

    // -v- handle - Check ALL Processed Label Checkboxes
    const handleCheckAllChange = (e: CheckboxChangeEvent) => {
        setProcessLabelCheckedList(e.target.checked ? processLabelOptions : []);
    };

    // -v- handle -v- 若修改了 Processed Label
    const handleChangeCheckbox = (list: CheckboxValueType[]) => {

        if (!isLockingCheckedAll) {
            
            const addedItems:string = String(list.filter(item => !processLabelCheckedList.includes(item))[0] || ""); // = 找出新增的項目
            const removedItems = processLabelCheckedList.filter(item => !list.includes(item))[0]; // = 找出移除的項目

            setTimeout(() => {
                const anchorElement = document.getElementById(`anchor-${addedItems}`);
                const cardElement = document.getElementById('extraction-labels-card'); // 或者使用其他選擇器獲取 Card 元素

                if (anchorElement && cardElement) {
                    anchorElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }

            }, 0);

            setCurrentSelectedLabel(addedItems)
            setProcessLabelCheckedList(list);
        }
    };

    // -v- handle - 修改 re 公式
    const handleREFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReFormula(e.target.value);
    }
    
    // -v- handle - 鎖定全選
    const handleLockingCheckedAll = (isLocking: boolean) => {
        setIsLockingCheckedAll(!isLockingCheckedAll);
        if (isLocking) {  }
    }

    // -v- handle 刪除檔案
    const handleDeleteFile = async () => {
        await deleteFile();
        closeModal(); 
        cleanTheField();
    }

    // -v- handle - 清除資料
    const cleanTheField = () => {
        setCurrentFileName("");
        setCurrentFileContentVisual("");
        setProcessedList([])
        setCurrentContentFieldKey("");
        setCurrentSelectedLabel("");

        setSortOptions([]);
        setProcessLabelOptions([]);
        setProcessLabelCheckedList([]);
    }

    // -v- handle - 對要擷取內容 HighLight, 並修改相關資訊，送到 Fields Input 中
    const handleTextSelection = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const textarea = event.currentTarget;
        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        const indexPage = readTheCurrentPage(currentPage);
        
        // @ 更新當前選擇項目欄位的 Input.
        if (selectedText) {

            const updateFields = processedList[indexPage].processed.map ( field => {
                if (field.name === currentSelectedLabel) { 

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
            })

            updateCurrentProcessedToList(updateFields)
        }
    } 

    // -v- handle -v- 處理「當前」頁面的 GPT
    const handleGptAction = () => {

        // setIsLoading(true);

        // const request = {
        //     processedFields: currentProcessed,
        //     currentFileContentVisual: currentFileContentVisual,
        // }
    
        // defaultHttp.post(processDataRoutes.gptRetrieve, request)
        //     .then((response) => {
    
        //     type respGPTValue = { name: string, gpt_value: string}
        //     response.data.labelFields.forEach((responseItem: respGPTValue) => {
        //         currentProcessed.forEach(processedField => {
        //             if (processedField.name === responseItem.name) {
        //                 processedField.gpt_value = responseItem.gpt_value;
        //             }
        //         });
        //     });
    
        //     updateCurrentProcessedToList(currentProcessed);
        // })
        // .catch((error) => {})
        // .finally(() => { setIsLoading(false); })
    }

    // ----- handle -v- 處理「全部」頁面的 GPT
    const handleGptActionAll = () => {
        // setIsLoading(true);
        // const request = {
        //     content:  contentList,
        //     contentKey: currentContentFieldKey
        // }
        // defaultHttp.post(processDataRoutes.gptRetrieve_all, request)
        //   .then((response) => { 
        //     type responseList = []
        //     type responseItem = {name: string, gpt_value: string}
        //     response.data.map((responseList: responseList, responseListIndex:number) => {
        //       responseList.map((responseItem: responseItem, responseItemIndex) => {
        //         contentList[responseListIndex].processed?.forEach((item, index) => {
        //           if (item.name === responseItem.name){
        //             item.gpt_value = responseItem.gpt_value;
        //           }
        //         })  
        //       })
        //     });
        //     setContentList(contentList)
        //   })
        //   .catch((error) => {})
        //   .finally(() => { setIsLoading(false); })
    }

    // ----- handle -v- 處理 RE 
    const handleReAction = () => {

        // // - Loading Progress
        // setIsLoading(true);

        // // - Start to Regualr Expression 
        // const rExp: RegExp = new RegExp(REFormula, 'g');

        // // @ for - 透過迴圈將每一個 contentList 的元素進行擷取
        // const newProcessedFields = contentList.map((content, index) => {
            
        //     const preREContent = content[currentContentFieldKey]; 
        //     const match = rExp.exec(preREContent);
        //     if (content['processed'] ) {
        //         content['processed'].forEach((field: ProcessedFieldsType) => {
                    
        //             field.regular_expression_formula = REFormula;
        //             if(match) field.regular_expression_match = match[1] || "";
        //             else field.regular_expression_match = "";
                    
        //         });
        //     }

        //     return content;
        // })

        // async function handleProcessAndUpload() {
        //     await setContentList(newProcessedFields);
        //     uploadProcessedFile();
        // }

        // // - Loading Done
        // handleProcessAndUpload();
        // setIsLoading(false);
        
    }

    // ----- Template -v- 編輯欄位
    const editFieldsLabelTemplate = () => {

        const indexPage = readTheCurrentPage(currentPage);

        const handleDelete = (indexToDelete: number, labelName:string) => {
            setIsLoading(true)
            
            if (currentSelectedLabel === labelName) {
                setCurrentSelectedLabel("");
            }

            removeLabel_all(labelName);
        };

        const handleClean = (indexToClean: number, labelName:string) => {
            setIsLoading(true)
            const updatedProcessedFields = [...processedList[indexPage].processed];
            updatedProcessedFields[indexToClean].value = '';
            updateCurrentProcessedToList(updatedProcessedFields)
            setIsLoading(false)
        }

        const handleCancel = (indexToCancel: number, labelName:string) => {
            setIsLoading(true)
            setProcessLabelCheckedList(currentList => 
                currentList.filter(item => !(item === labelName))
            );
            setIsLoading(false)
        }
        
        const handleUpdate = (indexToUpdate: number, labelName:string, newValue: string) => {
            setIsLoading(true)
            const updatedLabelFields = [...processedList[indexPage].processed];
            if (updatedLabelFields[indexToUpdate].name == labelName){
                updatedLabelFields[indexToUpdate].value = newValue;
            }
            
            updateCurrentProcessedToList(updatedLabelFields)
            setIsLoading(false)
        };

        const handleChoose = (labelName: string) => {
            setCurrentSelectedLabel(labelName)
        }


        return ( <>
        
            {Array.isArray(processedList[indexPage]?.processed) &&
                processedList[indexPage].processed.map((originalField: ProcessedFieldsType, originalIndex: number) => {
                    if (processLabelCheckedList.includes(originalField.name)) {
                        return (
                            <div key={originalIndex} id={`anchor-${originalField.name}`} style={{display: 'flex', alignItems: 'center'}}>
                                <Form.Item label={<span  style={{  color: originalField.name === currentSelectedLabel ? 'red' : 'black'  }}>{originalField.name}</span>}>
                                    <div className='grid grid-cols-12 gap-4' style={{alignItems: 'center'}} onClick={() => {handleChoose(originalField.name)}}>
                                        <TextArea 
                                            className="col-span-10" 
                                            value={originalField.value}
                                            onChange={(e) => handleUpdate(originalIndex, originalField.name, e.target.value)}  />

                                        {/* <Button 
                                            className='ant-btn-icon' 
                                            onClick={(e) => {
                                                e.stopPropagation(); // 阻止事件繼續傳播
                                                // handleDelete(originalIndex, originalField.name); 
                                                setModalSetting((prevState: ModalFormatterType) => ({
                                                    ...prevState,
                                                    isOpen: true,
                                                    title: "刪除",
                                                    ok: {
                                                        onClick: async () => { handleDelete(originalIndex, originalField.name); closeModal();  }
                                                    },
                                                    icon: <DeleteOutlined />,
                                                    confirmLoading: false,
                                                    message: `你確定要刪除這個欄位（全部） ${originalField.name} 嗎?`
                                                }))
                                            }}>
                                            <DeleteOutlined />
                                        </Button> */}

                                        <Button 
                                            className='ant-btn-icon' 
                                            onClick={(e) => {
                                                e.stopPropagation(); // 阻止事件繼續傳播
                                                handleClean(originalIndex, originalField.name); 
                                            }}>
                                            <ClearOutlined />
                                        </Button>

                                        <Button 
                                            className='ant-btn-icon' 
                                            onClick={(e) => {
                                                e.stopPropagation(); // 阻止事件繼續傳播
                                                handleCancel(originalIndex, originalField.name); 
                                            }}>
                                            <CloseOutlined />
                                        </Button>
                                        
                                    </div>
                                </Form.Item>
                            </div>
                        );
                    }
                })
            }
        
        </> )
    }

    // ----- 進入網頁執行一次 Init
    useEffect(() => {
        fetchFilesName();
    }, []);

    useEffect(() => {
        // 如果已經有 storedAccount，則重定向到標籤資料頁面
        if (storedAccount) {
            navigate(webRoutes.labelData);
        }
    }, [navigate, storedAccount]);
    
    // useEffect(() => {
    
    //     const interval = setInterval(() => {
    //         if (currentFileName && currentFileContentVisual && !isLoading) {
    //             uploadProcessedFile()
    //         }
    //     }, 1000 * 60 * 10); // 每隔3000毫秒（即3秒）執行一次
    
    //     return () => clearInterval(interval); // 清除間隔，防止記憶體洩漏
    
    // }, [currentFileName, currentFileContentVisual, isLoading]); // 空依賴數組意味著這個效果只會在組件掛載時運行一次
    

    return (
    <Spin spinning={isLoading} tip="Loading...">
        
        
        {/* 開關位置  */}
        <div className="mb-4 space-x-2">
            <Button onClick={chooseIsVisible(0)} className={isVisible[0] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Actions</Button>
            <Button onClick={chooseIsVisible(1)} className={isVisible[1] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Labels Checked</Button>
            <Button onClick={chooseIsVisible(2)} className={isVisible[2] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Add Extraction Label</Button>
            <Button onClick={chooseIsVisible(3)} className={isVisible[3] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Extraction Labels</Button>
            <Button onClick={chooseIsVisible(4)} className={isVisible[4] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Labels View</Button>
        </div>

        <Row gutter={24}>
            <Col xl={14} lg={14} md={14} sm={24} xs={24} style={{ marginBottom: 24}} >
                <Card bordered={false} className="h-full cursor-default">

                    <div className='grid gap-2 mb-4 grid-cols-8'>
                        <Pagination 
                            className='w-full mb-4 col-span-2' 
                            simple 
                            current={currentPage}  
                            total={contentList.length} 
                            onChange={(page, pageSize) => changePage(page)}  
                            pageSize={1}
                            defaultCurrent={1} /> 

                        <Select 
                            className='col-span-3' 
                            placeholder="Select the File Name"
                            optionFilterProp="children"
                            filterOption={labelValue_selectedFilterOption}
                            options={filesNameList}
                            onChange={chooseTheFile}
                            value={currentFileName}
                            loading={isLoading} 
                            showSearch />

                        <Select 
                            className='col-span-2' 
                            placeholder="Select the Fields Name"
                            optionFilterProp="children"
                            filterOption={labelValue_selectedFilterOption}
                            options={fileFieldsList}
                            onChange={(e) => { 
                                setCurrentContentFieldKey(e);
                                setCurrentFileContentVisual((contentList[readTheCurrentPage(currentPage)] as any)[e]);
                            }}
                            value={currentContentFieldKey}
                            loading={isLoading} 
                            showSearch />

                        <Button 
                            className='col-span-1 ant-btn-store'
                            onClick={uploadProcessedFile} 
                            disabled={currentFileName == null || contentList.length === 0}>
                            Store </Button>

                    </div>

                    <TextArea
                        className='h-full'
                        showCount
                        // autoSize={{minRows: 21, maxRows: 21}}
                        style={{ height: '80vh', marginBottom: 24, fontSize: textAreaPx + 'px' }}
                        placeholder="欲標記內容"
                        value={breakSentence_CurrentFileContentVisual()}
                        onSelect={handleTextSelection} />

                    <div className='grid grid-cols-11 gap-2'>
                        <div className='col-span-2' style={{ display: 'flex', alignItems: "center"}}> 是否自動斷句：<Switch defaultChecked onChange={(e) => setIsBreakSentence(e)} /> </div>
                        <div className='col-span-5' style={{ display: 'flex', alignItems: "center"}}> 字體大小： <InputNumber addonAfter="px" value={textAreaPx} onChange={(e:number|null) => {setTextAreaPx(e)}} /> </div>
                        <div className='col-span-2'></div>
                        <div className='col-span-2' style={{ display: 'flex', alignItems: "center"}}> 是否自動儲存：<Switch defaultChecked onChange={(e) => setIsAutoSave(e)} /> </div>
                    </div>
                    

                </Card>
            </Col>

            <Col xl={10} lg={10} md={10} sm={24} xs={24} style={{ marginBottom: 24, maxHeight: '100vh', overflowY: 'auto' }}>
            
                {isVisible[0] && <>
                    <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"Actions"} 
                        extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(0)}></Button>}>                

                        <p className='text-xl mb-4'>Operation File</p>
                        <div className='grid gap-2 mb-4 grid-cols-3'>
                            <Button 
                                className="w-full ant-btn-check"  
                                icon={<DownloadOutlined />} 
                                disabled={!currentFileName}
                                onClick={downloadProcessedFile}> 
                                <span className="btn-text">Down</span> 
                            </Button>
                            <Button 
                                className="w-full ant-btn-delete"  
                                icon={<DeleteOutlined />} 
                                disabled={!currentFileName}
                                onClick={ () => {
                                setModalSetting((prevState: ModalFormatterType) => ({
                                    ...prevState,
                                    isOpen: true,
                                    title: "刪除",
                                    ok: {
                                        onClick: async () => { handleDeleteFile(); }
                                    },
                                    icon: <DeleteOutlined />,
                                    confirmLoading: false,
                                    message: "你確定要刪除這個檔案嗎?"
                                }))
                            }} > 
                                <span className="btn-text">Delete</span> 
                            </Button>

                            <Upload maxCount={1} {...uploadFileProps}  >
                                <Button type="dashed" className="w-full ant-btn-action" icon={<UploadOutlined />}> <span className="btn-text">Upload File </span> </Button>
                            </Upload>
                        </div>

                        {/* TODO: 之後改 */}
                        {/* <p className='text-xl mb-4'>Regular Expression</p>
                        <div className='grid gap-2 mb-4 grid-cols-5'>
                            <Input 
                                className='w-full col-span-4'
                                addonBefore="/" addonAfter="/g"
                                value={REFormula} onChange={handleREFormulaChange} />
                            <Button className="w-full ant-btn-action" onClick={handleReAction} icon={<MonitorOutlined />} 
                                    disabled={currentFileName == null || contentList.length === 0 || currentSelectedLabel === ""}> 
                                <span className="btn-text" > 正規化 </span> 
                            </Button>
                        </div>
                        
                        <p className='text-xl mb-4'>GPT</p>
                        <div className='grid gap-2 mb-4 grid-cols-2'>
                            <Button className="w-full ant-btn-action mb-4" onClick={handleGptAction}
                                disabled={currentFileName == null || contentList.length === 0} >GPT搜索(當前頁面)</Button>
                            <Button className="w-full ant-btn-all_gpt" onClick={handleGptActionAll}
                                disabled={currentFileName == null || contentList.length === 0} >GPT搜索(全部)</Button>
                        </div> */}
                    
                    </Card>
                </>}


                {isVisible[1] && <>
                    <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"Labels Checked"} 
                        extra={ <div> 
                                    <Switch className='switch-checkedAll' unCheckedChildren="關閉鎖定" checkedChildren="鎖定選擇"  onChange={handleLockingCheckedAll} /> 
                                    <Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(1)}></Button>
                                </div>}>                

                        <Checkbox 
                            className='mb-4'
                            indeterminate={processLabelCheckedList.length > 0 && processLabelCheckedList.length < processLabelOptions.length} 
                            checked={processLabelOptions.length === processLabelCheckedList.length}
                            onChange={handleCheckAllChange}
                            disabled={isLockingCheckedAll} >
                            Check all
                        </Checkbox>

                        <Button onClick={() => setIsTableModalOpen(true)} disabled={currentFileName == null || contentList.length === 0}>
                            Table Edit
                        </Button>

                        <CheckboxGroup 
                            options={processLabelOptions} 
                            value={processLabelCheckedList} onChange={handleChangeCheckbox} />

                    </Card>
                </>}

                {isVisible[2] && <>
                    <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"Add Extraction Label"} 
                        extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(2)}></Button>}>  
                            <div className='grid grid-cols-2 gap-4'>
                                <Input value={newExtractionLabel} onChange={(e) => {setNewExtractionLabel(e.target.value)}} addonBefore="new Label"/>
                                <Button type="dashed" onClick={() => addExtractionLabel()} disabled={!currentFileName} > 
                                    + Add Item 
                                </Button>
                            </div>
                    </Card>
                </>}

                {isVisible[3] && <>
                    <Card id={'extraction-labels-card'} bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"Extraction Labels"}
                    
                        extra={ <div style={{display: 'flex', alignItems: 'center'}}> 
                                    <p>選取：</p> <p className='p-current-dele' onClick={()=>{setCurrentSelectedLabel("")}}>{currentSelectedLabel}</p> 
                                    <Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(3)}></Button> 
                                </div> } 
                        style={{maxHeight: '60vh', overflowY: 'auto'}}>  

                        <Form form={extraction_label_form} name="dynamic_label_form_edit" >
                            <Form.List name="labels">
                                {(currentProcessedFields) => (
                                    <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
                                        {editFieldsLabelTemplate()}
                                    </div>
                                )}
                            </Form.List>      
                        </Form>
                    </Card>
                </>}

                {isVisible[4] && <>
                    <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"Labels View"} 
                        extra={<Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(4)}></Button>}
                        style={{maxHeight: '60vh', overflowY: 'auto'}}>  

                        <Form form={extraction_label_form} name="dynamic_label_form_typography" >
                            
                            <Form.Item noStyle shouldUpdate>
                                {() => (
                                <Typography>
                                    <pre>{ 
                                        Array.isArray(processedList[readTheCurrentPage(currentPage)]?.processed) &&
                                        JSON.stringify(processedList[readTheCurrentPage(currentPage)].processed.filter(field => processLabelCheckedList.includes(field.name)), null, 2)
                                    }</pre>
                                </Typography>
                                )}
                            </Form.Item>

                        </Form>
                    </Card>
                </>}

            </Col>
        </Row>

        {/* 以下是呼叫才會跳出來的部分 */}
        <Modal 
            open={modalSetting.isOpen} 
            onCancel={modalSetting.cancel.onClick} 
            title= {<> {modalSetting.icon} {modalSetting.title}</>}
            okButtonProps={{className: "ant-btn-check"}}
            onOk={modalSetting.ok.onClick}
        >
            {modalSetting.message}
        </Modal>

        {/* 編輯欄位 */}
        <Modal 
            open={isTableModalOpen} 
            title= {<> Label Table View </>}
            okButtonProps={{className: "ant-btn-check"}} 
            onCancel={(e) => setIsTableModalOpen(false)}
            onOk={(e) => {
                setIsTableModalOpen(false);
                handleClickOK();
            }}
            >
            
            {   <DragSorting 
                    processLabelOptions={processLabelOptions} 
                    setSortOptions={setSortOptions} 
                    setDefaultCheck={setDefaultCheck} 
                    defaultCheck={defaultCheck} /> 
            }
        </Modal>

        {contextHolder}

    </Spin>
    );
};

export default labelData;

