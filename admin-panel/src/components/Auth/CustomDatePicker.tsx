import { useEffect, useRef, useState } from "react";
import { useModalAnimation } from "../../hooks/useModalAnimation";

interface CustomDatePickerProps {
  label: string;
  name: string;
  value: string; // YYYY-MM-DD
  onChange: (e: { target: { name: string; value: string } }) => void;
  required?: boolean;
  error?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const CustomDatePicker = ({
  label,
  name,
  value,
  onChange,
  required,
  error,
}: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldRender, isAnimatingOut } = useModalAnimation(isOpen, 200);

  const parsedDate = value ? new Date(value + "T00:00:00") : new Date();
  const validParsed = !isNaN(parsedDate.getTime());
  
  const [viewYear, setViewYear] = useState(validParsed ? parsedDate.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(validParsed ? parsedDate.getMonth() : new Date().getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formatted = `${viewYear}-${mm}-${dd}`;
    onChange({ target: { name, value: formatted } });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({ target: { name, value: "" } });
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yyyy = today.getFullYear();
    const formatted = `${yyyy}-${mm}-${dd}`;
    onChange({ target: { name, value: formatted } });
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const selectedDateObj = value ? new Date(value + "T00:00:00") : null;
  const isSelected = (day: number) => {
    if (!selectedDateObj || isNaN(selectedDateObj.getTime())) return false;
    return (
      selectedDateObj.getFullYear() === viewYear &&
      selectedDateObj.getMonth() === viewMonth &&
      selectedDateObj.getDate() === day
    );
  };

  const todayObj = new Date();
  const isToday = (day: number) => {
    return (
      todayObj.getFullYear() === viewYear &&
      todayObj.getMonth() === viewMonth &&
      todayObj.getDate() === day
    );
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 110 }, (_, i) => currentYear - i);

  const displayString = () => {
    if (!value) return "mm/dd/yyyy";
    const d = new Date(value + "T00:00:00");
    if (isNaN(d.getTime())) return "mm/dd/yyyy";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const borderTone = error
    ? "border-red-400"
    : "border-white/20 focus-within:border-violet-400";

  return (
    <div className="relative mb-7" ref={containerRef}>
      <label htmlFor={name} className="mb-2 block text-[13.5px] font-medium text-violet-200/80">
        {required && <span className="mr-1 text-red-400">*</span>}
        {label}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex cursor-pointer items-end gap-2 border-b-2 pb-1 transition-colors ${borderTone}`}
      >
        <div className={`min-w-0 flex-1 py-3 text-[14.5px] ${value ? "text-white font-medium" : "text-white/30"}`}>
          {displayString()}
        </div>

        <button
          type="button"
          tabIndex={-1}
          className="mb-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center text-violet-300/70 hover:text-violet-200 transition-colors"
          aria-label="Open calendar"
        >
          <svg
            className={`h-[18px] w-[18px] transition-transform duration-300 ${isOpen ? "rotate-12 text-violet-300" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8 3v4M16 3v4M3 11h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

      {shouldRender && (
        <>
          <style>{`
            @keyframes datepicker-pop-in {
              from { opacity: 0; transform: translateY(-10px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0)     scale(1);    }
            }
            @keyframes datepicker-pop-out {
              from { opacity: 1; transform: translateY(0)     scale(1);    }
              to   { opacity: 0; transform: translateY(-10px) scale(0.95); }
            }
          `}</style>
          <div
            className="absolute left-0 top-[102%] z-[100] w-80 rounded-2xl border border-violet-500/30 bg-[#161233]/95 p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            style={{
              animation: isAnimatingOut
                ? "datepicker-pop-out 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
                : "datepicker-pop-in 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Header Controls */}
            <div className="mb-3.5 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="rounded-lg border border-white/15 bg-[#211a48] px-2 py-1 text-xs font-semibold text-white outline-none focus:border-violet-400 cursor-pointer"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#1c173b] text-white">
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="rounded-lg border border-white/15 bg-[#211a48] px-2 py-1 text-xs font-semibold text-white outline-none focus:border-violet-400 cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-[#1c173b] text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-violet-200 hover:bg-white/15 hover:text-white transition-colors"
                  title="Previous Month"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-violet-200 hover:bg-white/15 hover:text-white transition-colors"
                  title="Next Month"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 mb-1.5 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <span key={day} className="py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300/70">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
                const prevDayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
                return (
                  <span key={`prev-${idx}`} className="flex h-8 items-center justify-center text-xs text-white/20 select-none">
                    {prevDayNum}
                  </span>
                );
              })}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const active = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`flex h-8 w-8 mx-auto items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.5)] scale-105"
                        : today
                        ? "border border-violet-400 text-violet-200 font-semibold bg-violet-500/20 hover:bg-violet-600/40"
                        : "text-violet-100 hover:bg-violet-600/30 hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 px-1">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-violet-300/80 hover:text-violet-100 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="text-xs font-semibold text-violet-400 hover:text-violet-200 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
