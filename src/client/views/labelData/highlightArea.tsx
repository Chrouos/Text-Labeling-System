import React, { useRef, useEffect, useCallback, createContext, useState, useContext} from 'react';
import { Tooltip } from 'antd';

import './highlightArea.css'

type TextPositionsType = {key:string, start_position: number, end_position: number}
type highlightColor = {key: string, self: string, comparator: string, [key: string]: string}
type HighLightPositionListType = {
    key: TextPositionsType[],
    self: TextPositionsType[],
    comparator: TextPositionsType[],
    [key: string]: TextPositionsType[]
}
type isOpenHighLightType = {
    key: boolean,
    self: boolean,
    comparator: boolean,
    [key: string]: boolean
}
interface HighlightAreaProps {
    textAreaPx: number | null;
    textValue: string; 
    onTextSelection: (selectedText: string, fullText: string, startPosition: number) => void; 
    highlightList: HighLightPositionListType,
    highlightColor: highlightColor,
    isOpenHighLight: isOpenHighLightType,
    isBreakSentence: boolean
}



const HighlightArea: React.FC<HighlightAreaProps> = ({ 
    textAreaPx, textValue, onTextSelection, highlightList, highlightColor, isOpenHighLight, isBreakSentence  }) => {

    const currentIsOpenHighLight = isOpenHighLight || {
        key: false,
        self: false,
        comparator: false
    }
        
    const divRef = useRef<HTMLDivElement>(null);
    const [showTooltip, setShowTooltip] = useState(false); // 新增狀態變量
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "z" || event.key === "Z") { // 當按下 Z 鍵時顯示 Tooltip
                setShowTooltip(true);
            }
        };
    
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key ) { // 當放開 Z 鍵時隱藏 Tooltip
                setShowTooltip(false);
            }
        };
    
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
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
                            let accumulation_step = 0
                            console.log(isBreakSentence)
                            if (isBreakSentence){
                                for (let i = 0; i < textValue.length; i++) {
                                    let char = textValue[i];
                                    let nextChar = textValue[i + 1];
                                    if ((char === '。' || char === '？' || char === '！') && !(nextChar === '「' || nextChar === '」') && start > i   ) {
                                        accumulation_step -= 2
                                    } 
                                }
                            }
                            // console.log(start, accumulation_step, textValue.length)
                            onTextSelection(selectedText, textValue, start + accumulation_step ); // - (textValue.length + accumulation_step) 
                        }
                    }
                }
            }
        };
    
        document.addEventListener('mouseup', handleMouseUp);
    
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [textValue, isBreakSentence]);
    

    const currentHighlightList = {
        key: highlightList.key || [],
        self: highlightList.self || [],
        comparator: highlightList.comparator || [],
    }
    const currentHighlightColor = {
        key: highlightColor.key || "#ffe60039",
        self: highlightColor.self || "#ff6d6d46",
        comparator: highlightColor.comparator || "#4dc6fa45",
    }

    // 定義 div 的樣式
    const divTextAreaStyled = {
        border: '1px solid #ccc',
        padding: '8px',
        fontFamily: 'monospace',
        overflow: 'auto',
        minHeight: '100px',
        width: '100%',
        boxSizing: 'border-box' as const,
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-word' as const,
        height: '80vh',
        marginBottom: 24,
        fontSize: `${textAreaPx || 14}px` // 如果 textAreaPx 為 null，則使用 14px
    };

    return (
        <div ref={divRef} style={divTextAreaStyled} >
        
                <HighlightSequence
                    highlightColor={currentHighlightColor} 
                    text={textValue}
                    highlights={currentHighlightList}
                    showTooltip={showTooltip}
                    isOpenHighLight={currentIsOpenHighLight}
                    
                    />
        </div>
    );
    
};

export default HighlightArea;


const HighlightSequence: React.FC<{ text: string, highlights: HighLightPositionListType, highlightColor: highlightColor, 
        showTooltip: boolean, isOpenHighLight:isOpenHighLightType  }> 
        = ({ text, highlights, highlightColor, showTooltip, isOpenHighLight}) => {

    let lave_highlights:TextPositionsType[] = []
    

    const generateHighlightedText = (text: string, highlights: TextPositionsType[], highlightColor: string, showTooltip: boolean, generateIndex: number) => {

        let lastIndex = 0;
        let highlightedText = [];
        
        highlights.forEach((item, index) => {
            if (item.start_position <= lastIndex && item.start_position !== 0 && item.end_position !== 0) {
                lave_highlights.push(item)
                return;
            }

            if (item.start_position === 0 && item.end_position === 0) { // 檢查 start_position 或 end_position 是否為 0
                return; 
            }

            const currentKey = item.key || "";
            const currentClassName = showTooltip ? "sniper-tooltip" : ""
        
            highlightedText.push(text.substring(lastIndex, item.start_position));
            highlightedText.push(
                <Tooltip key={`${index}-${item.start_position}-tooltip-${generateIndex}`} title={currentKey} className={currentClassName} >
                    <span key={`${index}-${item.start_position}-${generateIndex}`} style={{ backgroundColor: highlightColor}}>
                        {text.substring(item.start_position, item.end_position)}
                    </span>
                </Tooltip>
            );
            lastIndex = item.end_position;
        });
        

        highlightedText.push(text.substring(lastIndex));
        return highlightedText;
        
    };


    const renderHighlights = (): JSX.Element[] => {
        let result: JSX.Element[] = [];
        let current_total_generateIndex = 0;
    
        Object.entries(highlights).forEach(([type, highlightPositions]) => {

            if (!isOpenHighLight[type]) {
                return;
            }

            result.push(
                <span className='textarea-position onlyHover' key={`${type}-${++current_total_generateIndex}`}>
                    {generateHighlightedText(text, highlights[type], highlightColor[type], showTooltip, current_total_generateIndex)}
                </span>
            );

            for (let i = 0; i <= 2; i++) {
                if (lave_highlights.length == 0) break

                let temp_highlights = [...lave_highlights];
                lave_highlights.length = 0; // 清空 lave_highlights
        
                result.push(
                    <span className='textarea-position onlyHover' key={`lave-${++current_total_generateIndex}`}>
                        {generateHighlightedText(text, temp_highlights, highlightColor[type], showTooltip, current_total_generateIndex)}
                    </span>
                );
            }
        });

        return result;
    };



    return (
        <>
            <div style={{position: "relative"}}>

                <span className='textarea-position'>{text}</span>                
                {renderHighlights()}
            </div>

        </>
    );
};
