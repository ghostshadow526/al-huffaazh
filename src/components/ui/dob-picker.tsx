'use client';

import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DateOfBirthPickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DateOfBirthPicker({ value, onChange, className }: DateOfBirthPickerProps) {
  const currentYear = new Date().getFullYear();
  // Years range from 1980 to currentYear
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const selectedYear = value ? value.getFullYear().toString() : '';
  const selectedMonth = value ? value.getMonth().toString() : '';
  const selectedDay = value ? value.getDate().toString() : '';

  // Calculate days in the selected month & year
  const daysInMonth = useMemo(() => {
    if (!selectedYear || selectedMonth === '') return 31;
    return new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const days = useMemo(() => {
    const list: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(d);
    }
    return list;
  }, [daysInMonth]);

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    const month = selectedMonth !== '' ? parseInt(selectedMonth) : 0;
    const day = selectedDay !== '' ? Math.min(parseInt(selectedDay), new Date(year, month + 1, 0).getDate()) : 1;
    onChange(new Date(year, month, day));
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    const year = selectedYear !== '' ? parseInt(selectedYear) : currentYear - 10;
    const day = selectedDay !== '' ? Math.min(parseInt(selectedDay), new Date(year, month + 1, 0).getDate()) : 1;
    onChange(new Date(year, month, day));
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr);
    const year = selectedYear !== '' ? parseInt(selectedYear) : currentYear - 10;
    const month = selectedMonth !== '' ? parseInt(selectedMonth) : 0;
    onChange(new Date(year, month, day));
  };

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {/* Year */}
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="h-12 border-2">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select value={selectedMonth} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-12 border-2">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {MONTHS.map((m, idx) => (
            <SelectItem key={idx} value={idx.toString()}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Day */}
      <Select value={selectedDay} onValueChange={handleDayChange}>
        <SelectTrigger className="h-12 border-2">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {days.map((d) => (
            <SelectItem key={d} value={d.toString()}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
