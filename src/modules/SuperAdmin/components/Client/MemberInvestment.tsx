import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import AutoCompleter from "../../../../components/CommonFormElements/InputTypes/AutoCompleter";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import { useCurrency } from "../../context/CurrencyContext";
import SelectUserModal from "../../../../components/CommonFormElements/PopUp/SelectUserModal";
import { SmartActions } from "../Security/SmartActionWithFormName";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { useLocation } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const today = new Date().toISOString().split("T")[0];

const inputCls =
  "w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm h-10 " +
  "bg-white dark:bg-gray-800 dark:text-gray-100 " +
  "focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20 transition-all";

const MemberWalletsElegant: React.FC = () => {
  /* ---------------- VALIDATION SCHEMA ---------------- */
  const ValidationSchema = () =>
    Yup.object().shape({
      PackageId: Yup.string().required("Package is required"),
      remarks: Yup.string().max(250, "Max 250 characters allowed"),
      amount: Yup.number()
        .required("Amount is required")
        .test("range-check", "Invalid amount", function (value) {
          if (!selectedPackage || value === undefined) return true;
          if (selectedPackage.Type === "Fixed") {
            return Number(value) === Number(selectedPackage.MinAmount);
          }
          return (
            value >= selectedPackage.MinAmount &&
            value <= selectedPackage.MaxAmount
          );
        }),
    });

  const { currency } = useCurrency();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { universalService } = ApiService();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(7);
  const [totalCount, setTotalCount] = useState(0);
  const [investments, setInvestments] = useState<any[]>([]);
  const totalPages = Math.ceil(totalCount / pageSize);
  const formikRef = useRef<any>(null);
  const [autoResetKey, setAutoResetKey] = useState(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedModalUser, setSelectedModalUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [modalusers, setModalUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const payload = {
        procName: "Client",
        Para: JSON.stringify({ searchData: userSearch, ActionMode: "getUsersListByCompany" }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load managers", err);
      setUsers([]);
    }
  };

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

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const payload = {
        procName: "MemberInvestmentByAdmin",
        Para: JSON.stringify({ ActionMode: "GetPackages" }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      console.log(data);
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load packages", err);
      setPackages([]);
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
        console.log(data[0]);
        setMemberDetails(data[0]);
      } else {
        setMemberDetails(null);
      }
    } catch (err) {
      console.error("Failed to load member details", err);
      setMemberDetails(null);
    }
  };

  const submitMemberInvestment = async (values: any) => {
    try {
      if (!memberDetails?.ClientId) {
        Swal.fire("Error", "Please select a member first!", "error");
        return;
      }
      if (!values.PackageId) {
        Swal.fire("Error", "Please select a package!", "error");
        return;
      }

      const confirm = await Swal.fire({
        title: "Confirm Investment",
        icon: "warning",
        background: document.documentElement.classList.contains("dark") ? "#0c1427" : "#ffffff",
        color: document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#111827",
        html: `
  <div style="text-align:left; font-size:14px;">
    <div style="
      background:${document.documentElement.classList.contains("dark") ? "#111827" : "#f9fafb"};
      border-radius:10px; padding:12px;
      border:1px solid ${document.documentElement.classList.contains("dark") ? "#1f2937" : "#e5e7eb"};
    ">
      <div style="display:flex; justify-content:space-between; padding:6px 0;">
        <span style="color:#9ca3af;">Member</span>
        <span style="font-weight:600;">${memberDetails.Name} (${memberDetails.UserName})</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:6px 0;">
        <span style="color:#9ca3af;">Package</span>
        <span style="font-weight:600; color:#3b82f6;">${selectedPackage?.ProductName || "N/A"}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:6px 0; border-top:1px dashed #6b7280; margin-top:6px; padding-top:10px;">
        <span style="color:#9ca3af;">Amount</span>
        <span style="font-weight:700; color:#22c55e; font-size:16px;">${currency.symbol}${values.amount}</span>
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
        procName: "MemberInvestmentByAdmin",
        Para: JSON.stringify({
          ClientId: memberDetails.ClientId,
          PackageId: values.PackageId,
          Amount: values.amount,
          Remarks: values.remarks || "",
          EntryBy: 1,
          ActionMode: "AdminCreateInvestment",
        }),
      };

      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response?.data?.[0];

      if (res?.StatusCode == 1) {
        Swal.fire({
          title: "Success!",
          text: res.Msg || "Investment created successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          fetchInvestmentTransactions(selectedUser, page, pageSize);
          formikRef.current?.resetForm();
        });
      } else {
        Swal.fire({ title: "Error", text: res?.Msg || "Investment failed", icon: "error" });
      }
    } catch (error) {
      console.error("Investment Failed", error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  const fetchInvestmentTransactions = async (clientId: number, page: number, pageSize: number) => {
    const payload = {
      procName: "MemberInvestmentByAdmin",
      Para: JSON.stringify({ ClientId: clientId, PageNumber: page, PageSize: pageSize, ActionMode: "GetInvestmentTransaction" }),
    };
    const res = await universalService(payload);
    const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    setInvestments(data);
    setTotalCount(data.length > 0 ? data[0].TotalCount : 0);
  };

  useEffect(() => { fetchPackages(); }, []);

  useEffect(() => {
    if (selectedUser) {
      setSelectedPackage(null);
      formikRef.current?.setFieldValue("PackageId", "");
      formikRef.current?.setFieldValue("amount", "");
      fetchMemberDetails(selectedUser);
      fetchInvestmentTransactions(selectedUser, page, pageSize);
    }
  }, [selectedUser, page]);

  const handleResetAll = () => {
    formikRef.current?.resetForm();
    setAutoResetKey((k) => k + 1);
    setSelectedUser(null);
    setMemberDetails(null);
    setInvestments([]);
    setUsers([]);
    setPage(1);
    setTotalCount(0);
  };

  const imageBaseUrl = import.meta.env.VITE_IMAGE_PREVIEW_URL;

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

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Dual-tone icon */}
          <div className="w-11 h-11 rounded-xl relative flex items-center justify-center flex-shrink-0 bg-primary-button-bg/10">
            <i
              className="material-symbols-outlined absolute text-[38px] text-primary-button-bg/20"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              payments
            </i>
            <i
              className="material-symbols-outlined relative text-[20px] text-primary-button-bg"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}
            >
              payments
            </i>
          </div>
          <div>
            <h5 className="!mb-0 font-bold text-xl text-black dark:text-white leading-tight">
              Member Investment
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 !mb-0">
              Process and track investment packages for members
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
            allowedText="Make Investment"
            deniedText="Permission required"
          >
            <button
              type="submit"
              form="walletForm"
              className="flex items-center gap-2 px-5 py-2
                bg-primary-button-bg hover:bg-primary-button-bg-hover
                text-white rounded-md text-sm font-medium transition-all shadow-sm"
            >
              <i className="material-symbols-outlined text-[16px]">trending_up</i>
              Make Investment
            </button>
          </PermissionAwareTooltip>
        </div>
      </div>

      {/* ── Member Search Bar ────────────────────────────────────────────────── */}
      <div className="mx-6 mt-5 mb-2 rounded-xl border border-gray-100 dark:border-gray-700/60
        bg-gray-50/60 dark:bg-[#111827]/40 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

          {/* Search */}
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
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="w-[46px] flex items-center justify-center bg-primary-button-bg
                  text-white hover:bg-primary-button-bg-hover transition rounded-r-lg flex-shrink-0"
              >
                <i className="material-symbols-outlined text-[20px]">search</i>
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 italic">
              Search by Name, Username, Email or Mobile number
            </p>
          </div>

          {/* Member info card */}
          {memberDetails ? (
            <div className="flex items-center justify-between gap-4 pl-4 border-l border-gray-200 dark:border-gray-700">
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
            </div>
          ) : (
            <div className="flex items-center justify-center h-16 pl-4 border-l border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                Select a member to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Form + History ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">

        {/* ── Left: Investment Form ────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/60
          bg-gray-50/40 dark:bg-[#111827]/30 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            Investment Details
          </p>

          <Formik
            innerRef={formikRef}
            initialValues={{ PackageId: "", amount: "", remarks: "" }}
            validationSchema={ValidationSchema}
            onSubmit={(values, { resetForm }) => { submitMemberInvestment(values); }}
          >
            {({ setFieldValue }) => (
              <Form id="walletForm" className="space-y-4">

                {/* Package */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Package <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="PackageId"
                    className={`${inputCls} !h-10`}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      if (!value) {
                        setFieldValue("PackageId", "");
                        setFieldValue("amount", "");
                        setSelectedPackage(null);
                        return;
                      }
                      const selectedId = Number(value);
                      const pkg = packages.find((p: any) => Number(p.ProductId) === selectedId);
                      console.log("Selected Package:", pkg);
                      setFieldValue("PackageId", value);
                      if (pkg?.Type === "Fixed") {
                        setFieldValue("amount", String(pkg.MinAmount));
                      } else {
                        setFieldValue("amount", "");
                      }
                      setSelectedPackage(pkg);
                    }}
                  >
                    <option value="">Select Package</option>
                    {packages.map((pkg: any, index: number) => (
                      <option key={`pkg-${pkg.ProductId ?? index}`} value={String(pkg.ProductId)}>
                        {pkg.ProductName}
                        {pkg.Type === "Fixed"
                          ? ` (${pkg.MinAmount})`
                          : ` (${pkg.MinAmount} - ${pkg.MaxAmount})`}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="PackageId" component="p" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Amount <span className="text-red-500">*</span>
                    {selectedPackage && (
                      <span className="ml-2 font-normal text-gray-400">
                        {selectedPackage.Type === "Fixed"
                          ? `Fixed: ${currency.symbol}${selectedPackage.MinAmount}`
                          : `Range: ${currency.symbol}${selectedPackage.MinAmount} – ${currency.symbol}${selectedPackage.MaxAmount}`}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-gray-500 pointer-events-none">
                      {currency.symbol}
                    </span>
                    <Field
                      type="number"
                      name="amount"
                      placeholder={
                        selectedPackage?.Type === "Fixed"
                          ? "Fixed Amount"
                          : selectedPackage
                          ? `${selectedPackage.MinAmount} – ${selectedPackage.MaxAmount}`
                          : "Enter amount"
                      }
                      disabled={selectedPackage?.Type === "Fixed"}
                      min={selectedPackage?.MinAmount}
                      max={selectedPackage?.MaxAmount}
                      className={`${inputCls} !pl-7 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <ErrorMessage name="amount" component="p" className="text-red-500 text-xs mt-1" />
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
                          placeholder="Optional notes about this investment..."
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm
                            bg-white dark:bg-gray-800 dark:text-gray-100
                            focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20
                            transition-all resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
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

        {/* ── Right: Investment History ────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/60
          bg-white dark:bg-[#0c1427] flex flex-col">

          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <i className="material-symbols-outlined text-[18px] text-primary-button-bg"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}>
                history
              </i>
              <span className="text-sm font-bold text-gray-800 dark:text-white">Investment History</span>
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
                  <th className="px-4 py-3 text-left font-semibold">Package</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Paid By</th>
                  <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-[#0c1427] divide-y divide-gray-50 dark:divide-gray-800">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <i className="material-symbols-outlined text-5xl opacity-30">inventory_2</i>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No Investments Found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {selectedUser
                            ? "This member has no investment records yet."
                            : "Select a member to view their history."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  investments.map((item, index) => (
                    <tr
                      key={item.InvestmentId}
                      className="hover:bg-gray-50 dark:hover:bg-[#172036] transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.InvestmentDate}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                        {item.PackageName}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {currency.symbol}{item.Amount}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.Status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.Status === "Active" ? "bg-green-500" : "bg-red-500"
                          }`} />
                          {item.Status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.PaidBy}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 max-w-[100px] truncate">
                        {item.Remarks || "—"}
                      </td>
                    </tr>
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

      <SelectUserModal
        open={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={modalusers}
        search={userSearch}
        setSearch={setUserSearch}
        onSelect={(user) => {
          console.log(user);
          setPage(1);
          setIsUserModalOpen(false);
        }}
      />
    </div>
  );
};

export default MemberWalletsElegant;
