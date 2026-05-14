"use client";

import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import { useApiHelper } from "../../../../utils/ApiHelper";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaSave,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaSync,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaWallet,
  FaPaperPlane,
} from "react-icons/fa";
import { SiBnbchain, SiBitcoin, SiEthereum, SiSolana } from "react-icons/si";
import { TbHexagon } from "react-icons/tb";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation } from "react-router-dom";

// ─── Derive WalletMaster API base from VITE_EXEC_PROC ──────────────────────
// VITE_EXEC_PROC = http://host/api/workforce  →  base = http://host/api
const WALLET_API = (() => {
  const ep = import.meta.env.VITE_EXEC_PROC || "";
  return ep.replace(/\/workforce$/, "") + "/WalletMaster";
})();

const ChainIcon = ({ chain, size = 20 }: { chain: string; size?: number }) => {
  switch (chain) {
    case "BEP20": return <SiBnbchain size={size} style={{ color: "#F0B90B" }} />;
    case "TRC20": return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF060A" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.46 6.28 13.17.27a2.12 2.12 0 0 0-2.34 0L1.54 6.28a2.1 2.1 0 0 0-.77 2.86l4.46 7.72L12 22.46l6.77-5.6 4.46-7.72a2.1 2.1 0 0 0-.77-2.86ZM12 17.5l-4-6.93L12 3.5l4 7.07L12 17.5Z" />
      </svg>
    );
    case "ERC20": return <SiEthereum size={size} style={{ color: "#627EEA" }} />;
    case "SOL":   return <SiSolana size={size} style={{ color: "#9945FF" }} />;
    case "BTC":   return <SiBitcoin size={size} style={{ color: "#F7931A" }} />;
    default:      return <TbHexagon size={size} style={{ color: "#6B7280" }} />;
  }
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface Chain {
  WalletTypeId: number;
  Name: string;
  Chain: string;
  Rate: number;
}

interface Wallet {
  WalletId: number;
  WalletTypeId: number;
  ChainName: string;
  Chain: string;
  WalletLabel: string;
  WalletAddress: string;
  KeyVersion: number;
  IsActive: boolean;
  CreatedAt: string;
}

interface WalletForm {
  WalletLabel: string;
  WalletAddress: string;
  PlainPKey: string;
}

interface OtpForm {
  EmailOTP: string;
  MobileOTP: string;
}

type ActionMode = "SAVE" | "ROTATE_KEY" | "DEACTIVATE";

