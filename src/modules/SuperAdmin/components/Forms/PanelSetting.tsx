"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  FaPencilAlt,
  FaPlus,
  FaSave,
  FaPalette,
  FaTimes,
  FaImage,
} from "react-icons/fa";
// Kept for internal library dependencies if needed, but UI uses SweetAlert
import { ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";

import { ApiService } from "../../../../services/ApiService";
import { PostService } from "../../../../services/PostService";
import { useSweetAlert } from "../../context/SweetAlertContext";
import CropperModal from "../Cropper/Croppermodel";
import TableSkeleton from "./TableSkeleton";

/* ======================================================
   TYPES
====================================================== */

type Theme = {
  PanelSettingId: number;
  ThemeName: string;
  SidebarColor: string;
  TextColor: string;
  HoverColor: string;
  Preference: boolean;
};

/* ======================================================
   STYLES & REUSABLE COMPONENTS
====================================================== */

const bigInputClasses =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 " +
  "placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all " +
  "bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  className,
}: any) => (
  <div className={`flex flex-col ${className} dark:text-gray-100`}>
    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={bigInputClasses}
    />
  </div>
);

const TextAreaField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  className,
}: any) => (
  <div className={`flex flex-col ${className} dark:text-gray-100`}>
    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <textarea
      name={name}
      rows={3}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`${bigInputClasses.replace("h-10", "h-auto")}`}
    />
  </div>
);

// Component: Combined Color Picker + Text Input
const ColorInputGroup = ({ label, name, value, onChange }: any) => (
  <div>
    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
      {label}
    </label>
    <div className="flex items-center gap-2">
      {/* Visual Picker */}
      <div className="relative w-12 h-10 flex-shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-700 shadow-sm">
        <input
          type="color"
          name={name}
          value={value}
          onChange={onChange}
          className="absolute -top-2 -left-2 w-20 h-20 cursor-pointer p-0 border-0"
        />
      </div>
      {/* Text Input for Copy/Paste */}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder="#000000"
        maxLength={7}
        className={`${bigInputClasses} uppercase font-mono`}
      />
    </div>
  </div>
);

/* ======================================================
   MAIN COMPONENT
====================================================== */

