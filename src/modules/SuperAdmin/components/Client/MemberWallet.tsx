import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useLocation } from "react-router-dom";
import * as Yup from "yup";
import { motion, AnimatePresence, type Variants, type Easing } from "framer-motion";
import AutoCompleter from "../../../../components/CommonFormElements/InputTypes/AutoCompleter";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import { useCurrency } from "../../context/CurrencyContext";
import { SmartActions } from "../Security/SmartActionWithFormName";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { FaChevronLeft, FaChevronRight, FaArrowDown, FaArrowUp } from "react-icons/fa";

/* ---------------- VALIDATION SCHEMA ---------------- */
const validationSchema = Yup.object().shape({
  transactionType: Yup.string().required("Transaction Type is required"),
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Amount must be greater than 0")
    .required("Amount is required"),
  paymentMode: Yup.string().required("Payment Mode is required"),
  paymentDate: Yup.string().required("Payment Date is required"),
  referenceNo: Yup.string().max(30, "Max 30 characters allowed"),
  remarks: Yup.string().max(250, "Max 250 characters allowed"),
});

const today = new Date().toISOString().split("T")[0];

const inputCls =
  "w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm h-10 " +
  "bg-white dark:bg-gray-800 dark:text-gray-100 " +
  "focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20 transition-all";

/* ---------------- ANIMATION VARIANTS ---------------- */
const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as Easing } },
};
const rowVariant: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.28 },
  }),
};
const slideIn: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: "easeOut" as Easing } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.18 } },
};
const expandIn: Variants = {
  hidden: { opacity: 0, y: -8, scaleY: 0.9 },
  show: { opacity: 1, y: 0, scaleY: 1, transition: { duration: 0.25, ease: "easeOut" as Easing } },
  exit: { opacity: 0, y: -8, scaleY: 0.9, transition: { duration: 0.18 } },
};

/* ---------------- WALLET HELPERS ---------------- */
const walletIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("roi") || n.includes("income")) return "trending_up";
  if (n.includes("commission") || n.includes("sponsor")) return "handshake";
  if (n.includes("product") || n.includes("shopping")) return "shopping_bag";
  if (n.includes("bonus")) return "stars";
  return "account_balance_wallet";
};

const walletColor = (name: string): string => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("roi") || n.includes("income")) return "#10b981";
  if (n.includes("commission") || n.includes("sponsor")) return "#3b82f6";
  if (n.includes("product") || n.includes("shopping")) return "#f59e0b";
  if (n.includes("bonus")) return "#8b5cf6";
  return "#6366f1";
};

