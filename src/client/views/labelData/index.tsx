import { useEffect, useState, useRef, useMemo } from 'react';
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
    Switch, Space, InputNumber, ConfigProvider
} from 'antd';
import { message } from 'antd';
import type { UploadProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined, CheckOutlined, DeleteOutlined, CloseOutlined, DownloadOutlined, ClearOutlined} from '@ant-design/icons';


import { webRoutes } from '../../routes/web';
import { useNavigate } from 'react-router-dom';
import { defaultHttp } from '../../utils/http';
import { processDataRoutes } from '../../routes/api';
import { handleErrorResponse } from '../../utils';
import './index.css'
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { storedHeaders } from '../../utils/storedHeaders';
import { useAccount } from '../../store/accountContext';
import HighlightArea from './highlightArea';
import { current } from '@reduxjs/toolkit';

const { TextArea } = Input;
const CheckboxGroup = Checkbox.Group;

// - 定義類型
type TextPositionsType = {key:string, start_position: number, end_position: number}
type HighLightPositionListType = {
    key: TextPositionsType[],
    self: TextPositionsType[],
    comparator: TextPositionsType[]
}
type isOpenHighLightType = {
    key: boolean,
    self: boolean,
    comparator: boolean
}

type SelectType = { value: string; label: string; };
type FileContentType = { [key: string]: string; };
type ProcessedFieldsType = { 
    name: string; 
    value: string; the_surrounding_words: string; 
    regular_expression_match: string, regular_expression_formula: string, 
    gpt_value: string, 
    pre_normalize_value?: string,
    position: {start_position: number, end_position: number}
}; 
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
    message: any;
};

