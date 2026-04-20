"use client";

import React, { useEffect, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";

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

    const data = res||[]
// debugger
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
      setRows([
        {
          WalletTypeId: 0,
          Name: "",
          Chain: "",
          Rate: "",
          ApiEndpoint: "",
          IsDeposit: false,
          IsWithdrawal: false,
        },
      ]);
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

    const result = res||[];
    //debugger
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
    <div className="trezo-card bg-white dark:bg-[#0c1427] p-6 rounded-md relative">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <h5 className="font-bold text-xl">Wallet Chain Setting</h5>

        <button
          onClick={addRow}
          className="px-4 py-2 bg-primary-button-bg text-white rounded flex items-center gap-2"
        >
          <FaPlus /> Add Chain
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
     <table className="w-full text-sm">
  <thead>
    <tr className="bg-primary-table-bg text-primary-table-text dark:bg-[#15203c]">
      <th className="px-4 py-3 text-left font-semibold w-[80px]">S. No</th>
      <th className="px-4 py-3 text-left font-semibold">Name</th>
      <th className="px-4 py-3 text-left font-semibold">Chain</th>
      <th className="px-4 py-3 text-left font-semibold">Rate</th>
      <th className="px-4 py-3 text-left font-semibold">API Endpoint</th>
      <th className="px-4 py-3 text-left font-semibold w-[120px]">Deposit</th>
      <th className="px-4 py-3 text-left font-semibold w-[120px]">Withdrawal</th>
      <th className="px-0 py-3 text-center font-semibold w-[100px]">Action</th>
    </tr>
  </thead>

  <tbody className="bg-white dark:bg-[#0c1427]">
    {rows.map((row, index) => (
      <tr
        key={index}
        className="border-b border-gray-100 dark:border-gray-700 
        hover:bg-gray-50 dark:hover:bg-[#172036] 
        transition-colors duration-200"
      >
        <td className="px-4 py-3 font-semibold">{index + 1}</td>

        {/* NAME */}
        <td className="px-4 py-3">
          <input
            value={row.Name}
            onChange={(e) => handleChange(index, "Name", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 
            bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-button-bg"
          />
        </td>

        {/* CHAIN */}
        <td className="px-4 py-3">
          <input
            value={row.Chain}
            onChange={(e) => handleChange(index, "Chain", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 
            bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-button-bg"
          />
        </td>

        {/* RATE */}
        <td className="px-4 py-3">
          <input
            type="number"
            value={row.Rate}
            onChange={(e) => handleChange(index, "Rate", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 
            bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-button-bg"
          />
        </td>

        {/* API */}
        <td className="px-4 py-3">
          <input
            value={row.ApiEndpoint}
            onChange={(e) =>
              handleChange(index, "ApiEndpoint", e.target.value)
            }
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 
            bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary-button-bg"
          />
        </td>

        {/* DEPOSIT */}
        <td className="px-4 py-3 text-center">
          <input
            type="checkbox"
            checked={row.IsDeposit}
            onChange={(e) =>
              handleChange(index, "IsDeposit", e.target.checked)
            }
            className="w-4 h-4 accent-primary-button-bg"
          />
        </td>

        {/* WITHDRAWAL */}
        <td className="px-4 py-3 text-center">
          <input
            type="checkbox"
            checked={row.IsWithdrawal}
            onChange={(e) =>
              handleChange(index, "IsWithdrawal", e.target.checked)
            }
            className="w-4 h-4 accent-primary-button-bg"
          />
        </td>

        {/* ACTION */}
        <td className="px-8 py-3 text-center">
          <button
            onClick={() => removeRow(index)}
            className="w-9 h-9 flex items-center justify-center rounded-md 
            text-red-500 hover:bg-red-500 hover:text-white transition"
          >
            <FaTimes size={14} />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end mt-5">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-primary-button-bg text-white rounded"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>

    </div>
  );
}