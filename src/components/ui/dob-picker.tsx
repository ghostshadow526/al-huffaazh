'use client';

import * as React from 'react';
import { format, setMonth, setYear, setDate, getYear, getMonth, getDate, getDaysInMonth, isValid } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Sparkles, Calendar as CalendarGlyph, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateOfBirthPickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  minYear?: number;
  maxYear?: number;
  className?: string;
  placeholder?: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DateOfBirthPicker({
  value,
  onChange,
  disabled,
  minYear = 1950,
  maxYear = new Date().getFullYear(),
  className,
  placeholder = 'Select Date of Birth (Year, Month, Day)',
}: DateOfBirthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [pickerMode, setPickerMode] = React.useState<'calendar' | 'dropdowns'>('dropdowns');

  // Compute a sensible default year for students (~10 years old if no date selected)
  const defaultYear = value ? getYear(value) : Math.max(minYear, maxYear - 10);
  const defaultMonth = value ? getMonth(value) : 0;
  const defaultDay = value ? getDate(value) : 1;

  const [selectedYear, setSelectedYear] = React.useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(defaultMonth);
  const [selectedDay, setSelectedDay] = React.useState<number>(defaultDay);

  // Sync internal state when external value changes
  React.useEffect(() => {
    if (value && isValid(value)) {
      setSelectedYear(getYear(value));
      setSelectedMonth(getMonth(value));
      setSelectedDay(getDate(value));
    }
  }, [value]);

  // Year options list descending: maxYear down to minYear
  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Compute number of days in the currently selected month and year
  const daysInCurrentMonth = React.useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth, 1));
  }, [selectedYear, selectedMonth]);

  // Ensure selected day is valid for the current month
  React.useEffect(() => {
    if (selectedDay > daysInCurrentMonth) {
      setSelectedDay(daysInCurrentMonth);
      if (value) {
        onChange(new Date(selectedYear, selectedMonth, daysInCurrentMonth));
      }
    }
  }, [daysInCurrentMonth, selectedDay, selectedMonth, selectedYear, value, onChange]);

  // Calculate calendar days grid for the selected month and year
  const calendarDays = React.useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const days: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];

    // Days from previous month
    const prevMonthDays = getDaysInMonth(
      new Date(selectedYear, selectedMonth === 0 ? 11 : selectedMonth - 1, 1)
    );
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(
        selectedMonth === 0 ? selectedYear - 1 : selectedYear,
        selectedMonth === 0 ? 11 : selectedMonth - 1,
        d
      );
      days.push({ day: d, isCurrentMonth: false, date: prevDate });
    }

    // Days of current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const date = new Date(selectedYear, selectedMonth, d);
      days.push({ day: d, isCurrentMonth: true, date });
    }

    // Days from next month to fill grid (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(
        selectedMonth === 11 ? selectedYear + 1 : selectedYear,
        selectedMonth === 11 ? 0 : selectedMonth + 1,
        d
      );
      days.push({ day: d, isCurrentMonth: false, date: nextDate });
    }

    return days;
  }, [selectedYear, selectedMonth, daysInCurrentMonth]);

  // Handlers for month, year, day changes
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setSelectedYear(newYear);
    const newDate = new Date(newYear, selectedMonth, Math.min(selectedDay, getDaysInMonth(new Date(newYear, selectedMonth, 1))));
    onChange(newDate);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setSelectedMonth(newMonth);
    const newDate = new Date(selectedYear, newMonth, Math.min(selectedDay, getDaysInMonth(new Date(selectedYear, newMonth, 1))));
    onChange(newDate);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(e.target.value, 10);
    setSelectedDay(newDay);
    const newDate = new Date(selectedYear, selectedMonth, newDay);
    onChange(newDate);
  };

  const handleDayClick = (date: Date) => {
    setSelectedYear(getYear(date));
    setSelectedMonth(getMonth(date));
    setSelectedDay(getDate(date));
    onChange(date);
    setOpen(false);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      if (selectedYear > minYear) {
        setSelectedYear(selectedYear - 1);
        setSelectedMonth(11);
      }
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      if (selectedYear < maxYear) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(0);
      }
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const quickJumpDecade = (decadeYear: number) => {
    const targetYear = Math.min(maxYear, Math.max(minYear, decadeYear));
    setSelectedYear(targetYear);
    const newDate = new Date(targetYear, selectedMonth, Math.min(selectedDay, getDaysInMonth(new Date(targetYear, selectedMonth, 1))));
    onChange(newDate);
  };

  const quickJumpAge = (age: number) => {
    const targetYear = maxYear - age;
    setSelectedYear(targetYear);
    const newDate = new Date(targetYear, selectedMonth, Math.min(selectedDay, getDaysInMonth(new Date(targetYear, selectedMonth, 1))));
    onChange(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full h-12 text-base px-4 font-normal justify-between rounded-lg border-2 shadow-sm transition-colors text-left',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
            <span className="truncate font-medium text-foreground">
              {value && isValid(value) ? format(value, 'PPP') : placeholder}
            </span>
          </div>
          <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground shrink-0 font-medium">
            Change
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[calc(100vw-32px)] sm:w-[380px] p-0 rounded-2xl shadow-2xl border-2 z-50 overflow-hidden bg-card"
        align="start"
      >
        {/* Header / Mode Switcher */}
        <div className="bg-primary/5 p-3.5 border-b flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Date of Birth Selector
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select Year, Month, and Day
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setPickerMode('dropdowns')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1',
                pickerMode === 'dropdowns'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Selectors
            </button>
            <button
              type="button"
              onClick={() => setPickerMode('calendar')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1',
                pickerMode === 'calendar'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarGlyph className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>
        </div>

        {/* Year & Month Selection Controls - Dedicated Native Dropdowns (Zero Glitch / Native Wheel on Mobile) */}
        <div className="p-3.5 space-y-3 bg-card border-b">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Month Dropdown */}
            <div className="space-y-1">
              <label htmlFor="dob-month-select" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Month
              </label>
              <div className="relative">
                <select
                  id="dob-month-select"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="w-full h-11 px-3 text-sm font-semibold rounded-lg border-2 border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year Dropdown */}
            <div className="space-y-1">
              <label htmlFor="dob-year-select" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Year
              </label>
              <div className="relative">
                <select
                  id="dob-year-select"
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="w-full h-11 px-3 text-sm font-bold rounded-lg border-2 border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-mono"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Decade Jump Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0">Decade:</span>
            {[2020, 2015, 2010, 2005, 2000, 1995, 1990].map((dec) => (
              <button
                key={dec}
                type="button"
                onClick={() => quickJumpDecade(dec)}
                className={cn(
                  'shrink-0 px-2 py-0.5 rounded-md font-medium text-[11px] border transition-colors',
                  selectedYear >= dec && selectedYear < dec + 5
                    ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                    : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {dec}s
              </button>
            ))}
          </div>

          {/* Quick Age Shortcuts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0">Age:</span>
            {[5, 7, 9, 11, 13, 15, 17].map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => quickJumpAge(age)}
                className={cn(
                  'shrink-0 px-2 py-0.5 rounded-md font-medium text-[11px] border transition-colors',
                  maxYear - selectedYear === age
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {age} yrs
              </button>
            ))}
          </div>
        </div>

        {/* View Mode: Dropdowns vs Calendar Grid */}
        {pickerMode === 'dropdowns' ? (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="dob-day-select" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Day of Month
              </label>
              <select
                id="dob-day-select"
                value={selectedDay}
                onChange={handleDayChange}
                className="w-full h-12 px-3 text-base font-bold rounded-lg border-2 border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-mono"
              >
                {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Date Summary Card */}
            <div className="p-3 bg-muted/60 rounded-xl border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Selected Date:</p>
                <p className="text-base font-bold text-foreground">
                  {format(new Date(selectedYear, selectedMonth, selectedDay), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  Age: {maxYear - selectedYear} years old
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-12 text-base font-bold rounded-xl"
              onClick={() => {
                const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
                onChange(finalDate);
                setOpen(false);
              }}
            >
              <Check className="mr-2 h-5 w-5" />
              Confirm Date of Birth
            </Button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {/* Month Navigation Bar */}
            <div className="flex items-center justify-between px-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-bold text-foreground">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAYS_OF_WEEK.map((day) => (
                <span
                  key={day}
                  className="text-[11px] font-bold text-muted-foreground py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((item, index) => {
                const isSelected =
                  value &&
                  isValid(value) &&
                  getDate(value) === item.day &&
                  getMonth(value) === getMonth(item.date) &&
                  getYear(value) === getYear(item.date);

                const isToday =
                  new Date().toDateString() === item.date.toDateString();

                const isFuture = item.date > new Date();

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isFuture}
                    onClick={() => handleDayClick(item.date)}
                    className={cn(
                      'h-9 w-full rounded-lg text-xs font-medium transition-all flex items-center justify-center',
                      !item.isCurrentMonth && 'text-muted-foreground/40',
                      item.isCurrentMonth && !isSelected && 'hover:bg-muted text-foreground',
                      isSelected &&
                        'bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90',
                      isToday && !isSelected && 'border-2 border-primary/40 font-bold',
                      isFuture && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {value && isValid(value) ? format(value, 'MMM d, yyyy') : 'No date chosen'}
              </span>
              <Button
                type="button"
                size="sm"
                className="h-8 px-4 text-xs font-bold rounded-lg"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
