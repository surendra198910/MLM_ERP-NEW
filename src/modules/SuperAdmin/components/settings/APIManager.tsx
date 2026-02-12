"use client";
import React, { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import Pagination from "../../common/Pagination";
import AddProviderModal from "./AddProviderModal";
import { FaSms, FaWhatsapp, FaEnvelope, FaEdit, FaTrash } from "react-icons/fa";


type Provider = {
    ProviderId: number;
    Name: string;
    BaseURL: string;
    SenderId: string;
    IsDefault: boolean;
    TotalRecords?: number;
};

export default function ApiManager() {
    const { universalService } = ApiService();
    const [showModal, setShowModal] = useState(false);

    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("SMS");

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [editData, setEditData] = useState<any>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const tabs = [
        { label: "SMS", icon: <FaSms /> },
        { label: "WhatsApp", icon: <FaWhatsapp /> },
        { label: "Email", icon: <FaEnvelope /> },
    ];


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

    const applySearch = () => {
        setCurrentPage(1);
        setSearchQuery(searchInput.trim());
    };
    const handleDefaultToggle = async (provider: Provider) => {
        try {
            const newValue = !provider.IsDefault;

            // If already default and user tries to disable it → prevent
            if (!newValue) {
                Swal.fire("Info", "At least one provider must remain default.", "info");
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


            fetchProviders();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to update default provider", "error");
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

    return (
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-2 -mx-7 px-5">
                <h5 className="font-bold text-xl text-black dark:text-white">
                    API Manager
                </h5>

                <button
                    onClick={() => {
                        setEditData(null);   // 🔥 clear edit
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded text-sm"
                >
                    Add Provider
                </button>


            </div>

            {/* TABS */}
            <div className="flex flex-wrap items-center justify-between gap-4 
    dark:border-[#1f2a44] 
    mb-5 -mx-6 px-6 pb-4">

                {/* LEFT SIDE — TABS */}
                <div className="flex items-center gap-3 overflow-x-auto">
                    {tabs.map((t) => {
                        const isActive = tab === t.label;

                        return (
                            <button
                                key={t.label}
                                onClick={() => {
                                    setTab(t.label);
                                    setCurrentPage(1);
                                }}
                                className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-all duration-200 whitespace-nowrap
            ${isActive
                                        ? "bg-primary-button-bg text-white shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1c2742] hover:text-gray-800 dark:hover:text-white"
                                    }
          `}
                            >
                                <span className="text-base">{t.icon}</span>
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* RIGHT SIDE — SEARCH + PAGE SIZE */}
                <div className="flex items-center gap-3">

                    {/* Search */}
                    {/* <div className="relative">
                        <input
                            type="text"
                            placeholder="Search provider..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applySearch()}
                            className="
          h-9 w-[240px] pl-3 pr-3 text-sm
          border border-gray-300 dark:border-gray-600
          rounded-md bg-white dark:bg-[#111c34]
          focus:outline-none focus:ring-1 focus:ring-primary-button-bg
          focus:border-primary-button-bg
          transition-all
        "
                        />
                    </div> */}

                    {/* Page Size */}
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="
        h-9 px-3 text-sm
        border border-gray-300 dark:border-gray-600
        rounded-md bg-white dark:bg-[#111c34]
        focus:outline-none focus:ring-1 focus:ring-primary-button-bg
        focus:border-primary-button-bg
        transition-all
      "
                    >
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                    </select>

                </div>
            </div>





            {/* TABLE */}
            <div className="overflow-x-auto -mx-7.5">
                <table className="w-full text-sm overflow-hidden">

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
                                Sender ID
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
                                        {p.SenderId}
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

                                            <button
                                                onClick={async () => {
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
                                                className="w-9 h-9 flex items-center justify-center rounded-md 
                     text-primary-button-bg 
                    hover:bg-primary-button-bg hover:text-white 
                    transition-all duration-200"
                                            >
                                                <FaEdit size={14} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(p)}
                                                className="w-9 h-9 flex items-center justify-center rounded-md 
                     text-red-500 
                    hover:bg-red-500 hover:text-white 
                    transition-all duration-200"
                                            >
                                                <FaTrash size={14} />
                                            </button>

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
        </div>
    );
}
