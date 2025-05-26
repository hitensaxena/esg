import { format, subMonths, eachMonthOfInterval, isWithinInterval, parseISO } from 'date-fns';

// Generate labels for the last N months
export const generateMonthLabels = (months: number, endDate = new Date()): string[] => {
  const startDate = subMonths(endDate, months - 1);
  const monthsList = eachMonthOfInterval({
    start: startDate,
    end: endDate,
  });
  
  return monthsList.map(date => format(date, 'MMM yyyy'));
};

// Format numbers with commas and optional decimal places
export const formatNumber = (value: number, decimals = 0): string => {
  if (value === null || value === undefined) return '0';
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Calculate percentage change between two values
export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

// Format percentage with sign
export const formatPercent = (value: number, decimals = 1): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

// Filter data by date range
export const filterByDateRange = <T extends { date: string | Date }>(
  data: T[],
  startDate: Date,
  endDate: Date
): T[] => {
  return data.filter(item => {
    const itemDate = typeof item.date === 'string' ? parseISO(item.date) : item.date;
    return isWithinInterval(itemDate, { start: startDate, end: endDate });
  });
};

// Generate random color with opacity
export const generateRandomColor = (opacity = 1): string => {
  const r = Math.floor(Math.random() * 200) + 55;
  const g = Math.floor(Math.random() * 200) + 55;
  const b = Math.floor(Math.random() * 200) + 55;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Generate a color palette
export const generateColorPalette = (count: number, opacity = 0.7): string[] => {
  const colors = [
    'rgba(99, 102, 241, $opacity)',  // indigo
    'rgba(59, 130, 246, $opacity)',  // blue
    'rgba(16, 185, 129, $opacity)',  // emerald
    'rgba(245, 158, 11, $opacity)',  // amber
    'rgba(239, 68, 68, $opacity)',   // red
    'rgba(139, 92, 246, $opacity)',  // violet
    'rgba(20, 184, 166, $opacity)',  // teal
    'rgba(249, 115, 22, $opacity)',  // orange
    'rgba(236, 72, 153, $opacity)',  // pink
    'rgba(132, 204, 22, $opacity)',  // lime
  ];
  
  // If we need more colors than we have predefined, generate random ones
  if (count > colors.length) {
    const additionalColors = Array.from(
      { length: count - colors.length },
      () => generateRandomColor(opacity)
    );
    return [...colors, ...additionalColors];
  }
  
  return colors.slice(0, count).map(color => color.replace('$opacity', String(opacity)));
};

// Format date for display
export const formatDisplayDate = (date: Date | string | number, formatStr = 'MMM d, yyyy'): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

// Generate mock data for charts (for development)
export const generateMockTimeseriesData = (
  count: number,
  min: number,
  max: number,
  startDate = new Date()
): { date: Date; value: number }[] => {
  const data = [];
  let currentValue = Math.random() * (max - min) + min;
  
  for (let i = 0; i < count; i++) {
    const date = subMonths(startDate, count - i - 1);
    // Random walk for more realistic data
    currentValue += (Math.random() - 0.5) * (max - min) * 0.1;
    currentValue = Math.max(min, Math.min(max, currentValue)); // Clamp value
    
    data.push({
      date,
      value: parseFloat(currentValue.toFixed(2)),
    });
  }
  
  return data;
};
