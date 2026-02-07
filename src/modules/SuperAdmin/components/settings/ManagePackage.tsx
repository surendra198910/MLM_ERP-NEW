"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";

/* ================= TYPES ================= */

interface PackageItem {
    ProductId: number;
    ProductName: string;
    Type: string;
    MinAmount: number;
    MaxAmount: number;
    Validity: number;
    IsActive: number;
    DefaultImageURL?: string;
}

/* ================= COMPONENT ================= */

const Template: React.FC = () => {
    const navigate = useNavigate();
    const { universalService } = ApiService();

    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(false);

    /* Pagination */
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    /* ================= FETCH PACKAGES ================= */

    const fetchPackages = async () => {
        try {
            setLoading(true);

            const payload = {
                procName: "CreatePackage",
                Para: JSON.stringify({
                    ActionMode: "GetAllPackage",
                }),
            };

            const res = await universalService(payload);

            const data = res?.data || res;

            if (Array.isArray(data)) {
                setPackages(data);
            }

        } catch (err) {
            console.error("Package fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const getImageUrl = (img?: string) => {
        if (!img || img === "null" || img === "undefined") {
            return "";
        }

        return `http://122.160.25.202/mlmapi/uploads/employeedocuments/${img}`;
    };


    /* ================= TOGGLE STATUS ================= */

    const toggleStatus = async (pkg: PackageItem) => {
        try {
            const payload = {
                procName: "CreatePackage",
                Para: JSON.stringify({
                    ActionMode: "ToggleStatus",
                    ProductId: pkg.ProductId,
                    EntryBy: 1,
                }),
            };

            const res = await universalService(payload);
            const result = res?.data?.[0] || res?.[0];

            if (result?.StatusCode === 1) {
                Swal.fire("Updated", "Status changed successfully", "success");
                fetchPackages();
            } else {
                Swal.fire("Error", "Failed to update", "error");
            }

        } catch (err) {
            console.error("Toggle error:", err);
            Swal.fire("Error", "Server error", "error");
        }
    };

    /* ================= PAGINATION ================= */

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;

    const currentPackages = packages.slice(
        indexOfFirst,
        indexOfLast
    );

    /* ================= UI ================= */

    return (
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">

            {/* ================= HEADER ================= */}

            <div className="flex items-center justify-between pb-5 border-b border-gray-200 mb-5">

                <h5 className="font-bold text-xl text-black dark:text-white">
                    Manage Packages
                </h5>

                <button
                    onClick={() => navigate("/superadmin/mlm-setting/add-package")}
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium"
                >
                    + Add Package
                </button>

            </div>

            {/* ================= CONTENT ================= */}

            {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
            ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[25px]">

                    {currentPackages.map((pkg) => (

                        <div
                            key={pkg.ProductId}
                            className="relative group bg-white/80 dark:bg-[#0b1220]/80
              backdrop-blur-xl border border-blue-100 dark:border-blue-900/40
              rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300
              p-6 flex flex-col min-w-[280px] max-w-[320px]"
                        >

                            {/* Top Glow Line */}
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

                            {/* Ribbon Status */}
                            <div className="absolute top-0 right-0 z-20">
                                <div className="relative">
                                    <div className="absolute right-0 top-0 w-24 h-24 overflow-hidden">
                                        <span
                                            className={`absolute top-[22px] right-[-38px] w-40 rotate-45
                      text-white text-[11px] font-semibold text-center py-1 shadow-md
                      ${pkg.IsActive === 1
                                                    ? "bg-green-600"
                                                    : "bg-gray-500"
                                                }`}
                                        >
                                            {pkg.IsActive === 1 ? "ACTIVE" : "INACTIVE"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Header */}
                            <div className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight leading-snug">
                                {pkg.ProductName}
                            </div>

                            {/* Image */}
                            <div className="mt-6 flex justify-center">

                                <div className="w-28 h-28 rounded-2xl
                bg-gradient-to-br from-blue-50 to-indigo-50
                dark:from-[#111827] dark:to-[#020617]
                p-[2px] shadow-lg">
                                    {pkg.DefaultImageURL ? (

                                        <img
                                            src={`http://122.160.25.202/mlmapi/uploads/employeedocuments/${pkg.DefaultImageURL}`}
                                            alt={pkg.ProductName}
                                            className="w-full h-full object-cover rounded-2xl bg-white"
                                        />

                                    ) : (

                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                            No Image
                                        </div>

                                    )}




                                </div>

                            </div>

                            {/* Amount */}
                            <div className="mt-5 text-center">

                                <p className="text-3xl font-bold bg-gradient-to-r
                from-blue-600 to-indigo-600 bg-clip-text text-transparent">

                                    $ {pkg.MinAmount} - {pkg.MaxAmount}

                                </p>

                            </div>

                            {/* Details */}
                            <div className="mt-5 bg-blue-50/60 dark:bg-[#0f172a]
              border border-blue-100 dark:border-blue-900/40
              rounded-2xl p-4 space-y-3 text-sm">

                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Type
                                    </span>
                                    <span className="font-semibold">
                                        {pkg.Type}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Validity
                                    </span>
                                    <span className="font-semibold">
                                        {pkg.Validity} Days
                                    </span>
                                </div>

                            </div>

                            {/* Actions */}
                            <div className="mt-5 flex justify-between items-center gap-2">

                                {/* Edit */}
                                <button
                                    onClick={() =>
                                        navigate(`/superadmin/package/edit/${pkg.ProductId}`)
                                    }
                                    className="flex items-center gap-1 px-3 py-1.5
                  bg-blue-500 hover:bg-blue-600
                  text-white text-xs rounded"
                                >
                                    <FaEdit size={12} />
                                    Edit
                                </button>

                                {/* Toggle Switch */}
                                <div className="flex items-center gap-2">

                                    <span className="text-xs text-gray-500">
                                        {pkg.IsActive === 1 ? "Active" : "Inactive"}
                                    </span>

                                    <button
                                        onClick={() => toggleStatus(pkg)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full
    transition-colors duration-300 focus:outline-none
    ${pkg.IsActive === 1
                                                ? "bg-green-500"
                                                : "bg-gray-400"
                                            }`}
                                    >

                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow
      transition-transform duration-300
      ${pkg.IsActive === 1
                                                    ? "translate-x-5"
                                                    : "translate-x-1"
                                                }`}
                                        />

                                    </button>

                                </div>


                            </div>

                            {/* Footer */}
                            <p className="mt-4 text-[11px] text-gray-400 text-center tracking-wide">
                                Smart returns start with smart investments.
                            </p>

                        </div>

                    ))}

                </div>

            )}

            {/* ================= PAGINATION ================= */}

            {packages.length > itemsPerPage && (

                <div className="flex justify-center mt-8 gap-3">

                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <span className="px-3 py-1 text-sm">
                        Page {currentPage}
                    </span>

                    <button
                        disabled={currentPackages.length < itemsPerPage}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>

                </div>

            )}

        </div>
    );
};

export default Template;
