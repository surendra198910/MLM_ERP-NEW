import React, { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import Swal from "sweetalert2";
export default function WithdrawActionModal({
  isOpen,
  onClose,
  data,
  onSubmit,
}) {
  useEffect(() => {
    if (data) {
      setTxnId(data.TransactionNo || "");
      setRemark(data.WithdrawRemark || "");
    }
  }, [data]);
  const [txnId, setTxnId] = useState("");
  const [remark, setRemark] = useState("");

  const isCrypto = data?.WithdrawModeId === 2;
  const isReadOnly = data?.Status === "Approved" || data?.Status === "Rejected";
  const handleSubmit = (status) => {
    if (status === "Approved" && !txnId) {
      return Swal.fire({
        title: "Error",
        text: "Enter Transaction No.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }

    onSubmit?.({
      withdrawId: data?.WithdrawId,
      status,
      transactionId: txnId,
      remark,
    });

    onClose();
  };

  const statusClass =
    data?.Status === "Approved"
      ? "bg-green-100 text-green-700"
      : data?.Status === "Rejected"
        ? "bg-red-100 text-red-600"
        : "bg-red-100 text-red-600"; // Pending RED

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-3">
        <DialogPanel className="w-full max-w-xl rounded-xl bg-white shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
            <div className="text-md font-semibold">
              Withdraw Request
              <span className="ml-2 text-blue-600 text-sm">
                #{data?.WithdrawNo}
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* USER */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <img
              src="https://img.magnific.com/free-vector/user-circles-set_78370-4704.jpg"
              className="w-9 h-9 rounded-full"
            />
            <div className="text-sm">
              <div className="font-medium">
                {data?.Name} [{data?.UserName}]
              </div>
              <div className="text-gray-500 text-xs">{data?.Mobile}</div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="px-4 py-3 border-b space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-green-600 font-semibold text-lg">
                {data?.WithdrawAmount} USDT
              </div>

              <span className={`px-2 py-0.5 rounded text-xs ${statusClass}`}>
                {data?.Status || "Pending"}
              </span>
            </div>

            {/* Wallet / Bank */}
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
              {isCrypto ? (
                <div className="break-all">{data?.ReceivingWallet}</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400">Acc Holder</div>
                    <div className="font-medium">{data?.AccountHolderName}</div>
                  </div>

                  <div>
                    <div className="text-gray-400">Acc No</div>
                    <div className="font-medium">{data?.AccountNo}</div>
                  </div>

                  <div>
                    <div className="text-gray-400">IFSC</div>
                    <div>{data?.IFSC}</div>
                  </div>

                  <div>
                    <div className="text-gray-400">Bank</div>
                    <div>{data?.BankName}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Date</span>
              <span>{data?.WithdrawDate}</span>
            </div>
          </div>

          {/* FORM */}
          <div className="px-4 py-3 space-y-3">
            <div className="text-sm font-medium text-gray-700">Take Action</div>

            <input
              disabled={isReadOnly}
              type="text"
              placeholder="Transaction Hash / UTR"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />

            <textarea
              disabled={isReadOnly}
              placeholder="Remark (optional)"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm h-20 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
            {!isReadOnly && (
              <>
                <button
                  onClick={() => handleSubmit("Rejected")}
                  className="px-4 py-1.5 text-sm rounded bg-red-500 hover:bg-red-600 text-white"
                >
                  Reject
                </button>

                <button
                  onClick={() => handleSubmit("Approved")}
                  className="px-4 py-1.5 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
