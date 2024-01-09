import React, { useRef, useEffect, useCallback, createContext, useState } from 'react';

interface HighlightAreaProps {
    textAreaPx: number | null;
    textValue: string; 
    onTextSelection: (selectedText: string, fullText: string, startPosition: number) => void; 
    highlightList: string[],
    highlightColor: string
}
    
const HighlightedText: React.FC<{ text: string, keywords: string[], highlightColor: string }> = ({ text, keywords, highlightColor }) => {

    const highlightKeywords = (text:string, keywords: string[], highlightColor:string) => {
        const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
            return text.split(regex).map((part, index) => 
                keywords.includes(part.toLowerCase()) ? 
                    <span key={index} style={{ backgroundColor: highlightColor }}>{part}</span> : 
                    part
        );
    };

    return (
        <>
            {highlightKeywords(text, keywords, highlightColor)}
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
            <HighlightedText text={textValue} keywords={highlightList} highlightColor={highlightColor} />
        </div>
    );
};

export default HighlightArea;
