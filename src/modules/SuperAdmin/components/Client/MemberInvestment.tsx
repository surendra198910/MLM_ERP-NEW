import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import AutoCompleter from "../../../../components/CommonFormElements/InputTypes/AutoCompleter";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";

const today = new Date().toISOString().split("T")[0];
const MemberWalletsElegant: React.FC = () => {
  /* ---------------- VALIDATION SCHEMA ---------------- */
  const ValidationSchema = () =>
    Yup.object().shape({
      PackageId: Yup.string().required("Package is required"),
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
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { universalService } = ApiService();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [investments, setInvestments] = useState<any[]>([]);
  const totalPages = Math.ceil(totalCount / pageSize);
  const formikRef = useRef<any>(null);
  const [autoResetKey, setAutoResetKey] = useState(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

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
  const fetchPackages = async () => {
    try {
      setLoading(true);

      const payload = {
        procName: "MemberInvestmentByAdmin",
        Para: JSON.stringify({
          ActionMode: "GetPackages",
        }),
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

  const submitMemberInvestment = async (values: any) => {
    try {
      // ✅ Member validation
      if (!memberDetails?.ClientId) {
        Swal.fire("Error", "Please select a member first!", "error");
        return;
      }

      // ✅ Package validation
      if (!values.PackageId) {
        Swal.fire("Error", "Please select a package!", "error");
        return;
      }

      const payload = {
        procName: "MemberInvestmentByAdmin",
        Para: JSON.stringify({
          ClientId: memberDetails.ClientId,
          PackageId: values.PackageId,
          Amount: values.amount,
          Remarks: values.remarks || "",
          EntryBy: 1, // Admin UserId
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
          // Optional refresh actions
          fetchInvestmentTransactions(selectedUser, page, pageSize);
        });
      } else {
        Swal.fire({
          title: "Error",
          text: res?.Msg || "Investment failed",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Investment Failed", error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  const fetchInvestmentTransactions = async (
    clientId: number,
    page: number,
    pageSize: number,
  ) => {
    const payload = {
      procName: "MemberInvestmentByAdmin",
      Para: JSON.stringify({
        ClientId: clientId,
        PageNumber: page,
        PageSize: pageSize,
        ActionMode: "GetInvestmentTransaction",
      }),
    };

    const res = await universalService(payload);

    // normalize response
    const data = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];

    setInvestments(data);
    setTotalCount(data.length > 0 ? data[0].TotalCount : 0);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

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
    setAutoResetKey((k) => k + 1); // 👈 clears autocomplete
    setSelectedUser(null);
    setMemberDetails(null);
    setInvestments([]);
    setUsers([]);
    setPage(1);
    setTotalCount(0);
  };
  const imageBaseUrl = import.meta.env.VITE_IMAGE_PREVIEW_URL;

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] rounded-2xl shadow-lg p-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
        <div className="text-lg font-bold text-gray-800 dark:text-white">
          Member Investment
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm font-medium transition-colors"
          >
            Reset Form
          </button>

          <button
            type="submit"
            form="walletForm"
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 "
          >
            Submit
          </button>
        </div>
      </div>

      {/* ================= MEMBER SECTION ================= */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f6f7f9bd]
px-4 py-5
sm:px-6
md:px-10
min-h-[135px]
rounded-[14px]
flex items-center"
      >
        {/* SEARCH MEMBER */}
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block text-gray-600 dark:text-gray-300">
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
              ${
                memberDetails.PaidStatus === "Paid"
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
        ${
          memberDetails.Status == "1"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* ================= WALLET CARDS ================= */}
        <div>
          {/* ================= LEFT FORM ================= */}
          <Formik
            innerRef={formikRef}
            initialValues={{
              PackageId: "",
              amount: "",
              remarks: "",
            }}
            validationSchema={ValidationSchema}
            onSubmit={(values, { resetForm }) => {
              submitMemberInvestment(values);
            }}
          >
            {({ setFieldValue }) => (
              <Form id="walletForm" className="space-y-5 ">
                {/* Package */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Package <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="PackageId"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value; // ✅ STRING

                      // If "Select Package"
                      if (!value) {
                        setFieldValue("PackageId", "");
                        setFieldValue("amount", "");
                        setSelectedPackage(null);
                        return;
                      }

                      // Convert ONLY for lookup
                      const selectedId = Number(value);

                      const pkg = packages.find(
                        (p: any) => Number(p.ProductId) === selectedId,
                      );

                      console.log("Selected Package:", pkg);

                      // ✅ STORE STRING IN FORMIK
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
                      <option
                        key={`pkg-${pkg.ProductId ?? index}`}
                        value={String(pkg.ProductId)} // ✅ STRING
                      >
                        {pkg.ProductName}
                        {pkg.Type === "Fixed"
                          ? ` (${pkg.MinAmount})`
                          : ` (${pkg.MinAmount} - ${pkg.MaxAmount})`}
                      </option>
                    ))}
                  </Field>

                  <ErrorMessage
                    name="PackageId"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Amount($) <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="number"
                    name="amount"
                    placeholder={
                      selectedPackage?.Type === "Fixed"
                        ? "Fixed Amount"
                        : selectedPackage
                          ? `Enter amount between ${selectedPackage.MinAmount} - ${selectedPackage.MaxAmount}`
                          : "Enter amount"
                    }
                    disabled={selectedPackage?.Type === "Fixed"}
                    min={selectedPackage?.MinAmount}
                    max={selectedPackage?.MaxAmount}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />

                  <ErrorMessage
                    name="amount"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Description / Remarks
                  </label>
                  <Field
                    as="textarea"
                    name="remarks"
                    placeholder="Enter remarks..."
                    className="w-full h-[90px] w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500  "
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* ================= RIGHT TABLE ================= */}
        <div className="rounded-2xl shadow-sm p-5 bg-white dark:bg-[#f6f7f9bd]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              Investment History
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
              Member Investments
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg shadow-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Investment Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Paid By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <i className="material-symbols-outlined text-5xl">
                          inventory_2
                        </i>
                        <p className="font-medium text-gray-600 dark:text-gray-300">
                          No Investments Found
                        </p>
                        <p className="text-xs text-gray-400">
                          Member investments will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  investments.map((item, index) => (
                    <tr
                      key={item.InvestmentId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{index + 1}</td>

                      <td className="px-4 py-3">{item.InvestmentDate}</td>

                      <td className="px-4 py-3 font-semibold">
                        {item.PackageName}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        ${item.Amount}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.Status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.Status}
                        </span>
                      </td>

                      <td className="px-4 py-3">{item.PaidBy}</td>

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
