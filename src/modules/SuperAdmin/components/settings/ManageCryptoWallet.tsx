"use client";

import { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import { FaSave, FaWallet } from "react-icons/fa";
import { SiBnbchain, SiBitcoin, SiEthereum, SiSolana } from "react-icons/si";
import { TbHexagon } from "react-icons/tb";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";
import Loader from "../../common/Loader";

// ─── Chain helpers ────────────────────────────────────────────────────────────
const CHAIN_META: Record<string, { color: string }> = {
  BEP20: { color: "#F0B90B" },
  TRC20:  { color: "#FF060A" },
  ERC20: { color: "#627EEA" },
  SOL:   { color: "#9945FF" },
  BTC:   { color: "#F7931A" },
};

const TronIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF060A" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.46 6.28 13.17.27a2.12 2.12 0 0 0-2.34 0L1.54 6.28a2.1 2.1 0 0 0-.77 2.86l4.46 7.72L12 22.46l6.77-5.6 4.46-7.72a2.1 2.1 0 0 0-.77-2.86ZM12 17.5l-4-6.93L12 3.5l4 7.07L12 17.5Z" />
  </svg>
);

const getChainIcon = (label: string, size = 22) => {
  switch (label?.toUpperCase()) {
    case "BEP20": return <SiBnbchain size={size} style={{ color: "#F0B90B" }} />;
    case "TRC20": return <TronIcon size={size} />;
    case "ERC20": return <SiEthereum size={size} style={{ color: "#627EEA" }} />;
    case "SOL":   return <SiSolana size={size} style={{ color: "#9945FF" }} />;
    case "BTC":   return <SiBitcoin size={size} style={{ color: "#F7931A" }} />;
    default:      return <TbHexagon size={size} style={{ color: "#6B7280" }} />;
  }
};

const getChainColor = (label: string) =>
  CHAIN_META[label?.toUpperCase()]?.color ?? "#6B7280";

