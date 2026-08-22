"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, ArrowRight } from "lucide-react";

interface DateRangePickerProps {
  startName?: string;
  endName?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  minDate?: string;
  maxDate?: string;
  label?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoToDate(isoString: string): Date | null {
  if (!isoString) return null;
  const parts = isoString.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

export function DateRangePicker({
  startName = "start_date",
  endName = "end_date",
  defaultStartDate = "",
  defaultEndDate = "",
  minDate,
  maxDate,
  label,
  required = false,
}: DateRangePickerProps) {
  const [startDateStr, setStartDateStr] = useState<string>(defaultStartDate);
  const [endDateStr, setEndDateStr] = useState<string>(defaultEndDate);

  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<"start" | "end">("start");
  const [hoverDateStr, setHoverDateStr] = useState<string | null>(null);

  // Calendar current view month
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (defaultStartDate) {
      const parsed = parseIsoToDate(defaultStartDate);
      if (parsed) return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Ensure end date >= start date
  useEffect(() => {
    if (startDateStr && endDateStr) {
      const s = parseIsoToDate(startDateStr);
      const e = parseIsoToDate(endDateStr);
      if (s && e && e < s) {
        setEndDateStr(startDateStr);
      }
    }
  }, [startDateStr, endDateStr]);

  const startDateObj = useMemo(() => parseIsoToDate(startDateStr), [startDateStr]);
  const endDateObj = useMemo(() => parseIsoToDate(endDateStr), [endDateStr]);

  // Calculate duration in nights & days
  const durationText = useMemo(() => {
    if (!startDateObj || !endDateObj) return null;
    const diffTime = endDateObj.getTime() - startDateObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Same Day (1 Day)";
    if (diffDays === 1) return "1 Night • 2 Days";
    return `${diffDays} Nights • ${diffDays + 1} Days`;
  }, [startDateObj, endDateObj]);

  const minDateObj = useMemo(() => (minDate ? parseIsoToDate(minDate) : null), [minDate]);
  const maxDateObj = useMemo(() => (maxDate ? parseIsoToDate(maxDate) : null), [maxDate]);

  const nextMonthViewDate = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (dateStr: string) => {
    const clickedDate = parseIsoToDate(dateStr);
    if (!clickedDate) return;

    if (activeStep === "start") {
      setStartDateStr(dateStr);
      // If end date is before new start date, reset end date
      if (endDateStr) {
        const currentEnd = parseIsoToDate(endDateStr);
        if (currentEnd && currentEnd < clickedDate) {
          setEndDateStr(dateStr);
        }
      } else {
        setEndDateStr(dateStr);
      }
      setActiveStep("end");
    } else {
      // Step: selecting end date
      if (startDateStr) {
        const currentStart = parseIsoToDate(startDateStr);
        if (currentStart && clickedDate < currentStart) {
          // If clicked date is before start date, treat it as the new start date
          setStartDateStr(dateStr);
          setEndDateStr(dateStr);
          setActiveStep("end");
        } else {
          setEndDateStr(dateStr);
          setIsOpen(false);
          setActiveStep("start");
        }
      } else {
        setStartDateStr(dateStr);
        setEndDateStr(dateStr);
        setActiveStep("end");
      }
    }
  };

  const applyPresetDays = (daysToAdd: number) => {
    const start = startDateObj || new Date();
    const newStartStr = formatDateToIso(start);
    const newEnd = new Date(start);
    newEnd.setDate(newEnd.getDate() + daysToAdd);
    const newEndStr = formatDateToIso(newEnd);

    setStartDateStr(newStartStr);
    setEndDateStr(newEndStr);
    setIsOpen(false);
  };

  // Render month grid helper
  const renderMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (string | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(formatDateToIso(new Date(year, month, i)));
    }

    return (
      <div className="flex-1 min-w-[250px]">
        <div className="text-center font-bold text-slate-800 text-sm mb-3">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-1.5">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} className="h-8 w-8" />;
            }

            const dayObj = parseIsoToDate(dateStr)!;
            const dayNum = dayObj.getDate();

            // Disabled conditions
            const isBeforeMin = minDateObj ? dayObj < minDateObj : false;
            const isAfterMax = maxDateObj ? dayObj > maxDateObj : false;
            const isDisabled = isBeforeMin || isAfterMax;

            // Highlight states
            const isStart = startDateStr === dateStr;
            const isEnd = endDateStr === dateStr;
            const isRangeSelected =
              startDateStr &&
              endDateStr &&
              dateStr >= startDateStr &&
              dateStr <= endDateStr;

            const isHoverRange =
              activeStep === "end" &&
              startDateStr &&
              hoverDateStr &&
              hoverDateStr > startDateStr &&
              dateStr >= startDateStr &&
              dateStr <= hoverDateStr;

            let cellBg = "hover:bg-slate-100 text-slate-700";
            if (isStart || isEnd) {
              cellBg = "bg-[#0B4F6C] text-white font-bold shadow-xs";
            } else if (isRangeSelected || isHoverRange) {
              cellBg = "bg-[#E0F2FE] text-[#0B4F6C] font-semibold";
            }

            if (isDisabled) {
              cellBg = "text-slate-300 cursor-not-allowed opacity-40";
            }

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDayClick(dateStr)}
                onMouseEnter={() => !isDisabled && setHoverDateStr(dateStr)}
                onMouseLeave={() => setHoverDateStr(null)}
                className={`h-8 w-8 mx-auto rounded-md text-xs transition-colors flex items-center justify-center ${cellBg}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
      {/* Hidden inputs to feed standard form actions */}
      <input type="hidden" name={startName} value={startDateStr} required={required} />
      <input type="hidden" name={endName} value={endDateStr} required={required} />

      {label ? <span className="text-sm font-semibold text-slate-800">{label}</span> : null}

      {/* MakeMyTrip Style Dual Card Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Departure / Start Date Card */}
        <div
          onClick={() => {
            setActiveStep("start");
            setIsOpen(true);
          }}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all bg-white shadow-xs ${
            isOpen && activeStep === "start"
              ? "border-[#0891B2] ring-2 ring-[#0891B2]/20"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#0891B2]">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Start / Departure</span>
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-1.5">
            {startDateObj ? (
              <>
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {startDateObj.getDate()}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {MONTH_NAMES[startDateObj.getMonth()].substring(0, 3)} '{String(startDateObj.getFullYear()).slice(-2)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 ml-auto">
                  {WEEKDAYS[startDateObj.getDay()]}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 py-1">Select departure date</span>
            )}
          </div>
        </div>

        {/* Return / End Date Card */}
        <div
          onClick={() => {
            setActiveStep("end");
            setIsOpen(true);
          }}
          className={`cursor-pointer rounded-xl border p-3.5 transition-all bg-white shadow-xs ${
            isOpen && activeStep === "end"
              ? "border-[#0891B2] ring-2 ring-[#0891B2]/20"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#FF5A5F]">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>End / Return</span>
            </span>
            {durationText ? (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0891B2] border border-sky-200 lowercase">
                {durationText}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-baseline gap-1.5">
            {endDateObj ? (
              <>
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {endDateObj.getDate()}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {MONTH_NAMES[endDateObj.getMonth()].substring(0, 3)} '{String(endDateObj.getFullYear()).slice(-2)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 ml-auto">
                  {WEEKDAYS[endDateObj.getDay()]}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 py-1">Select return date</span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Calendar Popover */}
      {isOpen ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in duration-150">
          {/* Header Controls */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                activeStep === "start" ? "bg-[#0B4F6C] text-white" : "bg-slate-100 text-slate-600"
              }`}>
                1. Departure
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                activeStep === "end" ? "bg-[#0B4F6C] text-white" : "bg-slate-100 text-slate-600"
              }`}>
                2. Return Date
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Side-by-side Months (1 or 2 months) */}
          <div className="flex flex-col md:flex-row gap-6">
            {renderMonth(viewDate)}
            <div className="hidden md:block">
              {renderMonth(nextMonthViewDate)}
            </div>
          </div>

          {/* Quick Presets & Action Footer */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Quick:</span>
              <button
                type="button"
                onClick={() => applyPresetDays(3)}
                className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200"
              >
                +3 Days
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(7)}
                className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200"
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(14)}
                className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200"
              >
                +2 Weeks
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-teal px-4 py-1.5 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
