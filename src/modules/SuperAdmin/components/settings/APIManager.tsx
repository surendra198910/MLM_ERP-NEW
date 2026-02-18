"use client";
import { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import Pagination from "../../common/Pagination";
import AddProviderModal from "./AddProviderModal";
import { FaSms, FaWhatsapp, FaEnvelope, FaEdit, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";
import { motion } from "framer-motion";



type Provider = {
    ProviderId: number;
    Name: string;
    BaseURL: string;
    SenderId: string;
    IsDefault: boolean;
    HttpMethod?: string;
    TotalRecords?: number;
};

export default function ApiManager() {
    const { universalService } = ApiService();
    const [showModal, setShowModal] = useState(false);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("SMS");
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editData, setEditData] = useState<any>(null);
    const path = location.pathname;
    const formName = path.split("/").pop();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const tabs = [
        { label: "SMS", icon: <FaSms /> },
        { label: "WhatsApp", icon: <FaWhatsapp /> },
        { label: "Email", icon: <FaEnvelope /> },
    ];

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

            // 🔎 Find permission for THIS page
            const pagePermission = data.find(
                (p) =>
                    String(p.FormNameWithExt).trim().toLowerCase() ===
                    formName?.trim().toLowerCase()
            );

            // ❌ No permission or empty Action
            if (
                !pagePermission ||
                !pagePermission.Action ||
                pagePermission.Action.trim() === ""
            ) {
                setHasPageAccess(false);
                return;
            }

            // ✅ Load permissions into SmartActions
            SmartActions.load(data);
            setHasPageAccess(true);

        } catch (error) {
            console.error("Form permission fetch failed:", error);
            setHasPageAccess(false);
        } finally {
            setPermissionsLoading(false);
        }
    };

    const fetchProviders = async () => {
        try {
            setLoading(true);

            const payload = {
                procName: "ApiManager",
                Para: JSON.stringify({
                    ActionMode: "Select",
                    ProviderType: tab,
                    SearchTerm: searchQuery,
                    Start: (currentPage - 1) * itemsPerPage,
                    Length: itemsPerPage,
                }),
            };

            const res = await universalService(payload);
            const data = res?.data || res || [];

            if (!Array.isArray(data) || data.length === 0) {
                setProviders([]);
                setTotalCount(0);
                return;
            }

            setProviders(data);
            setTotalCount(data[0]?.TotalRecords ?? data.length);
        } catch (err) {
            console.error(err);
            setProviders([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, [tab, currentPage, itemsPerPage, searchQuery]);

    const handleDefaultToggle = async (provider: Provider) => {
        try {
            const newValue = !provider.IsDefault;

            // Prevent disabling the only default
            if (!newValue) {
                toast.info("At least one provider must remain default.");
                return;
            }

            await universalService({
                procName: "ApiManager",
                Para: JSON.stringify({
                    ActionMode: "Update",
                    ProviderId: provider.ProviderId,
                    ProviderType: tab,
                    ProviderName: provider.Name,
                    BaseUrl: provider.BaseURL,
                    SenderId: provider.SenderId,
                    IsDefault: newValue,
                }),
            });

            toast.success(`${provider.Name} is now Default ${tab} Provider`);

            fetchProviders();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update default provider");
        }
    };
    const handleDelete = async (provider: Provider) => {
        const result = await Swal.fire({
            title: "Delete Provider?",
            html: `
      <div style="font-size:14px">
        Are you sure you want to delete <b>${provider.Name}</b>?<br/>
        This action will deactivate the provider.
      </div>
    `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
            focusCancel: true,
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({
                title: "Deleting...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const response = await universalService({
                procName: "ApiManager",
                Para: JSON.stringify({
                    ActionMode: "Delete",
                    ProviderId: provider.ProviderId,
                }),
            });

            Swal.close();

            const res = response?.data?.[0] || response?.[0] || response;

            if (res?.Status === "SUCCESS") {
                Swal.fire("Deleted!", "Provider deleted successfully.", "success");
                fetchProviders();
            } else {
                Swal.fire("Error", res?.Message || "Delete failed", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Something went wrong while deleting.", "error");
        }
    };
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    useEffect(() => {
        fetchFormPermissions();
    }, []);
    if (permissionsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0c1427] rounded-md">
                <div className="flex flex-col items-center gap-3">
                    <div className="theme-loader"></div>
                    {/* <p className="text-sm text-gray-500">
          Loading permissions...
        </p> */}

                </div>
            </div>
        );
    }
    if (!hasPageAccess) {
        return (
            <AccessRestricted />
        );
    }
    return (
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-2 -mx-7 px-5">
                <h5 className="font-bold text-xl text-black dark:text-white">
                    API Manager
                </h5>
                <PermissionAwareTooltip
                    allowed={SmartActions.canAdd(formName)}
                    allowedText="Add Provider"
                    deniedText="Permission required"
                >
                    <button
                        onClick={() => {
                            if (!SmartActions.canAdd(formName)) return;
                            setEditData(null);
                            setShowModal(true);
                        }}
                        disabled={!SmartActions.canAdd(formName)}
                        className="px-4 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover 
        text-white rounded text-sm disabled:opacity-50"
                    >
                        Add Provider
                    </button>
                </PermissionAwareTooltip>


            </div>

            {/* TABS */}
            <div className="-mx-7 px-7 mb-6 mt-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-6 overflow-x-auto relative">

                    {tabs.map((t) => {
                        const isActive = tab === t.label;

                        return (
                            <button
                                key={t.label}
                                type="button"
                                onClick={() => {
                                    setTab(t.label);
                                    setCurrentPage(1);
                                }}
                                className={`
          relative pb-3 text-sm font-medium transition-colors duration-200
          flex items-center gap-2 whitespace-nowrap
          ${isActive
                                        ? "text-primary-button-bg"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"}
        `}
                            >
                                {t.icon}
                                {t.label}

                                {/* 🔥 Animated Underline */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-button-bg rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}

                    {/* PAGE SIZE RIGHT SIDE */}
                    <div className="ml-auto pb-2">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="h-9 px-3 text-sm border border-gray-300 dark:border-gray-600
        rounded-md bg-white dark:bg-[#111c34]
        focus:outline-none focus:ring-1 focus:ring-primary-button-bg
        focus:border-primary-button-bg transition-all"
                        >
                            <option value={10}>10 / page</option>
                            <option value={25}>25 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
                    </div>

                </div>

            </div>



            {/* TABLE */}
            <div className="relative overflow-x-auto -mx-7.5 -mt-6">
                {loading && (
                    <div className="absolute inset-0 
                  bg-white/60 dark:bg-black/40 
                  backdrop-blur-sm
                  flex items-center justify-center 
                  z-20">
                        <div className="animate-spin w-10 h-10 
                    border-4 border-primary-button-bg 
                    border-t-transparent 
                    rounded-full" />
                    </div>
                )}

                <table className="w-full text-sm overflow-hidden ">

                    {/* ================= HEADER ================= */}
                    <thead>
                        <tr className="bg-primary-table-bg text-primary-table-text dark:bg-[#15203c]">
                            <th className="px-4 py-3 text-left font-semibold">
                                Name
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                                Base URL
                            </th>
                            <th className="px-4 py-3 text-left font-semibold w-[140px]">
                                Method
                            </th>

                            <th className="px-4 py-3 text-center font-semibold w-[120px]">
                                Default
                            </th>
                            <th className="px-4 py-3 text-center font-semibold w-[130px]">
                                Action
                            </th>
                        </tr>
                    </thead>

                    {/* ================= BODY ================= */}
                    <tbody className="bg-white dark:bg-[#0c1427]">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : providers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    No providers found.
                                </td>
                            </tr>
                        ) : (
                            providers.map((p, index) => (
                                <tr
                                    key={p.ProviderId}
                                    className={`
              border-b border-gray-100 dark:border-[#172036]
              hover:bg-gray-50 dark:hover:bg-[#172036]
              transition-colors duration-200
            `}
                                >
                                    {/* Name */}
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                                        {p.Name}
                                    </td>

                                    {/* Base URL */}
                                    <td className="px-4 py-3 max-w-[220px] truncate text-gray-600 dark:text-gray-300">
                                        {p.BaseURL}
                                    </td>

                                    {/* Sender ID */}
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        <span
                                            className={`px-2 py-1 rounded-md text-xs font-medium
            ${p.HttpMethod === "GET"
                                                    ? "bg-green-100 text-green-700"
                                                    : p.HttpMethod === "POST"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : p.HttpMethod === "PUT"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : p.HttpMethod === "DELETE"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-gray-100 text-gray-600"
                                                }
        `}
                                        >
                                            {p.HttpMethod || "-"}
                                        </span>
                                    </td>


                                    {/* Default Toggle */}
                                    <td className="px-4 py-3 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={p.IsDefault}
                                                onChange={() => handleDefaultToggle(p)}
                                            />

                                            {/* Track */}
                                            <div
                                                className="
        w-12 h-6 rounded-full
        bg-gray-300 dark:bg-gray-600
        transition-all duration-300 ease-in-out
        peer-checked:bg-primary-button-bg
        shadow-inner
        peer-focus:ring-2 peer-focus:ring-primary-button-bg/40
      "
                                            ></div>

                                            {/* Thumb */}
                                            <div
                                                className="
        absolute left-1 top-1
        w-4 h-4 rounded-full
        bg-white
        shadow-md
        transition-all duration-300 ease-in-out
        peer-checked:translate-x-6
        group-hover:shadow-lg
      "
                                            ></div>
                                        </label>
                                    </td>


                                    {/* Action */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center items-center gap-2">

                                            <PermissionAwareTooltip
                                                allowed={SmartActions.canEdit(formName)}
                                                allowedText="Edit Provider"
                                                deniedText="Permission required"
                                            >
                                                <button
                                                    onClick={async () => {
                                                        if (!SmartActions.canEdit(formName)) return;

                                                        try {
                                                            const res = await universalService({
                                                                procName: "ApiManager",
                                                                Para: JSON.stringify({
                                                                    ActionMode: "Select",
                                                                    ProviderId: p.ProviderId,
                                                                }),
                                                            });

                                                            const data = res?.data?.[0] || res?.[0];
                                                            if (!data) return;

                                                            const parsedParams = data.Parameters
                                                                ? JSON.parse(data.Parameters)
                                                                : [];

                                                            setEditData({
                                                                ...data,
                                                                Parameters: parsedParams,
                                                            });

                                                            setShowModal(true);
                                                        } catch (err) {
                                                            console.error(err);
                                                            Swal.fire("Error", "Failed to load provider details", "error");
                                                        }
                                                    }}
                                                    disabled={!SmartActions.canEdit(formName)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-md 
        text-primary-button-bg hover:bg-primary-button-bg hover:text-white 
        transition-all duration-200 disabled:opacity-50"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                            </PermissionAwareTooltip>


                                            <PermissionAwareTooltip
                                                allowed={SmartActions.canDelete(formName)}
                                                allowedText="Delete Provider"
                                                deniedText="Permission required"
                                            >
                                                <button
                                                    onClick={() => {
                                                        if (!SmartActions.canDelete(formName)) return;
                                                        handleDelete(p);
                                                    }}
                                                    disabled={!SmartActions.canDelete(formName)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-md 
        text-red-500 hover:bg-red-500 hover:text-white 
        transition-all duration-200 disabled:opacity-50"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </PermissionAwareTooltip>


                                        </div>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>



            <AddProviderModal
                open={showModal}
                editData={editData}
                onClose={() => {
                    setShowModal(false);
                    setEditData(null);   // 🔥 important
                }}
                onSuccess={fetchProviders}
            />



            {/* PAGINATION */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
            />
            <ToastContainer position="top-right" autoClose={2500} />

        </div>
    );
}
