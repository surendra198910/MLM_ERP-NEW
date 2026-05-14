"use client";

import React, { useEffect, useState } from "react";
import { FaPlus, FaSave } from "react-icons/fa";
import { SiBnbchain, SiBitcoin, SiEthereum, SiSolana } from "react-icons/si";
import { TbHexagon, TbX } from "react-icons/tb";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";

// ─── Chain icon helpers ───────────────────────────────────────────────────────
const TronIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF060A" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.46 6.28 13.17.27a2.12 2.12 0 0 0-2.34 0L1.54 6.28a2.1 2.1 0 0 0-.77 2.86l4.46 7.72L12 22.46l6.77-5.6 4.46-7.72a2.1 2.1 0 0 0-.77-2.86ZM12 17.5l-4-6.93L12 3.5l4 7.07L12 17.5Z" />
  </svg>
);

const getChainIcon = (chain: string, size = 16) => {
  switch (chain?.toUpperCase()) {
    case "BEP20": return <SiBnbchain size={size} style={{ color: "#F0B90B" }} />;
    case "TRC20": return <TronIcon size={size} />;
    case "ERC20": return <SiEthereum size={size} style={{ color: "#627EEA" }} />;
    case "SOL":   return <SiSolana size={size} style={{ color: "#9945FF" }} />;
    case "BTC":   return <SiBitcoin size={size} style={{ color: "#F7931A" }} />;
    default:      return chain ? <TbHexagon size={size} style={{ color: "#6B7280" }} /> : null;
  }
};

const inputCls =
  "w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 " +
  "bg-transparent dark:text-gray-100 text-sm focus:outline-none " +
  "focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20 transition-all";

