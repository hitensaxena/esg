import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ScaleOptions,
} from 'chart.js';
import { useState, useEffect } from 'react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }[];
  height?: string | number;
  width?: string | number;
}

export default function LineChart({ 
  title, 
  labels, 
  datasets, 
  height = '400px',
  width = '100%'
}: LineChartProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          drawBorder: false,
          display: true,
        },
      } as ScaleOptions<'linear'>,
      x: {
        grid: {
          display: false,
        },
      } as ScaleOptions<'category'>,
    },
  };

  const chartData = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: dataset.borderColor,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: dataset.borderColor,
      fill: dataset.fill !== undefined ? dataset.fill : true,
      tension: dataset.tension || 0.3,
    })),
  };

  if (!isClient) {
    return (
      <div 
        className="bg-white p-4 rounded-lg shadow" 
        style={{ height, width }}
      >
        <div className="animate-pulse h-full w-full bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white p-4 rounded-lg shadow"
      style={{ height, width }}
    >
      <Line options={options} data={chartData} />
    </div>
  );
}
