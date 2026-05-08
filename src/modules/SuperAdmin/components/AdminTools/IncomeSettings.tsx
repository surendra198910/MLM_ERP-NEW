import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../../../../services/ApiService";
import Loader from "../../common/Loader";

const getIncomeIcon = (income: any): string => {
    const name = (income.IncomeName || "").toLowerCase();
    const type = (income.IncomeType || "").toLowerCase();
    if (name.includes("roi") || name.includes("return")) return "trending_up";
    if (name.includes("refer") || name.includes("affiliate")) return "group_add";
    if (name.includes("level") || name.includes("generation")) return "account_tree";
    if (name.includes("binary") || name.includes("matching")) return "compare_arrows";
    if (name.includes("rank") || name.includes("leadership")) return "military_tech";
    if (name.includes("pool") || name.includes("reward")) return "savings";
    if (name.includes("bonus") || name.includes("incentive")) return "redeem";
    if (name.includes("daily")) return "today";
    if (name.includes("weekly")) return "date_range";
    if (type === "percentage") return "percent";
    if (type === "fixed") return "attach_money";
    return "paid";
};

const CARD_COLORS = [
    { accent: "from-indigo-500 to-violet-500", iconBg: "bg-indigo-50 dark:bg-indigo-900/30", iconText: "text-indigo-600 dark:text-indigo-400" },
    { accent: "from-sky-500 to-cyan-500", iconBg: "bg-sky-50 dark:bg-sky-900/30", iconText: "text-sky-600 dark:text-sky-400" },
    { accent: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-50 dark:bg-emerald-900/30", iconText: "text-emerald-600 dark:text-emerald-400" },
    { accent: "from-amber-500 to-orange-500", iconBg: "bg-amber-50 dark:bg-amber-900/30", iconText: "text-amber-600 dark:text-amber-400" },
    { accent: "from-pink-500 to-rose-500", iconBg: "bg-pink-50 dark:bg-pink-900/30", iconText: "text-pink-600 dark:text-pink-400" },
    { accent: "from-teal-500 to-green-500", iconBg: "bg-teal-50 dark:bg-teal-900/30", iconText: "text-teal-600 dark:text-teal-400" },
    { accent: "from-violet-500 to-purple-500", iconBg: "bg-violet-50 dark:bg-violet-900/30", iconText: "text-violet-600 dark:text-violet-400" },
    { accent: "from-orange-500 to-amber-400", iconBg: "bg-orange-50 dark:bg-orange-900/30", iconText: "text-orange-600 dark:text-orange-400" },
];

interface IncomeItem {
    IncomeId: number;
    IncomeName: string;
    DisplayName: string;
    Status: boolean | number;
    TriggerType: string;
    TriggerTime: string;
    TriggerValueType: string;
    WalletDisplayName: string;
    IncomeType: string;
    MaxLevel: number;
    IsIncludedInCapping: boolean | number;
    Route: string;
}

const IncomeSettingPage: React.FC = () => {
    const { universalService } = ApiService();
    const navigate = useNavigate();

    const [incomes, setIncomes] = useState<IncomeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");

    const fetchIncomes = async () => {
        try {
            setLoading(true);
            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({ ActionMode: "GET_ALL" }),
            };
            const response = await universalService(payload);
            const data = response?.data ?? response;
            const list: IncomeItem[] = Array.isArray(data) ? data : [];
            setIncomes(list.filter((i) => i.Status === true || i.Status === 1));
        } catch (err) {
            console.error("Income fetch error:", err);
            setIncomes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIncomes(); }, []);

    // unique income types for the filter dropdown
    const incomeTypes = Array.from(
        new Set(incomes.map((i) => i.IncomeType).filter(Boolean))
    );

    const filtered = incomes.filter((inc) => {
        const matchSearch =
            !searchQuery ||
            inc.IncomeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inc.DisplayName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = !filterType || inc.IncomeType === filterType;
        return matchSearch && matchType;
    });

    const handleSettingClick = (route: string) => {
        if (!route) return;
        const path = route.startsWith("/") ? route : `/${route}`;
        navigate(path);
    };

    const handleReset = () => {
        setFilterType("");
        setSearchQuery("");
    };

    if (loading) return <Loader />;

    return (
        <>
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">

                {/* ══════════════════════════════════════════════════════════
                    HEADER & SEARCH  — mirrors Template reference exactly
                ══════════════════════════════════════════════════════════ */}
                <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 dark:border-[#172036] -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">

                    {/* Left — page title */}
                    <div className="trezo-card-title">
                        <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
                            Income Settings
                        </h5>
                    </div>

                    {/* Right — controls row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">

                            {/* 1 ▸ Filter Dropdown */}
                            <div className="relative w-full sm:w-[180px]">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                                    <i className="material-symbols-outlined !text-[18px]">filter_list</i>
                                </span>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border transition-all
                                        bg-white dark:bg-[#0c1427] text-black dark:text-white
                                        border-gray-300 dark:border-[#334155]
                                        focus:border-primary-button-bg"
                                >
                                    <option value="">Select Filter Option</option>
                                    {incomeTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                                    <i className="material-symbols-outlined !text-[18px]">expand_more</i>
                                </span>
                            </div>

                            {/* 2 ▸ Search Input */}
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                                    <i className="material-symbols-outlined !text-[18px]">search</i>
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    placeholder="Enter Criteria..."
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border transition-all
                                        bg-white dark:bg-[#0c1427] text-black dark:text-white
                                        border-gray-300 dark:border-[#334155]
                                        focus:border-primary-button-bg
                                        placeholder:text-gray-400"
                                />
                            </div>

                            {/* 3 ▸ Button Group */}
                            <div className="flex items-center gap-2">

                                {/* Search btn (visual — filtering is live) */}
                                <button
                                    type="button"
                                    title="Search"
                                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all shadow-sm"
                                >
                                    <i className="material-symbols-outlined text-[20px]">search</i>
                                </button>

                                {/* Refresh btn */}
                                <button
                                    type="button"
                                    title="Refresh"
                                    onClick={fetchIncomes}
                                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-300 dark:border-[#334155] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-all shadow-sm"
                                >
                                    <i className="material-symbols-outlined text-[20px]">refresh</i>
                                </button>

                            </div>

                            {/* Reset pill — only when a filter/search is active */}
                            {(filterType || searchQuery) && (
                                <button
                                    type="button"
                                    title="Reset filters"
                                    onClick={handleReset}
                                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 dark:border-[#334155] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1e293b] transition-all"
                                >
                                    <i className="material-symbols-outlined text-[20px]">refresh</i>
                                </button>
                            )}

                        </div>
                    </div>
                </div>

                {/* ── Thin results meta-bar ── */}
                {/* <div className="flex items-center justify-between -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px] py-2 mb-4 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-100 dark:border-[#172036]">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        Showing&nbsp;
                        <span className="font-semibold text-black dark:text-white">{filtered.length}</span>
                        &nbsp;of&nbsp;
                        <span className="font-semibold text-black dark:text-white">{incomes.length}</span>
                        &nbsp;active income{incomes.length !== 1 ? "s" : ""}
                    </span>
                    {(filterType || searchQuery) && (
                        <span className="text-[11px] font-bold text-primary-button-bg uppercase tracking-wide">
                            Filtered
                        </span>
                    )}
                </div> */}

                {/* ══════════════════════════════════════════════════════════
                    CARDS GRID / EMPTY STATE
                ══════════════════════════════════════════════════════════ */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span
                            className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-4"
                            style={{ fontSize: 56 }}
                        >
                            payments
                        </span>
                        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-1">
                            No income settings found
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {searchQuery || filterType
                                ? "Try clearing your search or filter."
                                : "No active income settings are configured yet."}
                        </p>
                        {(searchQuery || filterType) && (
                            <button
                                onClick={handleReset}
                                className="mt-4 px-4 py-2 text-xs font-semibold rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map((income, idx) => {
                            const color = CARD_COLORS[idx % CARD_COLORS.length];
                            const icon = getIncomeIcon(income);
                            const hasCapping =
                                income.IsIncludedInCapping === true ||
                                income.IsIncludedInCapping === 1;

                            return (
                                <div
                                    key={income.IncomeId}
                                    className="relative bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-[#1e293b] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                                    style={{
                                        animation: "fadeSlideUp 0.4s ease both",
                                        animationDelay: `${idx * 0.05}s`,
                                    }}
                                >
                                    {/* Colour accent strip */}
                                    <div className={`h-1 w-full bg-gradient-to-r ${color.accent}`} />

                                    {/* Card body */}
                                    <div className="p-5 flex-1 flex flex-col">

                                        {/* Icon + Settings button */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.iconBg} ${color.iconText}`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                                                    {icon}
                                                </span>
                                            </div>

                                            {/* ── Settings icon → navigates to backend Route ── */}
                                            <button
                                                title={income.Route ? `Configure: ${income.Route}` : "No route configured"}
                                                onClick={() => handleSettingClick(income.Route)}
                                                disabled={!income.Route}
                                                className={`w-[34px] h-[34px] flex items-center justify-center rounded-md border transition-all
                                                    ${income.Route
                                                        ? "border-gray-200 dark:border-[#334155] text-gray-500 dark:text-gray-400 hover:bg-primary-button-bg hover:border-primary-button-bg hover:text-white hover:rotate-45"
                                                        : "border-gray-100 dark:border-[#1e293b] text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40"
                                                    }`}
                                            >
                                                <i className="material-symbols-outlined text-[20px]">settings</i>
                                            </button>
                                        </div>

                                        {/* Names */}
                                        <p className="font-bold text-base text-black dark:text-white mb-0.5 leading-snug">
                                            {income.DisplayName || income.IncomeName}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                                            {income.IncomeName}
                                        </p>

                                        {/* Meta chips */}
                                        <div className="flex flex-wrap gap-1.5 mt-auto">
                                            {income.TriggerTime && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#1e293b] text-gray-600 dark:text-gray-400 text-[11px] font-semibold">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
                                                    {income.TriggerTime}
                                                </span>
                                            )}
                                            {income.IncomeType && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[11px] font-semibold">
                                                    {income.IncomeType === "Percentage" ? "%" : "$"} {income.IncomeType}
                                                </span>
                                            )}
                                            {hasCapping && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
                                                    Capped
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card footer */}
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-[#1e293b]">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>account_balance_wallet</span>
                                            <span>{income.WalletDisplayName || "—"}</span>
                                        </div>
                                        {income.MaxLevel > 0 && (
                                            <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] text-gray-500 dark:text-gray-400">
                                                L{income.MaxLevel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default IncomeSettingPage;