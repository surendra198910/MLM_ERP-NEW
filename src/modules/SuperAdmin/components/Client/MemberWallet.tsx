import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useLocation } from "react-router-dom";
import * as Yup from "yup";
import AutoCompleter from "../../../../components/CommonFormElements/InputTypes/AutoCompleter";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import { useCurrency } from "../../context/CurrencyContext";
import { SmartActions } from "../Security/SmartActionWithFormName";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
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
  const totalPages = Math.ceil(totalCount / pageSize);
  const formikRef = useRef<any>(null);
  const [autoResetKey, setAutoResetKey] = useState(0);

  // ✅ Member List comes from API / state
  /* ---------------- API FUNCTION ---------------- */
  const fetchManagers = async (searchText: string) => {
    try {
      setLoading(true);

      const payload = {
        procName: "Client",
        Para: JSON.stringify({
          searchData: searchText,
          ActionMode: "getUsersList",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
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
        Para: JSON.stringify({
          ClientId: clientId,
          ActionMode: "GetClientDetails",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data) && data.length > 0) {
        setMemberDetails(data[0]); // single row
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
        Para: JSON.stringify({
          ClientId: clientid,
          ActionMode: "GetWallets",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data)) {
        setWalletList(data);
      } else {
        setWalletList([]);
      }
    } catch (err) {
      console.error("Wallet fetch failed", err);
      setWalletList([]);
    }
  };
  useEffect(() => {
    fetchWallets("0");
  }, []);
  const submitWalletTransaction = async (values: any) => {
    try {
      console.log(memberDetails);

      // ✅ Client Validation
      if (!memberDetails?.ClientId) {
        Swal.fire("Error", "Please select a member first!", "error");
        return;
      }

      // ✅ Wallet Validation
      if (!selectedWallet?.WalletId) {
        Swal.fire("Error", "Please select a wallet first!", "error");
        return;
      }

      const isDark = document.documentElement.classList.contains("dark");

      // ✅ Confirmation Popup
      const confirm = await Swal.fire({
        title: "Confirm Wallet Transaction",
        icon: "warning",
        background: isDark ? "#0c1427" : "#ffffff",
        color: isDark ? "#e5e7eb" : "#111827",
        html: `
        <div style="text-align:left; font-size:14px;">
          <div style="
            background:${isDark ? "#111827" : "#f9fafb"};
            border-radius:10px;
            padding:12px;
            border:1px solid ${isDark ? "#1f2937" : "#e5e7eb"};
          ">
            
            <div style="display:flex; justify-content:space-between; padding:6px 0;">
              <span style="color:#9ca3af;">Member</span>
              <span style="font-weight:600;">
                ${memberDetails.Name} (${memberDetails.UserName})
              </span>
            </div>

            <div style="display:flex; justify-content:space-between; padding:6px 0;">
              <span style="color:#9ca3af;">Wallet</span>
              <span style="font-weight:600; color:#3b82f6;">
                ${selectedWallet?.WalletDisplayName || "N/A"}
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              padding:6px 0;
              border-top:1px dashed #6b7280;
              margin-top:6px;
              padding-top:10px;
            ">
              <span style="color:#9ca3af;">Amount</span>
              <span style="font-weight:700; color:#22c55e; font-size:16px;">
                ${currency.symbol}${values.amount}
              </span>
            </div>

          </div>
        </div>
      `,
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
      const res = Array.isArray(response)
        ? response[0]
        : response?.data?.[0];

      if (res?.StatusCode == "1") {
        Swal.fire({
          title: "Success!",
          text: res?.Msg || "Action completed successfully.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3b82f6",
        }).then((result) => {
          if (result.isConfirmed) {
            fetchWalletTransactions(selectedUser, page, pageSize);
            fetchWallets(selectedUser);
            formikRef.current?.resetForm();
          }
        });
      } else {
        Swal.fire({
          title: "Error",
          text: res?.Msg || "Operation failed",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Transaction Failed", error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  const fetchWalletTransactions = async (
    clientId: number,
    pageNumber: number,
    pageSize: number,
  ) => {
    try {
      const payload = {
        procName: "WalletTransaction_CRDR",
        Para: JSON.stringify({
          ClientId: clientId,
          ActionMode: "GetWalletTransaction",
          PageNumber: pageNumber,
          PageSize: pageSize,
        }),
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
    setAutoResetKey((k) => k + 1); // 👈 clears autocomplete
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

  //PERMISSION API CALL
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);
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
        Para: JSON.stringify({
          ActionMode: "GetForms",
          FormName: formName, // 👈 category for this page
          EmployeeId: employeeId,
        }),
      };

      const response = await universalService(payload);
      const data = response?.data ?? response;

      // ❌ Invalid or empty response → deny access
      if (!Array.isArray(data)) {
        setHasPageAccess(false);
        return;
      }

      // 🔍 Find permission for THIS form/page
      const pagePermission = data.find(
        (p) =>
          String(p.FormNameWithExt).trim().toLowerCase() ===
          formName?.trim().toLowerCase(),
      );

      // ❌ No permission OR empty Action
      if (
        !pagePermission ||
        !pagePermission.Action ||
        pagePermission.Action.trim() === ""
      ) {
        setHasPageAccess(false);
        return;
      }

      // ✅ Permission allowed → load SmartActions
      SmartActions.load(data);
      setHasPageAccess(true);
    } catch (error) {
      console.error("Form permission fetch failed:", error);
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };
  useEffect(() => {
    fetchFormPermissions();
  }, []);
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] rounded-2xl shadow-lg">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4 mb-4">
        <div className="text-lg font-bold text-gray-800 dark:text-white">
          Wallet Credit & Debit
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm font-medium transition-colors"
          >
            Reset Form
          </button>
          <PermissionAwareTooltip
            allowed={SmartActions.canAdd(formName)}
            allowedText="Process Transaction"
            deniedText="Permission required"
          >
            <button
              type="submit"
              form="walletForm"
              className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 "
            >
              Process Transaction
            </button>
          </PermissionAwareTooltip>
        </div>
      </div>

      {/* ================= MEMBER SECTION ================= */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f6f7f9bd] dark:bg-[#0c1410]
px-4 py-5

sm:px-6
md:px-10
min-h-[135px]
rounded-[14px]
flex items-center mx-4"
      >
        {/* SEARCH MEMBER */}
        <div>
          <label className="text-sm text-gray-700 dark:text-white mb-1 block">
            Select Member (Type First 3 Letters)
          </label>

          <div className="flex mt-2 shadow-sm rounded-lg overflow-visible">
            <AutoCompleter
              memberList={users}
              loading={loading}
              onSearch={fetchManagers} // ✅ Parent API Passed Here
              onSelect={(member) => {
                setSelectedUser(member.id);
                setPage(1); // reset pagination
                console.log("Selected Member:", member);
              }}
              clearTrigger={autoResetKey}
            />
            <button className="w-[55px] flex items-center justify-center bg-primary-button-bg text-white hover:bg-primary-button-bg-hover transition">
              <i className="material-symbols-outlined">search</i>
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-white mt-1 italic">
            You can search using Name, Username, Email address, or Mobile number
          </p>
        </div>

        {/* MEMBER INFO */}
        {memberDetails && (
          <div
            className="
      flex items-center justify-between
      border-l border-[#2222220f]
      px-2 py-2
    "
          >
            {/* LEFT SIDE */}
            <div className="flex items-center gap-4">
              {/* ✅ Logo */}
              <div className="w-[65px] h-[65px] rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={`${imageBaseUrl}${memberDetails?.Logo}`}
                  alt="Client Logo"
                  className="w-full h-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = `${imageBaseUrl}default.jpg`;
                  }}
                />
              </div>

              {/* ✅ Info */}
              <div className="space-y-[3px]">
                {/* Name + Paid Tag */}
                <div className="flex items-center gap-2">
                  <h3
                    className="text-base font-bold text-gray-800 dark:text-white leading-none mb-0 text-base sm:text-[18px] md:text-[20px]"
                    style={{ margin: 0 }}
                  >
                    {memberDetails.Name}
                  </h3>

                  {/* Paid Tag */}
                  <span
                    className={`px-2 py-[2px] text-[11px] rounded-md font-semibold
              ${memberDetails.PaidStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                      }`}
                  >
                    {memberDetails.PaidStatus}
                  </span>
                </div>

                {/* Username */}
                <p
                  className="text-sm text-gray-500 mb-0 leading-none"
                  style={{ margin: 0 }}
                >
                  {memberDetails.UserName}
                </p>

                {/* Email + Contact Compact */}
                <p
                  className="text-xs text-gray-400 mb-0 leading-none"
                  style={{ margin: 0 }}
                >
                  {memberDetails.EmailId} • {memberDetails.ContactNo}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE STATUS */}
            <span
              className={`px-4 py-[6px] rounded-xl text-xs font-semibold
        ${memberDetails.Status == "1"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                }`}
            >
              {memberDetails.Status == "1" ? "Active" : "Inactive"}
            </span>
          </div>
        )}
      </div>

      {/* ================= FORM + TABLE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-5 p-4 px-5">
        {/* ================= WALLET CARDS ================= */}
        <div>
          <div className="flex flex-wrap gap-5">
            {walletList.map((wallet) => (
              <div
                key={wallet.WalletId}
                onClick={() => setSelectedWallet(wallet)}
                className={`w-[170px] p-5 rounded-xl cursor-pointer transition-all shadow-sm dark:bg-[#0c1427]
        ${selectedWallet?.WalletId === wallet.WalletId
                    ? "bg-blue-50 border-2 border-primary-button-bg scale-[1.03]"
                    : "bg-gray-50 border border-gray-200 hover:scale-[1.02]"
                  }`}
              >
                {/* Amount (Static for now) */}
                <h2 className="text-xl font-bold text-gray-800">
                  {currency.symbol}
                  {wallet.Balance}
                </h2>

                {/* Wallet Name from API */}
                <p className="text-sm text-gray-500 mt-1">
                  {wallet.WalletDisplayName}
                </p>
              </div>
            ))}
          </div>
          {/* ================= LEFT FORM ================= */}
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
            onSubmit={(values, { resetForm }) => {
              submitWalletTransaction(values);
            }}
          >
            {() => (
              <Form id="walletForm" className="space-y-5 mt-5">
                {/* Transaction Type */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Transaction Type <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="transactionType"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500  "
                  >
                    <option value="">Select Transaction Type</option>
                    <option value="CR">Credit</option>
                    <option value="DR">Debit</option>
                  </Field>
                  <ErrorMessage
                    name="transactionType"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Amount({currency.symbol}){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    name="amount"
                    placeholder="Enter Amount"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500  "
                  />
                  <ErrorMessage
                    name="amount"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Payment Mode <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="paymentMode"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500  "
                  >
                    <option value="">Select Mode</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                    <option value="Wallet">Wallet</option>
                  </Field>
                  <ErrorMessage
                    name="paymentMode"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="date"
                    name="paymentDate"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500  "
                  />
                  <ErrorMessage
                    name="paymentDate"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Reference */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Reference Number
                  </label>
                  <Field
                    type="text"
                    name="referenceNo"
                    placeholder="Optional Reference"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500  "
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Description / Remarks
                  </label>
                  <Field name="remarks">
                    {({ field }) => (
                      <div>
                        <textarea
                          {...field}
                          maxLength={250}
                          className="w-full h-[90px] border border-gray-200 rounded-md px-3 py-2"
                        />
                        <p className="text-xs text-gray-500">
                          {field.value?.length || 0}/250 characters
                        </p>
                      </div>
                    )}
                  </Field>
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* ================= RIGHT TABLE ================= */}
        <div className="rounded-2xl shadow-sm p-5 bg-white dark:bg-[#0c1427]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              Transaction History
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
              Recent Activity
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg shadow-sm">
              <thead className="bg-primary-table-bg dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    Ref No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary-table-text dark:text-gray-300 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <i className="material-symbols-outlined text-5xl">
                          receipt_long
                        </i>
                        <p className="font-medium text-gray-600 dark:text-gray-300">
                          No Transactions Found
                        </p>
                        <p className="text-xs text-gray-400">
                          Wallet transactions will appear here once added.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">{item.PaymentDate}</td>
                      <td className="px-4 py-3">{item.WalletDisplayName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${item.TranType === "CR"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.TranType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {currency.symbol}
                        {item.Amount}
                      </td>
                      <td className="px-4 py-3">{item.PaymentMode}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.ReferenceNo || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.Remarks || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-end items-center gap-3 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Prev
              </button>

              <span className="text-sm">
                Page {page} of {Math.ceil(totalCount / pageSize) || 1}
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberWalletsElegant;
