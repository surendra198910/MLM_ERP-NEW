import React, { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import Swal from "sweetalert2";

interface WithdrawActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onSubmit: (payload: any) => void;
}

export default function WithdrawActionModal({
  isOpen,
  onClose,
  data,
  onSubmit,
}: WithdrawActionModalProps) {
  const [txnId, setTxnId] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (data) {
      setTxnId(data.TransactionNo || "");
      setRemark(data.WithdrawRemark || "");
    }
  }, [data]);

  const isCrypto = data?.WithdrawModeId === 2;
  const isReadOnly = data?.Status === "Approved" || data?.Status === "Rejected";

  const statusConfig: Record<string, { label: string; classes: string }> = {
    Approved: {
      label: "Approved",
      classes: "bg-green-100 text-green-700 border border-green-200",
    },
    Rejected: {
      label: "Rejected",
      classes: "bg-red-100 text-red-600 border border-red-200",
    },
    Pending: {
      label: "Pending",
      classes: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    },
  };

  const status = data?.Status || "Pending";
  const { label, classes } = statusConfig[status] ?? statusConfig["Pending"];

  // Initials avatar
  const initials = (data?.Name || "??")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = (action: string) => {
    if (action === "Approved" && !txnId.trim()) {
      return Swal.fire({
        title: "Required",
        text: "Please enter a Transaction ID / UTR No.",
        icon: "warning",
        confirmButtonColor: "#f59e0b",
      });
    }

    onSubmit?.({
      withdrawId: data?.WithdrawId,
      status: action,
      transactionId: txnId,
      remark,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white dark:bg-[#0c1427] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all">

          {/* ── HEADER ── */}
          <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#0f172a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <i className="material-symbols-outlined text-blue-600 dark:text-blue-400 !text-[18px]">
                  account_balance_wallet
                </i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                  Withdraw request
                </p>
                <p className="text-xs text-blue-500 mt-0.5">#{data?.WithdrawNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${classes}`}>
                {label}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <i className="material-symbols-outlined !text-[18px]">close</i>
              </button>
            </div>
          </div>

          {/* ── USER + AMOUNT ── */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-medium flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data?.Name}{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    [{data?.UserName}]
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{data?.Mobile}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-medium text-green-600 dark:text-green-400">
                {data?.WithdrawAmount} USDT
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{data?.WithdrawDate}</p>
            </div>
          </div>

          {/* ── BANK / WALLET DETAILS ── */}
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2.5">
              {isCrypto ? "Wallet details" : "Bank details"}
            </p>

            {isCrypto ? (
              <div className="bg-gray-50 dark:bg-[#0f172a] rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-[11px] text-gray-400 mb-1">Receiving wallet</p>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 break-all">
                  {data?.ReceivingWallet}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Account holder", value: data?.AccountHolderName },
                  { label: "Account no.", value: data?.AccountNo },
                  { label: "IFSC code", value: data?.IFSC },
                  { label: "Bank name", value: data?.BankName },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 dark:bg-[#0f172a] rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700"
                  >
                    <p className="text-[11px] text-gray-400">{label}</p>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                      {value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ACTION FORM ── */}
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2.5">
              Take action
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Transaction ID / UTR no.
                  {!isReadOnly && (
                    <span className="text-red-400 ml-0.5">*</span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="e.g. UTR123456789"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0c1427] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 dark:disabled:bg-[#0f172a] disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Remark{" "}
                  <span className="text-gray-300 dark:text-gray-600">
                    (optional)
                  </span>
                </label>
                <textarea
                  disabled={isReadOnly}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0c1427] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 dark:disabled:bg-[#0f172a] disabled:text-gray-400 disabled:cursor-not-allowed resize-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="flex justify-between items-center px-5 py-3 bg-gray-50 dark:bg-[#0f172a]">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>

            {!isReadOnly && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit("Rejected")}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                >
                  <i className="material-symbols-outlined !text-[16px]">cancel</i>
                  Reject
                </button>
                <button
                  onClick={() => handleSubmit("Approved")}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all"
                >
                  <i className="material-symbols-outlined !text-[16px]">check_circle</i>
                  Approve
                </button>
              </div>
            )}
          </div>

        </DialogPanel>
      </div>
    </Dialog>
  );
}