// ─── Component ────────────────────────────────────────────────────────────────
export default function CryptoWalletSetting() {
  const { universalService } = ApiService();

  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);

  const path = location.pathname;
  const formName = path.split("/").pop();

  // -------------------------------------
  // PERMISSIONS
  // -------------------------------------
  const fetchFormPermissions = async () => {
    try {
      setPermissionsLoading(true);

      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "GetForms",
          FormName: formName,
          EmployeeId: employeeId,
        }),
      };

      const response = await universalService(payload);
      const data = response?.data ?? response;

      if (!Array.isArray(data)) {
        setHasPageAccess(false);
        return;
      }

      const pagePermission = data.find(
        (p) =>
          String(p.FormNameWithExt).trim().toLowerCase() ===
          formName?.trim().toLowerCase(),
      );

      if (!pagePermission || !pagePermission.Action) {
        setHasPageAccess(false);
        return;
      }

      SmartActions.load(data);
      setHasPageAccess(true);
    } catch (error) {
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // -------------------------------------
  // LOAD WALLETS (UPDATED)
  // -------------------------------------
  const loadPlatforms = async () => {
    try {
      setInitialLoading(true);

      const payload = {
        procName: "ManageCompanyCryptowallet",
        Para: JSON.stringify({
          ActionMode: "SELECT",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res || [];

      const formatted = data.map((item, index) => ({
        Id: item.Id || 0,
        WalletTypeId: item.WalletTypeId,
        Label: item.Chain,
        Url: item.DepositAddress || "",
      }));

      setPlatforms(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load wallets");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchFormPermissions();
    loadPlatforms();
  }, []);

  // -------------------------------------
  // HANDLE INPUT (UNCHANGED)
  // -------------------------------------
  const handleChange = (index, value) => {
    const updated = [...platforms];
    updated[index].Url = value;
    setPlatforms(updated);
  };

  // -------------------------------------
  // SUBMIT (UPDATED)
  // -------------------------------------
  const handleSubmit = async () => {
    const confirm = await Swal.fire({
      title: "Update Wallets?",
      text: "Are you sure you want to save these changes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const payload = {
        procName: "ManageCompanyCryptowallet",
        Para: JSON.stringify({
          ActionMode: "UPSERT",
          JsonData: JSON.stringify(
            platforms.map((p) => ({
              Id: p.Id || 0,
              WalletTypeId: p.WalletTypeId,
              DepositAddress: p.Url,
            })),
          ),
        }),
      };

      const res = await universalService(payload);
      const result = res;

      if (result[0].StatusCode == 1) {
        Swal.fire("Success!", result[0]?.Msg, "success");
      } else {
        Swal.fire("Error", result[0]?.Msg || "Failed", "error");
      }

      loadPlatforms();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // GUARDS
  // -------------------------------------
  if (permissionsLoading) return <Loader />;
  if (!hasPageAccess) return <AccessRestricted />;

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6 relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 -mx-6 px-6">
        <div className="flex items-center gap-3">
          {/* Dual-tone icon */}
          <div className="w-11 h-11 rounded-xl relative flex items-center justify-center flex-shrink-0 bg-primary-button-bg/10">
            <i
              className="material-symbols-outlined absolute text-[38px] text-primary-button-bg/20"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              account_balance_wallet
            </i>
            <i
              className="material-symbols-outlined relative text-[20px] text-primary-button-bg"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}
            >
              account_balance_wallet
            </i>
          </div>
          <div>
            <h5 className="!mb-0 font-bold text-xl text-black dark:text-white leading-tight">
              Manage Crypto Wallet
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 !mb-0">
              Configure deposit addresses for each blockchain network
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <PermissionAwareTooltip allowed={SmartActions.canUpdate(formName)}>
            <button
              onClick={handleSubmit}
              disabled={!SmartActions.canUpdate(formName)}
              className="flex items-center gap-2 px-4 py-2
                bg-primary-button-bg hover:bg-primary-button-bg-hover
                text-white rounded-md text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              <FaSave size={13} /> Update
            </button>
          </PermissionAwareTooltip>
        </div>
      </div>

      {/* ── Wallet list ────────────────────────────────────────────────────── */}
      {platforms.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FaWallet className="text-4xl mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No wallet types configured</p>
          <p className="text-xs mt-1">Add wallet types in Wallet Type Setting first</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          {platforms.map((item, index) => {
            const accentColor = getChainColor(item.Label);
            const hasAddress = !!item.Url.trim();

            return (
              <div
                key={item.WalletTypeId}
                className="rounded-xl border border-gray-100 dark:border-gray-700/60
                  bg-gray-50/40 dark:bg-[#111827]/40 p-4 transition-all
                  hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">

                  {/* Chain identity */}
                  <div className="flex items-center gap-3 md:w-56 flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: accentColor + "1a" }}
                    >
                      {getChainIcon(item.Label, 22)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {item.Label}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Deposit Address
                      </span>
                    </div>
                  </div>

                  {/* Input with left accent bar */}
                  <div className="md:flex-1 relative">
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <input
                      type="text"
                      value={item.Url}
                      onChange={(e) => handleChange(index, e.target.value)}
                      className="w-full pl-4 pr-4 py-2.5 text-sm font-mono
                        border border-gray-200 dark:border-gray-700 rounded-lg
                        bg-white dark:bg-[#0c1427] dark:text-gray-100
                        focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20
                        placeholder:text-gray-300 dark:placeholder:text-gray-600
                        transition-all"
                      placeholder={`Enter ${item.Label} deposit address`}
                    />
                  </div>

                  {/* Configured status dot */}
                  <div className="flex-shrink-0 hidden md:flex items-center">
                    <span
                      title={hasAddress ? "Address configured" : "No address set"}
                      className={`w-2.5 h-2.5 rounded-full ring-2 transition-all ${
                        hasAddress
                          ? "bg-green-500 ring-green-200 dark:ring-green-900"
                          : "bg-gray-300 ring-gray-100 dark:bg-gray-600 dark:ring-gray-800"
                      }`}
                    />
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
