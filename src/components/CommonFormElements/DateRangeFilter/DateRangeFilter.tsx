"use client";

import React, { useState, useEffect } from "react";
import { DateRange } from "react-date-range";
import {
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfYear,
    endOfYear,
} from "date-fns";

type Props = {
    onChange: (r: { from: string; to: string; preset: string }) => void;
};

const DateRangeFilterPro: React.FC<Props> = ({ onChange }) => {
    const today = new Date();

    const [showCalendar, setShowCalendar] = useState(false);
    const [preset, setPreset] = useState("today");
    const [label, setLabel] = useState("");

    const [state, setState] = useState<any>([
        {
            startDate: today,
            endDate: today,
            key: "selection",
        },
    ]);

    /* ========= helpers ========= */

    const formatLabel = (d: Date) =>
        d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    const emit = (from: Date, to: Date, p: string) => {
        onChange({
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
            preset: p,
        });
    };

    const applyRange = (from: Date, to: Date, p: string) => {
        setPreset(p);
        setLabel(`${formatLabel(from)} to ${formatLabel(to)}`);
        emit(from, to, p);
    };

    /* ========= preset click ========= */

    const handlePreset = (p: string) => {
        if (p === "custom") return;

        if (p === "today") applyRange(today, today, p);

        if (p === "thisMonth")
            applyRange(startOfMonth(today), today, p);

        if (p === "lastMonth") {
            const d = subMonths(today, 1);
            applyRange(startOfMonth(d), endOfMonth(d), p);
        }

        if (p === "lastYear") {
            const y = new Date(today.getFullYear() - 1, 0, 1);
            applyRange(startOfYear(y), endOfYear(y), p);
        }

        setShowCalendar(false);
    };

    const applyCustom = () => {
        const r = state[0];
        applyRange(r.startDate, r.endDate, "custom");
        setShowCalendar(false);
    };

    /* ========= init ========= */

    useEffect(() => {
        applyRange(today, today, "today");
    }, []);

    /* ========= UI ========= */

    return (
        <div className="relative ">

            {/* SINGLE INPUT */}
            <div
                onClick={() => setShowCalendar(true)}
                className="h-[34px] px-3 text-xs rounded-md border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] flex items-center justify-between cursor-pointer min-w-[260px]"
            >
                <span>{label}</span>
                <i className="material-symbols-outlined text-[18px] text-gray-500">
                    calendar_month
                </i>
            </div>

            {/* POPUP */}
            {showCalendar && (
                <div className="absolute z-50 top-[40px] right-0 bg-white dark:bg-[#0c1427] border rounded-xl shadow-lg p-4 flex gap-4 border border-gray-300">

                    {/* PRESET SIDEBAR */}
                    <div className="flex flex-col gap-1 min-w-[150px] pr-3 border-r border-gray-200 dark:border-[#172036]">

                        {[
                            { key: "today", label: "Today", icon: "today" },
                            { key: "thisMonth", label: "This Month", icon: "calendar_month" },
                            { key: "lastMonth", label: "Last Month", icon: "history" },
                            { key: "lastYear", label: "Last Year", icon: "event" },
                        ].map((p) => (
                            <button
                                key={p.key}
                                onClick={() => handlePreset(p.key)}
                                className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
        ${preset === p.key
                                        ? "bg-primary-50 text-primary-button-bg font-semibold"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#15203c]"
                                    }
      `}
                            >
                                <i className="material-symbols-outlined text-[18px] opacity-80 group-hover:opacity-100">
                                    {p.icon}
                                </i>

                                <span>{p.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* CALENDAR */}
                    <div>
                        <DateRange
                            editableDateInputs
                            onChange={(item: any) => setState([item.selection])}
                            moveRangeOnFirstSelection={false}
                            ranges={state}
                            months={2}
                            direction="horizontal"
                        />

                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => setShowCalendar(false)}
                                className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={applyCustom}
                                 className="px-[26.5px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeFilterPro;