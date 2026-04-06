"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
    Switch,
} from "@headlessui/react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
    FaPencilAlt,
    FaPlus,
    FaTimes,
    FaPalette,
    FaSave,
    FaFont,
} from "react-icons/fa";

import { ApiService } from "../../../../services/ApiService";
import { useSweetAlert } from "../../context/SweetAlertContext";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation } from "react-router-dom";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";

/* ================= COMPONENT ================= */

const ThemeSettings = () => {
    const { universalService } = ApiService();
    const { ShowSuccessAlert, ShowConfirmAlert } = useSweetAlert();

    const [themes, setThemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const location = useLocation();
    const formName = location.pathname.split("/").pop();
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);

    const loadThemes = async () => {
        setLoading(true);
        try {
            const res = await universalService({ procName: "MemberTheme", Para: JSON.stringify({ ActionMode: "List" }) });
            const data = Array.isArray(res) ? res : res?.data || [];
            const mapped = data.map((t: any) => ({
                ...t,
                Config: t.ThemeJson ? JSON.parse(t.ThemeJson) : {}
            }));
            setThemes(mapped);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadThemes(); setPermissionsLoading(false); }, []);

    const handleToggleActivate = async (theme: any) => {
        if (theme.IsActive) return; // Already active

        const confirmed = await ShowConfirmAlert(
            "Activate Theme?",
            `Are you sure you want to activate "${theme.ThemeName}"? This will apply to the entire system.`
        );

        if (confirmed) {
            try {
                await universalService({
                    procName: "MemberTheme",
                    Para: JSON.stringify({
                        ActionMode: "Activate",
                        ThemeId: theme.ThemeId,
                        EntryBy: 1,
                    }),
                });
                ShowSuccessAlert("Theme Activated Successfully");
                loadThemes();
            } catch (error) {
                console.error("Activation failed", error);
            }
        }
    };

    const saveTheme = async (values: any) => {
        const themePayload = {
            primary: { start: values.primaryStart, end: values.primaryEnd },
            sidebar: { bg: values.sidebarBg, text: values.sidebarText },
            header: { bg: values.headerBg, iconBg: values.headerIconBg, iconColor: values.headerIconColor },
            body: { bg: values.bodyBg, text: values.bodyText },
            card: { bg: values.cardBg, text: values.cardText, border: values.cardBorder },
            button: {
                start: values.btnStart,
                end: values.btnEnd,
                text: values.btnText,
                hoverBg: values.btnHoverBg,
                hoverText: values.btnHoverText
            },
            darkModeDefault: values.darkModeDefault,
            fontBody: values.fontBody,
        };

        await universalService({
            procName: "MemberTheme",
            Para: JSON.stringify({
                ActionMode: isEdit ? "Update" : "Insert",
                ThemeId: editData?.ThemeId || 0,
                ThemeName: values.ThemeName,
                ThemeJson: JSON.stringify(themePayload),
                EntryBy: 1,
            }),
        });

        ShowSuccessAlert("Theme configuration saved");
        setOpenModal(false);
        loadThemes();
    };

    if (permissionsLoading) return <Loader />;

    return (
        <div className="bg-white dark:bg-[#0c1427]  dark:text-gray-100 rounded-lg min-h-screen mb-10">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4 mb-1">
                <div className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FaPalette className="text-blue-600" /> Theme Settings
                </div>

                <div className="flex gap-x-2">
                    <PermissionAwareTooltip
                        allowed={SmartActions.canAdd(formName)}
                        allowedText="Add New Theme"
                    >
                        <button
                            type="button"
                            // disabled={!SmartActions.canAdd(formName)}
                            onClick={() => {
                                setIsEdit(false);
                                setEditData(null);
                                setOpenModal(true);
                            }}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                        >
                            <FaPlus size={12} />
                            Add New Theme
                        </button>
                    </PermissionAwareTooltip>
                </div>
            </div>

            {/* TABLE SUMMARY */}
            {/* PROFESSIONAL TABLE WITH DETAILED HEADERS */}
            <div className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 text-[10px] font-black uppercase text-gray-500 tracking-widest w-40">Theme Name</th>
                            <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                <div className="flex gap-x-6 items-center">
                                    <span className="w-16 text-blue-600">Primary</span>
                                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                                        <span className="w-10">Side-BG</span>
                                        <span className="w-10">Side-Txt</span>
                                    </div>
                                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                                        <span className="w-10">Head-BG</span>
                                        <span className="w-10">Head-Icon</span>
                                    </div>
                                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                                        <span className="w-10">Body-BG</span>
                                        <span className="w-10">Body-Txt</span>
                                    </div>
                                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                                        <span className="w-10">Btn-BG</span>
                                        <span className="w-10">Btn-Hvr</span>
                                    </div>
                                </div>
                            </th>
                            <th className="p-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center w-28">Status</th>
                            <th className="p-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center w-20">Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {themes.map((t) => (
                            <tr key={t.ThemeId} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                <td className="p-4">
                                    <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">{t.ThemeName}</div>
                                    <div className="text-[9px] text-gray-400 font-mono mt-0.5">ID: {t.ThemeId}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-x-6 items-center">
                                        {/* Primary Gradient */}
                                        <div className="w-16">
                                            <div className="w-full h-4 rounded shadow-inner border border-white dark:border-gray-700"
                                                style={{ background: `linear-gradient(90deg, ${t.Config.primary?.start}, ${t.Config.primary?.end})` }} />
                                        </div>

                                        {/* Sidebar Group */}
                                        <div className="flex gap-x-2 pl-6">
                                            <MiniChip color={t.Config.sidebar?.bg} />
                                            <MiniChip color={t.Config.sidebar?.text} />
                                        </div>

                                        {/* Header Group */}
                                        <div className="flex gap-x-2 pl-6">
                                            <MiniChip color={t.Config.header?.bg} />
                                            <MiniChip color={t.Config.header?.iconColor} />
                                        </div>

                                        {/* Body Group */}
                                        <div className="flex gap-x-2 pl-6">
                                            <MiniChip color={t.Config.body?.bg} />
                                            <MiniChip color={t.Config.body?.text} />
                                        </div>

                                        {/* Button Group */}
                                        <div className="flex gap-x-2 pl-6">
                                            <MiniChip color={t.Config.button?.start} />
                                            <MiniChip color={t.Config.button?.hoverBg} />
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <Switch
                                            checked={t.IsActive}
                                            onChange={() => handleToggleActivate(t)}
                                            className={`${t.IsActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'} relative inline-flex h-5 w-10 items-center rounded-full transition-all outline-none`}
                                        >
                                            <span className={`${t.IsActive ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                                        </Switch>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => { setIsEdit(true); setEditData(t); setOpenModal(true); }}
                                        className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-100 dark:border-blue-900">
                                        <FaPencilAlt size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} className="relative z-50">
                <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-2">
                    <DialogPanel className="bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden border dark:border-gray-800 flex flex-col max-h-[92vh]">

                        <div className="px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <DialogTitle className="text-lg font-bold dark:text-white flex items-center gap-2 uppercase tracking-tight">
                                <FaPalette className="text-blue-500" /> {isEdit ? "Update Theme Designer" : "Create New Theme Architecture"}
                            </DialogTitle>
                            <button onClick={() => setOpenModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><FaTimes size={20} /></button>
                        </div>

                        <Formik
                            initialValues={{
                                ThemeName: editData?.ThemeName || "",
                                primaryStart: editData?.Config?.primary?.start || "#d4af37",
                                primaryEnd: editData?.Config?.primary?.end || "#b8962e",
                                sidebarBg: editData?.Config?.sidebar?.bg || "#b7b3b3",
                                sidebarText: editData?.Config?.sidebar?.text || "#00eb52",
                                headerBg: editData?.Config?.header?.bg || "#121212",
                                headerIconBg: editData?.Config?.header?.iconBg || "#1f1f1f",
                                headerIconColor: editData?.Config?.header?.iconColor || "#d4af37",
                                bodyBg: editData?.Config?.body?.bg || "#dedede",
                                bodyText: editData?.Config?.body?.text || "#000000",
                                cardBg: editData?.Config?.card?.bg || "#ffffff",
                                cardText: editData?.Config?.card?.text || "#121212",
                                cardBorder: editData?.Config?.card?.border || "#2a2a2a",
                                btnStart: editData?.Config?.button?.start || "#d4af37",
                                btnEnd: editData?.Config?.button?.end || "#b8962e",
                                btnText: editData?.Config?.button?.text || "#000000",
                                btnHoverBg: editData?.Config?.button?.hoverBg || "#f5d76e",
                                btnHoverText: editData?.Config?.button?.hoverText || "#000000",
                                darkModeDefault: editData?.Config?.darkModeDefault || false,
                                fontBody: editData?.Config?.fontBody || "Inter",
                            }}
                            onSubmit={saveTheme}
                        >
                            {({ values, handleChange }) => (
                                <Form className="flex flex-col overflow-hidden">
                                    <div className="p-6 space-y-6 overflow-y-auto bg-gray-50/30 dark:bg-transparent">

                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex items-center gap-6">
                                            <label className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest whitespace-nowrap">Unique Theme Name</label>
                                            <Field name="ThemeName" placeholder="E.g. Modern Professional" className="flex-1 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 py-1 dark:text-white text-sm font-bold transition-all" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <CompactSection title="1. Branding">
                                                <ColorInput label="Brand Start" name="primaryStart" value={values.primaryStart} onChange={handleChange} />
                                                <ColorInput label="Brand End" name="primaryEnd" value={values.primaryEnd} onChange={handleChange} />
                                                <div className="h-8 w-full mt-3 rounded-lg border dark:border-gray-600 shadow-inner" style={{ background: `linear-gradient(90deg, ${values.primaryStart}, ${values.primaryEnd})` }} />
                                            </CompactSection>

                                            <CompactSection title="2. Layout Bars">
                                                <ColorInput label="Sidebar Bg" name="sidebarBg" value={values.sidebarBg} onChange={handleChange} />
                                                <ColorInput label="Sidebar Icons" name="sidebarText" value={values.sidebarText} onChange={handleChange} />
                                                <ColorInput label="Header Bg" name="headerBg" value={values.headerBg} onChange={handleChange} />
                                            </CompactSection>

                                            <CompactSection title="3. Workspace">
                                                <ColorInput label="Global Bg" name="bodyBg" value={values.bodyBg} onChange={handleChange} />
                                                <ColorInput label="Card Surface" name="cardBg" value={values.cardBg} onChange={handleChange} />
                                                <ColorInput label="Card Stroke" name="cardBorder" value={values.cardBorder} onChange={handleChange} />
                                            </CompactSection>

                                            <CompactSection title="4. Button Style">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <ColorInput label="Btn Start" name="btnStart" value={values.btnStart} onChange={handleChange} />
                                                    <ColorInput label="Btn End" name="btnEnd" value={values.btnEnd} onChange={handleChange} />
                                                </div>
                                                <ColorInput label="Label Color" name="btnText" value={values.btnText} onChange={handleChange} />
                                                <div className="mt-3 text-[10px] text-center p-2 rounded-lg font-black border dark:border-gray-700 shadow-md" style={{ background: `linear-gradient(to right, ${values.btnStart}, ${values.btnEnd})`, color: values.btnText }}>PREVIEW</div>
                                            </CompactSection>

                                            <CompactSection title="5. Button Hover">
                                                <ColorInput label="Hover Fill" name="btnHoverBg" value={values.btnHoverBg} onChange={handleChange} />
                                                <ColorInput label="Hover Label" name="btnHoverText" value={values.btnHoverText} onChange={handleChange} />
                                                <div className="mt-3 text-[10px] text-center p-2 rounded-lg font-black border dark:border-gray-700 shadow-lg" style={{ backgroundColor: values.btnHoverBg, color: values.btnHoverText }}>HOVER STATE</div>
                                            </CompactSection>

                                            <CompactSection title="6. Iconography">
                                                <ColorInput label="Icon Bubble" name="headerIconBg" value={values.headerIconBg} onChange={handleChange} />
                                                <ColorInput label="Icon Tint" name="headerIconColor" value={values.headerIconColor} onChange={handleChange} />
                                            </CompactSection>

                                            <CompactSection title="7. Typography">
    <div className="space-y-4">
        <ColorInput label="Main Text" name="bodyText" value={values.bodyText} onChange={handleChange} />
        <ColorInput label="Card Text" name="cardText" value={values.cardText} onChange={handleChange} />
        
        {/* FONT FAMILY DROPDOWN */}
        <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Font Family</label>
            <div className="flex items-center border-2 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden h-8 group focus-within:border-blue-500/50 transition-all">
                <div className="pl-2 pr-1 text-gray-400">
                    <FaFont size={10} />
                </div>
                <Field
                    as="select"
                    name="fontBody"
                    className="flex-1 bg-transparent text-[10px] font-bold outline-none dark:text-white cursor-pointer pr-1 appearance-none"
                >
                    <option value="Inter" className="dark:bg-gray-800">Inter (Modern)</option>
                    <option value="Outfit" className="dark:bg-gray-800">Outfit (Modern)</option>
                    <option value="Roboto" className="dark:bg-gray-800">Roboto (Clean)</option>
                    <option value="Poppins" className="dark:bg-gray-800">Poppins (Friendly)</option>
                    <option value="Montserrat" className="dark:bg-gray-800">Montserrat (Bold)</option>
                    <option value="Open Sans" className="dark:bg-gray-800">Open Sans</option>
                    <option value="Lato" className="dark:bg-gray-800">Lato</option>
                </Field>
                {/* Custom arrow for the select */}
                <div className="pr-2 pointer-events-none text-gray-400">
                    <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
            </div>
        </div>
    </div>
</CompactSection>

                                            <CompactSection title="8. Global Config">
                                                <div className="space-y-3">
                                                    {/* FONT SELECTION DROPDOWN */}
                                                    {/* <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">System Typography</label>
                                                        <div className="flex items-center border-2 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden h-10 transition-all focus-within:border-blue-500/50">
                                                            <div className="pl-3 pr-2 text-gray-400">
                                                                <FaFont size={12} />
                                                            </div>
                                                            <Field
                                                                as="select"
                                                                name="fontBody"
                                                                className="flex-1 bg-transparent text-[11px] font-bold outline-none dark:text-white cursor-pointer pr-2"
                                                            >
                                                                <option value="Inter">Inter (Default)</option>
                                                                <option value="Roboto">Roboto</option>
                                                                <option value="Poppins">Poppins</option>
                                                                <option value="Montserrat">Montserrat</option>
                                                                <option value="Open Sans">Open Sans</option>
                                                                <option value="Lato">Lato</option>
                                                            </Field>
                                                        </div>
                                                    </div> */}

                                                    {/* DARK MODE TOGGLE */}
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border dark:border-gray-700 mt-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-tighter">Interface Style</span>
                                                            <span className="text-[8px] text-gray-400 uppercase">Dark Mode Default</span>
                                                        </div>
                                                        <Switch
                                                            checked={values.darkModeDefault}
                                                            onChange={(val) => handleChange({ target: { name: 'darkModeDefault', value: val } })}
                                                            className={`${values.darkModeDefault ? 'bg-blue-600 shadow-blue-500/40' : 'bg-gray-300 dark:bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-all outline-none shadow-inner`}
                                                        >
                                                            <span className={`${values.darkModeDefault ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md`} />
                                                        </Switch>
                                                    </div>
                                                </div>
                                            </CompactSection>
                                        </div>
                                    </div>

                                    <div className="px-8 py-4 border-t dark:border-gray-800 flex justify-end gap-4 bg-white dark:bg-gray-900">
                                        <button type="button" onClick={() => setOpenModal(false)} className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Cancel Changes</button>
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl shadow-blue-500/30 active:scale-95 transition-all">
                                            <FaSave /> Commit Theme Settings
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

/* --- UI HELPERS --- */
const CompactSection = ({ title, children }: any) => (
    <div className="p-4 border dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800/20 shadow-sm hover:shadow-md transition-shadow">
        <h6 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] mb-3 border-b dark:border-gray-700 pb-2">{title}</h6>
        <div className="space-y-3">{children}</div>
    </div>
);

const ColorInput = ({ label, name, value, onChange, textOnly = false }: any) => (
    <div className="flex flex-col gap-1">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight">{label}</label>
        <div className="flex items-center border-2 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden h-8 group focus-within:border-blue-500/50 transition-all">
            {!textOnly && <input type="color" name={name} value={value} onChange={onChange} className="w-7 h-full cursor-pointer border-none p-0 bg-transparent" />}
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="flex-1 text-[10px] px-2 font-mono outline-none dark:text-white bg-transparent uppercase font-bold"
            />
        </div>
    </div>
);

const MiniChip = ({ color }: { color: string }) => (
    <div className="w-10 flex justify-center">
        <div 
            className="w-5 h-5 rounded-md shadow-sm border border-white dark:border-gray-700 transition-transform group-hover:scale-110" 
            style={{ backgroundColor: color || '#ccc' }} 
            title={color}
        />
    </div>
);

export default ThemeSettings;