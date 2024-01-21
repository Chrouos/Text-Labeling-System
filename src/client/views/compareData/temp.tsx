// -v- handle - 處理「當前」頁面的 GPT
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

// -v- handle -v- 處理「全部」頁面的 GPT
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

// -v- handle - 處理 RE 
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


// -v- autoVariable -v- 自動生成
// const ProcessedFieldsTemplate = <T extends Partial<ProcessedFieldsType>>(fields: T): ProcessedFieldsType => {

//     const exampleProcessedFields: ProcessedFieldsType = {
//         name: "",
//         value: "",
//         the_surrounding_words: "",
//         regular_expression_match: "",
//         regular_expression_formula: "",
//         gpt_value: "",
//         pre_normalize_value: ""
//     };
    
//       // 使用 Object.keys 在這個示例對象上，以獲取所有的鍵
//     const defaultFields = Object.keys(exampleProcessedFields).reduce((acc, key) => {
//         acc[key as keyof ProcessedFieldsType] = "";
//         return acc;
//     }, {} as ProcessedFieldsType);

//     return {
//         ...defaultFields,
//         ...fields
//     };
    // }




const HighlightSequence: React.FC<{ text: string, highlights: HighLightPositionListType, highlightColor: highlightColor }> = ({ text, highlights, highlightColor }) => {

    type ExtendedTextPositionType ={ key: string, position: number, type: 'start' | 'end', from: 'key' | 'self' | 'comparator' };
    function transformHighlights(highlights: HighLightPositionListType): ExtendedTextPositionType[] {
        let result: ExtendedTextPositionType[] = [];
    
        Object.entries(highlights).forEach(([from, positions]) => {
            positions.forEach(position => {
                result.push({
                    key: position.key,
                    position: position.start_position,
                    type: 'start',
                    from: from as 'key' | 'self' | 'comparator'
                });
                result.push({
                    key: position.key,
                    position: position.end_position,
                    type: 'end',
                    from: from as 'key' | 'self' | 'comparator'
                });
            });
        });
        result.sort((a, b) => a.position - b.position);
        return result;
    }

    const highlightText = (temp_text: string, highlights: HighLightPositionListType, highlightColor: highlightColor) => {

        let lastIndex = 0;
        let highlightedText = [];
        highlights.key.forEach((item, index) => {
            highlightedText.push(text.substring(lastIndex, item.start_position));
            highlightedText.push(
                <span key={index} style={{ backgroundColor: highlightColor.key }}>
                    {text.substring(item.start_position, item.end_position)}
                </span>
            );
            lastIndex = item.end_position;
        });

        highlightedText.push(text.substring(lastIndex));
        return highlightedText;
    };

    return (
        <>
            {highlightText(text, highlights, highlightColor)}
        </>
    );
};








－－－－－



useEffect(() => {
    const handleSelectionChange = () => {
        if (divRef.current && document.contains(divRef.current)) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (divRef.current.contains(range.commonAncestorContainer)) {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const selectedText = range.toString();
            
                        // 計算選取文本的起始位置
                        const preCaretRange = range.cloneRange();
                        preCaretRange.selectNodeContents(divRef.current);
                        preCaretRange.setEnd(range.startContainer, range.startOffset);
                        const start = preCaretRange.toString().length;
            
                        if (selectedText) {
                            onTextSelection(selectedText, textValue, start);
                        }
                    }
                }
            }
        }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
    };
}, []);



useEffect(() => {
    const handleMouseUp = () => {
        if (divRef.current && document.contains(divRef.current)) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (divRef.current.contains(range.commonAncestorContainer)) {
                    const selectedText = range.toString();

                    // 計算選取文本的起始位置
                    const preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(divRef.current);
                    preCaretRange.setEnd(range.startContainer, range.startOffset);
                    const start = preCaretRange.toString().length;

                    if (selectedText) {
                        onTextSelection(selectedText, textValue, start);
                    }
                }
            }
        }
    };

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
        document.removeEventListener('mouseup', handleMouseUp);
    };
}, []);