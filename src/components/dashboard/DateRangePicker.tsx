import { useState, useEffect } from 'react';
import { format, subMonths, parseISO } from 'date-fns';
import { CalendarIcon } from '@heroicons/react/20/solid';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  initialRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
}

export default function DateRangePicker({
  onDateRangeChange,
  initialRange,
  className = '',
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date>(
    initialRange?.start || subMonths(new Date(), 12)
  );
  const [endDate, setEndDate] = useState<Date>(
    initialRange?.end || new Date()
  );
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(
    format(initialRange?.start || subMonths(new Date(), 12), 'yyyy-MM-dd')
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    format(initialRange?.end || new Date(), 'yyyy-MM-dd')
  );

  useEffect(() => {
    onDateRangeChange(startDate, endDate);
  }, [startDate, endDate, onDateRangeChange]);

  const handleApply = () => {
    const newStartDate = parseISO(tempStartDate);
    const newEndDate = parseISO(tempEndDate);
    
    if (newStartDate > newEndDate) {
      alert('Start date cannot be after end date');
      return;
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(format(startDate, 'yyyy-MM-dd'));
    setTempEndDate(format(endDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const formatDisplayDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
        {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