// ─── Component ─────────────────────────────────────────────────────────────
export default function ManageAdminCryptoWallet() {
  const { universalService } = ApiService();
  const { post } = useApiHelper();
  const location = useLocation();
  const formName = location.pathname.split("/").pop();

  // ── State ──────────────────────────────────────────────────────────────
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);

  const [chains, setChains] = useState<Chain[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  const [form, setForm] = useState<WalletForm>({
    WalletLabel: "",
    WalletAddress: "",
    PlainPKey: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // OTP modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>("SAVE");
  const [otpForm, setOtpForm] = useState<OtpForm>({ EmailOTP: "", MobileOTP: "" });
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showRotateKey, setShowRotateKey] = useState(false);
  const [pendingWalletId, setPendingWalletId] = useState<number | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────
  const getAdminId = () => {
    const raw = localStorage.getItem("EmployeeDetails");
    if (!raw) return 0;
    const emp = JSON.parse(raw);
    return emp.EmployeeId || 0;
  };

  const safeArray = (res: any): any[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  // "true|msg" or "false|msg" from BuildResult in C#
  const parseStringResult = (res: any) => {
    if (typeof res === "string" && res.includes("|")) {
      const idx = res.indexOf("|");
      return {
        success: res.slice(0, idx) === "true",
        msg: res.slice(idx + 1),
      };
    }
    // object fallback
    const code = res?.StatusCode ?? res?.Status;
    return {
      success: String(code) === "1",
      msg: res?.Msg || (String(code) === "1" ? "Success" : "Operation failed"),
    };
  };

  // ── Permissions ────────────────────────────────────────────────────────
  const fetchFormPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const raw = localStorage.getItem("EmployeeDetails");
      const employeeId = raw ? JSON.parse(raw).EmployeeId : 0;

      const response = await universalService({
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "GetForms",
          FormName: formName,
          EmployeeId: employeeId,
        }),
      });

      const data = response?.data ?? response;
      if (!Array.isArray(data)) { setHasPageAccess(false); return; }

      const pagePermission = data.find(
        (p) =>
          String(p.FormNameWithExt).trim().toLowerCase() ===
          formName?.trim().toLowerCase()
      );
      if (!pagePermission?.Action) { setHasPageAccess(false); return; }

      SmartActions.load(data);
      setHasPageAccess(true);
    } catch {
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // ── Data loaders ───────────────────────────────────────────────────────
  const loadChains = async () => {
    try {
      const res = await post(`${WALLET_API}/GetChains`, {});
      const list = safeArray(res);
      setChains(list);
      if (list.length > 0) setSelectedChain((prev) => prev ?? list[0]);
    } catch {
      toast.error("Failed to load chains");
    }
  };

  const loadWallets = async () => {
    try {
      setTableLoading(true);
      const res = await post(`${WALLET_API}/GetAllWallets`, {});
      setWallets(safeArray(res));
    } catch {
      toast.error("Failed to load wallets");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchFormPermissions();
    loadChains();
    loadWallets();
  }, []);

  // Update selectedWallet whenever wallets or selectedChain changes
  useEffect(() => {
    if (!selectedChain) return;
    const existing = wallets.find(
      (w) => w.WalletTypeId === selectedChain.WalletTypeId && w.IsActive
    );
    setSelectedWallet(existing || null);
  }, [wallets, selectedChain]);

  // ── Chain selection ────────────────────────────────────────────────────
  const handleChainSelect = (chain: Chain) => {
    setSelectedChain(chain);
    setForm({ WalletLabel: "", WalletAddress: "", PlainPKey: "" });
    setShowKey(false);
  };

  // ── OTP send ───────────────────────────────────────────────────────────
  const sendOtp = async () => {
    const adminId = getAdminId();
    if (!adminId) { toast.error("Admin session expired"); return; }
    try {
      setOtpLoading(true);
      const res = await universalService({
        procName: "GenerateAdminOTP",
        Para: JSON.stringify({ EmployeeId: adminId }),
      });
      const data = Array.isArray(res) ? res[0] : (res?.data?.[0] ?? res);
      const code = data?.StatusCode ?? data?.Status;
      if (String(code) === "1") {
        setOtpSent(true);
        toast.success(data?.Msg || "OTP sent to your registered email and mobile");
      } else {
        toast.error(data?.Msg || "Failed to send OTP");
      }
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Open OTP modal ─────────────────────────────────────────────────────
  const openOtpModal = (mode: ActionMode, walletId?: number) => {
    setActionMode(mode);
    setOtpForm({ EmailOTP: "", MobileOTP: "" });
    setOtpSent(false);
    setPendingWalletId(walletId ?? null);
    setShowOtpModal(true);
    if (mode !== "ROTATE_KEY") {
      setShowRotateKey(false);
    }
  };

  // ── Save (pre-OTP validation) ──────────────────────────────────────────
  const handleSave = () => {
    if (!selectedChain) { toast.warning("Please select a chain first"); return; }
    if (!form.WalletLabel.trim()) { toast.warning("Wallet Label is required"); return; }
    if (!form.WalletAddress.trim()) { toast.warning("Wallet Address is required"); return; }
    if (!form.PlainPKey.trim()) { toast.warning("Private Key is required"); return; }
    openOtpModal("SAVE");
  };

  // ── Rotate key ─────────────────────────────────────────────────────────
  const handleRotateKey = (wallet: Wallet) => {
    setSelectedChain(chains.find((c) => c.WalletTypeId === wallet.WalletTypeId) || null);
    setForm((p) => ({ ...p, PlainPKey: "" }));
    setShowRotateKey(true);
    openOtpModal("ROTATE_KEY", wallet.WalletId);
  };

  // ── Deactivate ─────────────────────────────────────────────────────────
  const handleDeactivate = async (wallet: Wallet) => {
    const confirm = await Swal.fire({
      title: "Deactivate Wallet?",
      text: `This will soft-delete the ${wallet.Chain} wallet. Payouts using this wallet will stop.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Deactivate",
    });
    if (!confirm.isConfirmed) return;
    openOtpModal("DEACTIVATE", wallet.WalletId);
  };

  // ── Verify OTP & execute action ────────────────────────────────────────
  const handleVerifyAndExecute = async () => {
    const otp = otpForm.EmailOTP.trim() || otpForm.MobileOTP.trim();
    if (!otp) { toast.warning("Please enter OTP"); return; }

    if (actionMode === "ROTATE_KEY" && !form.PlainPKey.trim()) {
      toast.warning("Please enter the new private key"); return;
    }

    const adminId = getAdminId();
    setOtpLoading(true);

    try {
      let raw: any;

      if (actionMode === "SAVE") {
        raw = await post(`${WALLET_API}/SaveWallet`, {
          WalletTypeId: selectedChain!.WalletTypeId,
          WalletLabel: form.WalletLabel,
          WalletAddress: form.WalletAddress,
          PlainPKey: form.PlainPKey,
          AdminId: adminId,
          OTP: otp,
        });
      } else if (actionMode === "ROTATE_KEY") {
        raw = await post(`${WALLET_API}/RotateWalletKey`, {
          WalletId: pendingWalletId,
          NewPlainKey: form.PlainPKey,
          AdminId: adminId,
          OTP: otp,
        });
      } else {
        raw = await post(`${WALLET_API}/DeactivateWallet`, {
          WalletId: pendingWalletId,
          AdminId: adminId,
          OTP: otp,
        });
      }

      const result = parseStringResult(raw);

      if (result.success) {
        setShowOtpModal(false);
        setForm({ WalletLabel: "", WalletAddress: "", PlainPKey: "" });
        await Swal.fire("Success", result.msg, "success");
        await loadWallets();
      } else {
        Swal.fire("Error", result.msg, "error");
      }
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Render guards ──────────────────────────────────────────────────────
  if (permissionsLoading) return <Loader />;
  if (!hasPageAccess) return <AccessRestricted />;

  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* ══ Main Card ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 -mx-6 px-6">
          <div className="flex items-center gap-3">
            {/* Dual-tone icon — filled layer (soft) + outlined layer (vivid) */}
            <div className="w-11 h-11 rounded-xl relative flex items-center justify-center flex-shrink-0 bg-primary-button-bg/10">
              <i
                className="material-symbols-outlined absolute text-[38px] text-primary-button-bg/20"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
              >
                security
              </i>
              <i
                className="material-symbols-outlined relative text-[20px] text-primary-button-bg"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}
              >
                security
              </i>
            </div>
            <div>
              <h5 className="font-bold text-xl text-black dark:text-white !mb-0">
                Admin Crypto Wallet
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Manage hot wallets for automated member payouts
              </p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — Chain list */}
          <div className="lg:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              Select Chain
            </p>
            <div className="space-y-2">
              {chains.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-10 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <FaWallet className="text-3xl mx-auto mb-2 opacity-20" />
                  <p>No active withdrawal chains.</p>
                  <p className="text-xs mt-1">Configure in Wallet Type Setting.</p>
                </div>
              )}

              {chains.map((chain) => {
                const hasWallet = wallets.some(
                  (w) => w.WalletTypeId === chain.WalletTypeId && w.IsActive
                );
                const isSelected =
                  selectedChain?.WalletTypeId === chain.WalletTypeId;

                return (
                  <button
                    key={chain.WalletTypeId}
                    onClick={() => handleChainSelect(chain)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between
                      ${
                        isSelected
                          ? "border-primary-button-bg bg-primary-button-bg/5 dark:bg-primary-button-bg/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary-button-bg/40 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center">
                        <ChainIcon chain={chain.Chain} size={20} />
                      </span>
                      <div>
                        <p
                          className={`text-sm font-semibold leading-tight ${
                            isSelected
                              ? "text-primary-button-bg"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {chain.Name}
                        </p>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                          {chain.Chain}
                        </p>
                      </div>
                    </div>
                    <span
                      title={hasWallet ? "Wallet configured" : "No wallet set"}
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ${
                        hasWallet
                          ? "bg-green-500 ring-green-200 dark:ring-green-900"
                          : "bg-gray-300 ring-gray-100 dark:bg-gray-600 dark:ring-gray-800"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Wallet form */}
          <div className="lg:col-span-2">
            {!selectedChain ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <FaWallet className="text-5xl mb-3 opacity-20" />
                <p className="text-sm font-medium">Select a chain to configure its wallet</p>
                <p className="text-xs mt-1 text-gray-300">Click any chain on the left</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Chain badge + status */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="flex items-center"><ChainIcon chain={selectedChain.Chain} size={32} /></span>
                  <div>
                    <h6 className="font-bold text-gray-900 dark:text-white !mb-0">
                      {selectedChain.Name} Wallet
                    </h6>
                    {selectedWallet ? (
                      <p className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
                        <FaCheckCircle />
                        Configured — Key v{selectedWallet.KeyVersion} &nbsp;·&nbsp;
                        <span className="font-mono">{selectedWallet.WalletAddress?.slice(0, 10)}…</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                        <FaTimesCircle /> No wallet configured for this chain
                      </p>
                    )}
                  </div>
                </div>

                {/* Wallet Label */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Wallet Label
                  </label>
                  <input
                    type="text"
                    value={form.WalletLabel}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, WalletLabel: e.target.value }))
                    }
                    placeholder={`e.g., ${selectedChain.Name} Main Payout Wallet`}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2.5 text-sm
                      bg-white dark:bg-gray-800 dark:text-white
                      focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20"
                  />
                </div>

                {/* Wallet Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Wallet Address&nbsp;
                    <span className="font-normal text-gray-400">(Public)</span>
                  </label>
                  <input
                    type="text"
                    value={form.WalletAddress}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, WalletAddress: e.target.value }))
                    }
                    placeholder="0x… or T…"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2.5 text-sm font-mono
                      bg-white dark:bg-gray-800 dark:text-white
                      focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20"
                  />
                </div>

                {/* Private Key */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Private Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={form.PlainPKey}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, PlainPKey: e.target.value }))
                      }
                      placeholder="Enter private key — encrypted before saving"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2.5 pr-10 text-sm font-mono
                        bg-white dark:bg-gray-800 dark:text-white
                        focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showKey ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-button-bg hover:bg-primary-button-bg-hover
                      text-white rounded-md text-sm font-medium transition-all shadow-sm"
                  >
                    <FaSave size={13} /> Save Wallet
                  </button>
                </div>

                {/* Security notes */}
                <div className="border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <FaShieldAlt size={11} /> Security Notes
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc ml-4 leading-relaxed">
                    <li>Private key is encrypted with AES-256-CBC + HMAC-SHA256 on the server before storage</li>
                    <li>Plain key never reaches the database — encrypted in C# before the SQL INSERT</li>
                    <li>OTP verification is required for save, key rotation, and deactivate</li>
                    <li>Decryption happens only internally during payout processing — never exposed via API</li>
                    <li>Key version increments on every rotation for a full audit trail</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ Wallet List Table ═══════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-5 -mx-6 px-6">
          <h5 className="font-bold text-lg text-black dark:text-white !mb-0">
            Configured Wallets
          </h5>
          <button
            onClick={loadWallets}
            title="Refresh"
            className="text-primary-button-bg hover:text-primary-button-bg-hover transition-colors"
          >
            <FaSync className={tableLoading ? "animate-spin" : ""} size={14} />
          </button>
        </div>

        {tableLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaWallet className="text-4xl mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No wallets configured yet</p>
            <p className="text-xs mt-1">Select a chain above and add the first wallet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-table-bg text-primary-table-text dark:bg-[#15203c]">
                  <th className="px-4 py-3 text-left font-semibold w-14">S.No</th>
                  <th className="px-4 py-3 text-left font-semibold">Chain</th>
                  <th className="px-4 py-3 text-left font-semibold">Label</th>
                  <th className="px-4 py-3 text-left font-semibold">Public Address</th>
                  <th className="px-4 py-3 text-left font-semibold w-28">Key Version</th>
                  <th className="px-4 py-3 text-left font-semibold w-24">Status</th>
                  <th className="px-4 py-3 text-center font-semibold w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0c1427]">
                {wallets.map((wallet, idx) => (
                  <tr
                    key={wallet.WalletId}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#172036] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{idx + 1}</td>

                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <ChainIcon chain={wallet.Chain} size={18} />
                        <span className="font-semibold">{wallet.Chain}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {wallet.WalletLabel}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {wallet.WalletAddress
                        ? `${wallet.WalletAddress.slice(0, 14)}…${wallet.WalletAddress.slice(-6)}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        v{wallet.KeyVersion}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {wallet.IsActive ? (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-semibold">
                          <FaCheckCircle size={11} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                          <FaTimesCircle size={11} /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {wallet.IsActive && (
                          <>
                            <button
                              onClick={() => handleRotateKey(wallet)}
                              title="Rotate Key"
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-blue-400
                                text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                            >
                              <FaKey size={11} />
                            </button>
                            <button
                              onClick={() => handleDeactivate(wallet)}
                              title="Deactivate"
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-red-400
                                text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                              <FaTrash size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ OTP Verification Modal ══════════════════════════════════════════ */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0c1427] rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
              <span className="w-11 h-11 rounded-full bg-primary-button-bg/10 flex items-center justify-center flex-shrink-0">
                <FaShieldAlt className="text-primary-button-bg text-lg" />
              </span>
              <div>
                <h6 className="font-bold text-lg text-gray-900 dark:text-white !mb-0">
                  OTP Verification
                </h6>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {actionMode === "SAVE" && "Verify identity to save this wallet"}
                  {actionMode === "ROTATE_KEY" && "Verify identity to rotate the private key"}
                  {actionMode === "DEACTIVATE" && "Verify identity to deactivate this wallet"}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* New key input for ROTATE_KEY */}
              {actionMode === "ROTATE_KEY" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    New Private Key
                  </label>
                  <div className="relative">
                    <input
                      type={showRotateKey ? "text" : "password"}
                      value={form.PlainPKey}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, PlainPKey: e.target.value }))
                      }
                      placeholder="Enter replacement private key"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2.5 pr-10 text-sm font-mono
                        bg-gray-50 dark:bg-gray-800 dark:text-white
                        focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRotateKey((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showRotateKey ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Email OTP */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Email OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={otpForm.EmailOTP}
                  onChange={(e) =>
                    setOtpForm({ EmailOTP: e.target.value, MobileOTP: "" })
                  }
                  placeholder="Enter OTP received on email"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2.5 text-sm tracking-widest
                    bg-gray-50 dark:bg-gray-800 dark:text-white
                    focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20"
                />
              </div>

              {/* OR divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs font-bold text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Mobile OTP */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Mobile OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={otpForm.MobileOTP}
                  onChange={(e) =>
                    setOtpForm({ MobileOTP: e.target.value, EmailOTP: "" })
                  }
                  placeholder="Enter OTP received on mobile"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2.5 text-sm tracking-widest
                    bg-gray-50 dark:bg-gray-800 dark:text-white
                    focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20"
                />
              </div>

              {/* Send OTP link */}
              <div className="flex justify-end -mt-1">
                <button
                  onClick={sendOtp}
                  disabled={otpLoading}
                  className="text-xs text-primary-button-bg hover:underline flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FaPaperPlane size={10} />
                  {otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowOtpModal(false)}
                disabled={otpLoading}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                  rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleVerifyAndExecute}
                disabled={
                  otpLoading ||
                  (!otpForm.EmailOTP.trim() && !otpForm.MobileOTP.trim())
                }
                className="flex-1 py-2.5 bg-primary-button-bg hover:bg-primary-button-bg-hover
                  text-white rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                  disabled:opacity-50"
              >
                {otpLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FaShieldAlt size={12} />
                    Verify &amp;{" "}
                    {actionMode === "SAVE"
                      ? "Save"
                      : actionMode === "ROTATE_KEY"
                      ? "Rotate Key"
                      : "Deactivate"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