/* ================================================================ */
const MemberWalletsElegant: React.FC = () => {
  interface Wallet {
    WalletId: number;
    WalletDisplayName: string;
    WalletValue: string;
    Balance: number;
    IsActive: boolean;
  }

  const { currency } = useCurrency();
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [walletList, setWalletList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { universalService } = ApiService();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(7);
  const [totalCount, setTotalCount] = useState(0);
  const formikRef = useRef<any>(null);
  const [autoResetKey, setAutoResetKey] = useState(0);

  /* ---------------- API FUNCTIONS (unchanged) ---------------- */
  const fetchManagers = async (searchText: string) => {
    try {
      setLoading(true);
      const payload = {
        procName: "Client",
        Para: JSON.stringify({ searchData: searchText, ActionMode: "getUsersList" }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load managers", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDetails = async (clientId: number) => {
    try {
      const payload = {
        procName: "Client",
        Para: JSON.stringify({ ClientId: clientId, ActionMode: "GetClientDetails" }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      if (Array.isArray(data) && data.length > 0) {
        setMemberDetails(data[0]);
      } else {
        setMemberDetails(null);
      }
    } catch (err) {
      console.error("Failed to load member details", err);
      setMemberDetails(null);
    }
  };

  const fetchWallets = async (clientid: string) => {
    try {
      const payload = {
        procName: "GetMLMSettings",
        Para: JSON.stringify({ ClientId: clientid, ActionMode: "GetWallets" }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      setWalletList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Wallet fetch failed", err);
      setWalletList([]);
    }
  };

  useEffect(() => { fetchWallets("0"); }, []);

  const submitWalletTransaction = async (values: any) => {
    try {
      console.log(memberDetails);
      if (!memberDetails?.ClientId) {
        Swal.fire("Error", "Please select a member first!", "error"); return;
      }
      if (!selectedWallet?.WalletId) {
        Swal.fire("Error", "Please select a wallet first!", "error"); return;
      }
      const isDark = document.documentElement.classList.contains("dark");
      const confirm = await Swal.fire({
        title: "Confirm Wallet Transaction",
        icon: "warning",
        background: isDark ? "#0c1427" : "#ffffff",
        color: isDark ? "#e5e7eb" : "#111827",
        html: `
        <div style="text-align:left; font-size:14px;">
          <div style="background:${isDark ? "#111827" : "#f9fafb"};border-radius:10px;padding:12px;border:1px solid ${isDark ? "#1f2937" : "#e5e7eb"};">
            <div style="display:flex;justify-content:space-between;padding:6px 0;">
              <span style="color:#9ca3af;">Member</span>
              <span style="font-weight:600;">${memberDetails.Name} (${memberDetails.UserName})</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;">
              <span style="color:#9ca3af;">Wallet</span>
              <span style="font-weight:600;color:#3b82f6;">${selectedWallet?.WalletDisplayName || "N/A"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed #6b7280;margin-top:6px;padding-top:10px;">
              <span style="color:#9ca3af;">Amount</span>
              <span style="font-weight:700;color:#22c55e;font-size:16px;">${currency.symbol}${values.amount}</span>
            </div>
          </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: "Yes, Proceed",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#9ca3af",
      });
      if (!confirm.isConfirmed) return;

      const payload = {
        procName: "WalletTransaction_CRDR",
        Para: JSON.stringify({
          ClientId: memberDetails?.ClientId,
          WalletId: selectedWallet.WalletId,
          TranType: values.transactionType,
          Amount: values.amount,
          PaymentMode: values.paymentMode,
          PaymentDate: values.paymentDate,
          ReferenceNo: values.referenceNo || "",
          Remarks: values.remarks || "",
          EntryBy: 1,
          ActionMode: "WalletTransaction",
        }),
      };
      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response?.data?.[0];
      if (res?.StatusCode == "1") {
        Swal.fire({ title: "Success!", text: res?.Msg || "Action completed successfully.", icon: "success", confirmButtonColor: "#3b82f6" })
          .then((result) => {
            if (result.isConfirmed) {
              fetchWalletTransactions(selectedUser, page, pageSize);
              fetchWallets(selectedUser);
              formikRef.current?.resetForm();
            }
          });
      } else {
        Swal.fire({ title: "Error", text: res?.Msg || "Operation failed", icon: "error" });
      }
    } catch (error) {
      console.error("Transaction Failed", error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  const fetchWalletTransactions = async (clientId: number, pageNumber: number, pageSize: number) => {
    try {
      const payload = {
        procName: "WalletTransaction_CRDR",
        Para: JSON.stringify({ ClientId: clientId, ActionMode: "GetWalletTransaction", PageNumber: pageNumber, PageSize: pageSize }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setTransactions(data);
        setTotalCount(data[0].TotalCount);
      } else if (Array.isArray(data?.data)) {
        setTransactions(data.data);
        setTotalCount(data.TotalCount || 0);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to load wallet transactions", err);
      setTransactions([]);
      setTotalCount(0);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchMemberDetails(selectedUser);
      fetchWallets(selectedUser);
      fetchWalletTransactions(selectedUser, page, pageSize);
    }
  }, [selectedUser, page]);

  const handleResetAll = () => {
    formikRef.current?.resetForm();
    setAutoResetKey((k) => k + 1);
    setSelectedUser(null);
    setMemberDetails(null);
    setSelectedWallet(null);
    setTransactions([]);
    setUsers([]);
    setPage(1);
    setTotalCount(0);
    fetchWallets("0");
  };

  const imageBaseUrl = import.meta.env.VITE_IMAGE_PREVIEW_URL;

  const [, setPermissionsLoading] = useState(true);
  const [, setHasPageAccess] = useState(true);
  const location = useLocation();
  const path = location.pathname;
  const formName = path.split("/").pop();

  const fetchFormPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({ ActionMode: "GetForms", FormName: formName, EmployeeId: employeeId }),
      };
      const response = await universalService(payload);
      const data = response?.data ?? response;
      if (!Array.isArray(data)) { setHasPageAccess(false); return; }
      const pagePermission = data.find(
        (p) => String(p.FormNameWithExt).trim().toLowerCase() === formName?.trim().toLowerCase(),
      );
      if (!pagePermission || !pagePermission.Action || pagePermission.Action.trim() === "") {
        setHasPageAccess(false); return;
      }
      SmartActions.load(data);
      setHasPageAccess(true);
    } catch (error) {
      console.error("Form permission fetch failed:", error);
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => { fetchFormPermissions(); }, []);

  /* ================================================================ */
  /* UI                                                               */
  /* ================================================================ */
  return (
    <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl relative flex items-center justify-center flex-shrink-0 bg-primary-button-bg/10">
            <i className="material-symbols-outlined absolute text-[38px] text-primary-button-bg/20"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
              account_balance
            </i>
            <i className="material-symbols-outlined relative text-[20px] text-primary-button-bg"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>
              account_balance
            </i>
          </div>
          <div>
            <h5 className="!mb-0 font-bold text-xl text-black dark:text-white leading-tight">
              Wallet Credit &amp; Debit
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 !mb-0">
              Manage member wallet balances — credit or debit any wallet
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700
              text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
              rounded-md text-sm font-medium transition-all"
          >
            <i className="material-symbols-outlined text-[16px]">restart_alt</i>
            Reset
          </button>
          <PermissionAwareTooltip
            allowed={SmartActions.canAdd(formName)}
            allowedText="Process Transaction"
            deniedText="Permission required"
          >
            <button
              type="submit"
              form="walletForm"
              disabled={!SmartActions.canAdd(formName)}
              className="flex items-center gap-2 px-5 py-2
                bg-primary-button-bg hover:bg-primary-button-bg-hover
                text-white rounded-md text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              <i className="material-symbols-outlined text-[16px]">swap_horiz</i>
              Process Transaction
            </button>
          </PermissionAwareTooltip>
        </div>
      </div>

      {/* ── Member Search ────────────────────────────────────────────────── */}
      <div className="mx-6 mt-5 mb-2 rounded-xl border border-gray-100 dark:border-gray-700/60
        bg-gray-50/60 dark:bg-[#111827]/40 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              Select Member
            </label>
            <div className="flex shadow-sm rounded-lg overflow-visible">
              <AutoCompleter
                memberList={users}
                loading={loading}
                onSearch={fetchManagers}
                onSelect={(member) => {
                  setSelectedUser(member.id);
                  setPage(1);
                  console.log("Selected Member:", member);
                }}
                clearTrigger={autoResetKey}
              />
              <button className="w-[46px] flex items-center justify-center bg-primary-button-bg
                text-white hover:bg-primary-button-bg-hover transition rounded-r-lg flex-shrink-0">
                <i className="material-symbols-outlined text-[20px]">search</i>
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 italic">
              Search by Name, Username, Email or Mobile number
            </p>
          </div>

          {/* Member info — animated slide-in */}
          <AnimatePresence mode="wait">
            {memberDetails ? (
              <motion.div
                key="member-info"
                variants={slideIn}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex items-center justify-between gap-4 pl-4 border-l border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700">
                    <img
                      src={`${imageBaseUrl}${memberDetails?.Logo}`}
                      alt="Client Logo"
                      className="w-full h-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = `${imageBaseUrl}default.jpg`;
                      }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-800 dark:text-white leading-none !mb-0">
                        {memberDetails.Name}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                        memberDetails.PaidStatus === "Paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {memberDetails.PaidStatus}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 !mb-0 leading-none">
                      @{memberDetails.UserName}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 !mb-0 leading-none">
                      {memberDetails.EmailId} · {memberDetails.ContactNo}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                  memberDetails.Status == "1"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-800"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-800"
                }`}>
                  {memberDetails.Status == "1" ? "Active" : "Inactive"}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-16 pl-4 border-l border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Select a member to view details
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Wallet Cards + Form / Transaction Table ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">

        {/* ── Left: Wallet picker + Form ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* Wallet cards — stagger animation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Select Wallet
              </p>
              {walletList.length > 0 && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  Total:{" "}
                  <span className="font-bold text-gray-600 dark:text-gray-300">
                    {currency.symbol}
                    {walletList.reduce((sum, w) => sum + Number(w.Balance || 0), 0).toFixed(2)}
                  </span>
                </span>
              )}
            </div>

            <motion.div
              className="flex flex-wrap gap-3"
              variants={cardContainer}
              initial="hidden"
              animate="show"
              key={walletList.length}
            >
              {walletList.map((wallet) => {
                const isSelected = selectedWallet?.WalletId === wallet.WalletId;
                const accent = walletColor(wallet.WalletDisplayName);
                return (
                  <motion.div
                    key={wallet.WalletId}
                    variants={cardItem}
                    onClick={() => setSelectedWallet(wallet)}
                    whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.97 }}
                    animate={isSelected
                      ? { scale: 1.04, transition: { type: "spring", stiffness: 300, damping: 20 } }
                      : { scale: 1 }
                    }
                    className={`relative w-[160px] rounded-xl cursor-pointer border transition-colors duration-200 overflow-hidden
                      ${isSelected
                        ? "border-primary-button-bg bg-primary-button-bg/5 dark:bg-primary-button-bg/10 shadow-md"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827]/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                      }`}
                  >
                    {/* Colored top strip */}
                    <div
                      className="h-[3px] w-full absolute top-0 left-0"
                      style={{ backgroundColor: accent }}
                    />

                    <div className="pt-5 px-4 pb-4">
                      {/* Selected dot */}
                      {isSelected && (
                        <motion.span
                          layoutId="wallet-selected-dot"
                          className="absolute top-3 right-3 w-2 h-2 rounded-full"
                          style={{ backgroundColor: accent }}
                          initial={false}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: accent + "1a" }}
                      >
                        <i
                          className="material-symbols-outlined text-[20px]"
                          style={{ color: accent, fontVariationSettings: "'FILL' 0, 'wght' 500" }}
                        >
                          {walletIcon(wallet.WalletDisplayName)}
                        </i>
                      </div>

                      {/* Balance */}
                      <p
                        className="text-lg font-bold leading-none !mb-1"
                        style={{ color: accent }}
                      >
                        {currency.symbol}{Number(wallet.Balance).toFixed(2)}
                      </p>

                      {/* Name */}
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight !mb-0 truncate">
                        {wallet.WalletDisplayName}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {walletList.length === 0 && (
                <p className="text-sm text-gray-400 italic py-4">No wallets available</p>
              )}
            </motion.div>
          </div>

          {/* Form */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700/60
            bg-gray-50/40 dark:bg-[#111827]/30 p-5">

            {/* Selected wallet summary banner */}
            <AnimatePresence>
              {selectedWallet && (
                <motion.div
                  key={selectedWallet.WalletId}
                  variants={expandIn}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="mb-4 origin-top"
                >
                  <div
                    className="rounded-lg px-4 py-3 flex items-center justify-between"
                    style={{
                      border: `1px solid ${walletColor(selectedWallet.WalletDisplayName)}30`,
                      backgroundColor: walletColor(selectedWallet.WalletDisplayName) + "0d",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: walletColor(selectedWallet.WalletDisplayName) + "20" }}
                      >
                        <i
                          className="material-symbols-outlined text-[16px]"
                          style={{
                            color: walletColor(selectedWallet.WalletDisplayName),
                            fontVariationSettings: "'FILL' 0, 'wght' 500",
                          }}
                        >
                          {walletIcon(selectedWallet.WalletDisplayName)}
                        </i>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 !mb-0 leading-tight">
                          {selectedWallet.WalletDisplayName}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 !mb-0">Selected wallet</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold !mb-0 leading-tight"
                        style={{ color: walletColor(selectedWallet.WalletDisplayName) }}
                      >
                        {currency.symbol}{Number(selectedWallet.Balance).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400 !mb-0">Current Balance</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Transaction Details
            </p>

            <Formik
              innerRef={formikRef}
              initialValues={{
                transactionType: "",
                amount: "",
                paymentMode: "",
                paymentDate: today,
                referenceNo: "",
                remarks: "",
              }}
              validationSchema={validationSchema}
              onSubmit={(values) => { submitWalletTransaction(values); }}
            >
              {({ field: _field }: any) => (
                <Form id="walletForm" className="space-y-4">

                  {/* Row 1: Transaction Type + Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <Field as="select" name="transactionType" className={inputCls}>
                        <option value="">Select Type</option>
                        <option value="CR">Credit</option>
                        <option value="DR">Debit</option>
                      </Field>
                      <ErrorMessage name="transactionType" component="p" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">
                          {currency.symbol}
                        </span>
                        <Field
                          type="text"
                          name="amount"
                          placeholder="0.00"
                          className={`${inputCls} !pl-7`}
                        />
                      </div>
                      <ErrorMessage name="amount" component="p" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  {/* Row 2: Payment Mode + Payment Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Mode <span className="text-red-500">*</span>
                      </label>
                      <Field as="select" name="paymentMode" className={inputCls}>
                        <option value="">Select Mode</option>
                        <option value="Bank">Bank</option>
                        <option value="UPI">UPI</option>
                        <option value="Wallet">Wallet</option>
                      </Field>
                      <ErrorMessage name="paymentMode" component="p" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <Field type="date" name="paymentDate" className={inputCls} />
                      <ErrorMessage name="paymentDate" component="p" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  {/* Reference No */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Reference Number
                    </label>
                    <Field
                      type="text"
                      name="referenceNo"
                      placeholder="Optional reference"
                      className={inputCls}
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Remarks
                    </label>
                    <Field name="remarks">
                      {({ field }) => (
                        <div>
                          <textarea
                            {...field}
                            maxLength={250}
                            rows={3}
                            placeholder="Optional notes..."
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm
                              bg-white dark:bg-gray-800 dark:text-gray-100 resize-none
                              focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20
                              transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                          />
                          <p className="text-[11px] text-gray-400 text-right mt-0.5">
                            {field.value?.length || 0} / 250
                          </p>
                        </div>
                      )}
                    </Field>
                  </div>

                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* ── Right: Transaction History ───────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/60
          bg-white dark:bg-[#0c1427] flex flex-col">

          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <i className="material-symbols-outlined text-[18px] text-primary-button-bg"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}>
                receipt_long
              </i>
              <span className="text-sm font-bold text-gray-800 dark:text-white">Transaction History</span>
            </div>
            {totalCount > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary-button-bg/10
                text-primary-button-bg font-semibold">
                {totalCount} records
              </span>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-table-bg text-primary-table-text dark:bg-[#15203c]">
                  <th className="px-4 py-3 text-left font-semibold w-10">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Wallet</th>
                  <th className="px-4 py-3 text-left font-semibold w-20">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Mode</th>
                  <th className="px-4 py-3 text-left font-semibold">Ref</th>
                  <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0c1427] divide-y divide-gray-50 dark:divide-gray-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <i className="material-symbols-outlined text-5xl opacity-30">receipt_long</i>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No Transactions Found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {selectedUser
                            ? "No wallet transactions yet for this member."
                            : "Select a member to view transaction history."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((item, index) => (
                    <motion.tr
                      key={index}
                      custom={index}
                      variants={rowVariant}
                      initial="hidden"
                      animate="show"
                      className="hover:bg-gray-50 dark:hover:bg-[#172036] transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">
                        {item.PaymentDate}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: walletColor(item.WalletDisplayName) }}
                          />
                          <span className="text-gray-700 dark:text-gray-300">{item.WalletDisplayName}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.TranType === "CR"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {item.TranType === "CR"
                            ? <FaArrowDown size={9} />
                            : <FaArrowUp size={9} />}
                          {item.TranType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold whitespace-nowrap" style={{
                        color: item.TranType === "CR" ? "#10b981" : "#ef4444",
                      }}>
                        {currency.symbol}{Number(item.Amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {item.PaymentMode}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {item.ReferenceNo || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 max-w-[80px] truncate">
                        {item.Remarks || "—"}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Page {page} of {Math.ceil(totalCount / pageSize) || 1}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700
                    text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                >
                  <FaChevronLeft size={10} />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700
                    text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberWalletsElegant;
