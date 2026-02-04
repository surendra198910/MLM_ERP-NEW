"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from "@headlessui/react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
    FaPlus,
    FaPencilAlt,
    FaTimes,
    FaPalette,
} from "react-icons/fa";
import { ApiService } from "../../../../services/ApiService";
import { useSweetAlert } from "../../context/SweetAlertContext";
import TableSkeleton from "./TableSkeleton";

/* ======================================================
   TYPES
====================================================== */

type ThemeRow = {
    ThemeId: number;
    ThemeName: string;
    ThemeJson: string;
    IsActive: boolean;
};

/* ======================================================
   VALIDATION
====================================================== */

const ThemeSchema = Yup.object({
    ThemeName: Yup.string().required("Theme name is required"),

});
const ColorField = ({ label, name, value, onChange }: any) => (
    <div>
        <label className="text-xs text-gray-600 dark:text-gray-300">
            {label}
        </label>
        <div className="flex gap-2 items-center">
            <input
                type="color"
                name={name}
                value={value}
                onChange={onChange}
                className="w-10 h-9 border rounded"
            />
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="w-full border rounded px-2 py-1 text-xs font-mono uppercase"
            />
        </div>
    </div>
);

/* ======================================================
   MAIN COMPONENT
====================================================== */

const PanelSettings: React.FC = () => {
    const { universalService } = ApiService();
    const { ShowSuccessAlert, showAlert, ShowConfirmAlert } = useSweetAlert();

    const [themes, setThemes] = useState<ThemeRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editData, setEditData] = useState<ThemeRow | null>(null);

    /* ======================================================
       LOAD THEMES
    ====================================================== */

    const loadThemes = async () => {
        setLoading(true);
        try {
            const res = await universalService({
                procName: "AppThemeMaster",
                Para: JSON.stringify({ ActionMode: "List" }),
            });

            const data = res?.data ?? res ?? [];
            setThemes(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setThemes([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadThemes();
    }, []);

    /* ======================================================
       ACTIVATE THEME
    ====================================================== */

    const activateTheme = async (ThemeId: number) => {
        const ok = await ShowConfirmAlert(
            "Activate Theme?",
            "This will immediately apply the theme."
        );

        if (!ok) return;

        try {
            await universalService({
                procName: "AppThemeMaster",
                Para: JSON.stringify({
                    ActionMode: "Activate",
                    ThemeId,
                    EntryBy: 1,
                }),
            });

            ShowSuccessAlert("Theme activated successfully");
            loadThemes();
            window.location.reload();
        } catch {
            showAlert("Error", "Failed to activate theme");
        }
    };

    /* ======================================================
       DELETE THEME
    ====================================================== */

    const deleteTheme = async (ThemeId: number) => {
        const ok = await ShowConfirmAlert(
            "Delete Theme?",
            "This action cannot be undone."
        );

        if (!ok) return;

        try {
            await universalService({
                procName: "AppThemeMaster",
                Para: JSON.stringify({
                    ActionMode: "Delete",
                    ThemeId,
                }),
            });

            ShowSuccessAlert("Theme deleted");
            loadThemes();
        } catch {
            showAlert("Error", "Delete failed");
        }
    };

    /* ======================================================
       RENDER
    ====================================================== */
    const getInitialThemeValues = () => {
        if (!isEdit || !editData) {
            return {
                ThemeName: "",
                primary50: "#fee2e2",
                primary500: "#dc2626",
                primary600: "#b91c1c",
                secondary500: "#ef4444",
                success500: "#16a34a",
                warning500: "#f59e0b",
                danger500: "#dc2626",
                info500: "#38bdf8",
            };
        }

        try {
            const json = JSON.parse(editData.ThemeJson);

            return {
                ThemeName: editData.ThemeName,
                primary50: json?.primary?.["50"] ?? "#fee2e2",
                primary500: json?.primary?.["500"] ?? "#dc2626",
                primary600: json?.primary?.["600"] ?? "#b91c1c",
                secondary500: json?.secondary?.["500"] ?? "#ef4444",
                success500: json?.success?.["500"] ?? "#16a34a",
                warning500: json?.warning?.["500"] ?? "#f59e0b",
                danger500: json?.danger?.["500"] ?? "#dc2626",
                info500: json?.info?.["500"] ?? "#38bdf8",
            };
        } catch (e) {
            console.error("Invalid ThemeJson", e);
            return {
                ThemeName: editData.ThemeName || "",
            };
        }
    };

    return (
        <div className="bg-white dark:bg-[#0c1427] rounded-lg min-h-screen p-6">
            {/* HEADER */}
            <div className="flex justify-between mb-4">
                <h2 className=" font-bold flex items-center gap-2 text-primary-500 text-lg">
                    <FaPalette className="text-primary-500" /> Theme Management
                </h2>

                <button
                    onClick={() => {
                        setIsEdit(false);
                        setEditData(null);
                        setOpenModal(true);
                    }}
                    className="px-4 py-2 bg-primary-500 text-white rounded text-sm flex items-center gap-2"
                >
                    <FaPlus /> Add Theme
                </button>
            </div>

            {/* TABLE */}
            {loading ? (
                <TableSkeleton rows={5} columns={4} />
            ) : (
                <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="p-3 text-left">Theme</th>
                                <th className="p-3 text-center">Table Header</th>
                                <th className="p-3 text-center">Sidebar / Button</th>
                                <th className="p-3 text-center">Hover</th>
                                <th className="p-3 text-center">Active</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {themes.map((t) => {
                                let tableHeader = "#ccc";
                                let sidebar = "#ccc";
                                let hover = "#ccc";

                                try {
                                    const json = JSON.parse(t.ThemeJson);

                                    tableHeader = json?.primary?.["50"] || tableHeader;
                                    sidebar = json?.primary?.["500"] || sidebar;
                                    hover = json?.primary?.["600"] || hover;
                                } catch (e) {
                                    console.warn("Invalid theme JSON:", t.ThemeName);
                                }

                                return (
                                    <tr key={t.ThemeId} className="border-t">
                                        <td className="p-3 font-medium">{t.ThemeName}</td>

                                        {/* TABLE HEADER COLOR */}
                                        <td className="p-3 text-center">
                                            <div
                                                className="w-6 h-6 rounded-full mx-auto border"
                                                style={{ background: tableHeader }}
                                                title={tableHeader}
                                            />
                                        </td>

                                        {/* SIDEBAR / BUTTON COLOR */}
                                        <td className="p-3 text-center">
                                            <div
                                                className="w-6 h-6 rounded-full mx-auto border"
                                                style={{ background: sidebar }}
                                                title={sidebar}
                                            />
                                        </td>

                                        {/* HOVER COLOR */}
                                        <td className="p-3 text-center">
                                            <div
                                                className="w-6 h-6 rounded-full mx-auto border"
                                                style={{ background: hover }}
                                                title={hover}
                                            />
                                        </td>

                                        {/* ACTIVE */}
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => !t.IsActive && activateTheme(t.ThemeId)}
                                                className={`px-3 py-1 rounded text-xs ${t.IsActive
                                                    ? "bg-primary-500 text-white"
                                                    : "bg-gray-200 dark:bg-gray-700"
                                                    }`}
                                            >
                                                {t.IsActive ? "Active" : "Activate"}
                                            </button>
                                        </td>

                                        {/* ACTION */}
                                        <td className="p-3 text-right flex gap-3 justify-end">
                                            <button
                                                onClick={() => {
                                                    setIsEdit(true);
                                                    setEditData(t);
                                                    setOpenModal(true);
                                                }}
                                                className="text-primary-500"
                                            >
                                                <FaPencilAlt />
                                            </button>

                                            <button
                                                onClick={() => deleteTheme(t.ThemeId)}
                                                className="text-red-500"
                                            >
                                                <FaTimes />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} className="relative z-50">
                <DialogBackdrop className="fixed inset-0 bg-black/40" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="bg-white dark:bg-[#0c1427] w-full max-w-lg rounded p-6">
                        <DialogTitle className="font-bold mb-4">
                            {isEdit ? "Edit Theme" : "Add Theme"}
                        </DialogTitle>

                        <Formik
                            enableReinitialize
                            initialValues={getInitialThemeValues()}
                            validationSchema={ThemeSchema}
                            onSubmit={async (v) => {
                                const themeJson = {
                                    fontBody: "Inter",
                                    darkModeDefault: true,
                                    primary: {
                                        "50": v.primary50,
                                        "500": v.primary500,
                                        "600": v.primary600,
                                    },
                                    secondary: { "500": v.secondary500 },
                                    success: { "500": v.success500 },
                                    warning: { "500": v.warning500 },
                                    danger: { "500": v.danger500 },
                                    info: { "500": v.info500 },
                                };

                                try {
                                    await universalService({
                                        procName: "AppThemeMaster",
                                        Para: JSON.stringify({
                                            ActionMode: isEdit ? "Update" : "Insert",
                                            ThemeId: editData?.ThemeId,
                                            ThemeName: v.ThemeName,
                                            ThemeJson: JSON.stringify(themeJson, null, 2),
                                            EntryBy: 1,
                                        }),
                                    });

                                    ShowSuccessAlert("Theme saved successfully");
                                    setOpenModal(false);

                                    /* ✅ FORCE FULL THEME APPLY */
                                    window.location.reload();

                                } catch {
                                    showAlert("Error", "Save failed");
                                }
                            }}

                        >
                            {({ values, handleChange, errors }) => (
                                <Form className="space-y-4">
                                    <input
                                        name="ThemeName"
                                        value={values.ThemeName}
                                        onChange={handleChange}
                                        placeholder="Theme name"
                                        className="w-full border rounded p-2"
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <ColorField label="Table Header" name="primary50" value={values.primary50} onChange={handleChange} />
                                        <ColorField label="Sidebar/Buttons" name="primary500" value={values.primary500} onChange={handleChange} />
                                        <ColorField label="Hover Color" name="primary600" value={values.primary600} onChange={handleChange} />

                                        <ColorField label="Secondary Color" name="secondary500" value={values.secondary500} onChange={handleChange} />
                                        <ColorField label="Success 500" name="success500" value={values.success500} onChange={handleChange} />
                                        <ColorField label="Warning 500" name="warning500" value={values.warning500} onChange={handleChange} />
                                        <ColorField label="Danger 500" name="danger500" value={values.danger500} onChange={handleChange} />
                                        <ColorField label="Info 500" name="info500" value={values.info500} onChange={handleChange} />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setOpenModal(false)}
                                            className="px-4 py-2 bg-gray-200 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-primary-500 text-white rounded"
                                        >
                                            Save Theme
                                        </button>
                                    </div>
                                </Form>

                            )}
                        </Formik>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
};

export default PanelSettings;
