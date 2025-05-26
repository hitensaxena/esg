'use client';

import { useState, useEffect } from 'react';
import { format, subMonths, startOfDay, endOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  initialRange: {
    start: Date;
    end: Date;
  };
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

export default function DateRangePicker({
  initialRange,
  onDateRangeChange,
  className = '',
}: DateRangePickerProps) {
  // Ensure we're working with Date objects and normalize them to start/end of day
  const [startDate, setStartDate] = useState<Date>(() => 
    initialRange.start ? startOfDay(new Date(initialRange.start)) : new Date()
  );
  const [endDate, setEndDate] = useState<Date>(() => 
    initialRange.end ? endOfDay(new Date(initialRange.end)) : new Date()
  );
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setStartDate(initialRange.start ? startOfDay(new Date(initialRange.start)) : new Date());
      setEndDate(initialRange.end ? endOfDay(new Date(initialRange.end)) : new Date());
    }
  }, [initialRange, isMounted]);

  const handleApply = () => {
    onDateRangeChange(startDate, endDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setStartDate(initialRange.start);
    setEndDate(initialRange.end);
    setIsOpen(false);
  };

  // Don't render anything on the server to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className={cn('w-[300px] h-10', className)} />
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className={className}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !startDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? (
              endDate ? (
                <span>
                  {format(startDate, 'LLL dd, y')} - {format(endDate, 'LLL dd, y')}
                </span>
              ) : (
                <span>{format(startDate, 'LLL dd, y')}</span>
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">From</h4>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date: Date | undefined) => date && setStartDate(date)}
                  initialFocus
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">To</h4>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date: Date | undefined) => date && setEndDate(date)}
                  initialFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}
