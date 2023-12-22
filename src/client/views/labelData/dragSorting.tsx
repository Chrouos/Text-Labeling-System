import React, { useState, useEffect } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface DataType {
    name: string;
    checked: boolean;
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
}

interface DragSortingProps {
    processLabelOptions: string[];
    setSortOptions: React.Dispatch<React.SetStateAction<string[]>>;
    setDefaultCheck: React.Dispatch<React.SetStateAction<CheckboxValueType[]>>;
    defaultCheck: CheckboxValueType[];
}

const Row = (props: RowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        cursor: 'move',
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
};

const DragSorting: React.FC<DragSortingProps> = ({ processLabelOptions, setSortOptions, setDefaultCheck, defaultCheck }) => {

    useEffect(() => {
        if (processLabelOptions.length > 0) {

            const defaultCheckedItems = defaultCheck; // 替換為您的預設勾選項目
            const newData = processLabelOptions.map(name => ({
                name,
                checked: defaultCheckedItems.includes(name)
            }));
            setDataSource(newData);
            setDefaultCheck(defaultCheckedItems);   // 更新預設勾選狀態
        }
    }, [processLabelOptions]);


    const columns: ColumnsType<DataType> = [
        {
            title: '',
            dataIndex: 'check',
            width: '20px',
            render: (_, record) => (
                <input
                    type="checkbox"
                    checked={record.checked}
                    onChange={() => handleCheckChange(record.name)}
                />
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
        },
    ];

    const [dataSource, setDataSource] = useState<DataType[]>([]);



    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
    );

    const handleCheckChange = (name: string) => {
        setDataSource(prev => {
            const newDataSource = prev.map(item =>
                item.name === name ? { ...item, checked: !item.checked } : item
            );
    
            // 使用新的數據源更新勾選狀態
            const newCheckedItems = newDataSource.filter(item => item.checked).map(item => item.name);
            setDefaultCheck(newCheckedItems);
    
            return newDataSource;
        });
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setDataSource(prev => {
                const activeIndex = prev.findIndex(item => item.name === active.id);
                const overIndex = prev.findIndex(item => item.name === over?.id);
                const newDataSource = arrayMove(prev, activeIndex, overIndex);
    
                const newSortOptions = newDataSource.map(item => item.name);
                setSortOptions(newSortOptions);
                
                return newDataSource;
            });
        }
    };

    return (
        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            <SortableContext
                // rowKey array
                items={dataSource.map((i: DataType) => i.name)}
                strategy={verticalListSortingStrategy}
            >
                <Table
                    components={{
                        body: {row: Row},
                    }}
                    rowKey="name"
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                    style={{
                        maxHeight: '500px',
                        overflow: 'auto',
                    }}
                />
            </SortableContext>
        </DndContext>
    );
};

export default DragSorting;