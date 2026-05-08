"use client";

import { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import { FaSave } from "react-icons/fa";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";
import Loader from "../../common/Loader";

export default function CryptoWalletSetting() {
  const { universalService } = ApiService();

  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);

  const path = location.pathname;
  const formName = path.split("/").pop();

  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 " +
    "focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg " +
    "bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100";

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
        Id: item.Id || 0, // if exists later
        WalletTypeId: item.WalletTypeId,
        Label: item.Chain, // UI label same usage
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

      // 🔥 Direct pass
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
      const result = res; ///res?.data?.[0] || res?.data || res;
      // debugger

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
  // STATES (UNCHANGED)
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
  // UI (100% SAME)
  // -------------------------------------
  return (
    <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}

      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3 -mx-[20px] md:-mx-[20px] px-[20px] md:px-[25px]">
        <div>
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Manage Crypto Wallet
          </h5>
        </div>

        <div className="flex gap-2">
          <PermissionAwareTooltip allowed={SmartActions.canUpdate(formName)}>
            <button
              onClick={handleSubmit}
              disabled={!SmartActions.canUpdate(formName)}
              className="flex items-center gap-2 px-4 py-1.5 
                            bg-primary-button-bg hover:bg-primary-button-bg-hover 
                            text-white rounded text-sm disabled:opacity-50"
            >
              <FaSave /> Update
            </button>
          </PermissionAwareTooltip>
        </div>
      </div>

      <div className="space-y-6 animate-fadeIn">
        <div className="border-t border-gray-100 dark:border-gray-800 mt-4">
          {platforms.map((item, index) => (
            <div
              key={item.WalletTypeId}
              className="flex flex-col md:flex-row md:items-center py-5 border-b border-gray-50 dark:border-[#15203c] last:border-0 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#15203c]/30 px-2"
            >
              <div className="w-full md:w-1/3 mb-2 md:mb-0">
                <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-button-bg"></span>
                  {item.Label}
                </label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 ml-3.5 uppercase tracking-tighter">
                  Wallet Address
                </p>
              </div>

              <div className="w-full md:w-2/3">
                <div className="relative">
                  <input
                    type="text"
                    value={item.Url}
                    onChange={(e) => handleChange(index, e.target.value)}
                    className={`${inputClass} !h-[48px] w-full bg-white dark:bg-[#0c1427] 
              border-gray-200 dark:border-gray-700 
              focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20 
              rounded-md px-4 text-sm transition-all shadow-sm`}
                    placeholder={`Enter ${item.Label} wallet address`}
                  />
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-primary-button-bg transition-all duration-300 ${item.Url ? "w-full" : "w-0"}`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