const labelData = () => {

    // 監聽 temp-account 帳號
    const { account } = useAccount();   
    const storedAccount = sessionStorage.getItem('account');

  // -------------------------------------------------- Fields Settings

    const [accountList, setAccountList] = useState<SelectType[]>([])
    const [currentComparator, setCurrentComparator] = useState<string>("");

    // - Global Settings
    const [extraction_label_form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState<boolean[]>([false, true, false, true, false, false]);
    const chooseIsVisible = (index: number) => {
        return (event: React.MouseEvent<HTMLElement>) => {
            const newIsVisible = [...isVisible];
            newIsVisible[index] = !newIsVisible[index];
            setIsVisible(newIsVisible);
        };
    }
    const cleanIsVisible = () => {
        let tempIsVisible: boolean[] = []
        isVisible.map(() => {
            tempIsVisible.push(false);
        })
        setIsVisible(tempIsVisible)
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

    // - Loading
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStates, setLoadingStates] = useState({    // 儲存各個API的loading狀態

    });
    useEffect(() => {   // 當任何一個API的loading狀態改變時，更新isLoading
        const anyLoading = Object.values(loadingStates).some(state => state);
        setIsLoading(anyLoading);
    }, [loadingStates]);

    // - File List
    const [currentPage, setCurrentPage] = useState(1);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);
    const [filesNameList, setFilesNameList] = useState<SelectType[]>([]);
    const [currentFileContentVisual, setCurrentFileContentVisual] = useState<string>("");
    const [currentTextAreaVisual, setCurrentTextAreaVisual] = useState<string>("");
    const [isBreakSentence, setIsBreakSentence] = useState<boolean>(true);
    const [isAutoSave, setIsAutoSave] = useState<boolean>(true);
    
    const readTheCurrentPage = (page: number) => {
        const fileIndex = (page > 0) ? page - 1 : 0;
        return fileIndex;
    }

    // - Processed Content
    const [contentList, setContentList] = useState<FileContentType[]>([]);
    const [fileFieldsList, setFileFieldsList] = useState<SelectType[]>([]); // = 可選擇內容
    const [currentContentFieldKey, setCurrentContentFieldKey] = useState<string>("");
    const [defaultFieldKey, setDefaultFieldKey] = useState<string>("");

    // - Processed Fields
    const [processedList, setProcessedList] = useState<ProcessedListType[]>([]);
    const [currentSelectedLabel, setCurrentSelectedLabel] = useState<string>(""); // = 選擇的新欄位

    // - Comparator 
    const [comparatorProcessedList, setComparatorProcessedList] = useState<ProcessedListType[]>([]);
    
    // - other options.
    const [processLabelCheckedList, setProcessLabelCheckedList] = useState<CheckboxValueType[]>([]);
    const [processLabelOptions, setProcessLabelOptions] = useState<string[]>([]);

    const [newExtractionLabel, setNewExtractionLabel] = useState<string>("");
    const [isLockingCheckedAll, setIsLockingCheckedAll] = useState<boolean>(false);
    const [REFormula, setReFormula] = useState<string>("");
    const [textAreaPx, setTextAreaPx] = useState<number | null>(18);

    // - HighLight
    const [highLightList_key, setHighLightList_key] = useState<string[]>([]);
    const [highLightPositionList, setHighLightPositionList] = useState<HighLightPositionListType>({
        key: [],
        self: [],
        comparator: []
    })
    const [isOpenHighLight, setIsOpenHighLight] = useState<isOpenHighLightType>({
        key: true,
        self: true,
        comparator: false
    })

    // - Table Viewer
    const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
    const [sortOptions, setSortOptions] = useState<string[]>([]);
    const [defaultCheck, setDefaultCheck] = useState<CheckboxValueType[]>([]);

    
    


    // -------------------------------------------------- API Settings

    // ----- API - 抓取在 uploads/files 裡面的資料名稱
    const fetchFilesName = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, fetchFilesName: true }));
            const response = await defaultHttp.get(processDataRoutes.fetchUploadsFileName, {
                headers: storedHeaders()
            });
            const newFileNames = response.data.map((fileName: string) => ({ value: fileName, label: fileName }));
            setFilesNameList(newFileNames);
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, fetchFilesName: false }));
        }
    }
    
    // ----- API - 讀取 processed 的內容
    const fetchProcessedContent = async (fileName: string) => {
        setLoadingStates(prev => ({ ...prev, fetchProcessedContent: true }));
        const request = {
            fileName: fileName,
        };
    
        try {
            const defaultPage = readTheCurrentPage(currentPage) // = 預設頁數

            // @ 處理 file 內容
            const file_response = await defaultHttp.post(processDataRoutes.fetchFileContent, request, { headers: storedHeaders() });

            const keysWithoutProcessed = Object.keys(file_response.data[defaultPage]); // = file ----- 裡面的所有欄位 (LIST)
            await updateFileFields(keysWithoutProcessed, file_response.data[defaultPage]);
            setContentList(file_response.data);

            // @ 處理 processed 內容
            const processed_response = await defaultHttp.post(processDataRoutes.fetchProcessedContent, request, { headers: storedHeaders() });
            if (processed_response?.data?.[defaultPage]?.processed) {
                const currentProcessedData = processed_response.data[defaultPage].processed;
                setProcessedList(processed_response.data);
                
                // @ Options 選擇要顯示的欄位
                processOptions(currentProcessedData);
            }

            setNewExtractionLabel("");
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, fetchProcessedContent: false }));
        }
    }


    // ----- API - 讀取 comparator processed 的內容
    const fetchComparatorProcessedContent = async (fileName: string, currentComparator: string) => {
        
        setLoadingStates(prev => ({ ...prev, fetchComparatorProcessedContent: true }));
        const request = {
            fileName: fileName,
            comparator_userName: currentComparator
        };
    
        try {
            const defaultPage = readTheCurrentPage(currentPage) // = 預設頁數

            // @ 處理 processed 內容
            const processed_response = await defaultHttp.post(processDataRoutes.fetchComparatorProcessedContent, request, { headers: storedHeaders() });
            if (processed_response?.data?.[defaultPage]?.processed) {
                setComparatorProcessedList(processed_response.data);
            }
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, fetchComparatorProcessedContent: false }));
        }
    }

    // ----- API - 抓取 fetchFilesName 後擁有該檔名的所有user
    const fetchMatchFileUser = async (fileName:string) => {
        try {
            setLoadingStates(prev => ({ ...prev, fetchMatchFileUser: true }));
            const request = {
                fileName: fileName as string,
            }
            const response = await defaultHttp.post(processDataRoutes.fetchUsers, request, { headers: storedHeaders() });
            let filteredAccounts = response.data.filter((acc: SelectType) => acc.label !== account && acc.label !== storedAccount);

            setAccountList(filteredAccounts);
            setCurrentComparator(filteredAccounts[0].label);
            fetchComparatorProcessedContent(fileName, filteredAccounts[0].label)

        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, fetchMatchFileUser: false }));
        }
    }

    // ----- void - 根據 process 讀取要顯示的 Label
    const processOptions = async (currentProcessedData: ProcessedFieldsType[]) => {
        const processedNameList = currentProcessedData.map((item:ProcessedFieldsType) => item.name);
        setProcessLabelOptions(processedNameList);
        setSortOptions(processedNameList);

        // - hight light
        if (highLightList_key.length == 0){
            setHighLightList_key(processedNameList);
            setTempHighLightList(processedNameList.join(', '))
        }
    };

    // ----- API - 存擋
    const uploadProcessedFile = async () => {
        
        setLoadingStates(prev => ({ ...prev, uploadProcessedFile: true }));
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
            setLoadingStates(prev => ({ ...prev, uploadProcessedFile: false }));
        }
    };

    // ----- API - 下載txt
    const downloadProcessedFile = async () => {

        setLoadingStates(prev => ({ ...prev, downloadProcessedFile: true }));

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
                const match = contentDisposition.match(/filename="?(.*?)"?$/);
                if (match && match[1]) {
                    fileName = match[1];
                }
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
        }).finally(() => { setLoadingStates(prev => ({ ...prev, uploadProcessedFile: false }));  });
    }

    // ----- API - 下載Excel
    const downloadExcel = async () => {
        
        let selectedUsers = [storedAccount]
        if (storedAccount == "admin") {
            selectedUsers = [account]
        }
        if (currentComparator != ""){
            selectedUsers.push(currentComparator)
        }

        const request = {
            fileName: currentFileName as string,
            selectedUsers: selectedUsers,
        }
        setLoadingStates(prev => ({ ...prev, downloadExcel: true }));
        defaultHttp.post(processDataRoutes.downloadExcel, request, {
            headers: storedHeaders(),
            responseType: 'blob'
        })
        .then((response) => {

            // @ 假設 response.data 為 binary
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); // 請根據你的檔案類型調整 MIME 類型
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
        }).finally(() => { setLoadingStates(prev => ({ ...prev, downloadExcel: false })); });
    }

    // ----- API - 刪除檔案
    const deleteFile = async () => {
        try {
            
            setLoadingStates(prev => ({ ...prev, deleteFile: true }));
            const request = { fileName: currentFileName };
            const response = await defaultHttp.post(processDataRoutes.deleteFile, request, { headers: storedHeaders() });
            await fetchFilesName();
        
            messageApi.success(response.data);
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, deleteFile: false }));
        }
    }
    

    // ----- API - 增加欄位
    const addExtractionLabel_all = async () => {
        
        setLoadingStates(prev => ({ ...prev, addExtractionLabel_all: true }));
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
            setLoadingStates(prev => ({ ...prev, addExtractionLabel_all: false }));
        }
    }

    // ----- API - 刪除欄位
    const removeLabel_all = async (labelToRemove: string) => {
        
        setLoadingStates(prev => ({ ...prev, removeLabel_all: true }));
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
            setLoadingStates(prev => ({ ...prev, removeLabel_all: false }));
        }
    }

    // -------------------------------------------------- Other Setting.
    
    // ----- Props 上傳檔案的資料
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

    // ----- 排序 & 預設勾選 儲存
    const handleClickOK = async () => {
        setLoadingStates(prev => ({ ...prev, handleClickOK: true }));
        setProcessLabelCheckedList(defaultCheck);
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
            setLoadingStates(prev => ({ ...prev, handleClickOK: false }));
        }
    }

    // ----- void -> 更新 currentProcessed 到指定 index of processedList 
    const updateCurrentProcessedToList = (updatedProcessedFields: ProcessedFieldsType[]) => {

        const temp_ProcessedList = [...processedList];
        temp_ProcessedList[readTheCurrentPage(currentPage)].processed = updatedProcessedFields;
        setProcessedList(temp_ProcessedList);
        return temp_ProcessedList
    }

    // -------------------------------------------------- Other Functions

    // ----- 選擇檔案
    const chooseTheFile = (selectedValue: string) => {
        setCurrentFileName(selectedValue);
        fetchProcessedContent(selectedValue);
        // fetchComparatorProcessedContent(selectedValue, currentComparator)
        fetchMatchFileUser(selectedValue);
    }
    
    // ----- 換頁
    const changePage = async (page: number) => {
        const indexPage = readTheCurrentPage(page);

        const keysWithoutProcessed = Object.keys(contentList[indexPage]); // = file ----- 裡面的所有欄位 (LIST)
        await updateFileFields(keysWithoutProcessed, contentList[indexPage]);
        setCurrentPage(page);
        

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

    // ----- 增加處理欄位
    const addExtractionLabel = () => {

        // @ 檢查是否重複
        const indexPage = readTheCurrentPage(currentPage);
        const isExisting = processedList[indexPage].processed.some(processedField => processedField.name === newExtractionLabel );
        if (isExisting) {
            messageApi.error(`${newExtractionLabel} 已經存在了.`);
            
            return;
        }

        // @ 確認可以儲存
        addExtractionLabel_all();
        
    }

    // ----- Filter - 選擇檔案 
    const labelValue_selectedFilterOption = (input: string, option?: { label: string; value: string }) => {
        if (!option) { return false; }
        return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
    };

    // ----- Filter - 選擇帳號
    const accountList_selectedFilterOption = (input: string, option?: { label: string; value: string }) => {
        if (!option) { return false; }
        return (option.label ?? '').toLowerCase().includes(input.toLowerCase());
    };

    // ----- handle - Check ALL Processed Label Checkboxes
    const handleCheckAllChange = (e: CheckboxChangeEvent) => {
        setProcessLabelCheckedList(e.target.checked ? processLabelOptions : []);
    };

    // ----- handle ----- 若修改了 Processed Label
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

    // ----- handle - 修改 re 公式
    const handleREFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReFormula(e.target.value);
    }
    
    // ----- handle - 鎖定全選
    const handleLockingCheckedAll = (isLocking: boolean) => {
        setIsLockingCheckedAll(!isLockingCheckedAll);
        if (isLocking) {  }
    }

    // ----- handle 刪除檔案
    const handleDeleteFile = async () => {
        await deleteFile();
        closeModal(); 
        cleanTheField();
    }

    // ----- handle - 清除資料
    const cleanTheField = () => {
        setCurrentFileName("");
        setCurrentFileContentVisual("");
        setProcessedList([])
        setCurrentContentFieldKey("");
        setCurrentSelectedLabel("");

        setSortOptions([]);
        setProcessLabelOptions([]);
        setHighLightList_key([]);
        setTempHighLightList("")
        setProcessLabelCheckedList([]);
    }

    // ----- handle - 對要擷取內容 HighLight, 並修改相關資訊，送到 Fields Input 中
    const currentPageRef = useRef(currentPage);
    const currentProcessedListRef = useRef(processedList);
    const currentSelectedLabelRef = useRef(currentSelectedLabel);
    const currentContentListRef = useRef(contentList);
    const currentDefaultFieldKeyRef = useRef(defaultFieldKey);
    const currentContentFieldKeyRef = useRef(currentContentFieldKey);
    useEffect(() => {
        currentPageRef.current = currentPage;
        currentProcessedListRef.current = processedList;
        currentSelectedLabelRef.current = currentSelectedLabel;
        currentContentListRef.current = contentList;
        currentDefaultFieldKeyRef.current = defaultFieldKey;
        currentContentFieldKeyRef.current = currentContentFieldKey;
    }, [currentPage, processedList, currentSelectedLabel, contentList, defaultFieldKey, currentContentFieldKey]);

    const handleTextSelection = (selectedText: string, fullText: string, startPosition: number) => {
        function escapeRegExp(text:string) {
            return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function catchSurroundingText(selectedText: string, fullText: string, startPosition: number): string {
            const punctuation = /[，。、]/;
            const clean_fullText = fullText.replace(/\s+/g, '')
            let start = startPosition;
            let end = startPosition + selectedText.length;
        
            // 向前搜尋，直到遇到標點符號或文本開頭
            while (start > 0 && !punctuation.test(fullText[start - 1])) {
                start--;
            }
        
            // 向後搜尋，直到遇到標點符號或文本結尾
            while (end < fullText.length && !punctuation.test(fullText[end])) {
                end++;
            }
        
            // 返回選定單字的前後文
            console.log(startPosition, start,end)
            return fullText.substring(start, end).replace(/\s+/g, '');
        }


        if (selectedText) {
            
            const indexPage = readTheCurrentPage(currentPageRef.current);
            const escapedSelectedText = escapeRegExp(selectedText);
            const clean_selectedText = selectedText.replace(/\s+/g, '');
    
            // @ 前後文
            const currentVisual = currentContentListRef.current[readTheCurrentPage(currentPage)][currentContentFieldKeyRef.current];
            const the_surrounding_words = catchSurroundingText(selectedText, currentVisual, startPosition);

            // @ 位置 Position
            let start_position = startPosition;
            let end_position = startPosition + escapedSelectedText.length;

            if (currentContentFieldKey != defaultFieldKey){

                // @ 根據 surrounding_word 找到
                const currentDefaultVisual = currentContentListRef.current[readTheCurrentPage(currentPage)][currentDefaultFieldKeyRef.current];
                const indexOfSurroundingWord = currentDefaultVisual.indexOf(the_surrounding_words);
                const indexOfSelectedText = the_surrounding_words.indexOf(clean_selectedText);

                start_position = indexOfSurroundingWord + indexOfSelectedText
                end_position = start_position + escapedSelectedText.length;
            }

            // @ 存擋
            const tempCurrentProcessed = currentProcessedListRef.current[indexPage].processed
            const updateFields = tempCurrentProcessed.map(field => {
                if (field.name === currentSelectedLabelRef.current) {
                    return { 
                        ...field, 
                        value: clean_selectedText, 
                        the_surrounding_words: the_surrounding_words,
                        position:{
                            start_position: start_position,
                            end_position: end_position
                        }
                    };
                }
                return field;
            });

            const temp_ProcessedList = [...currentProcessedListRef.current];
            temp_ProcessedList[indexPage].processed = updateFields;
            setProcessedList(temp_ProcessedList);
    
            // updateCurrentProcessedToList(updateFields);
        }
    };

    // ----- handle - 更新當前檔案 Fields
    async function updateFileFields(keysWithoutProcessed: string[], tempContentList: FileContentType) {

        const formattedKeys = keysWithoutProcessed.map(key => ({ value: key, label: key }));
        let result_currentFieldKey:string = currentContentFieldKey;
        setFileFieldsList(formattedKeys);

        // @ 如果目前沒有 currentContentFieldKey，或者它不再是有效的 key，則設置為第一個 key
        if (currentContentFieldKey == null || !formattedKeys.some(key => key.value === currentContentFieldKey)) {

            const defaultFieldKey = keysWithoutProcessed[0];

            setDefaultFieldKey(defaultFieldKey)
            setCurrentContentFieldKey(defaultFieldKey);
            result_currentFieldKey = defaultFieldKey;
        }

        setCurrentFileContentVisual(tempContentList[result_currentFieldKey])
        return result_currentFieldKey;
        
    }

    // ----- Template - 編輯欄位
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
            updatedProcessedFields[indexToClean] = {
                "name": labelName,
                "value": "",
                "the_surrounding_words": "",
                "regular_expression_match": "",
                "regular_expression_formula": "",
                "gpt_value": "",
                "position": {
                    "start_position": -1,
                    "end_position": -1
                }
            }
            updateCurrentProcessedToList(updatedProcessedFields)
            setIsLoading(false)
        }

        const handleCancel = (indexToCancel: number, labelName:string) => {
            setIsLoading(true)
            setCurrentSelectedLabel("");
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
    
    // ---------------------------------------------------------------------------------------------------- Highlight

    // ----- 處理換行和位置資訊
    async function  processTextAndHighlights (_highLightPositionList: HighLightPositionListType) {
        if (!isBreakSentence) return { text: currentFileContentVisual, highLightList: _highLightPositionList };
        
    
        let adjustedHighlights:HighLightPositionListType = _highLightPositionList;
        // JSON.parse(JSON.stringify(highLightPositionList));
        let sentences = "";
        let currentFileContentArray = Array.from(currentFileContentVisual);
        
        // 遍歷每一個字符
        for (let i = 0; i < currentFileContentArray.length; i++) {

            let char = currentFileContentArray[i];
            let nextChar = currentFileContentArray[i + 1];
            let addChar = char;
            let positionAdjustment = 0;
    
            if ((char === '。' || char === '？' || char === '！') && !(nextChar === '「' || nextChar === '」')) {
                positionAdjustment = 2; // 換行和制表符
                sentences += addChar + "\n\t";

                // @ Key
                adjustedHighlights.key = adjustedHighlights.key.map(highlight => {
                    if (highlight.start_position >= sentences.length - 2 ) {
                        return {
                            ...highlight,
                            start_position: highlight.start_position + positionAdjustment,
                            end_position: highlight.end_position + positionAdjustment
                        };
                    }
                    return highlight;
                });    


                // @ Self
                adjustedHighlights.self = adjustedHighlights.self.map(highlight => {
                    if (highlight.start_position >= sentences.length - 2 ) {
                        return {
                            ...highlight,
                            start_position: highlight.start_position + positionAdjustment,
                            end_position: highlight.end_position + positionAdjustment
                        };
                    }
                    return highlight;
                });    

                // @ comparator
                adjustedHighlights.comparator = adjustedHighlights.comparator.map(highlight => {
                    if (highlight.start_position >= sentences.length - 2 ) {
                        return {
                            ...highlight,
                            start_position: highlight.start_position + positionAdjustment,
                            end_position: highlight.end_position + positionAdjustment
                        };
                    }
                    return highlight;
                });    

            } else {
                sentences += addChar;
            }
    
            // - 更新 highlightList 中的位置

            
        }
    
        // setCurrentTextAreaVisual(sentences);
        // setHighLightPositionList(adjustedHighlights)
        
        return { text: sentences, highlights: adjustedHighlights };
    };

    // ----- 找到關鍵字的 Position
    async function findHighLightListPosition_key () {
        
        const findKeywordPositions = (keywords: string[], text: string) => {
            const positions = [];

            for (const keyword of keywords) {
                let startIndex = 0;
                while (startIndex < text.length) {
                    const index = text.indexOf(keyword, startIndex);
                    if (index !== -1) {
                        positions.push({ key: keyword, start_position: index, end_position: index + keyword.length});
                        startIndex = index + 1; // 移動到找到關鍵字的下一個位置繼續尋找
                    } else {
                        break; // 如果在文本中找不到關鍵字，則終止迴圈
                    }
                }
            }
            return positions;
        };
        
        const positions = findKeywordPositions(highLightList_key, currentFileContentVisual);
        positions.sort((a, b) => a.start_position - b.start_position);
        
        setHighLightPositionList(prevState => ({
            ...prevState, 
            key: positions
        }));

        return positions
    }

    // ----- 找到自己標記的 Position
    async function findHighLightListPosition_self () {
        if (processedList.length != 0) {

            let positions:TextPositionsType[] = [];
            const currentProcessed = processedList[readTheCurrentPage(currentPage)].processed;
            currentProcessed.map(item => {

                const itemKeyPosition = {
                    key: item.name,
                    start_position: item.position.start_position,
                    end_position: item.position.end_position
                }
                positions.push(itemKeyPosition);
            })

            positions.sort((a, b) => a.start_position - b.start_position);
            setHighLightPositionList(prevState => ({
                ...prevState, 
                self: positions
            }));

            return positions
        }

        return []
    }

    // ----- 找到 Comparator 標記的 Position
    async function findHighLightListPosition_comparator () {
        if (comparatorProcessedList.length != 0) {

            let positions:TextPositionsType[] = [];
            const currentProcessed = comparatorProcessedList[readTheCurrentPage(currentPage)].processed;
            currentProcessed.map(item => {

                const itemKeyPosition = {
                    key: item.name,
                    start_position: item.position.start_position,
                    end_position: item.position.end_position
                }
                positions.push(itemKeyPosition);
            })

            positions.sort((a, b) => a.start_position - b.start_position);
            setHighLightPositionList(prevState => ({
                ...prevState, 
                self: positions
            }));

            return positions
        }

        return []
    }

    const currentPagePositions = useMemo(() => {
        // 假設 readTheCurrentPage 返回當前頁面對應的 index
        const currentPageIndex = readTheCurrentPage(currentPage);
        const currentPageProcessed = processedList[currentPageIndex]?.processed;
        
        if (currentPageProcessed) {
            return currentPageProcessed.map(item => item.position.start_position).join(',');
        }
        return '';
    }, [processedList, currentPage]); // 確保 processedList 和 currentPage 變化時更新
    


    useEffect(() => {

        if (currentContentFieldKey == defaultFieldKey){
            setLoadingStates(prev => ({ ...prev, TextAreaHighlight: true }));
            findHighLightListPosition_key().then(key => {
                findHighLightListPosition_self().then(self => {
                    findHighLightListPosition_comparator().then(comparator => {

                        const _highLightPositionList:HighLightPositionListType  = { key: key, self: self, comparator: comparator, }
                        processTextAndHighlights(_highLightPositionList).then(result => {
                            setCurrentTextAreaVisual(result.text);
                            setHighLightPositionList(result.highlights || {
                                key: key,
                                self: self,
                                comparator: comparator,
                            })
                            setLoadingStates(prev => ({ ...prev, TextAreaHighlight: false }));
                            
                        }).catch(error => { console.log("processTextAndHighlights", error) });

                    }).catch(error => {console.log("findHighLightListPosition_comparator", error)})
                }).catch(error => {console.log("findHighLightListPosition_self", error)});
            }).catch(error => {console.log("findHighLightListPosition_key", error)});
        }
        else {
            setLoadingStates(prev => ({ ...prev, TextAreaHighlight: true }));
            findHighLightListPosition_key().then(key => {

                const _highLightPositionList:HighLightPositionListType  = { key: key, self: [], comparator: [], }
                processTextAndHighlights(_highLightPositionList).then(result => {
                    setCurrentTextAreaVisual(result.text);
                    setHighLightPositionList(result.highlights || {
                        key: key,
                        self: [],
                        comparator: [],
                    })
                    setLoadingStates(prev => ({ ...prev, TextAreaHighlight: false }));
                }).catch(error => { console.log("processTextAndHighlights", error) });

            }).catch(error => {console.log("findHighLightListPosition_key", error)});
        }
        
    }, [currentFileContentVisual, isBreakSentence, highLightList_key, currentPagePositions, comparatorProcessedList, currentFileName, currentPage, currentContentFieldKey])


    const [tempHighLightList, setTempHighLightList] = useState<string>(highLightList_key.join(', '));
    const handleOk = () => {
        // 移除多餘的空白和逗號
        const newList = tempHighLightList
                        .split(',')
                        .map(item => item.trim())
                        .filter(item => item !== '');
    
        setHighLightList_key(newList);
        setTempHighLightList(newList.join(', '))
    };

    // ----- 進入網頁執行一次 Init
    useEffect(() => { cleanTheField(); fetchFilesName(); }, [account]);

    useEffect(() => {
        // 如果已經有 storedAccount，則重定向到標籤資料頁面
        if (storedAccount) {
            navigate(webRoutes.labelData);
        }
    }, [navigate, storedAccount]);

    // ---------------------------------------------------------------------------------------------------- Return 

    return (
    <Spin spinning={isLoading} tip="Loading...">
        
        {/* 開關位置  */}
        <div className="mb-4 space-x-2">
            <a onClick={cleanIsVisible}>隱藏空間</a>
            <Button onClick={chooseIsVisible(0)} className={isVisible[0] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Actions</Button>
            <Button onClick={chooseIsVisible(1)} className={isVisible[1] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Labels Checked</Button>
            <Button onClick={chooseIsVisible(2)} className={isVisible[2] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Add Extraction Label</Button>
            <Button onClick={chooseIsVisible(3)} className={isVisible[3] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Extraction Labels</Button>
            <Button onClick={chooseIsVisible(4)} className={isVisible[4] ? 'ant-btn-none' : 'ant-btn-notChosen'}>Labels View</Button>
            <Button onClick={chooseIsVisible(5)} className={isVisible[5] ? 'ant-btn-none' : 'ant-btn-notChosen'}>TextArea Dashboard</Button>
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
                            placeholder="1. Select the File Name"
                            optionFilterProp="children"
                            filterOption={labelValue_selectedFilterOption}
                            options={filesNameList}
                            onChange={chooseTheFile}
                            value={currentFileName == "" ? null : currentFileName}
                            loading={isLoading} 
                            showSearch />

                        <Select 
                            className='col-span-2' 
                            placeholder="2. Select the Fields Name"
                            optionFilterProp="children"
                            filterOption={labelValue_selectedFilterOption}
                            options={fileFieldsList}
                            onChange={(e) => { 
                                setCurrentContentFieldKey(e);
                                setCurrentFileContentVisual((contentList[readTheCurrentPage(currentPage)] as any)[e]);
                            }}
                            value={currentContentFieldKey == "" ? null : currentContentFieldKey}
                            loading={isLoading} 
                            showSearch />

                        <Button 
                            className='col-span-1 ant-btn-store'
                            onClick={uploadProcessedFile} 
                            disabled={currentFileName == null || contentList.length === 0}>
                            Store </Button>

                    </div>

                    <HighlightArea 
                        textAreaPx={textAreaPx}
                        textValue={currentTextAreaVisual}
                        onTextSelection={handleTextSelection}
                        highlightList={highLightPositionList}
                        highlightColor={{
                            key: "#ffdd0064",
                            self: "#fc27275c",
                            comparator: "#4b69ff51"
                        }}
                        isOpenHighLight={isOpenHighLight}
                        isBreakSentence={isBreakSentence} />

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
                        <div className='grid gap-2 mb-4 grid-cols-2'>
                            <Button 
                                className="w-full ant-btn-check"  
                                icon={<DownloadOutlined />} 
                                disabled={!currentFileName}
                                onClick={downloadProcessedFile}> 
                                <span className="btn-text">Download txt</span> 
                            </Button>
                            <Button 
                                className="w-full ant-btn-downloadExcel"
                                icon={<DownloadOutlined />} 
                                disabled={!currentFileName}
                                onClick={downloadExcel}> 
                                <span className="btn-text">Download Excel</span> 
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
                    </Card>
                </>}


                {/* TextArea Dashboard */}
                {isVisible[5] && <>
                    <Card bordered={false} className="w-full cursor-default grid gap-4 mb-4"  title={"TextArea Dashboard"}
                        extra={ <Button icon={<CloseOutlined />} type="text" onClick={chooseIsVisible(5)}></Button>}>

                        <div >
                            <Select
                                    className='w-full mb-4'
                                    filterOption={accountList_selectedFilterOption}
                                    options={accountList}
                                    value={currentComparator}
                                    placeholder="選擇比對對象"
                                    onChange={(e) => {
                                        fetchComparatorProcessedContent(currentFileName || "", e)
                                        setCurrentComparator(e)
                                    }}
                            />

                            {/* 選項 */}
                            <ConfigProvider 
                                theme={{
                                    components: {
                                        Switch: {
                                            handleBg: "#ffffff",
                                            colorPrimary: "#188035be",
                                            colorPrimaryHover: "#1880358a",
                                            colorTextTertiary: "#0916231b"
                                        },},
                                    }}
                                >
                                <div className='grid gap-2 mb-4 grid-cols-3' >
                                    <Switch className='w-full' checkedChildren="開啟：關鍵字" unCheckedChildren="關閉：關鍵字" defaultChecked={isOpenHighLight.key}
                                        onChange={(e) => setIsOpenHighLight(prevState => ({ ...prevState, key: e }))} />
                                    <Switch className='w-full' checkedChildren="開啟標記紀錄" unCheckedChildren="關閉：標記紀錄" defaultChecked={isOpenHighLight.self}
                                    onChange={(e) => setIsOpenHighLight(prevState => ({  ...prevState,  self: e })) } />
                                    <Switch className='w-full' checkedChildren="開啟：比對標記" unCheckedChildren="關閉：比對標記" defaultChecked={isOpenHighLight.comparator}
                                        onChange={(e) => setIsOpenHighLight(prevState => ({ ...prevState,   comparator: e })) } />
                                </div>
                            </ConfigProvider>
                            

                            <p className='mb-3'>關鍵字高光：<br />注意每個想高光的單字需要用逗號隔開！預設為欄位，可自行修改 <br/> 該結果不會儲存到下次使用，請自己筆記</p>
                            <TextArea  
                                style={{fontSize: textAreaPx||18}}
                                value={tempHighLightList} 
                                onChange={(e) => setTempHighLightList(e.target.value)}
                                autoSize={{minRows: 10}} />

                            <Button 
                                className="w-full ant-btn-check mt-4"  
                                icon={<DownloadOutlined />} 
                                disabled={!currentFileName}
                                onClick={handleOk}> 
                                <span className="btn-text">Update Text Area</span> 
                            </Button>

                        </div>

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

                        <Button className='mr-2' onClick={() => setIsTableModalOpen(true)} disabled={currentFileName == null || contentList.length === 0}>
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

        {/* 高光編輯 */}
        
    
        {/* 編輯欄位 */}
        <Modal 
            open={isTableModalOpen} 
            title= {<> Label Table View </>}
            okButtonProps={{className: "ant-btn-check"}} 
            onCancel={(e) => setIsTableModalOpen(false)}
            onOk={(e) => {
                setIsTableModalOpen(false);
                handleClickOK();
            }}>
            
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

