import React, { useRef, useEffect, useCallback, createContext, useState } from 'react';
import { Tooltip } from 'antd';

type TextPositionsType = {key:string, start_position: number, end_position: number}

interface HighlightAreaProps {
    textAreaPx: number | null;
    textValue: string; 
    onTextSelection: (selectedText: string, fullText: string, startPosition: number) => void; 
    highlightList: TextPositionsType[],
    highlightColor: string
}

// -> To Find the Position
const HighlightedText_Key: React.FC<{ text: string, highlights: TextPositionsType[], highlightColor: string }> = ({ text, highlights, highlightColor }) => {

    const highlightText = (text: string, highlights: TextPositionsType[], highlightColor: string) => {
        let lastIndex = 0;
        let highlightedText = [];

        highlights.forEach((item, index) => {
            highlightedText.push(text.substring(lastIndex, item.start_position));
            highlightedText.push(
                <span key={index} style={{ backgroundColor: highlightColor }}>
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


const HighlightArea: React.FC<HighlightAreaProps> = ({ textAreaPx, textValue, onTextSelection, highlightList, highlightColor }) => {
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



    return (
        <div ref={divRef} style={divTextAreaStyled} >
            <HighlightedText_Key text={textValue} highlights={highlightList} highlightColor={highlightColor} />
        </div>
    );
};

export default HighlightArea;
