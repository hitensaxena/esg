import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  ScaleOptions,
} from 'chart.js';
import { useState, useEffect } from 'react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
  height?: string | number;
  width?: string | number;
  xAxisTitle?: string;
  yAxisTitle?: string;
  stacked?: boolean;
}

export default function BarChart({ 
  title, 
  labels, 
  datasets, 
  height = '400px',
  width = '100%',
  xAxisTitle,
  yAxisTitle,
  stacked = false
}: BarChartProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Define chart options with proper types
  const options: ChartOptions<'bar'> = {
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
        beginAtZero: true,
        title: {
          display: !!yAxisTitle,
          text: yAxisTitle,
        },
        grid: {
          drawBorder: false,
          display: true,
        },
        stacked: stacked,
      } as ScaleOptions<'linear'>,
      x: {
        title: {
          display: !!xAxisTitle,
          text: xAxisTitle,
        },
        grid: {
          display: false,
        },
        stacked: stacked,
      } as ScaleOptions<'category'>,
    },
  };

  const chartData = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      borderWidth: dataset.borderWidth || 1,
      borderRadius: 4,
      borderSkipped: 'start' as const,
    })),
  };

  // Stacked configuration is now handled in the options object directly

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
      <Bar options={options} data={chartData} />
    </div>
  );
}
