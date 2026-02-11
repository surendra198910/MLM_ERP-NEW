"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import {
    FaTimes,
    FaPlus,
    FaTrash,
    FaServer,
    FaKey,
} from "react-icons/fa";
type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;   // 👈 ADD THIS
};

type Parameter = {
    key: string;
    value: string;
    isRequired: boolean;
};

export default function AddProviderModal({
    open,
    onClose,
    onSuccess,
    editData,     // ✅ ADD THIS
}: Props) {

    const { universalService } = ApiService();
    const [loading, setLoading] = useState(false);
    const isEdit = !!editData;
  useEffect(() => {
    if (editData) {
        // EDIT MODE
        setForm({
            providerType: editData.ProviderType,
            providerName: editData.Name,
            baseUrl: editData.BaseURL,
            senderId: editData.SenderId,
        });

        if (editData.Parameters) {
            setParameters(
                editData.Parameters.map((p: any) => ({
                    key: p.ParamKey,
                    value: p.ParamValue,
                    isRequired: p.IsRequired,
                }))
            );
        }
    } else {
        // 🔥 ADD MODE RESET
        setForm({
            providerType: "SMS",
            providerName: "",
            baseUrl: "",
            senderId: "",
        });

        setParameters([
            { key: "ApiKey", value: "", isRequired: true },
        ]);
    }
}, [editData]);



    const [form, setForm] = useState({
        providerType: "SMS",   // ✅ MUST exist
        providerName: "",
        baseUrl: "",
        senderId: "",
    });

    const [parameters, setParameters] = useState<Parameter[]>([
        { key: "ApiKey", value: "", isRequired: true },
    ]);


    if (!open) return null;

    const inputClass =
        "w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-button-bg focus:border-primary-button-bg bg-white dark:bg-[#111827] dark:text-white";

    const handleAddRow = () => {
        setParameters([
            ...parameters,
            { key: "", value: "", isRequired: true },
        ]);
    };



    const handleRemoveRow = (index: number) => {
        const updated = [...parameters];
        updated.splice(index, 1);
        setParameters(updated);
    };

    const handleSave = async () => {
        if (!form.providerName || !form.baseUrl) {
            Swal.fire("Error", "Please fill required fields", "error");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                procName: "ApiManager",
                Para: JSON.stringify({
                    ActionMode: isEdit ? "Update" : "Insert",
                    ProviderId: editData?.ProviderId,
                    ProviderType: form.providerType,   // ✅ ADD THIS
                    ProviderName: form.providerName,
                    BaseUrl: form.baseUrl,
                    SenderId: form.senderId,
                    CreatedBy: 1,
                    Parameters: JSON.stringify(
                        parameters.map(p => ({
                            ParamKey: p.key,
                            ParamValue: p.value,
                            IsRequired: p.isRequired,
                            IsEncrypted: false
                        }))
                    )
                }),
            };



            const res = await universalService(payload);
            const result = res?.data?.[0] || res?.[0] || res;

            if (result?.Status === "SUCCESS") {
                Swal.fire("Success", "Provider added successfully", "success");
                onSuccess();
                onClose();
            } else {
                Swal.fire("Error", result?.Message || "Insert failed", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error occurred", "error");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white dark:bg-[#0c1427] w-full max-w-3xl rounded-2xl shadow-2xl p-8 relative">

                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">
                            {isEdit ? "Edit Provider" : "Add Provider"}
                        </h3>

                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Provider Info Section */}
                <div className="bg-gray-50 dark:bg-[#111827] p-6 rounded-xl mb-6">

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs text-gray-500 mb-2 block">
                                Provider Type
                            </label>
                            <select
                                className={inputClass}
                                value={form.providerType}
                                onChange={(e) =>
                                    setForm({ ...form, providerType: e.target.value })
                                }
                            >
                                <option value="SMS">SMS</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Email">Email</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-2 block">
                                Provider Name
                            </label>
                            <input
                                className={inputClass}
                                value={form.providerName}
                                onChange={(e) =>
                                    setForm({ ...form, providerName: e.target.value })
                                }
                                placeholder="e.g. MSG91"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-2 block">
                                Base URL
                            </label>
                            <input
                                className={inputClass}
                                value={form.baseUrl}
                                onChange={(e) =>
                                    setForm({ ...form, baseUrl: e.target.value })
                                }
                                placeholder="https://api.provider.com"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-2 block">
                                Sender ID
                            </label>
                            <input
                                className={inputClass}
                                value={form.senderId}
                                onChange={(e) =>
                                    setForm({ ...form, senderId: e.target.value })
                                }
                                placeholder="Enter Sender ID"
                            />
                        </div>


                    </div>
                </div>

                {/* Parameters Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-5">
                        <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Parameters
                        </h5>

                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded-md text-xs transition-all"
                        >
                            <FaPlus />
                            Add Parameter
                        </button>
                    </div>
                    {/* Divider */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-3 -mx-6"></div>
                    {/* HEADER ROW */}
                    <div className="grid grid-cols-12 gap-4 mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">
                        <div className="col-span-4">Key</div>
                        <div className="col-span-5">Value</div>
                        <div className="col-span-2 text-center">Is Required</div>
                        <div className="col-span-1 text-center">Action</div>
                    </div>

                    {/* Divider */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-4 -mx-6"></div>
                    {/* PARAMETER ROWS */}
                    <div className="max-h-64 overflow-y-auto pr-2 space-y-4 custom-scrollbar">

                        {parameters.map((param, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-12 gap-4 items-center"
                            >
                                {/* Key */}
                                <div className="col-span-4 relative">
                                    <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                    <input
                                        placeholder="Enter Key"
                                        className={`${inputClass} pl-8`}
                                        value={param.key}
                                        onChange={(e) => {
                                            const updated = [...parameters];
                                            updated[index].key = e.target.value;
                                            setParameters(updated);
                                        }}
                                    />
                                </div>

                                {/* Value */}
                                <div className="col-span-5">
                                    <input
                                        placeholder="Enter Value"
                                        className={inputClass}
                                        value={param.value}
                                        onChange={(e) => {
                                            const updated = [...parameters];
                                            updated[index].value = e.target.value;
                                            setParameters(updated);
                                        }}
                                    />
                                </div>

                                {/* Toggle */}
                                <div className="col-span-2 flex justify-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={param.isRequired}
                                            onChange={() => {
                                                const updated = [...parameters];
                                                updated[index].isRequired = !updated[index].isRequired;
                                                setParameters(updated);
                                            }}
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
                                </div>

                                {/* Delete */}
                                <div className="col-span-1 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRow(index)}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg 
                hover:bg-red-100 text-red-500 transition-all"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Footer */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-all"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-primary-button-bg text-white text-sm hover:bg-primary-button-bg-hover transition-all disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Save Provider"}
                    </button>
                </div>
            </div>
        </div>
    );
}