// ─── Component ────────────────────────────────────────────────────────────────
export default function WalletChainSetting() {
  const { universalService } = ApiService();

  const emptyRow = {
    WalletTypeId: 0,
    Name: "",
    Chain: "",
    Rate: "",
    ApiEndpoint: "",
    IsDeposit: false,
    IsWithdrawal: false,
  };

  const [rows, setRows] = useState([emptyRow]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // ================= LOAD =================
  const loadData = async () => {
    try {
      setTableLoading(true);

      const res = await universalService({
        procName: "ManageWalletTypeMaster",
        Para: JSON.stringify({ ActionMode: "SELECT" }),
      });

      const data = res || [];

      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item) => ({
          WalletTypeId: item.WalletTypeId || 0,
          Name: item.Name || "",
          Chain: item.Chain || "",
          Rate: item.Rate || "",
          ApiEndpoint: item.ApiEndpoint || "",
          IsDeposit: Boolean(item.IsDeposit),
          IsWithdrawal: Boolean(item.IsWithdrawal),
        }));
        setRows(formatted);
      } else {
        setRows([{ WalletTypeId: 0, Name: "", Chain: "", Rate: "", ApiEndpoint: "", IsDeposit: false, IsWithdrawal: false }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= ADD ROW =================
  const addRow = () => {
    setRows([...rows, emptyRow]);
  };

  // ================= DELETE ROW =================
  const removeRow = async (index) => {
    const res = await Swal.fire({
      title: "Remove this row?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    });
    if (!res.isConfirmed) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  // ================= HANDLE CHANGE =================
  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // ================= SAVE =================
  const handleSave = async () => {
    const confirm = await Swal.fire({
      title: "Save Wallet Chains?",
      icon: "question",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);

    const res = await universalService({
      procName: "ManageWalletTypeMaster",
      Para: JSON.stringify({
        ActionMode: "BULK_UPSERT",
        JsonData: JSON.stringify(rows),
      }),
    });

    const result = res || [];
    if (result[0].StatusCode === 1) {
      Swal.fire("Success", result[0].Msg, "success");
      loadData();
    } else {
      Swal.fire("Error", result[0].Msg || "Failed", "error");
    }

    setLoading(false);
  };

  // ================= UI =================
  return (
    <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6 relative">

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin w-8 h-8 border-4 border-primary-button-bg border-t-transparent rounded-full" />
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center gap-3">
          {/* Dual-tone icon */}
          <div className="w-11 h-11 rounded-xl relative flex items-center justify-center flex-shrink-0 bg-primary-button-bg/10">
            <i
              className="material-symbols-outlined absolute text-[38px] text-primary-button-bg/20"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              hub
            </i>
            <i
              className="material-symbols-outlined relative text-[20px] text-primary-button-bg"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}
            >
              hub
            </i>
          </div>
          <div>
            <h5 className="!mb-0 font-bold text-xl text-black dark:text-white leading-tight">
              Wallet Chain Setting
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 !mb-0">
              Configure blockchain networks, token standards and API endpoints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 border border-primary-button-bg
              text-primary-button-bg hover:bg-primary-button-bg hover:text-white
              rounded-md text-sm font-medium transition-all"
          >
            <FaPlus size={12} /> Add Chain
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2
              bg-primary-button-bg hover:bg-primary-button-bg-hover
              text-white rounded-md text-sm font-medium transition-all shadow-sm disabled:opacity-50"
          >
            <FaSave size={13} /> Save Settings
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        {tableLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-table-bg text-primary-table-text dark:bg-[#15203c]">
                <th className="px-4 py-3 text-left font-semibold w-14">S.No</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Chain</th>
                <th className="px-4 py-3 text-left font-semibold w-28">Rate</th>
                <th className="px-4 py-3 text-left font-semibold">API Endpoint</th>
                <th className="px-4 py-3 text-center font-semibold w-24">Deposit</th>
                <th className="px-4 py-3 text-center font-semibold w-28">Withdrawal</th>
                <th className="px-4 py-3 text-center font-semibold w-16">Del</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-[#0c1427]">
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 dark:border-gray-700
                    hover:bg-gray-50 dark:hover:bg-[#172036] transition-colors"
                >
                  {/* S.No */}
                  <td className="px-4 py-3">
                    <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800
                      text-gray-500 dark:text-gray-400 text-xs font-bold
                      flex items-center justify-center">
                      {index + 1}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-2.5">
                    <input
                      value={row.Name}
                      onChange={(e) => handleChange(index, "Name", e.target.value)}
                      placeholder="e.g. BNB Smart Chain"
                      className={inputCls}
                    />
                  </td>

                  {/* Chain — with live icon preview */}
                  <td className="px-4 py-2.5">
                    <div className="relative flex items-center">
                      {row.Chain && (
                        <span className="absolute left-3 flex items-center pointer-events-none">
                          {getChainIcon(row.Chain, 14)}
                        </span>
                      )}
                      <input
                        value={row.Chain}
                        onChange={(e) => handleChange(index, "Chain", e.target.value)}
                        placeholder="BEP20 / TRC20…"
                        className={`${inputCls} ${row.Chain ? "pl-8" : ""}`}
                      />
                    </div>
                  </td>

                  {/* Rate */}
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      value={row.Rate}
                      onChange={(e) => handleChange(index, "Rate", e.target.value)}
                      placeholder="0.00"
                      className={inputCls}
                    />
                  </td>

                  {/* API Endpoint */}
                  <td className="px-4 py-2.5">
                    <input
                      value={row.ApiEndpoint}
                      onChange={(e) => handleChange(index, "ApiEndpoint", e.target.value)}
                      placeholder="https://…"
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </td>

                  {/* IsDeposit toggle */}
                  <td className="px-4 py-3 text-center">
                    <label className="relative inline-flex items-center cursor-pointer justify-center">
                      <input
                        type="checkbox"
                        checked={row.IsDeposit}
                        onChange={(e) => handleChange(index, "IsDeposit", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full
                        peer peer-checked:bg-primary-button-bg
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:rounded-full after:h-4 after:w-4
                        after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </td>

                  {/* IsWithdrawal toggle */}
                  <td className="px-4 py-3 text-center">
                    <label className="relative inline-flex items-center cursor-pointer justify-center">
                      <input
                        type="checkbox"
                        checked={row.IsWithdrawal}
                        onChange={(e) => handleChange(index, "IsWithdrawal", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full
                        peer peer-checked:bg-primary-button-bg
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:rounded-full after:h-4 after:w-4
                        after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeRow(index)}
                      title="Remove row"
                      className="w-8 h-8 flex items-center justify-center mx-auto rounded-md
                        border border-red-300 text-red-400
                        hover:bg-red-500 hover:text-white hover:border-red-500
                        transition-all"
                    >
                      <TbX size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom save (secondary, for long tables) */}
      {rows.length > 4 && (
        <div hidden className="flex justify-end mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2
              bg-primary-button-bg hover:bg-primary-button-bg-hover
              text-white rounded-md text-sm font-medium transition-all shadow-sm disabled:opacity-50"
          >
            <FaSave size={13} /> Save Settings
          </button>
        </div>
      )}

    </div>
  );
}
