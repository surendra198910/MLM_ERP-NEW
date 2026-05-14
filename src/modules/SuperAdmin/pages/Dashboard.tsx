import React, { useState, useEffect } from "react";
import type { ApexOptions } from "apexcharts";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../../../services/ApiService";
import { useCurrency } from "../context/CurrencyContext";
import { ArrowUpRight, HandCoins, Landmark, Wallet } from "lucide-react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  type Variants,
  type Easing,
} from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  TotalMembers: number;
  ActiveMembers: number;
  InactiveMembers: number;
  ActiveRate: number;
  TodayMembers: number;
  ThisWeekMembers: number;
  ThisMonthMembers: number;
  TotalPlatformBusiness: number;
  TotalWalletBalance: number;
  TotalCommissionWallet: number;
  TotalROIWallet: number;
  TotalProductWallet: number;
  TotalEarning: number;
  TotalIncomeDistributed: number;
  TotalWithdrawals: number;
  PendingWithdrawalAmount: number;
  PendingWithdrawalCount: number;
  ApprovedWithdrawalAmount: number;
  ApprovedWithdrawalCount: number;
  RejectedWithdrawalAmount: number;
  RejectedWithdrawalCount: number;
  PendingRequestFundAmount: number;
  PendingRequestFundCount: number;
  PendingIncomeAmount: number;
  PendingIncomeCount: number;
  TotalROIIncome: number;
  TotalSponsorIncome: number;
  TotalROILevelIncome: number;
  IncomeBreakdown: string;
  EarningsChart: string;
  TotalTickets: number;
  OpenTickets: number;
  NewTickets: number;
  ClosedTickets: number;
  WorkingTickets: number;
  TopInvestors: string;
  RecentTransactions: string;
  RecentRegistrations: string;
}
interface IncomeItem { IncomeType: string; TotalIncome: number; SharePct: number; }
interface EarningsItem { date: string; earnings: number; withdrawals: number; }
interface TopInvestor { ClientId: number; ClientName: string; UserName: string; InvestmentAmount: number; RegistrationDate: string; }
interface RecentTx { MemberId: number; UserName: string; TransactionNote: string; TransType: string; Amount: number; LogType: string; TransDate: string; }
interface RecentReg { ClientId: number; ClientName: string; UserName: string; SponsorUserName: string; SponsorName: string; RegistrationDate: string; InvestmentAmount: number; MemberStatus: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseJson<T>(raw: string, fallback: T): T {
  try { return raw && raw !== "NoRecord" ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const staggerGrid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] as Easing },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

const fadeRow: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.045, duration: 0.3 },
  }),
};

