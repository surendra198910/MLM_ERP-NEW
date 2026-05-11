import React, { useState, useEffect } from "react";
import type { ApexOptions } from "apexcharts";
import { ApiService } from "../../../services/ApiService";
import { useCurrency } from "../context/CurrencyContext";

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
  TotalROIIncome: number;
  TotalSponsorIncome: number;
  TotalROILevelIncome: number;
  IncomeBreakdown: string;
  TeamGrowth: string;
  EarningsChart: string;
  TopInvestors: string;
  RecentTransactions: string;
  RecentRegistrations: string;
}
interface IncomeItem      { IncomeType: string; TotalIncome: number; SharePct: number; }
interface GrowthItem      { week: string; WeekStart: string; members: number; }
interface EarningsItem    { date: string; earnings: number; withdrawals: number; }
interface TopInvestor     { ClientId: number; ClientName: string; UserName: string; InvestmentAmount: number; RegistrationDate: string; }
interface RecentTx        { MemberId: number; UserName: string; TransactionNote: string; TransType: string; Amount: number; LogType: string; TransDate: string; }
interface RecentReg       { ClientId: number; ClientName: string; UserName: string; SponsorUserName: string; SponsorName: string; RegistrationDate: string; InvestmentAmount: number; MemberStatus: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + "M"
  : n >= 1_000   ? (n / 1_000).toFixed(2) + "K"
  : (n ?? 0).toFixed(2);

function parseJson<T>(raw: string, fallback: T): T {
  try { return raw && raw !== "NoRecord" ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-[#172036] rounded ${className}`} />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, sub, icon, numColor, iconColor, iconBg,
}: {
  label: string; value: string | number; sub?: string;
  icon: string; numColor: string; iconColor: string; iconBg: string;
}) => (
  <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
    <div className="trezo-card-content flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="block text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className={`!mb-0 !mt-[6px] text-[26px] font-bold ${numColor}`}>{value}</h4>
        {sub && <span className="block mt-2 text-[11px] text-gray-400">{sub}</span>}
      </div>
      <div className={`w-[50px] h-[50px] rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 mt-1`}>
        <i className={`material-symbols-outlined text-[24px] ${iconColor}`}>{icon}</i>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { universalService } = ApiService();
  const { currency } = useCurrency();
  const cs = currency?.symbol ?? "$";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
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

  // ── Parse JSON fields ──────────────────────────────────────────────────────
  const incomeBreakdown = parseJson<IncomeItem[]>(data?.IncomeBreakdown ?? "", []);
  const teamGrowth      = parseJson<GrowthItem[]>(data?.TeamGrowth ?? "", []);
  const earningsChart   = parseJson<EarningsItem[]>(data?.EarningsChart ?? "", []);
  const topInvestors    = parseJson<TopInvestor[]>(data?.TopInvestors ?? "", []);
  const recentTxs       = parseJson<RecentTx[]>(data?.RecentTransactions ?? "", []);
  const recentRegs      = parseJson<RecentReg[]>(data?.RecentRegistrations ?? "", []);

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

  const growthOpts: ApexOptions = {
    chart: { toolbar: { show: false } },
    colors: ["#605DFF"],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#ECEEF2" },
    xaxis: {
      categories: teamGrowth.map((g) => g.week),
      labels: { style: { colors: "#8695AA", fontSize: "11px" } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (v) => String(Math.round(v)), style: { colors: "#64748B", fontSize: "11px" } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
  };

  const incomeColors = ["#605DFF", "#AD63F6", "#3584FC"];

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
                <Skeleton className="w-[50px] h-[50px] rounded-full" />
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
      <div className="sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-x-[25px]">
        <StatCard
          label="Total Members"   value={(data?.TotalMembers ?? 0).toLocaleString()}
          sub={`Today +${data?.TodayMembers ?? 0}  ·  Inactive ${data?.InactiveMembers ?? 0}`}
          icon="group"            numColor="text-blue-600 dark:text-blue-400"
          iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          label="Active Members"  value={(data?.ActiveMembers ?? 0).toLocaleString()}
          sub={`Active Rate: ${(data?.ActiveRate ?? 0).toFixed(2)}%`}
          icon="verified_user"    numColor="text-emerald-600 dark:text-emerald-400"
          iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          label="This Week"       value={(data?.ThisWeekMembers ?? 0).toLocaleString()}
          sub="New registrations this week"
          icon="calendar_today"   numColor="text-violet-600 dark:text-violet-400"
          iconColor="text-violet-500" iconBg="bg-violet-50 dark:bg-violet-900/20"
        />
        <StatCard
          label="This Month"      value={(data?.ThisMonthMembers ?? 0).toLocaleString()}
          sub="New registrations this month"
          icon="date_range"       numColor="text-amber-600 dark:text-amber-400"
          iconColor="text-amber-500" iconBg="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 2 — Platform Financials
      ════════════════════════════════════════════════════════════════════ */}
      <div className="sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-x-[25px]">
        <StatCard
          label="Platform Business" value={`${cs}${fmt(data?.TotalPlatformBusiness ?? 0)}`}
          sub={`Earnings: ${cs}${fmt(data?.TotalEarning ?? 0)}`}
          icon="trending_up"        numColor="text-blue-600 dark:text-blue-400"
          iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          label="Wallet Balance"    value={`${cs}${fmt(data?.TotalWalletBalance ?? 0)}`}
          sub={`Commission ${cs}${fmt(data?.TotalCommissionWallet ?? 0)}  ·  ROI ${cs}${fmt(data?.TotalROIWallet ?? 0)}`}
          icon="account_balance_wallet" numColor="text-purple-600 dark:text-purple-400"
          iconColor="text-purple-500" iconBg="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          label="Income Distributed" value={`${cs}${fmt(data?.TotalIncomeDistributed ?? 0)}`}
          sub={`ROI ${cs}${fmt(data?.TotalROIIncome ?? 0)}  ·  Sponsor ${cs}${fmt(data?.TotalSponsorIncome ?? 0)}`}
          icon="payments"            numColor="text-emerald-600 dark:text-emerald-400"
          iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          label="Total Withdrawals"  value={`${cs}${fmt(data?.TotalWithdrawals ?? 0)}`}
          sub={`Pending ${data?.PendingWithdrawalCount ?? 0}  ·  Approved ${data?.ApprovedWithdrawalCount ?? 0}`}
          icon="savings"             numColor="text-rose-600 dark:text-rose-400"
          iconColor="text-rose-500"  iconBg="bg-rose-50 dark:bg-rose-900/20"
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 3 — Earnings Chart  +  Income Distribution
      ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        {/* Earnings vs Withdrawals — area chart */}
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <h5 className="!mb-0">Earnings vs Withdrawals</h5>
              <span className="text-xs text-gray-400 dark:text-gray-500">Last 30 days</span>
            </div>
            <div className="-mb-[3px] ltr:-ml-[10px] rtl:-mr-[10px]">
              {Chart && earningsChart.length > 0 ? (
                <Chart
                  options={earningsOpts}
                  series={[
                    { name: "Earnings",    data: earningsChart.map((e) => e.earnings)    },
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
                { lbl: "Total Earnings",    val: `${cs}${fmt(data?.TotalEarning ?? 0)}`,     color: "text-[#605DFF]" },
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
        </div>

        {/* Income Distribution — progress bars */}
        <div className="lg:col-span-1">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h5 className="!mb-0">Income Distribution</h5>
              <p className="text-sm text-gray-400 mt-1 !mb-0">
                Total: <span className="font-semibold text-black dark:text-white">{cs}{fmt(data?.TotalIncomeDistributed ?? 0)}</span>
              </p>
            </div>
            <div className="space-y-6">
              {incomeBreakdown.map((item, i) => (
                <div key={item.IncomeType}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-black dark:text-white">{item.IncomeType}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-black dark:text-white">{cs}{fmt(item.TotalIncome)}</span>
                      <span className="text-xs text-gray-400 ml-1">({item.SharePct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-[8px] bg-gray-100 dark:bg-[#172036] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(item.SharePct, 100)}%`, background: incomeColors[i % incomeColors.length] }}
                    />
                  </div>
                </div>
              ))}
              {incomeBreakdown.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                  <i className="material-symbols-outlined text-[40px]">bar_chart</i>
                  <p className="text-sm">No income data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 4 — Withdrawal Status  +  Team Growth Chart
      ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        {/* Withdrawal status */}
        <div className="lg:col-span-1">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h5 className="!mb-0">Withdrawal Status</h5>
            </div>
            <div className="space-y-4">
              {([
                { label: "Pending",  amount: data?.PendingWithdrawalAmount ?? 0,  count: data?.PendingWithdrawalCount ?? 0,  bg: "bg-amber-50   dark:bg-amber-900/20",   border: "border-amber-200   dark:border-amber-800",   num: "text-amber-500"   },
                { label: "Approved", amount: data?.ApprovedWithdrawalAmount ?? 0, count: data?.ApprovedWithdrawalCount ?? 0, bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", num: "text-emerald-500" },
                { label: "Rejected", amount: data?.RejectedWithdrawalAmount ?? 0, count: data?.RejectedWithdrawalCount ?? 0, bg: "bg-rose-50    dark:bg-rose-900/20",    border: "border-rose-200    dark:border-rose-800",    num: "text-rose-500"    },
              ] as const).map(({ label, amount, count, bg, border, num }) => (
                <div key={label} className={`flex items-center justify-between p-3 rounded-xl border ${bg} ${border}`}>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</span>
                    <p className={`text-lg font-bold ${num} !mb-0 leading-tight mt-0.5`}>{cs}{fmt(amount)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-extrabold ${num}`}>{count}</span>
                    <p className="text-[10px] text-gray-400 !mb-0">requests</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#172036]">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawals</span>
                <span className="text-base font-bold text-black dark:text-white">{cs}{fmt(data?.TotalWithdrawals ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Growth — bar chart */}
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <h5 className="!mb-0">Team Growth</h5>
              <span className="text-xs text-gray-400 dark:text-gray-500">Last 8 weeks</span>
            </div>
            <div className="ltr:-ml-[10px] rtl:-mr-[10px]">
              {Chart && teamGrowth.length > 0 ? (
                <Chart
                  options={growthOpts}
                  series={[{ name: "New Members", data: teamGrowth.map((g) => g.members) }]}
                  type="bar" height={260} width="100%"
                />
              ) : (
                <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                  {!Chart ? "Loading chart…" : "No registrations in the last 8 weeks"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 5 — Top Investors  +  Recent Registrations
      ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        {/* Top Investors */}
        <div className="lg:col-span-1">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h5 className="!mb-0">Top Investors</h5>
            </div>
            <div className="trezo-card-content">
              <table className="w-full">
                <tbody className="text-black dark:text-white">
                  {topInvestors.map((inv, i) => (
                    <tr key={inv.ClientId}>
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
                    </tr>
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
        </div>

        {/* Recent Registrations */}
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px]">
              <h5 className="!mb-0">Recent Registrations</h5>
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
                    {recentRegs.map((reg) => (
                      <tr key={reg.ClientId}>
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
                          <span className={`px-[8px] py-[3px] inline-block rounded-sm font-medium text-xs ${
                            reg.MemberStatus === "Active"
                              ? "bg-success-50 text-success-500 dark:bg-[#15203c]"
                              : "bg-warning-50 text-warning-500 dark:bg-[#15203c]"
                          }`}>
                            {reg.MemberStatus}
                          </span>
                        </td>
                      </tr>
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
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 6 — Recent Transactions
      ════════════════════════════════════════════════════════════════════ */}
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
          <h5 className="!mb-0">Recent Transactions</h5>
          <span className="text-xs text-gray-400 dark:text-gray-500">Latest 10 across all members</span>
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
                    <tr key={i}>
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
                        <span className={`px-[8px] py-[3px] inline-block rounded-sm font-semibold text-xs ${
                          isCr
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                            : "bg-rose-50 text-rose-500 dark:bg-rose-900/20"
                        }`}>
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
                    </tr>
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
      </div>
    </>
  );
};

export default Dashboard;