const PanelSettings: React.FC = () => {
  const { universalService } = ApiService();
  const { postDocument } = PostService();
  
  // Using the context provided by user
  // showAlert = Error (Icon: error)
  // ShowSuccessAlert = Success (Icon: success)
  // ShowConfirmAlert = Confirmation (Returns Promise<boolean>)
  const { ShowSuccessAlert, showAlert, ShowConfirmAlert } = useSweetAlert();

  const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

  /* ---------------- STATES ---------------- */

  const [tab, setTab] = useState(0);

  // Global Settings
  const [globalData, setGlobalData] = useState({
    Logo: "",
    SidebarHeader: "",
    FooterData: "",
  });

  // Theme list
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState<Theme | null>(null);

  // Logo upload
  const [rawImage, setRawImage] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ======================================================
     HELPERS
  ====================================================== */

  const getImageUrl = (file?: string) => {
    if (!file) return "";
    return `${IMAGE_PREVIEW_URL}${file}`;
  };

  /* ======================================================
     API CALLS
  ====================================================== */

  const loadGlobalSettings = async () => {
    try {
      const res = await universalService({
        procName: "PanelSetting",
        Para: JSON.stringify({ ActionMode: "GET_GLOBAL" }),
      });

      const data = res?.data?.[0] || res?.[0];
      if (data) {
        setGlobalData({
          Logo: data.Logo || "",
          SidebarHeader: data.SidebarHeader || "",
          FooterData: data.FooterData || "",
        });
      }
    } catch (err) {
      console.error("Global load error", err);
    }
  };

  const loadThemes = async () => {
    setLoading(true);
    try {
      const res = await universalService({
        procName: "PanelSetting",
        Para: JSON.stringify({ ActionMode: "LIST" }),
      });

      const raw = res?.data ?? res;

      if (Array.isArray(raw)) {
        setThemes(raw);
      } else if (Array.isArray(raw?.data)) {
        setThemes(raw.data);
      } else {
        setThemes([]);
      }
    } catch (err) {
      console.error("Theme load error", err);
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalSettings();
    loadThemes();
  }, []);

  /* ======================================================
     THEME TOGGLE LOGIC
  ====================================================== */

  const handleTogglePreference = async (themeId: number, currentStatus: boolean) => {
    if (currentStatus) return;

    // Async Confirmation
    const isConfirmed = await ShowConfirmAlert(
      "Activate Theme?",
      "Are you sure you want to switch to this theme? The page will reload."
    );

    if (isConfirmed) {
      try {
        // 1. Update DB
        await universalService({
          procName: "PanelSetting",
          Para: JSON.stringify({
            ActionMode: "SET_PREFERENCE",
            PanelSettingId: themeId,
            UserId: 1,
          }),
        });

        // 2. Fetch active theme
        const res = await universalService({
          procName: "PanelSetting",
          Para: JSON.stringify({ ActionMode: "GET_ACTIVE_THEME" }),
        });

        const activeTheme = res?.data?.[0] || res?.[0];
        if (activeTheme) {
          localStorage.setItem("PanelSetting", JSON.stringify(activeTheme));
        }

        // 3. HARD REFRESH 🔥
        window.location.reload();
      } catch (error) {
        console.error("Toggle error", error);
        showAlert("Error", "Failed to update preference.");
      }
    }
  };

  /* ======================================================
     LOGO UPLOAD
  ====================================================== */

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert("File too large", "Logo must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (base64Image: string) => {
    try {
      setLoadingLogo(true);
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const mime = blob.type;
      const ext = mime === "image/png" ? ".png" : ".jpg";
      const file = new File([blob], `panel_logo${ext}`, { type: mime });

      const fd = new FormData();
      fd.append("UploadedImage", file);
      fd.append("pagename", "EmpDoc");

      const response = await postDocument(fd);
      const fileName = response?.fileName || response?.Message;

      if (fileName) {
        setGlobalData((p) => ({ ...p, Logo: fileName }));
        // ---------------------------------------------------------
        // SILENT SUCCESS: No Alert here as requested
        // ---------------------------------------------------------
      } else {
        showAlert("Upload Failed", "No filename received from server.");
      }
    } catch (err) {
      console.error("Logo upload error", err);
      showAlert("Error", "Logo upload failed.");
    } finally {
      setLoadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    const isConfirmed = await ShowConfirmAlert(
      "Remove Logo?",
      "Are you sure you want to remove the current logo?"
    );

    if (isConfirmed) {
      setGlobalData((p) => ({ ...p, Logo: "" }));
      setRawImage("");
      ShowSuccessAlert("Logo removed successfully.");
    }
  };

  /* ======================================================
     DELETE THEME
  ====================================================== */

  const handleDeleteTheme = async (themeId: number) => {
    const isConfirmed = await ShowConfirmAlert(
      "Delete Theme?",
      "Are you sure you want to permanently delete this theme?"
    );

    if (isConfirmed) {
      try {
        await universalService({
          procName: "PanelSetting",
          Para: JSON.stringify({
            ActionMode: "DELETE",
            PanelSettingId: themeId,
            UserId: 1,
          }),
        });

        ShowSuccessAlert("Theme deleted successfully.");
        loadThemes(); // refresh list
      } catch (err) {
        console.error("Delete theme error", err);
        showAlert("Error", "Failed to delete theme.");
      }
    }
  };

  /* ======================================================
     SAVE GLOBAL SETTINGS
  ====================================================== */

  const handleSaveGlobalSettings = async () => {
    const isConfirmed = await ShowConfirmAlert(
      "Save Settings?",
      "Are you sure you want to save the global settings?"
    );

    if (isConfirmed) {
      try {
        await universalService({
          procName: "PanelSetting",
          Para: JSON.stringify({
            ActionMode: "UPDATE_GLOBAL",
            ...globalData,
            UserId: 1,
          }),
        });
        
        ShowSuccessAlert("Global settings saved.");
        setTimeout(() => {
           window.location.reload();
        }, 1500);
      } catch (err) {
        console.error("Save global error", err);
        showAlert("Error", "Failed to save settings.");
      }
    }
  };

  /* ======================================================
     TABS
  ====================================================== */

  const tabs = [
    { label: "Themes", icon: <FaPalette size={16} /> },
  ];

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="bg-white dark:bg-[#0c1427]  dark:text-gray-100 rounded-lg min-h-screen mb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="text-lg font-bold text-gray-800 dark:text-white">
          Theme Settings
        </div>

        <div className="flex gap-x-2">
          <button
            type="button"
            onClick={handleSaveGlobalSettings}
            className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <FaSave />
            Save Global Settings
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0c1427]  dark:text-gray-100 p-4 px-5 mt-2">
        {/* GLOBAL SETTINGS FORM */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
          {/* --- LEFT: LOGO SECTION --- */}
          <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
            <div className="relative w-36 h-36 group">
              <div className="w-full h-full rounded-xl border-[4px] border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
                {globalData.Logo || rawImage ? (
                  <img
                    src={rawImage || getImageUrl(globalData.Logo)}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaImage className="text-6xl text-gray-400 dark:text-gray-600" />
                )}
                {loadingLogo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {!loadingLogo && (
                <>
                  <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-primary-500 text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">
                    <FaPencilAlt size={14} />
                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={onLogoChange}
                    />
                  </label>
                  {(globalData.Logo || rawImage) && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 text-red-400 rounded-full shadow-lg cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-200 dark:border-gray-600"
                    >
                      <FaTimes size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* --- RIGHT: FORM FIELDS --- */}
          {/* <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Sidebar Header"
              name="SidebarHeader"
              placeholder="Enter Sidebar Header Text"
              value={globalData.SidebarHeader}
              onChange={(e: any) =>
                setGlobalData({ ...globalData, SidebarHeader: e.target.value })
              }
            />

            <TextAreaField
              label="Footer Text"
              name="FooterData"
              placeholder="Enter Footer Text"
              value={globalData.FooterData}
              onChange={(e: any) =>
                setGlobalData({ ...globalData, FooterData: e.target.value })
              }
              className="md:col-span-2"
            />
          </div> */}

           {/* --- RIGHT: FORM FIELDS --- */}
          <div className="w-full md:w-1/2 grid grid-cols-1 gap-5">
            <InputField
              label="Sidebar Header"
              name="SidebarHeader"
              placeholder="Enter Sidebar Header Text"
              value={globalData.SidebarHeader}
              onChange={(e: any) =>
                setGlobalData({ ...globalData, SidebarHeader: e.target.value })
              }
            />

            <TextAreaField
              label="Footer Text"
              name="FooterData"
              placeholder="Enter Footer Text"
              value={globalData.FooterData}
              onChange={(e: any) =>
                setGlobalData({ ...globalData, FooterData: e.target.value })
              }
            />
          </div>
        </div>

        {/* TABS */}
        <div className="mt-6 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
            {tabs.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTab(i)}
                className={`pb-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  tab === i
                    ? "border-b-2 border-primary-500 text-primary-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 0: THEMES */}
        {tab === 0 && (
          <div className="animate-fadeIn">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setIsEdit(false);
                  setEditData(null);
                  setOpenModal(true);
                }}
                className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <FaPlus size={12} />
                Add Theme
              </button>
            </div>

            {loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Theme Name
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                        Sidebar
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                        Text
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                        Hover
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                        Preference
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#0c1427]  divide-y divide-gray-100 dark:divide-gray-700">
                    {Array.isArray(themes) && themes.length > 0 ? (
                      themes.map((t) => (
                        <tr
                          key={t.PanelSettingId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">
                            {t.ThemeName}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 mx-auto shadow-sm"
                              style={{ background: t.SidebarColor }}
                              title={t.SidebarColor}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 mx-auto shadow-sm"
                              style={{ background: t.TextColor }}
                              title={t.TextColor}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 mx-auto shadow-sm"
                              style={{ background: t.HoverColor }}
                              title={t.HoverColor}
                            />
                          </td>
                          {/* TOGGLE SWITCH */}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleTogglePreference(
                                  t.PanelSettingId,
                                  t.Preference
                                )
                              }
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                                t.Preference
                                  ? "bg-primary-500"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                              role="switch"
                              aria-checked={t.Preference}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  t.Preference
                                    ? "translate-x-5"
                                    : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-end gap-3">
                              {/* EDIT */}
                              <button
                                onClick={() => {
                                  setIsEdit(true);
                                  setEditData(t);
                                  setOpenModal(true);
                                }}
                                className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center gap-1"
                              >
                                <FaPencilAlt size={12} />
                              </button>

                              {/* DELETE */}
                              <button
                                onClick={() =>
                                  handleDeleteTheme(t.PanelSettingId)
                                }
                                className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
                              >
                                <FaTimes size={12} /> 
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm"
                        >
                          No themes found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-[#0c1427]  p-6 text-left align-middle shadow-xl transition-all border dark:border-gray-700">
              <DialogTitle
                as="h3"
                className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2"
              >
                {isEdit ? "Edit Theme" : "Add New Theme"}
              </DialogTitle>

              <Formik
                initialValues={{
                  ThemeName: editData?.ThemeName || "",
                  SidebarColor: editData?.SidebarColor || "#1E293B",
                  TextColor: editData?.TextColor || "#FFFFFF",
                  HoverColor: editData?.HoverColor || "#F3F4F6",
                }}
                validationSchema={Yup.object({
                  ThemeName: Yup.string().required("Theme name required"),
                })}
                onSubmit={async (v) => {
                  const isConfirmed = await ShowConfirmAlert(
                    isEdit ? "Update Theme?" : "Save New Theme?",
                    "Are you sure you want to proceed?"
                  );

                  if (isConfirmed) {
                    try {
                      await universalService({
                        procName: "PanelSetting",
                        Para: JSON.stringify({
                          ActionMode: isEdit ? "UPDATE" : "INSERT",
                          PanelSettingId: editData?.PanelSettingId,

                          // 🔹 THEME FIELDS
                          ThemeName: v.ThemeName,
                          SidebarColor: v.SidebarColor,
                          TextColor: v.TextColor,
                          HoverColor: v.HoverColor,

                          // 🔹 PRESERVE GLOBAL SETTINGS (IMPORTANT)
                          Logo: globalData.Logo,
                          SidebarHeader: globalData.SidebarHeader,
                          FooterData: globalData.FooterData,

                          UserId: 1,
                          // Optional: if your API needs these, keep them. Otherwise, they are handled by Global settings.
                          // Usually INSERT needs all fields to avoid nulls if your SP requires them.
                        }),
                      });

                      setOpenModal(false);
                      ShowSuccessAlert(
                        isEdit
                          ? "Theme updated successfully."
                          : "Theme added successfully."
                      );
                      loadThemes();
                    } catch (err) {
                      console.error("Theme save error", err);
                      showAlert("Error", "Failed to save theme.");
                    }
                  }
                }}
              >
                {({ values, handleChange }) => (
                  <Form className="space-y-4">
                    <InputField
                      label="Theme Name"
                      name="ThemeName"
                      placeholder="e.g. Dark Blue"
                      value={values.ThemeName}
                      onChange={handleChange}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <ColorInputGroup
                        label="Sidebar Color"
                        name="SidebarColor"
                        value={values.SidebarColor}
                        onChange={handleChange}
                      />

                      <ColorInputGroup
                        label="Text Color"
                        name="TextColor"
                        value={values.TextColor}
                        onChange={handleChange}
                      />

                      <ColorInputGroup
                        label="Hover Color"
                        name="HoverColor"
                        value={values.HoverColor}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                      <button
                        type="button"
                        onClick={() => setOpenModal(false)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition shadow-sm"
                      >
                        {isEdit ? "Update Theme" : "Save Theme"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <CropperModal
        open={showCropper}
        image={rawImage}
        aspectRatio={1}
        onClose={() => setShowCropper(false)}
        onCrop={(img) => {
          uploadLogo(img);
          setShowCropper(false);
        }}
      />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PanelSettings;