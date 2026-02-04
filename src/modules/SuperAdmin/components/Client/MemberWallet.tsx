import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import AutoCompleter from "../../../../components/CommonFormElements/InputTypes/AutoCompleter";
import { ApiService } from "../../../../services/ApiService";

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
});

const MemberWalletsElegant: React.FC = () => {
  interface Wallet {
    WalletId: number;
    WalletDisplayName: string;
    WalletValue: string;
    IsActive: boolean;
  }
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [walletList, setWalletList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { universalService } = ApiService();
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
  const fetchWallets = async () => {
    try {
      const payload = {
        procName: "GetMLMSettings",
        Para: JSON.stringify({
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
    fetchWallets();
  }, []);
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] rounded-2xl shadow-lg p-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <p className="text-2xl font-bold text-gray-800 dark:text-white">
          Member Wallet(s)
        </p>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition">
            Reset Form
          </button>

          <button
            type="submit"
            form="walletForm"
            className="px-5 py-2 rounded-lg bg-primary-button-bg text-white font-semibold hover:bg-primary-button-bg-hover transition"
          >
            Submit
          </button>
        </div>
      </div>

      {/* ================= MEMBER SECTION ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SEARCH MEMBER */}
        <div>
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Select Member (Type First 2 Letters)
          </label>

          <div className="flex mt-2 shadow-sm rounded-lg overflow-visible">
            <AutoCompleter
              memberList={users}
              loading={loading}
              onSearch={fetchManagers} // ✅ Parent API Passed Here
              onSelect={(member) => {
                setSelectedUser(member.id);
                fetchMemberDetails(member.id);
                console.log("Selected Member:", member);
              }}
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
      bg-white dark:bg-[#0c1427]
      border border-gray-200 dark:border-[#172036]
      rounded-2xl
      px-5 py-4
      shadow-sm
      max-w-[650px]
    "
          >
            {/* LEFT SIDE */}
            <div className="flex items-center gap-4">
              {/* ✅ Logo */}
              <div className="w-[65px] h-[65px] rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={`http://122.160.25.202/mlmapi/uploads/employeedocuments/${memberDetails.Logo}`}
                  alt="Client Logo"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src =
                      "http://122.160.25.202/mlmapi/uploads/employeedocuments/default.jpg";
                  }}
                />
              </div>

              {/* ✅ Info */}
              <div className="space-y-[3px]">
                {/* Name + Paid Tag */}
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-800 dark:text-white leading-none">
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
                <p className="text-sm text-gray-500 leading-none">
                  {memberDetails.UserName}
                </p>

                {/* Email + Contact Compact */}
                <p className="text-xs text-gray-400 leading-none">
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

      {/* ================= WALLET CARDS ================= */}
      <div className="flex flex-wrap gap-5 mt-7">
        {walletList.map((wallet) => (
          <div
            key={wallet.WalletId}
            onClick={() => setSelectedWallet(wallet)}
            className={`w-[170px] p-5 rounded-xl cursor-pointer transition-all shadow-sm
        ${
          selectedWallet?.WalletId === wallet.WalletId
            ? "bg-blue-50 border-2 border-primary-button-bg scale-[1.03]"
            : "bg-gray-50 border border-gray-200 hover:scale-[1.02]"
        }`}
          >
            {/* Amount (Static for now) */}
            <h2 className="text-xl font-bold text-gray-800">$ 0</h2>

            {/* Wallet Name from API */}
            <p className="text-sm text-gray-500 mt-1">
              {wallet.WalletDisplayName}
            </p>
          </div>
        ))}
      </div>

      {/* ================= FORM + TABLE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* ================= LEFT FORM ================= */}
        <Formik
          initialValues={{
            transactionType: "",
            amount: "",
            paymentMode: "",
            paymentDate: "",
            referenceNo: "",
            remarks: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            console.log("Submitted Data:", values);
            alert("Transaction Submitted Successfully!");
          }}
        >
          {() => (
            <Form id="walletForm" className="space-y-5">
              {/* Transaction Type */}
              <div>
                <label className="text-sm font-semibold">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="transactionType"
                  className="w-full h-[44px] mt-1 border rounded-lg px-3 focus:ring-2 focus:ring-primary-button-bg"
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
                <label className="text-sm font-semibold">
                  Amount($) <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  name="amount"
                  placeholder="Enter Amount"
                  className="w-full h-[44px] mt-1 border rounded-lg px-3 focus:ring-2 focus:ring-primary-button-bg"
                />
                <ErrorMessage
                  name="amount"
                  component="p"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="text-sm font-semibold">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="paymentMode"
                  className="w-full h-[44px] mt-1 border rounded-lg px-3 focus:ring-2 focus:ring-primary-button-bg"
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
                <label className="text-sm font-semibold">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <Field
                  type="date"
                  name="paymentDate"
                  className="w-full h-[44px] mt-1 border rounded-lg px-3 focus:ring-2 focus:ring-primary-button-bg"
                />
                <ErrorMessage
                  name="paymentDate"
                  component="p"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="text-sm font-semibold">
                  Reference Number
                </label>
                <Field
                  type="text"
                  name="referenceNo"
                  placeholder="Optional Reference"
                  className="w-full h-[44px] mt-1 border rounded-lg px-3"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="text-sm font-semibold">
                  Description / Remarks
                </label>
                <Field
                  as="textarea"
                  name="remarks"
                  placeholder="Enter remarks..."
                  className="w-full h-[90px] mt-1 border rounded-lg px-3 py-2"
                />
              </div>
            </Form>
          )}
        </Formik>

        {/* ================= RIGHT TABLE ================= */}
        <div className="border rounded-xl shadow-sm p-5 bg-gray-50 dark:bg-[#172036]">
          <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-white">
            Transaction History
          </h3>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-gray-600 dark:text-gray-300">
                <th className="py-2 text-left">Req.Date</th>
                <th className="py-2 text-left">Wallet</th>
                <th className="py-2 text-left">By</th>
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Amount</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b hover:bg-gray-100 transition">
                <td className="py-2">02-Jan-2024</td>
                <td>FundWallet</td>
                <td>Admin</td>
                <td className="font-semibold text-green-600">CR</td>
                <td>$1000</td>
              </tr>

              <tr className="border-b hover:bg-gray-100 transition">
                <td className="py-2">24-Dec-2023</td>
                <td>FundWallet</td>
                <td>Admin</td>
                <td className="font-semibold text-green-600">CR</td>
                <td>$1000</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-400 mt-4">
            Showing 1 to 2 of 2 entries
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberWalletsElegant;
