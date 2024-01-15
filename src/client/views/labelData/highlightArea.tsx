import React, { useRef, useEffect, useCallback, createContext, useState } from 'react';
import { Tooltip } from 'antd';

type TextPositionsType = {key:string, start_position: number, end_position: number}
type highlightColor = {key: string, self: string, comparator: string}
type HighLightPositionListType = {
    key: TextPositionsType[],
    self: TextPositionsType[],
    comparator: TextPositionsType[]
}

// -> To Find the Position
const HighlightedText_Key: React.FC<{ text: string, highlights: TextPositionsType[], highlightColor: highlightColor }> = ({ text, highlights, highlightColor }) => {

    const highlightText = (temp_text: string, highlights: TextPositionsType[], highlightColor: highlightColor) => {

        // const text = temp_text.replace(/\n/g, '').replace(/\s/g, '');

        let lastIndex = 0;
        let highlightedText = [];
        highlights.forEach((item, index) => {
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

interface HighlightAreaProps {
    textAreaPx: number | null;
    textValue: string; 
    onTextSelection: (selectedText: string, fullText: string, startPosition: number) => void; 
    highlightList: TextPositionsType[],
    highlightColor: highlightColor,
    isBreakSentence: boolean
}

const HighlightArea: React.FC<HighlightAreaProps> = ({ 
    textAreaPx, textValue, onTextSelection, highlightList, highlightColor, isBreakSentence }) => {
    const divRef = useRef<HTMLDivElement>(null);

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

    const processTextAndHighlights = () => {
        if (!isBreakSentence) return { text: textValue, highlights: highlightList };
    
        let adjustedHighlights:TextPositionsType[] = JSON.parse(JSON.stringify(highlightList));
        let sentences = "";
        let currentFileContentArray = Array.from(textValue);
        
        // 遍歷每一個字符
        for (let i = 0; i < currentFileContentArray.length; i++) {

            let char = currentFileContentArray[i];
            let nextChar = currentFileContentArray[i + 1];
            let addChar = char;
            let positionAdjustment = 0;
    
            if ((char === '。' || char === '？' || char === '！') && !(nextChar === '「' || nextChar === '」')) {
                positionAdjustment = 2; // 換行和制表符
                sentences += addChar + "\n\t";
            } else {
                sentences += addChar;
            }
    
            // 更新 highlightList 中的位置
            adjustedHighlights = adjustedHighlights.map(highlight => {
                if (highlight.start_position >= sentences.length -2 ) {
                    return {
                        ...highlight,
                        start_position: highlight.start_position + positionAdjustment,
                        end_position: highlight.end_position + positionAdjustment
                    };
                }
                return highlight;
            });
        }
    
        return { text: sentences, highlights: adjustedHighlights };
    };
    

    const [adjustedHighlights, setAdjustedHighlights] = useState<TextPositionsType[]>([]);
    const [currentTextValue, setCurrentTextValue] = useState<string>("");
    useEffect(() => {
        const processedTextAndHighlight:{text:string, highlights:TextPositionsType[]} = processTextAndHighlights();
        setCurrentTextValue(processedTextAndHighlight.text)
        setAdjustedHighlights(processedTextAndHighlight.highlights)

        // console.log(highlightList, processedTextAndHighlight.highlights)
    }, [isBreakSentence, highlightList, textValue]);

    /**
     * level of highlight color
     * 
     * 1: 自己標記的部分 yellow
     * 2: 另一邊標記的部分 blue
     * 3: 關鍵字 gray
     */

    

    return (
        <div ref={divRef} style={divTextAreaStyled} >
            <HighlightedText_Key 
                text={currentTextValue} 
                highlights={adjustedHighlights} 
                highlightColor={highlightColor} />
        </div>
    );
};

export default HighlightArea;
