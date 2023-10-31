import { useEffect, useState, FC } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register (
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface HorizontalBarChartProps {
    labels: string[];
    datasets: {
        label: string,
        data: number[],
        borderColor: string,
        backgroundColor: string

    }[];
}
export const HorizontalBarChart: FC<HorizontalBarChartProps>  = (props) => {

    // 定義 ChartJs.
    const options = {
        indexAxis: 'y' as const,    // => y=水平, x=垂直
        elements: {
            bar: {
                borderWidth: 2, // => 設定條形的邊框寬度為 2 像素
            },
        },
        responsive: true, // => 當視窗大小改變時，圖表會自動調整大小
        plugins: {
            legend: {
                position: 'right' as const, // => 定義圖例的各種選項, 設定圖例顯示在圖表的右側
            },
            title: {
                display: true, // => 顯示標題
                text: 'Chart.js Horizontal Bar Chart',
            },
        },
    };

    const labels = props.labels || [];
    const transformedDatasets = props.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.borderColor,
        backgroundColor: dataset.backgroundColor
    }));
    

    const data = {
        labels,
        datasets: transformedDatasets
    };

    return ( 
        <div>
            <Bar options={options} data={data} />;
        </ div> 
    )
}