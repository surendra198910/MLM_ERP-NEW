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

// -------------------------------------
// MAIN COMPONENT
// -------------------------------------
export default function SocialMediaSetting() {
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
          formName?.trim().toLowerCase()
      );

      if (
        !pagePermission ||
        !pagePermission.Action ||
        pagePermission.Action.trim() === ""
      ) {
        setHasPageAccess(false);
        return;
      }

      SmartActions.load(data);
      setHasPageAccess(true);
    } catch (error) {
      console.error("Permission fetch failed:", error);
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // -------------------------------------
  // LOAD PLATFORMS
  // -------------------------------------
  const loadPlatforms = async () => {
    try {
      setInitialLoading(true);

      // 🔹 1. Get All Platforms
      const platformPayload = {
        procName: "ManageSocialLinks",
        Para: JSON.stringify({
          ActionMode: "GetAllSocialMediaPlatform",
        }),
      };

      // 🔹 2. Get Saved Links
      const socialPayload = {
        procName: "ManageSocialLinks",
        Para: JSON.stringify({
          ActionMode: "GET",
        }),
      };

      const [platformRes, socialRes] = await Promise.all([
        universalService(platformPayload),
        universalService(socialPayload),
      ]);

      const platformData = platformRes?.data || platformRes || [];
      const socialDataRaw = socialRes?.data || socialRes || [];

      // 🔥 Handle array response safely
      const socialData = Array.isArray(socialDataRaw)
        ? socialDataRaw
        : [];

      // 🔹 3. Merge Data
      const formatted = platformData.map((p) => {
        const existing = socialData.find(
          (s) => s.PlatformId === p.Value
        );

        return {
          Value: p.Value,
          Label: p.Label,
          Url: existing?.Url || "",
          Id: existing?.Id || 0,
          PlatformId: p.Value,
        };
      });

      setPlatforms(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load platforms");
    } finally {
      setInitialLoading(false);
    }
  };
  useEffect(() => {
    fetchFormPermissions();
    loadPlatforms();
  }, []);

  // -------------------------------------
  // HANDLE INPUT CHANGE
  // -------------------------------------
  const handleChange = (index, value) => {
    const updated = [...platforms];
    updated[index].Url = value;
    setPlatforms(updated);
  };

  // -------------------------------------
  // SUBMIT
  // -------------------------------------
  const handleSubmit = async () => {
    const confirm = await Swal.fire({
      title: "Update Social Links?",
      text: "Are you sure you want to save these changes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const payload = {
        procName: "ManageSocialLinks",
        Para: JSON.stringify({
          ActionMode: "UPDATE",
          JsonData: JSON.stringify(platforms),
        }),
      };

      const res = await universalService(payload);
      const result =
        res?.data?.[0] ||
        res?.data ||
        res;

      if (result[0]?.Status === "SUCCESS") {
        Swal.fire(
          "Success!",
          result[0]?.Message || "Updated successfully",
          "success"
        );
      } else {
        Swal.fire(
          "Error",
          result[0]?.Message || "Update failed",
          "error"
        );
      }
      loadPlatforms();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // LOADING STATES
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
  // UI
  // -------------------------------------
  return (
    <div className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6 relative">

      {/* LOADER OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3 -mx-[20px] md:-mx-[20px] px-[20px] md:px-[25px]">
        <div>
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Social Media Settings
          </h5>
        </div>

        <div className="flex gap-2">
          <PermissionAwareTooltip
            allowed={SmartActions.canUpdate(formName)}
            allowedText="Update Settings"
            deniedText="Permission required"
          >
            <button
              type="button"
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
              key={item.Value}
              className="flex flex-col md:flex-row md:items-center py-5 border-b border-gray-50 dark:border-[#15203c] last:border-0 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#15203c]/30 px-2"
            >
              {/* LABEL SECTION */}
              <div className="w-full md:w-1/3 mb-2 md:mb-0">
                <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-button-bg"></span>
                  {item.Label}
                </label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 ml-3.5 uppercase tracking-tighter">
                  Platform Link
                </p>
              </div>

              {/* INPUT SECTION */}
              <div className="w-full md:w-2/3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Paste your ${item.Label} profile URL here...`}
                    value={item.Url}
                    onChange={(e) => handleChange(index, e.target.value)}
                    className={`${inputClass} !h-[48px] w-full bg-white dark:bg-[#0c1427] 
              border-gray-200 dark:border-gray-700 
              focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg/20 
              rounded-md px-4 text-sm transition-all shadow-sm`}
                  />

                  {/* Subtle Bottom Indicator */}
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-primary-button-bg transition-all duration-300 ${item.Url ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}