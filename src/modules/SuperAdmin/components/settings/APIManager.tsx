"use client";
import React, { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Pagination from "../../common/Pagination";
import AddProviderModal from "./AddProviderModal";
import { FaSms, FaWhatsapp, FaEnvelope } from "react-icons/fa";


type Provider = {
    ProviderId: number;
    Name: string;
    BaseURL: string;
    SenderId: string;
    IsDefault: boolean;
    IsActive: boolean;
    TotalRecords?: number;
};

export default function ApiManager() {
    const { universalService } = ApiService();
    const navigate = useNavigate();
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
                    IsActive: provider.IsActive,
                }),
            });

            fetchProviders();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to update default provider", "error");
        }
    };


    const handleDelete = async (id: number) => {
        const confirm = await Swal.fire({
            title: "Delete Provider?",
            text: "Are you sure you want to delete this provider?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
        });

        if (!confirm.isConfirmed) return;

        await universalService({
            procName: "ApiManager",
            Para: JSON.stringify({
                ActionMode: "Delete",
                ProviderId: id,
            }),
        });

        fetchProviders();
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
            <div className="flex border-b border-gray-200 mb-4 gap-10 mb-2 -mx-7 px-10">
                {tabs.map((t) => (
                    <button
                        key={t.label}
                        onClick={() => {
                            setTab(t.label);
                            setCurrentPage(1);
                        }}
                        className={`pb-2 text-sm font-medium flex items-center gap-2 transition-colors ${tab === t.label
                            ? "border-b-2 border-primary-button-bg text-primary-button-bg"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <span className="text-base">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>


            {/* SEARCH */}
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applySearch()}
                    className="h-9 w-[250px] px-3 text-sm border rounded-md"
                />

                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    className="h-9 px-3 text-sm border rounded-md"
                >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                </select>
            </div>

            {/* TABLE */}
            <div className="table-responsive overflow-x-auto -mx-8">
                <table className="w-full">
                    <thead>
                        <tr className="bg-primary-table-bg text-primary-table-text dark:bg-[#15203c]">
                            <th className="px-10 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">BaseURL</th>
                            <th className="px-4 py-3 text-left">Sender ID</th>
                            <th className="px-4 py-3 text-left">Default</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    Loading...
                                </td>
                            </tr>
                        ) : providers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    No providers found.
                                </td>
                            </tr>
                        ) : (
                            providers.map((p) => (
                                <tr
                                    key={p.ProviderId}
                                    className="border-b border-gray-100 dark:border-[#172036]"
                                >
                                    <td className="px-4 py-4">{p.Name}</td>
                                    <td className="px-4 py-4">{p.BaseURL}</td>
                                    <td className="px-4 py-4">{p.SenderId}</td>

                                    <td className="px-4 py-4">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={p.IsDefault}
                                                onChange={() => handleDefaultToggle(p)}
                                            />
                                            <div className="w-11 h-6 bg-gray-300 rounded-full peer 
            peer-checked:bg-primary-button-bg 
            transition-colors duration-300">
                                            </div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full 
            transition-transform duration-300 
            peer-checked:translate-x-5">
                                            </div>
                                        </label>
                                    </td>


                                    <td className="px-4 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs ${p.IsActive
                                                ? "bg-green-100 text-green-600"
                                                : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            {p.IsActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex gap-3">
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

                                                        // 🔥 Parse Parameters JSON string
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

                                                className="text-primary-button-bg hover:underline text-sm"
                                            >
                                                Edit
                                            </button>


                                            <button
                                                onClick={() => handleDelete(p.ProviderId)}
                                                className="text-red-500 hover:underline text-sm"
                                            >
                                                Delete
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
