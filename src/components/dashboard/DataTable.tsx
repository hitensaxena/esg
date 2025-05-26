import { useState, useEffect } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon } from '@heroicons/react/20/solid';

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  keyField: string;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
}

export default function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  className = '',
  emptyState,
  loading = false,
  loadingRows = 5,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [sortedData, setSortedData] = useState<T[]>([]);

  // Apply sorting when data or sort config changes
  useEffect(() => {
    if (!sortConfig || !data.length) {
      setSortedData([...data]);
      return;
    }

    const sortableColumn = columns.find(col => col.key === sortConfig.key);
    if (!sortableColumn?.sortable) {
      setSortedData([...data]);
      return;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      // Handle undefined/null values
      if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

      // Compare values
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setSortedData(sorted);
  }, [data, sortConfig, columns]);

  const requestSort = (key: string) => {
    const sortableColumn = columns.find(col => col.key === key);
    if (!sortableColumn?.sortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowsUpDownIcon className="ml-2 h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUpIcon className="ml-2 h-4 w-4 text-gray-900" />
    ) : (
      <ArrowDownIcon className="ml-2 h-4 w-4 text-gray-900" />
    );
  };

  const renderCell = (row: T, column: Column) => {
    const value = row[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    // Default rendering
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }
    
    return String(value);
  };

  const displayData = sortConfig ? sortedData : data;

  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <tr key={`loading-${rowIndex}`} className="animate-pulse">
                {columns.map((column, colIndex) => (
                  <td
                    key={`loading-${rowIndex}-${colIndex}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!displayData.length) {
    return (
      <div className={`text-center py-12 ${className}`}>
        {emptyState || (
          <div className="text-gray-500">No data available</div>
        )}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${column.className || ''}`}
                onClick={() => column.sortable && requestSort(column.key)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.map((row) => (
            <tr
              key={String(row[keyField as keyof T])}
              onClick={() => onRowClick?.(row)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            >
              {columns.map((column, index) => (
                <td
                  key={`${String(row[keyField as keyof T])}-${column.key || index}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {renderCell(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
