// DateRangeFilter.tsx
// npm install react-day-picker date-fns react-icons

import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  isSameDay,
  addMonths,
  isBefore,
} from "date-fns";
import {
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import "react-day-picker/style.css";

/* ─── Types ─────────────────────────────────────── */
type Range = { from: Date | undefined; to: Date | undefined };
type PickStep = 0 | 1 | 2;
type Props = {
  disabled?: boolean;
  onChange?: (range: { start: Date; end: Date }) => void;
  initialRange?: { start: Date; end: Date };
};

/* ─── Presets ────────────────────────────────────── */
const PRESETS = [
  { label: "Today", key: "today" },
  { label: "Yesterday", key: "yesterday" },
  { label: "Last 7 days", key: "last7" },
  { label: "Last 30 days", key: "last30" },
  { label: "This month", key: "thisMonth" },
  { label: "Last month", key: "lastMonth" },
  { label: "This year", key: "thisYear" },
  { label: "Last year", key: "lastYear" },
] as const;

function getPreset(key: string): Range {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  switch (key) {
    case "today":
      return { from: new Date(now), to: new Date(now) };
    case "yesterday": {
      const d = subDays(now, 1);
      return { from: d, to: new Date(d) };
    }
    case "last7":
      return { from: subDays(now, 6), to: new Date(now) };
    case "last30":
      return { from: subDays(now, 29), to: new Date(now) };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "lastMonth": {
      const d = subMonths(now, 1);
      return { from: startOfMonth(d), to: endOfMonth(d) };
    }
    case "thisYear":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "lastYear": {
      const d = subYears(now, 1);
      return { from: startOfYear(d), to: endOfYear(d) };
    }
    default:
      return { from: new Date(now), to: new Date(now) };
  }
}

const fmt = (d: Date) => format(d, "dd MMM yyyy");

function rangeLabel(r: Range): string {
  if (!r.from) return "Select range";
  if (!r.to || isSameDay(r.from, r.to)) return fmt(r.from);
  return `${fmt(r.from)} – ${fmt(r.to)}`;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const YEARS = Array.from({ length: 126 }, (_, i) => 2000 + i);

/* ─── Custom Caption ─────────────────────────────── */
function CustomCaption({
  displayMonth,
  onMonthChange,
}: {
  displayMonth: Date;
  onMonthChange: (d: Date) => void;
}) {
  const y = displayMonth.getFullYear();
  const m = displayMonth.getMonth();
  return (
    <div className="drf-caption">
      <button
        className="drf-nav-btn"
        onClick={() => onMonthChange(new Date(y, m - 1, 1))}
        type="button"
      >
        <FaChevronLeft />
      </button>
      <div className="drf-caption-selects">
        <select
          className="drf-cap-select"
          value={m}
          onChange={(e) => onMonthChange(new Date(y, +e.target.value, 1))}
        >
          {MONTH_NAMES.map((mo, i) => (
            <option key={i} value={i}>
              {mo}
            </option>
          ))}
        </select>
        <select
          className="drf-cap-select"
          value={y}
          onChange={(e) => onMonthChange(new Date(+e.target.value, m, 1))}
        >
          {YEARS.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>
      <button
        className="drf-nav-btn"
        onClick={() => onMonthChange(new Date(y, m + 1, 1))}
        type="button"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────── */
export default function DateRangeFilter({
  onChange,
  initialRange,
  disabled,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initRange: Range = {
    from: initialRange?.start ?? undefined,
    to: initialRange?.end ?? undefined,
  };

  const [open, setOpen] = useState(false);
  const [committed, setCommitted] = useState<Range>(initRange);
  const [pending, setPending] = useState<Range>(initRange);
  const [pickStep, setPickStep] = useState<PickStep>(initRange.from ? 2 : 0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileStep, setMobileStep] = useState<"presets" | "calendar">(
    "presets",
  );
  const [popPos, setPopPos] = useState<"top" | "bottom">("bottom");

  /* ── Desktop month state ── */
  const [leftMonth, setLeftMonthRaw] = useState<Date>(
    initRange.from
      ? startOfMonth(initRange.from)
      : startOfMonth(subMonths(today, 1)),
  );
  const [rightMonth, setRightMonthRaw] = useState<Date>(
    initRange.to ? startOfMonth(initRange.to) : startOfMonth(today),
  );

  /* ── Mobile: two independent month states ── */
  const [mobTopMonth, setMobTopMonthRaw] = useState<Date>(
    startOfMonth(subMonths(today, 1)),
  );
  const [mobBotMonth, setMobBotMonthRaw] = useState<Date>(startOfMonth(today));

  const setLeftMonth = useCallback((d: Date) => {
    setLeftMonthRaw(d);
    setRightMonthRaw((prev) =>
      d >= startOfMonth(prev) ? addMonths(d, 1) : prev,
    );
  }, []);

  const setRightMonth = useCallback((d: Date) => {
    setRightMonthRaw(d);
    setLeftMonthRaw((prev) =>
      d <= startOfMonth(prev) ? subMonths(d, 1) : prev,
    );
  }, []);

  /* Mobile top calendar: keep bottom always after top */
  const setMobTopMonth = useCallback((d: Date) => {
    setMobTopMonthRaw(d);
    setMobBotMonthRaw((prev) =>
      d >= startOfMonth(prev) ? addMonths(d, 1) : prev,
    );
  }, []);

  /* Mobile bottom calendar: keep top always before bottom */
  const setMobBotMonth = useCallback((d: Date) => {
    setMobBotMonthRaw(d);
    setMobTopMonthRaw((prev) =>
      d <= startOfMonth(prev) ? subMonths(d, 1) : prev,
    );
  }, []);

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  useEffect(() => {
    document.body.style.overflow = isMobile && open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, open]);

  /* ── Open picker ── */
  const openPicker = () => {
    if (disabled) return; // ✅ block interaction

    if (open) {
      setOpen(false);
      return;
    }
    setPending({ from: committed.from, to: committed.to });
    setPickStep(committed.from ? 2 : 0);
    setHoverDate(null);
    setActivePreset(null);
    setMobileStep("presets");

    const refFrom = committed.from ?? today;
    const refTo = committed.to ?? today;
    const lm = startOfMonth(refFrom);
    const rm = startOfMonth(refTo);
    setLeftMonthRaw(lm);
    setRightMonthRaw(isSameDay(lm, rm) ? addMonths(lm, 1) : rm);

    /* initialise mobile months around committed range */
    setMobTopMonthRaw(lm);
    setMobBotMonthRaw(isSameDay(lm, rm) ? addMonths(lm, 1) : rm);

    if (!isMobile && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setPopPos(window.innerHeight - rect.bottom < 380 ? "top" : "bottom");
    }
    setOpen(true);
  };

  /* ── Day click ── */
  const handleDayClick = useCallback(
    (day: Date) => {
      setActivePreset(null);
      if (pickStep === 0 || pickStep === 2) {
        setPending({ from: day, to: undefined });
        setPickStep(1);
      } else {
        const start = pending.from!;
        const [f, t] = isBefore(day, start) ? [day, start] : [start, day];
        const final = { from: f, to: t };
        setPending(final);
        setPickStep(2);
        setHoverDate(null);
        setCommitted(final);
        onChange?.({ start: final.from!, end: final.to! });
      }
    },
    [pickStep, pending.from],
  );

  const handleRangeSelect = useCallback(
    (r: { from?: Date; to?: Date } | undefined) => {
      if (!r?.from) return;
      handleDayClick(
        r.to && (!pending.to || !isSameDay(r.to, pending.to ?? new Date(0)))
          ? r.to
          : r.from,
      );
    },
    [handleDayClick, pending.to],
  );

  const handleDayMouseEnter = useCallback(
    (day: Date) => {
      if (pickStep === 1) setHoverDate(day);
    },
    [pickStep],
  );

  const displayRange: Range = (() => {
    if (pickStep === 1 && hoverDate && pending.from) {
      const [f, t] = isBefore(hoverDate, pending.from)
        ? [hoverDate, pending.from]
        : [pending.from, hoverDate];
      return { from: f, to: t };
    }
    return pending;
  })();

  /* ── Preset ── */
  const handlePreset = (key: string) => {
    const r = getPreset(key);
    setActivePreset(key);
    setPending(r);
    setPickStep(2);
    setHoverDate(null);

    if (r.from) {
      const lm = startOfMonth(r.from);
      const rm = r.to ? startOfMonth(r.to) : addMonths(lm, 1);
      const leftM = lm;
      const rightM = isSameDay(lm, rm) ? addMonths(lm, 1) : rm;
      setLeftMonthRaw(leftM);
      setRightMonthRaw(rightM);
      setMobTopMonthRaw(leftM);
      setMobBotMonthRaw(rightM);
    }

    if (isMobile) {
      setCommitted(r);
      onChange?.({ start: r.from!, end: r.to! });
      setOpen(false);
    }
  };

  const handleApply = () => {
    if (!pending.from || !pending.to) return;
    const final = { from: pending.from, to: pending.to };
    setCommitted(final);
    onChange?.({ start: final.from!, end: final.to! });
    setOpen(false);
  };

  const handleClear = () => {
    setPending({ from: undefined, to: undefined });
    setPickStep(0);
    setHoverDate(null);
    setActivePreset(null);
  };

  /* ── Shared DayPicker props ── */
  const sharedPickerProps = {
    mode: "range" as const,
    selected: { from: displayRange.from, to: displayRange.to },
    onSelect: handleRangeSelect,
    onDayMouseEnter: (_: Date, __: unknown, e: React.MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("[data-day]");
      if (btn) {
        const d = new Date((btn as HTMLElement).dataset.day!);
        if (!isNaN(d.getTime())) handleDayMouseEnter(d);
      }
    },
    onDayMouseLeave: () => {
      if (pickStep === 1) setHoverDate(null);
    },
    numberOfMonths: 1,
    showOutsideDays: true,
    classNames: {
      root: "drf-rdp",
      months: "drf-rdp-months",
      month: "drf-rdp-month",
      month_grid: "drf-rdp-grid",
      weekdays: "drf-rdp-weekdays",
      weekday: "drf-rdp-weekday",
      week: "drf-rdp-week",
      day: "drf-rdp-day",
      day_button: "drf-rdp-day-btn",
      today: "drf-rdp-today",
      selected: "drf-rdp-selected",
      range_start: "drf-rdp-range-start",
      range_end: "drf-rdp-range-end",
      range_middle: "drf-rdp-range-middle",
      outside: "drf-rdp-outside",
      disabled: "drf-rdp-disabled",
      hidden: "drf-rdp-hidden",
      nav: "drf-rdp-nav-hidden",
      button_previous: "drf-rdp-nav-hidden",
      button_next: "drf-rdp-nav-hidden",
    },
  };

  /* ── Footer ── */
  const Footer = () => (
    <div className="drf-footer">
      <div className="drf-pending-label">
        <span className="drf-dot" />
        <span className="drf-pending-text">
          {pickStep === 1
            ? pending.from
              ? `From ${fmt(pending.from)}…`
              : "Click a start date"
            : rangeLabel(pending)}
        </span>
      </div>
      <div className="drf-actions">
        <button className="drf-btn-clear" onClick={handleClear} type="button">
          <FaTimes size={10} /> Clear
        </button>
        <button
          className="drf-btn-apply"
          onClick={handleApply}
          disabled={!pending.from || !pending.to}
          type="button"
        >
          <FaCheck size={10} /> Apply
        </button>
      </div>
    </div>
  );

  /* ── Presets panel ── */
  const PresetsPanel = ({ mobile }: { mobile?: boolean }) => (
    <div className={mobile ? "drf-mobile-presets" : "drf-presets"}>
      {!mobile && <div className="drf-presets-title">Quick select</div>}
      {mobile ? (
        <div className="drf-chip-grid">
          {PRESETS.map(({ label, key }) => (
            <button
              key={key}
              type="button"
              className={`drf-chip ${activePreset === key ? "active" : ""}`}
              onClick={() => handlePreset(key)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        PRESETS.map(({ label, key }) => (
          <button
            key={key}
            type="button"
            className={`drf-preset-btn ${activePreset === key ? "active" : ""}`}
            onClick={() => handlePreset(key)}
          >
            {label}
          </button>
        ))
      )}
    </div>
  );

  const triggerLabel = committed.from
    ? rangeLabel(committed)
    : "Select date range";

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <>
      <style>{CSS}</style>

      <div ref={wrapRef} className="drf-root">
        {/* <div className="drf-label">Date filter</div> */}
        <button
          onClick={openPicker}
          type="button"
          disabled={disabled}
          className={`
    h-[34px] min-w-[180px] px-2.5 flex items-center justify-between 
    text-xs rounded-md border transition-all outline-none bg-white
    ${open ? "border-primary-button-bg" : "border-gray-300"}
    ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : "hover:border-gray-400"}
  `}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Icon matches the color and size profile of your other filter icons */}
            <span className="flex items-center text-gray-500">
              <i className="material-symbols-outlined !text-[18px]">
                calendar_month
              </i>
            </span>

            <span className="truncate text-black">{triggerLabel}</span>
          </div>

          {/* Chevron matches the 'expand_more' icon style from your select filter */}
          <span
            className={`flex items-center text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <i className="material-symbols-outlined !text-[18px]">
              expand_more
            </i>
          </span>
        </button>

        {/* ── DESKTOP POPUP ── */}
        {open && !isMobile && (
          <div
            className="drf-popup"
            style={{
              [popPos === "bottom" ? "top" : "bottom"]: "calc(100% + 6px)",
            }}
          >
            <PresetsPanel />
            <div className="drf-cal-side">
              <div className="drf-two-panels">
                <div className="drf-panel">
                  <CustomCaption
                    displayMonth={leftMonth}
                    onMonthChange={setLeftMonth}
                  />
                  <DayPicker
                    {...sharedPickerProps}
                    month={leftMonth}
                    onMonthChange={setLeftMonth}
                  />
                </div>
                <div className="drf-panel-divider" />
                <div className="drf-panel">
                  <CustomCaption
                    displayMonth={rightMonth}
                    onMonthChange={setRightMonth}
                  />
                  <DayPicker
                    {...sharedPickerProps}
                    month={rightMonth}
                    onMonthChange={setRightMonth}
                  />
                </div>
              </div>
              <Footer />
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE BOTTOM SHEET ── */}
      {open && isMobile && (
        <>
          <div className="drf-backdrop" onClick={() => setOpen(false)} />
          <div className="drf-sheet">
            <div className="drf-handle" />

            {/* ── Presets step ── */}
            {mobileStep === "presets" && (
              <div className="drf-sheet-inner">
                <div className="drf-sheet-header">
                  <span className="drf-sheet-title">Select date range</span>
                  <button
                    className="drf-icon-btn"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
                <div className="drf-sheet-body">
                  <PresetsPanel mobile />
                  <div className="drf-divider">
                    <span>or custom range</span>
                  </div>
                  <button
                    className="drf-custom-row"
                    onClick={() => setMobileStep("calendar")}
                    type="button"
                  >
                    <span className="drf-dot" />
                    <span className="drf-custom-label">
                      {rangeLabel(pending)}
                    </span>
                    <FaChevronRight size={11} style={{ color: "#94a3b8" }} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Calendar step: TWO stacked calendars ── */}
            {mobileStep === "calendar" && (
              <div className="drf-sheet-inner">
                <div className="drf-sheet-header">
                  <button
                    className="drf-back-btn"
                    onClick={() => setMobileStep("presets")}
                    type="button"
                  >
                    <FaChevronLeft size={11} /> Back
                  </button>
                  <span className="drf-sheet-title">Custom range</span>
                  <button
                    className="drf-icon-btn"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>

                {/* Scrollable body with TWO calendars */}
                <div className="drf-sheet-body drf-sheet-scroll">
                  {/* ── Top calendar ── */}
                  <div className="drf-mob-cal-block">
                    <CustomCaption
                      displayMonth={mobTopMonth}
                      onMonthChange={setMobTopMonth}
                    />
                    <DayPicker
                      {...sharedPickerProps}
                      month={mobTopMonth}
                      onMonthChange={setMobTopMonth}
                      classNames={{
                        ...sharedPickerProps.classNames,
                        root: "drf-rdp drf-rdp-mobile",
                      }}
                    />
                  </div>

                  {/* Thin separator between calendars */}
                  <div className="drf-mob-cal-sep" />

                  {/* ── Bottom calendar ── */}
                  <div className="drf-mob-cal-block">
                    <CustomCaption
                      displayMonth={mobBotMonth}
                      onMonthChange={setMobBotMonth}
                    />
                    <DayPicker
                      {...sharedPickerProps}
                      month={mobBotMonth}
                      onMonthChange={setMobBotMonth}
                      classNames={{
                        ...sharedPickerProps.classNames,
                        root: "drf-rdp drf-rdp-mobile",
                      }}
                    />
                  </div>
                </div>

                <div className="drf-sheet-footer-wrap">
                  <Footer />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
.drf-root { position: relative; width: fit-content; z-index: 50; }

.drf-label {
  font-size: 11px; font-weight: 500;
  color: var(--card-text-color);
  margin-bottom: 4px; letter-spacing: .04em; text-transform: uppercase;
}

/* ── Trigger ── */
.drf-trigger {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 34px 11px 14px;
  background: var(--card-bg);
  border: 1.5px solid var(--card-border-color);
  border-radius: 10px;
  font-size: 13px; font-weight: 500; color: #334155;
  cursor: pointer; transition: border-color .2s, box-shadow .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.06); white-space: nowrap;
}
.drf-trigger:hover { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.08); }
.drf-trigger-text { color: var(--card-text-color); }
.drf-chevron { font-size: 11px; color: #94a3b8; transition: transform .2s; display: inline-block; }
.drf-chevron.open { transform: rotate(180deg); }

/* ── Desktop Popup ── */
.drf-popup {
  position: absolute; left: 0; z-index: 1001;
  display: flex; background: #fff;
  border-radius: 14px; border: 0.5px solid #e2e8f0;
  box-shadow: 0 8px 32px rgba(0,0,0,.13);
  overflow: hidden; animation: drfIn .12s ease;
}
@keyframes drfIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }

/* ── Presets — desktop ── */
.drf-presets {
  width: 136px; flex-shrink: 0; background: #f8fafc;
  border-right: 0.5px solid #e9eef4;
  padding: 10px 8px; display: flex; flex-direction: column; gap: 2px;
}
.drf-presets-title {
  font-size: 9px; font-weight: 500; letter-spacing: .08em;
  color: #94a3b8; padding: 0 4px; margin-bottom: 6px; text-transform: uppercase;
}
.drf-preset-btn {
  padding: 7px 10px; font-size: 12px; font-weight: 400; font-family: inherit;
  color: #475569; background: transparent;
  border: 0.5px solid transparent; border-radius: 8px;
  cursor: pointer; text-align: left; transition: all .12s;
}
.drf-preset-btn:hover { background: #fff; border-color: #e2e8f0; color: #1e293b; }
.drf-preset-btn.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; font-weight: 500; }

/* ── Cal side ── */
.drf-cal-side { display: flex; flex-direction: column; padding: 12px 14px 0; }
.drf-two-panels { display: flex; gap: 0; }
.drf-panel { display: flex; flex-direction: column; }
.drf-panel-divider { width: 0.5px; background: #e9eef4; margin: 0 10px; align-self: stretch; }

/* ── DayPicker resets ── */
.drf-rdp { margin: 0; }
.drf-rdp-months { display: flex; }
.drf-rdp-month { width: 224px; }
.drf-rdp-grid { width: 100%; border-collapse: collapse; }
.drf-rdp-weekdays { display: flex; }
.drf-rdp-weekday {
  flex: 1; text-align: center; font-size: 10px; font-weight: 600;
  color: #94a3b8; padding: 4px 0; text-transform: uppercase; letter-spacing: .04em;
}
.drf-rdp-week { display: flex; }
.drf-rdp-day { flex: 1; position: relative; }
.drf-rdp-day-btn {
  width: 100%; aspect-ratio: 1; max-height: 30px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #334155;
  background: transparent; border: none; border-radius: 6px;
  cursor: pointer; transition: background .1s, color .1s;
  position: relative; z-index: 1; font-family: inherit;
}
.drf-rdp-day-btn:hover { background: #f1f5f9; color: #0f172a; }
.drf-rdp-today .drf-rdp-day-btn { font-weight: 600; color: #3b82f6; }
.drf-rdp-outside .drf-rdp-day-btn { color: #cbd5e1; }
.drf-rdp-disabled .drf-rdp-day-btn { color: #e2e8f0; cursor: default; }
.drf-rdp-hidden { visibility: hidden; }
.drf-rdp-nav-hidden { display: none !important; }

/* ── Range highlight ── */
.drf-rdp-range-start .drf-rdp-day-btn,
.drf-rdp-range-end   .drf-rdp-day-btn {
  background: #3b82f6 !important; color: #fff !important; border-radius: 6px;
}
.drf-rdp-range-middle { background: #eff6ff; }
.drf-rdp-range-middle .drf-rdp-day-btn { color: #1d4ed8; border-radius: 0; }
.drf-rdp-range-start { background: linear-gradient(to right, transparent 50%, #eff6ff 50%); }
.drf-rdp-range-end   { background: linear-gradient(to left,  transparent 50%, #eff6ff 50%); }
.drf-rdp-range-start.drf-rdp-range-end { background: transparent !important; }

/* ── Caption ── */
.drf-caption {
  display: flex; align-items: center; gap: 4px; padding: 4px 2px 8px;
}
.drf-caption-selects { display: flex; gap: 4px; flex: 1; justify-content: center; }
.drf-cap-select {
  padding: 3px 4px; font-size: 12px; font-weight: 500; font-family: inherit;
  color: #1e293b; background: transparent;
  border: 0.5px solid #e2e8f0; border-radius: 6px;
  outline: none; cursor: pointer; transition: border-color .12s;
}
.drf-cap-select:focus { border-color: #93c5fd; }
.drf-nav-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; flex-shrink: 0;
  background: transparent; border: 0.5px solid #e2e8f0;
  border-radius: 6px; cursor: pointer; color: #64748b;
  font-size: 10px; transition: all .12s; font-family: inherit;
}
.drf-nav-btn:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }

/* ── Footer ── */
.drf-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0 10px; border-top: 0.5px solid #e9eef4;
  margin-top: 6px; gap: 10px;
}
.drf-pending-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #64748b; min-width: 0; overflow: hidden;
}
.drf-pending-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drf-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #3b82f6; flex-shrink: 0; display: inline-block;
}
.drf-actions { display: flex; gap: 6px; flex-shrink: 0; }
.drf-btn-clear {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 10px; font-size: 11.5px; font-family: inherit;
  color: #64748b; background: #f1f5f9;
  border: 0.5px solid #e2e8f0; border-radius: 8px;
  cursor: pointer; transition: all .12s;
}
.drf-btn-clear:hover { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
.drf-btn-apply {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 14px; font-size: 11.5px; font-weight: 500; font-family: inherit;
  color: #fff; background: #3b82f6; border: none; border-radius: 8px;
  cursor: pointer; transition: all .12s;
}
.drf-btn-apply:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
.drf-btn-apply:active { transform: translateY(0); }
.drf-btn-apply:disabled { opacity: .45; cursor: default; }

/* ══════════════════════════════════════════════════
   MOBILE SHEET
══════════════════════════════════════════════════ */
.drf-backdrop {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(15,23,42,.5); animation: drfBdIn .2s ease;
}
@keyframes drfBdIn { from { opacity:0; } to { opacity:1; } }

.drf-sheet {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2001;
  width: 92%;
  max-width: 500px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,.2);
  animation: popupCenter .25s cubic-bezier(.32,1,.32,1);
  /* taller to accommodate two calendars */
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}
@keyframes popupCenter {
  from { opacity:0; transform:translate(-50%,-60%) scale(0.95); }
  to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
}

.drf-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: #cbd5e1; margin: 10px auto 0; flex-shrink: 0;
}
.drf-sheet-inner { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.drf-sheet-header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px 10px; border-bottom: 0.5px solid #f1f5f9; flex-shrink: 0;
}
.drf-sheet-title { flex: 1; font-size: 15px; font-weight: 500; color: #0f172a; text-align: center; }
.drf-icon-btn {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: #f1f5f9; border: none; cursor: pointer;
  color: #64748b; display: flex; align-items: center; justify-content: center;
}
.drf-back-btn {
  display: flex; align-items: center; gap: 5px;
  background: transparent; border: none; font-size: 13px; color: #3b82f6;
  cursor: pointer; font-family: inherit; flex-shrink: 0; padding: 0;
}
.drf-sheet-body { overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1; }
.drf-sheet-scroll { padding: 0 16px 8px; }

/* ── Mobile presets ── */
.drf-mobile-presets { padding: 14px 16px 0; }
.drf-chip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px; }
.drf-chip {
  padding: 13px 10px; font-size: 13px; font-weight: 400; font-family: inherit;
  color: #334155; background: #f8fafc;
  border: 0.5px solid #e2e8f0; border-radius: 10px;
  cursor: pointer; text-align: center; transition: all .12s;
}
.drf-chip:active { transform: scale(.97); }
.drf-chip.active { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; font-weight: 500; }

.drf-divider {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; color: #94a3b8; padding: 16px 16px 10px;
}
.drf-divider::before, .drf-divider::after { content: ""; flex: 1; height: 0.5px; background: #e2e8f0; }

.drf-custom-row {
  display: flex; align-items: center; gap: 10px;
  margin: 0 16px 20px; padding: 13px 14px;
  font-size: 13px; font-family: inherit; color: #334155;
  background: #f8fafc; border: 0.5px solid #e2e8f0; border-radius: 10px;
  cursor: pointer; transition: all .12s; width: calc(100% - 32px);
}
.drf-custom-row:active { transform: scale(.98); }
.drf-custom-label { flex: 1; text-align: left; }

/* ══════════════════════════════════════════════════
   MOBILE — TWO STACKED CALENDARS
══════════════════════════════════════════════════ */

/* Each calendar block: caption + grid */
.drf-mob-cal-block {
  padding: 6px 0 4px;
}

/* Thin horizontal rule between the two calendars */
.drf-mob-cal-sep {
  height: 1px;
  background: #e9eef4;
  margin: 4px 0 6px;
}

/* Mobile caption — slightly larger for touch */
.drf-sheet-scroll .drf-caption {
  padding: 8px 0 10px;
}
.drf-sheet-scroll .drf-cap-select {
  font-size: 14px;
  padding: 6px 6px;
}
.drf-sheet-scroll .drf-nav-btn {
  width: 30px;
  height: 30px;
  font-size: 12px;
}

/* Mobile DayPicker — full-width, larger tap targets */
.drf-rdp-mobile { width: 100%; }
.drf-rdp-mobile .drf-rdp-months { width: 100%; }
.drf-rdp-mobile .drf-rdp-month  { width: 100%; }
.drf-rdp-mobile .drf-rdp-grid   { width: 100%; }
.drf-rdp-mobile .drf-rdp-week   { width: 100%; }
.drf-rdp-mobile .drf-rdp-day-btn {
  max-height: 40px;
  font-size: 14px;
  border-radius: 8px;
}
.drf-rdp-mobile .drf-rdp-weekday {
  font-size: 11px;
  padding: 6px 0;
}

/* ── Mobile footer ── */
.drf-sheet-footer-wrap {
  padding: 0 16px 20px;
  flex-shrink: 0;
  border-top: 0.5px solid #e9eef4;
}
.drf-sheet-footer-wrap .drf-footer {
  padding: 10px 0 0;
  border-top: none;
  margin-top: 0;
}
.drf-sheet-footer-wrap .drf-actions { flex: 1; }
.drf-sheet-footer-wrap .drf-btn-apply {
  flex: 1;
  justify-content: center;
  padding: 11px 16px;
  font-size: 14px;
}
.drf-sheet-footer-wrap .drf-btn-clear {
  padding: 11px 14px;
  font-size: 13px;
}
`;