// ─── CountUp ──────────────────────────────────────────────────────────────────
function CountUp({ to, prefix = "", decimals = 0 }: { to: number; prefix?: string; decimals?: number }) {
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => {
    if (decimals > 0) {
      return prefix + latest.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    return prefix + Math.floor(latest).toLocaleString();
  });
  useEffect(() => {
    const ctrl = animate(count, to, { duration: 1.5, ease: "easeOut" as Easing });
    return ctrl.stop;
  }, [to]);
  return <motion.span>{display}</motion.span>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-[#172036] rounded ${className}`} />
);

// ─── Card Header Icon (dual-tone) ─────────────────────────────────────────────
function CardHeaderIcon({ icon }: { icon: string }) {
  return (
    <div className="w-9 h-9 rounded-xl relative flex items-center justify-center flex-shrink-0 bg-primary-button-bg/10">
      <i
        className="material-symbols-outlined absolute text-[30px] text-primary-button-bg/20"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
      >{icon}</i>
      <i
        className="material-symbols-outlined relative text-[16px] text-primary-button-bg"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}
      >{icon}</i>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, rawValue, prefix = "", decimals = 0,
  sub, icon, numColor, iconColor, iconBg, stripColor, onClick,
}: {
  label: string;
  value: string | number;
  rawValue?: number;
  prefix?: string;
  decimals?: number;
  sub?: string;
  icon: string;
  numColor: string;
  iconColor: string;
  iconBg: string;
  stripColor: string;
  onClick?: () => void;
}) => (
  <motion.div
    variants={fadeUp}
    onClick={onClick}
    whileHover={onClick ? { y: -4, transition: { duration: 0.18 } } : undefined}
    whileTap={onClick ? { scale: 0.98 } : undefined}
    className={`
      trezo-card relative overflow-hidden
      bg-white dark:bg-[#0c1427]
      mb-[25px] pt-[23px] px-[20px] pb-[20px] md:pt-[28px] md:px-[25px] md:pb-[25px]
      rounded-md shadow-sm hover:shadow-md
      ${onClick ? "cursor-pointer" : ""}
    `}
  >
    {/* Top colour strip */}
    <div
      className="absolute top-0 left-0 right-0 h-[4px]"
      style={{ background: `linear-gradient(90deg, ${stripColor}, ${stripColor}99)` }}
    />
    <div className="trezo-card-content flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="block text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className={`!mb-0 !mt-[6px] text-[26px] font-bold ${numColor}`}>
          {rawValue !== undefined
            ? <CountUp to={rawValue} prefix={prefix} decimals={decimals} />
            : value}
        </h4>
        {sub && (
          <span className="block mt-2 text-[11px] text-gray-400">{sub}</span>
        )}
      </div>

      {/* Dual-tone icon */}
      <div className={`w-12 h-12 rounded-xl relative flex items-center justify-center flex-shrink-0 mt-1 ${iconBg}`}>
        <i
          className={`material-symbols-outlined absolute text-[40px] ${iconColor} opacity-20`}
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
        >{icon}</i>
        <i
          className={`material-symbols-outlined relative text-[22px] ${iconColor}`}
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}
        >{icon}</i>
      </div>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { universalService } = ApiService();
  const { currency } = useCurrency();
  const cs = currency?.symbol ?? "$";
  const navigate = useNavigate();

  const go = (path: string) => () => navigate(path);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [barReady, setBarReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Chart, setChart] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import("react-apexcharts").then((m) => setChart(() => m.default));
  }, []);

  const universalServiceRef = React.useRef(universalService);
  universalServiceRef.current = universalService;

  useEffect(() => {
    (async () => {
      try {
        const res = await universalServiceRef.current({
          procName: "FetchAdminDashboardData",
          Para: JSON.stringify({}),
        });
        const row = Array.isArray(res) ? res[0] : res;
        if (row) setData(row);
      } catch (e) {
        console.error("Dashboard fetch:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setBarReady(true), 450);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // ── Parse JSON fields ──────────────────────────────────────────────────────
  const incomeBreakdown = parseJson<IncomeItem[]>(data?.IncomeBreakdown ?? "", []);
  const earningsChart = parseJson<EarningsItem[]>(data?.EarningsChart ?? "", []);
  const topInvestors = parseJson<TopInvestor[]>(data?.TopInvestors ?? "", []);
  const recentTxs = parseJson<RecentTx[]>(data?.RecentTransactions ?? "", []);
  const recentRegs = parseJson<RecentReg[]>(data?.RecentRegistrations ?? "", []);

  // ── Chart configs ──────────────────────────────────────────────────────────
  const earningsOpts: ApexOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    colors: ["#605DFF", "#AD63F6"],
    fill: { type: "gradient", gradient: { stops: [0, 90, 100], opacityFrom: 0.4, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    grid: { borderColor: "#ECEEF2" },
    xaxis: {
      categories: earningsChart.map((e) => e.date),
      labels: { style: { colors: "#8695AA", fontSize: "10px" }, rotate: -30 },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (v) => cs + fmt(v), style: { colors: "#64748B", fontSize: "10px" } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    legend: { show: true, position: "top", horizontalAlign: "left", labels: { colors: "#64748B" }, markers: { size: 6 } },
    tooltip: { shared: true, intersect: false },
  };

  const incomeColors = ["#605DFF", "#AD63F6", "#3584FC"];

  const incomeRoutes: Record<string, string> = {
    "ROI Income": "/superadmin/commission/roi-income-report",
    "Sponsor Income": "/superadmin/commission/sponsor-income-report",
    "ROI Level Income": "/superadmin/commission/roi-level-income-report",
    "Binary Income": "/superadmin/commission/binary-income-report",
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <div className="sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-x-[25px]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 tracking-widest uppercase">Loading dashboard…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          ROW 1 — Member Stats
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-x-[25px]"
        variants={staggerGrid}
        initial="hidden"
        animate="show"
      >
        <StatCard
          label="Total Members"
          rawValue={data?.TotalMembers ?? 0}
          value={(data?.TotalMembers ?? 0).toLocaleString()}
          sub={`Today +${data?.TodayMembers ?? 0}  ·  Inactive ${data?.InactiveMembers ?? 0}`}
          icon="group" numColor="text-blue-600 dark:text-blue-400"
          iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-900/20"
          stripColor="#3b82f6"
          onClick={go("/superadmin/client/manage-client")}
        />
        <StatCard
          label="Active Members"
          rawValue={data?.ActiveMembers ?? 0}
          value={(data?.ActiveMembers ?? 0).toLocaleString()}
          sub={`Active Rate: ${(data?.ActiveRate ?? 0).toFixed(2)}%`}
          icon="verified_user" numColor="text-emerald-600 dark:text-emerald-400"
          iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          stripColor="#10b981"
          onClick={go("/superadmin/client/manage-client")}
        />
        <StatCard
          label="Inactive Members"
          rawValue={data?.InactiveMembers ?? 0}
          value={(data?.InactiveMembers ?? 0).toLocaleString()}
          sub={`Active Rate: ${(data?.ActiveRate ?? 0).toFixed(2)}%`}
          icon="person_off" numColor="text-violet-600 dark:text-violet-400"
          iconColor="text-violet-500" iconBg="bg-violet-50 dark:bg-violet-900/20"
          stripColor="#8b5cf6"
          onClick={go("/superadmin/client/manage-client")}
        />
        <StatCard
          label="This Month"
          rawValue={data?.ThisMonthMembers ?? 0}
          value={(data?.ThisMonthMembers ?? 0).toLocaleString()}
          sub="New registrations this month"
          icon="date_range" numColor="text-amber-600 dark:text-amber-400"
          iconColor="text-amber-500" iconBg="bg-amber-50 dark:bg-amber-900/20"
          stripColor="#f59e0b"
          onClick={go("/superadmin/client/manage-client")}
        />
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 2 — Platform Financials
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-x-[25px]"
        variants={staggerGrid}
        initial="hidden"
        animate="show"
      >
        <StatCard
          label="Total Business"
          rawValue={data?.TotalPlatformBusiness ?? 0}
          value={`${cs}${fmt(data?.TotalPlatformBusiness ?? 0)}`}
          prefix={cs} decimals={2}
          sub={`Earnings: ${cs}${fmt(data?.TotalEarning ?? 0)}`}
          icon="trending_up" numColor="text-blue-600 dark:text-blue-400"
          iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-900/20"
          stripColor="#3b82f6"
          onClick={go("/superadmin/investment/investment-report")}
        />
        <StatCard
          label="Wallet Balance"
          rawValue={data?.TotalWalletBalance ?? 0}
          value={`${cs}${fmt(data?.TotalWalletBalance ?? 0)}`}
          prefix={cs} decimals={2}
          sub={`Commission ${cs}${fmt(data?.TotalCommissionWallet ?? 0)}  ·  ROI ${cs}${fmt(data?.TotalROIWallet ?? 0)}`}
          icon="account_balance_wallet" numColor="text-purple-600 dark:text-purple-400"
          iconColor="text-purple-500" iconBg="bg-purple-50 dark:bg-purple-900/20"
          stripColor="#a855f7"
          onClick={go("/superadmin/wallet/member-wallet")}
        />
        <StatCard
          label="Income Distributed"
          rawValue={data?.TotalIncomeDistributed ?? 0}
          value={`${cs}${fmt(data?.TotalIncomeDistributed ?? 0)}`}
          prefix={cs} decimals={2}
          sub={`ROI ${cs}${fmt(data?.TotalROIIncome ?? 0)}  ·  Sponsor ${cs}${fmt(data?.TotalSponsorIncome ?? 0)}`}
          icon="payments" numColor="text-emerald-600 dark:text-emerald-400"
          iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          stripColor="#10b981"
          onClick={go("/superadmin/commission/roi-income-report")}
        />
        <StatCard
          label="Total Withdrawals"
          rawValue={data?.TotalWithdrawals ?? 0}
          value={`${cs}${fmt(data?.TotalWithdrawals ?? 0)}`}
          prefix={cs} decimals={2}
          sub={`Pending ${data?.PendingWithdrawalCount ?? 0}  ·  Approved ${data?.ApprovedWithdrawalCount ?? 0}`}
          icon="savings" numColor="text-rose-600 dark:text-rose-400"
          iconColor="text-rose-500" iconBg="bg-rose-50 dark:bg-rose-900/20"
          stripColor="#f43f5e"
          onClick={go("/superadmin/withdraw/withdraw-reports")}
        />
      </motion.div>

      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        {/* Earnings vs Withdrawals — area chart */}
        <motion.div
          className="lg:col-span-2"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardHeaderIcon icon="show_chart" />
                <div>
                  <h5 className="!mb-0">Earnings vs Withdrawals</h5>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 !mb-0">Last 30 days</p>
                </div>
              </div>
            </div>
            <div className="-mb-[3px] ltr:-ml-[10px] rtl:-mr-[10px]">
              {Chart && earningsChart.length > 0 ? (
                <Chart
                  options={earningsOpts}
                  series={[
                    { name: "Earnings", data: earningsChart.map((e) => e.earnings) },
                    { name: "Withdrawals", data: earningsChart.map((e) => e.withdrawals) },
                  ]}
                  type="area" height={300} width="100%"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
                  {!Chart ? "Loading chart…" : "No transaction data for last 30 days"}
                </div>
              )}
            </div>
            <ul className="text-center mt-3 border-t border-gray-100 dark:border-[#172036] pt-3">
              {[
                { lbl: "Total Earnings", val: `${cs}${fmt(data?.TotalEarning ?? 0)}`, color: "text-[#605DFF]" },
                { lbl: "Total Withdrawals", val: `${cs}${fmt(data?.TotalWithdrawals ?? 0)}`, color: "text-purple-500" },
              ].map(({ lbl, val, color }) => (
                <li key={lbl} className="inline-block mx-[13px]">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-[18px] ${color}`}>{val}</span>
                    <span className="text-sm text-gray-500">{lbl}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Pending Stats */}
        <motion.div
          className="lg:col-span-1"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="trezo-card-header flex items-center justify-between mb-[20px] md:mb-[25px]">
              <div className="flex items-center gap-3">
                <CardHeaderIcon icon="pending_actions" />
                <div>
                  <h5 className="!mb-0 font-bold text-gray-800 dark:text-white tracking-tight">Pending Stats</h5>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 !mb-0">Requires action</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium">
                Action Required
              </span>
            </div>

            <div className="space-y-3">
              {([
                {
                  label: "Withdrawal",
                  amount: data?.PendingWithdrawalAmount ?? 0,
                  count: data?.PendingWithdrawalCount ?? 0,
                  icon: <Landmark size={18} />,
                  colorClass: "text-amber-600 dark:text-amber-400",
                  bgClass: "bg-amber-50/50 dark:bg-amber-900/10",
                  borderColor: "hover:border-amber-300",
                },
                {
                  label: "Request Fund",
                  amount: data?.PendingRequestFundAmount ?? 0,
                  count: data?.PendingRequestFundCount ?? 0,
                  icon: <HandCoins size={18} />,
                  colorClass: "text-emerald-600 dark:text-emerald-400",
                  bgClass: "bg-emerald-50/50 dark:bg-emerald-900/10",
                  borderColor: "hover:border-emerald-300",
                },
                {
                  label: "Income",
                  amount: data?.PendingIncomeAmount ?? 0,
                  count: data?.PendingIncomeCount ?? 0,
                  icon: <Wallet size={18} />,
                  colorClass: "text-rose-600 dark:text-rose-400",
                  bgClass: "bg-rose-50/50 dark:bg-rose-900/10",
                  borderColor: "hover:border-rose-300",
                },
              ] as const).map(({ label, amount, count, icon, colorClass, bgClass, borderColor }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.35 }}
                  onClick={go("/superadmin/withdraw/withdraw-reports")}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.98 }}
                  className={`group flex items-center justify-between p-4 rounded-xl border border-transparent dark:border-gray-800/50 ${bgClass} ${borderColor} cursor-pointer hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${colorClass}`}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{cs}{fmt(amount)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <span className={`text-xl font-black ${colorClass}`}>{count}</span>
                      <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase">Requests</p>
                  </div>
                </motion.div>
              ))}

              <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Aggregated Total</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    {cs}{fmt(
                      (data?.PendingWithdrawalAmount ?? 0) +
                      (data?.PendingRequestFundAmount ?? 0) +
                      (data?.PendingIncomeAmount ?? 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 4 — Withdrawal Status  +  Support Tickets
      ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        {/* Withdrawal status */}
        <motion.div
          className="lg:col-span-1"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center gap-3">
              <CardHeaderIcon icon="savings" />
              <div>
                <h5 className="!mb-0">Withdrawal Status</h5>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 !mb-0">All-time breakdown</p>
              </div>
            </div>
            <div className="space-y-4">
              {([
                { label: "Pending", amount: data?.PendingWithdrawalAmount ?? 0, count: data?.PendingWithdrawalCount ?? 0, bg: "bg-amber-50   dark:bg-amber-900/20", border: "border-amber-200   dark:border-amber-800", num: "text-amber-500" },
                { label: "Approved", amount: data?.ApprovedWithdrawalAmount ?? 0, count: data?.ApprovedWithdrawalCount ?? 0, bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", num: "text-emerald-500" },
                { label: "Rejected", amount: data?.RejectedWithdrawalAmount ?? 0, count: data?.RejectedWithdrawalCount ?? 0, bg: "bg-rose-50    dark:bg-rose-900/20", border: "border-rose-200    dark:border-rose-800", num: "text-rose-500" },
              ] as const).map(({ label, amount, count, bg, border, num }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                  onClick={go("/superadmin/withdraw/withdraw-reports")}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:shadow-sm ${bg} ${border}`}
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</span>
                    <p className={`text-lg font-bold ${num} !mb-0 leading-tight mt-0.5`}>{cs}{fmt(amount)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-extrabold ${num}`}>{count}</span>
                    <p className="text-[10px] text-gray-400 !mb-0">requests</p>
                  </div>
                </motion.div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#172036]">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawals</span>
                <span className="text-base font-bold text-black dark:text-white">{cs}{fmt(data?.TotalWithdrawals ?? 0)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Support Tickets */}
        <motion.div
          className="lg:col-span-2"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md h-[94%]">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardHeaderIcon icon="confirmation_number" />
                <div>
                  <h5 className="!mb-0">Support Tickets</h5>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 !mb-0">All-time overview</p>
                </div>
              </div>
              <div
                onClick={go("/superadmin/support-center/search-ticket-all")}
                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-1.5 cursor-pointer hover:shadow-sm transition-shadow"
              >
                <i className="material-symbols-outlined text-[18px] text-blue-500">confirmation_number</i>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">
                  {(data?.TotalTickets ?? 0).toLocaleString()}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-blue-400">Total</span>
              </div>
            </div>

            <div className="space-y-3">
              {([
                { label: "New", val: data?.NewTickets ?? 0, icon: "fiber_new", accent: "#7c3aed", bar: "bg-violet-500", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
                { label: "Open", val: data?.OpenTickets ?? 0, icon: "drafts", accent: "#f59e0b", bar: "bg-amber-400", badge: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300" },
                { label: "Working", val: data?.WorkingTickets ?? 0, icon: "manufacturing", accent: "#0ea5e9", bar: "bg-sky-500", badge: "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-300" },
                { label: "Closed", val: data?.ClosedTickets ?? 0, icon: "check_circle", accent: "#22c55e", bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
              ] as const).map(({ label, val, icon, accent, bar, badge }, i) => {
                const total = data?.TotalTickets ?? 0;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.08, duration: 0.32 }}
                    onClick={go("/superadmin/support-center/search-ticket-all")}
                    whileHover={{ y: -1, transition: { duration: 0.15 } }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-[#0a1020] border border-gray-100 dark:border-[#172036] group hover:shadow-sm cursor-pointer"
                  >
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: accent }} />
                    <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accent + "1a" }}>
                      <i className="material-symbols-outlined text-[20px]" style={{ color: accent }}>{icon}</i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-[#172036] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar}`}
                          style={{
                            width: barReady ? `${pct}%` : "0%",
                            transition: `width 700ms ease ${i * 120}ms`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 w-[48px]">
                      <span className="text-xl font-black text-black dark:text-white leading-none">{val.toLocaleString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 5 — Top Investors  +  Recent Registrations
      ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        {/* Top Investors */}
        <motion.div
          className="lg:col-span-1"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center gap-3">
              <CardHeaderIcon icon="leaderboard" />
              <div>
                <h5 className="!mb-0">Top Investors</h5>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 !mb-0">By investment amount</p>
              </div>
            </div>
            <div className="trezo-card-content">
              <table className="w-full">
                <tbody className="text-black dark:text-white">
                  {topInvestors.map((inv, i) => (
                    <motion.tr
                      key={inv.ClientId}
                      custom={i}
                      variants={fadeRow}
                      initial="hidden"
                      animate="show"
                      onClick={go("/superadmin/investment/investment-report")}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#172036] transition-colors"
                    >
                      <td className="ltr:text-left whitespace-nowrap px-0 py-[13px] border-b border-gray-100 dark:border-[#172036]">
                        <div className="flex items-center gap-3">
                          <div className="w-[36px] h-[36px] rounded-full bg-primary-50 dark:bg-[#15203c] flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-500 font-bold text-sm">{i + 1}</span>
                          </div>
                          <div>
                            <span className="block font-medium text-sm leading-tight">{inv.ClientName}</span>
                            <span className="text-gray-400 text-[11px]">[{inv.UserName}]</span>
                          </div>
                        </div>
                      </td>
                      <td className="ltr:text-right whitespace-nowrap px-0 py-[13px] border-b border-gray-100 dark:border-[#172036]">
                        <span className="font-bold text-emerald-500 text-sm">{cs}{fmt(inv.InvestmentAmount)}</span>
                        <span className="block text-[10px] text-gray-400">{inv.RegistrationDate}</span>
                      </td>
                    </motion.tr>
                  ))}
                  {topInvestors.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-10 text-center text-sm text-gray-400">
                        <i className="material-symbols-outlined text-[36px] block mb-1">leaderboard</i>
                        No investors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Recent Registrations */}
        <motion.div
          className="lg:col-span-2"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center gap-3">
              <CardHeaderIcon icon="person_add" />
              <div>
                <h5 className="!mb-0">Recent Registrations</h5>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 !mb-0">Latest joined members</p>
              </div>
            </div>
            <div className="trezo-card-content -mx-[20px] md:-mx-[25px]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Member", "Sponsor", "Joined", "Investment", "Status"].map((h) => (
                        <th key={h} className="font-medium ltr:text-left px-[20px] py-[11px] md:ltr:first:pl-[25px] md:rtl:first:pr-[25px] bg-primary-50 dark:bg-[#15203c] whitespace-nowrap text-black dark:text-white text-sm">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-black dark:text-white">
                    {recentRegs.map((reg, i) => (
                      <motion.tr
                        key={reg.ClientId}
                        custom={i}
                        variants={fadeRow}
                        initial="hidden"
                        animate="show"
                        onClick={go("/superadmin/client/manage-client")}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#172036] transition-colors"
                      >
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] md:ltr:first:pl-[25px] border-b border-gray-100 dark:border-[#172036]">
                          <span className="block font-medium text-sm">{reg.ClientName}</span>
                          <span className="text-gray-400 text-[11px]">[{reg.UserName}]</span>
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036]">
                          <span className="block text-sm text-gray-600 dark:text-gray-300">{reg.SponsorName || "—"}</span>
                          <span className="text-[11px] text-gray-400">[{reg.SponsorUserName || "—"}]</span>
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036] text-sm text-gray-500 dark:text-gray-400">
                          {reg.RegistrationDate}
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036]">
                          <span className="font-semibold text-emerald-500 text-sm">{cs}{fmt(reg.InvestmentAmount)}</span>
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036]">
                          <span className={`px-[8px] py-[3px] inline-block rounded-sm font-medium text-xs ${reg.MemberStatus === "Active"
                            ? "bg-success-50 text-success-500 dark:bg-[#15203c]"
                            : "bg-warning-50 text-warning-500 dark:bg-[#15203c]"
                          }`}>
                            {reg.MemberStatus}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                    {recentRegs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-sm text-gray-400">
                          <i className="material-symbols-outlined text-[36px] block mb-1">person_add</i>
                          No recent registrations
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 6 — Income Distribution  +  Recent Transactions
      ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        {/* Income Distribution */}
        <motion.div
          className="lg:col-span-1"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center gap-3">
              <CardHeaderIcon icon="bar_chart" />
              <div>
                <h5 className="!mb-0">Income Distribution</h5>
                <p className="text-sm text-gray-400 mt-0.5 !mb-0">
                  Total: <span className="font-semibold text-black dark:text-white">{cs}{fmt(data?.TotalIncomeDistributed ?? 0)}</span>
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {incomeBreakdown.map((item, i) => (
                <motion.div
                  key={item.IncomeType}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                  onClick={() => { const r = incomeRoutes[item.IncomeType]; if (r) navigate(r); }}
                  className={incomeRoutes[item.IncomeType] ? "cursor-pointer group" : ""}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-black dark:text-white">{item.IncomeType}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-black dark:text-white">{cs}{fmt(item.TotalIncome)}</span>
                      <span className="text-xs text-gray-400 ml-1">({item.SharePct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-[8px] bg-gray-100 dark:bg-[#172036] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: barReady ? `${Math.min(item.SharePct, 100)}%` : "0%",
                        background: incomeColors[i % incomeColors.length],
                        transition: `width 700ms ease ${i * 150}ms`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
              {incomeBreakdown.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                  <i className="material-symbols-outlined text-[40px]">bar_chart</i>
                  <p className="text-sm">No income data available</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          className="lg:col-span-2 trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardHeaderIcon icon="receipt_long" />
              <div>
                <h5 className="!mb-0">Recent Transactions</h5>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 !mb-0">Latest 10 across all members</p>
              </div>
            </div>
          </div>
          <div className="trezo-card-content -mx-[20px] md:-mx-[25px]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Member", "Log Type", "Note", "Type", "Amount", "Date"].map((h) => (
                      <th key={h} className="font-medium ltr:text-left px-[20px] py-[11px] md:ltr:first:pl-[25px] md:rtl:first:pr-[25px] bg-primary-50 dark:bg-[#15203c] whitespace-nowrap text-black dark:text-white text-sm">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-black dark:text-white">
                  {recentTxs.map((tx, i) => {
                    const isCr = tx.TransType?.trim() === "CR";
                    return (
                      <motion.tr
                        key={i}
                        custom={i}
                        variants={fadeRow}
                        initial="hidden"
                        animate="show"
                        onClick={go("/superadmin/withdraw/withdraw-reports")}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#172036] transition-colors"
                      >
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] md:ltr:first:pl-[25px] border-b border-gray-100 dark:border-[#172036]">
                          <span className="font-medium text-sm">{tx.UserName}</span>
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036]">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{tx.LogType}</span>
                        </td>
                        <td className="px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036] max-w-[220px]">
                          <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{tx.TransactionNote || "—"}</span>
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036]">
                          <span className={`px-[8px] py-[3px] inline-flex items-center gap-1 rounded-sm font-semibold text-xs ${
                            isCr
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                              : "bg-rose-50 text-rose-500 dark:bg-rose-900/20"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isCr ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {tx.TransType?.trim()}
                          </span>
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036]">
                          <span className={`font-bold text-sm ${isCr ? "text-emerald-500" : "text-rose-500"}`}>
                            {isCr ? "+" : "-"}{cs}{Number(tx.Amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="ltr:text-left whitespace-nowrap px-[20px] py-[12px] border-b border-gray-100 dark:border-[#172036] text-sm text-gray-500 dark:text-gray-400">
                          {tx.TransDate}
                        </td>
                      </motion.tr>
                    );
                  })}
                  {recentTxs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                        <i className="material-symbols-outlined text-[36px] block mb-1">receipt_long</i>
                        No recent transactions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;
