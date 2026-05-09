"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Switch,
} from "@headlessui/react";
import { Formik, Form, Field, validateYupSchema, ErrorMessage } from "formik";
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
  const basicSchema = Yup.object().shape({
    ThemeName: Yup.string().required("Theme Name is Required"),
  });
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

  const fetchFormPermissions = async () => {
    try {
      setPermissionsLoading(true);

      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "GetForms",
          FormName: formName, // 👈 category for this page
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

      if (
        !pagePermission ||
        !pagePermission.Action ||
        pagePermission.Action.trim() === ""
      ) {
        setHasPageAccess(false);
        return;
      }

      // ✅ Permission allowed → load SmartActions
      SmartActions.load(data);
      setHasPageAccess(true);
    } catch (error) {
      console.error("Form permission fetch failed:", error);
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchFormPermissions();
  }, []);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const res = await universalService({
        procName: "MemberTheme",
        Para: JSON.stringify({ ActionMode: "List" }),
      });
      const data = Array.isArray(res) ? res : res?.data || [];
      const mapped = data.map((t: any) => ({
        ...t,
        Config: t.ThemeJson ? JSON.parse(t.ThemeJson) : {},
      }));
      setThemes(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
    setPermissionsLoading(false);
  }, []);

  const handleToggleActivate = async (theme: any) => {
    if (theme.IsActive) return; // Already active

    const confirmed = await ShowConfirmAlert(
      "Activate Theme?",
      `Are you sure you want to activate "${theme.ThemeName}"? This will apply to the entire system.`,
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

  const saveTheme = async (values, { setFieldError }) => {
    
    if (values.ThemeName == "" || values.ThemeName.trim() == "") {
      setFieldError("ThemeName", "Theme Name is required");
      return;
    }
    const themePayload = {
      primary: { start: values.primaryStart, end: values.primaryEnd },
      sidebar: { bg: values.sidebarBg, text: values.sidebarText },
      header: {
        bg: values.headerBg,
        iconBg: values.headerIconBg,
        iconColor: values.headerIconColor,
      },
      body: { bg: values.bodyBg, text: values.bodyText },
      card: {
        bg: values.cardBg,
        text: values.cardText,
        border: values.cardBorder,
      },
      button: {
        start: values.btnStart,
        end: values.btnEnd,
        text: values.btnText,
        hoverBg: values.btnHoverBg,
        hoverText: values.btnHoverText,
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
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      <div className="bg-white dark:bg-[#0c1427]  dark:text-gray-100 rounded-lg min-h-screen mb-10">
        <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
          <div className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaPalette className="text-blue-600" /> Member Panel Theme Settings
          </div>

          <div className="flex gap-x-2">
            <PermissionAwareTooltip
              allowed={SmartActions.canAdd(formName)}
              allowedText="Add New Theme"
            >
              <button
                type="button"
                disabled={!SmartActions.canAdd(formName)}
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

        {/* <div className="w-full flex flex-col md:flex-row gap-5 items-end">

            
                    <div className="flex flex-col w-full md:w-[45%]">
                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            Sidebar Header
                        </label>
                        <input
                            type="text"
                            name="SidebarHeader"
                            placeholder="Enter Sidebar Header Text"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 
      bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      transition duration-200"
                        />
                    </div>

                  
                    <div className="flex flex-col w-full md:w-[45%]">
                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            Footer Text
                        </label>
                        <textarea
                            name="FooterData"
                            placeholder="Enter Footer Text"
                            rows={1}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 
      bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      transition duration-200 resize-none"
                        />
                    </div>

                    <div className="w-full md:w-[10%] flex items-end">
                        <button
                            className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 
    text-white text-sm font-medium transition duration-200 
    shadow-sm hover:shadow-md"
                        >
                            Save
                        </button>
                    </div>

                </div>
                <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-4 mt-5 md:-mx-[25px] px-[20px] md:px-[25px]" /> */}

        {/* TABLE SUMMARY */}
        {/* PROFESSIONAL TABLE WITH DETAILED HEADERS */}
        <div className="overflow-hidden border rounded-md border-gray-100 dark:border-gray-800  bg-white dark:bg-gray-900/50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-primary-table-bg dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4 text-[13px]  text-primary-table-text">
                  Theme Name
                </th>
                <th className="p-4 text-[13px]  text-primary-table-text">
                  <div className="flex gap-x-6 items-center text-primary-table-text">
                    <span className="w-16 ">Primary</span>
                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                      <span>Side-BG</span>
                      <span>Side-Txt</span>
                    </div>
                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                      <span>Head-BG</span>
                      <span>Head-Icon</span>
                    </div>
                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                      <span>Body-BG</span>
                      <span>Body-Txt</span>
                    </div>
                    <div className="flex gap-x-2 border-l dark:border-gray-700 pl-6">
                      <span>Btn-BG</span>
                      <span>Btn-Hvr</span>
                    </div>
                  </div>
                </th>
                <th className="p-4 text-[13px]  text-primary-table-text text-center w-28">
                  Status
                </th>
                <th className="p-4 text-[13px] text-primary-table-text text-center w-20">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {themes.map((t) => (
                <tr
                  key={t.ThemeId}
                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group"
                >
                  <td className="p-4">
                    <div className="text-gray-800 dark:text-gray-100 text-sm">
                      {t.ThemeName}
                    </div>
                    {/* <div className="text-[9px] text-gray-400 font-mono mt-0.5">ID: {t.ThemeId}</div> */}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-x-10 items-center">
                      {/* Primary Gradient */}
                      <div className="w-16">
                        <div
                          className="w-full h-4 rounded shadow-inner border border-white dark:border-gray-700"
                          style={{
                            background: `linear-gradient(90deg, ${t.Config.primary?.start}, ${t.Config.primary?.end})`,
                          }}
                        />
                      </div>

                      {/* Sidebar Group */}
                      <div className="flex gap-x-10 pl-6">
                        <MiniChip color={t.Config.sidebar?.bg} />
                        <MiniChip color={t.Config.sidebar?.text} />
                      </div>

                      {/* Header Group */}
                      <div className="flex gap-x-10 pl-6">
                        <MiniChip color={t.Config.header?.bg} />
                        <MiniChip color={t.Config.header?.iconColor} />
                      </div>

                      {/* Body Group */}
                      <div className="flex gap-x-10 pl-6">
                        <MiniChip color={t.Config.body?.bg} />
                        <MiniChip color={t.Config.body?.text} />
                      </div>

                      {/* Button Group */}
                      <div className="flex gap-x-10 pl-6">
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
                        className={`${t.IsActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"} relative inline-flex h-5 w-10 items-center rounded-full transition-all outline-none`}
                      >
                        <span
                          className={`${t.IsActive ? "translate-x-5" : "translate-x-1"} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setIsEdit(true);
                        setEditData(t);
                        setOpenModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-100 dark:border-blue-900"
                    >
                      <FaPencilAlt size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          className="relative z-50"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
          />
          <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <DialogPanel
                transition
                className="relative transform overflow-hidden rounded-xl bg-white dark:bg-[#0f172a] text-left shadow-2xl transition-all
    flex flex-col w-full max-w-7xl max-h-[92vh] border dark:border-gray-800

    p-0 sm:p-0

    data-[closed]:translate-y-4 data-[closed]:opacity-0 
    data-[enter]:duration-300 data-[leave]:duration-200 
    data-[enter]:ease-out data-[leave]:ease-in 
    data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
              >
                <div className="trezo-card overflow-scroll w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
                  <div
                    className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px]
flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px]
p-[20px] md:p-[25px] rounded-t-md"
                  >
                    <div className="trezo-card-title">
                      <h5 className="!mb-0">
                        {isEdit
                          ? "Update Theme Designer"
                          : "Create New Theme Architecture"}
                      </h5>
                    </div>
                    <button
                      type="button"
                      className="text-[23px] transition-all leading-none text-black dark:text-white hover:text-red-500"
                      onClick={() => setOpenModal(false)}
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>

                  <Formik
                    validateYupSchema={basicSchema}
                    initialValues={{
                      ThemeName: editData?.ThemeName || "",
                      primaryStart:
                        editData?.Config?.primary?.start || "#d4af37",
                      primaryEnd: editData?.Config?.primary?.end || "#b8962e",
                      sidebarBg: editData?.Config?.sidebar?.bg || "#b7b3b3",
                      sidebarText: editData?.Config?.sidebar?.text || "#00eb52",
                      headerBg: editData?.Config?.header?.bg || "#121212",
                      headerIconBg:
                        editData?.Config?.header?.iconBg || "#1f1f1f",
                      headerIconColor:
                        editData?.Config?.header?.iconColor || "#d4af37",
                      bodyBg: editData?.Config?.body?.bg || "#dedede",
                      bodyText: editData?.Config?.body?.text || "#000000",
                      cardBg: editData?.Config?.card?.bg || "#ffffff",
                      cardText: editData?.Config?.card?.text || "#121212",
                      cardBorder: editData?.Config?.card?.border || "#2a2a2a",
                      btnStart: editData?.Config?.button?.start || "#d4af37",
                      btnEnd: editData?.Config?.button?.end || "#b8962e",
                      btnText: editData?.Config?.button?.text || "#000000",
                      btnHoverBg:
                        editData?.Config?.button?.hoverBg || "#f5d76e",
                      btnHoverText:
                        editData?.Config?.button?.hoverText || "#000000",
                      darkModeDefault:
                        editData?.Config?.darkModeDefault || false,
                      fontBody: editData?.Config?.fontBody || "Inter",
                    }}
                    onSubmit={(values, formikHelpers) => {
                      saveTheme(values, formikHelpers);
                    }}
                  >
                    {({ values, handleChange, setFieldError }) => (
                      <Form className="flex flex-col overflow-hidden">
                        <div className="space-y-6 overflow-y-auto bg-gray-50/30 dark:bg-transparent">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-1 border-gray-200 dark:border-gray-700">
                            <div className="w-full flex items-center gap-6">
                              <label className="text-xs  text-gray-500 dark:text-blue-400 whitespace-nowrap">
                                Unique Theme Name
                              </label>
                              <Field
                                name="ThemeName"
                                placeholder="E.g. Modern Professional"
                                className="flex-1 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 py-1 dark:text-white text-sm font-bold transition-all"
                              />
                            </div>
                            <ErrorMessage
                              name="ThemeName"
                              component="div"
                              className="text-xs text-red-500 mt-1"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CompactSection title="1. Panel Gradient">
                              <ColorInput
                                label="Start"
                                name="primaryStart"
                                value={values.primaryStart}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="End"
                                name="primaryEnd"
                                value={values.primaryEnd}
                                onChange={handleChange}
                              />
                              <div
                                className="h-8 w-full mt-3 rounded-lg border-1 border-gray-200 dark:border-gray-600 shadow-inner"
                                style={{
                                  background: `linear-gradient(90deg, ${values.primaryStart}, ${values.primaryEnd})`,
                                }}
                              />
                            </CompactSection>

                            <CompactSection title="2. Sidebar Color">
                              <ColorInput
                                label="Sidebar Bg"
                                name="sidebarBg"
                                value={values.sidebarBg}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="Sidebar Active Text"
                                name="sidebarText"
                                value={values.sidebarText}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="Header Bg"
                                name="headerBg"
                                value={values.headerBg}
                                onChange={handleChange}
                              />
                            </CompactSection>

                            <CompactSection title="3. Cards Color">
                              <ColorInput
                                label="Global Bg"
                                name="bodyBg"
                                value={values.bodyBg}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="Card Surface"
                                name="cardBg"
                                value={values.cardBg}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="Card Stroke"
                                name="cardBorder"
                                value={values.cardBorder}
                                onChange={handleChange}
                              />
                            </CompactSection>

                            <CompactSection title="4. Button Style">
                              <ColorInput
                                label="Btn Start"
                                name="btnStart"
                                value={values.btnStart}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="Btn End"
                                name="btnEnd"
                                value={values.btnEnd}
                                onChange={handleChange}
                              />

                              <ColorInput
                                label="Label Color"
                                name="btnText"
                                value={values.btnText}
                                onChange={handleChange}
                              />
                              <div
                                className="mt-3 text-[10px] text-center p-2 rounded-lg border-1 border-gray-200 dark:border-gray-700 shadow-md"
                                style={{
                                  background: `linear-gradient(to right, ${values.btnStart}, ${values.btnEnd})`,
                                  color: values.btnText,
                                }}
                              >
                                PREVIEW
                              </div>
                            </CompactSection>

                            <CompactSection title="5. Button Hover">
                              <ColorInput
                                label="Hover Fill"
                                name="btnHoverBg"
                                value={values.btnHoverBg}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="Hover Label"
                                name="btnHoverText"
                                value={values.btnHoverText}
                                onChange={handleChange}
                              />
                              <div
                                className="mt-3 text-[10px] text-center p-2 rounded-lg border-1 border-gray-200 dark:border-gray-700 shadow-lg"
                                style={{
                                  backgroundColor: values.btnHoverBg,
                                  color: values.btnHoverText,
                                }}
                              >
                                HOVER STATE
                              </div>
                            </CompactSection>

                            <CompactSection title="6. Iconography">
                              <ColorInput
                                label="Icon Bubble"
                                name="headerIconBg"
                                value={values.headerIconBg}
                                onChange={handleChange}
                              />
                              <ColorInput
                                label="Icon Tint"
                                name="headerIconColor"
                                value={values.headerIconColor}
                                onChange={handleChange}
                              />
                            </CompactSection>

                            <CompactSection title="7. Typography">
                              <div className="space-y-4">
                                <ColorInput
                                  label="Main Text"
                                  name="bodyText"
                                  value={values.bodyText}
                                  onChange={handleChange}
                                />
                                <ColorInput
                                  label="Card Text"
                                  name="cardText"
                                  value={values.cardText}
                                  onChange={handleChange}
                                />

                                {/* FONT FAMILY DROPDOWN */}
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-gray-400  tracking-tighter">
                                    Font Family
                                  </label>
                                  <div className="flex items-center border-1 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden h-8 group focus-within:border-blue-500/50 transition-all">
                                    <div className="pl-2 pr-1 text-gray-400">
                                      <FaFont size={10} />
                                    </div>
                                    <Field
                                      as="select"
                                      name="fontBody"
                                      className="flex-1 bg-transparent text-[10px] font-bold outline-none dark:text-white cursor-pointer pr-1 appearance-none"
                                    >
                                      <option
                                        value="Inter"
                                        className="dark:bg-gray-800"
                                      >
                                        Inter (Modern)
                                      </option>
                                      <option
                                        value="Outfit"
                                        className="dark:bg-gray-800"
                                      >
                                        Outfit (Modern)
                                      </option>
                                      <option
                                        value="Roboto"
                                        className="dark:bg-gray-800"
                                      >
                                        Roboto (Clean)
                                      </option>
                                      <option
                                        value="Poppins"
                                        className="dark:bg-gray-800"
                                      >
                                        Poppins (Friendly)
                                      </option>
                                      <option
                                        value="Montserrat"
                                        className="dark:bg-gray-800"
                                      >
                                        Montserrat (Bold)
                                      </option>
                                      <option
                                        value="Open Sans"
                                        className="dark:bg-gray-800"
                                      >
                                        Open Sans
                                      </option>
                                      <option
                                        value="Lato"
                                        className="dark:bg-gray-800"
                                      >
                                        Lato
                                      </option>
                                    </Field>
                                    {/* Custom arrow for the select */}
                                    <div className="pr-2 pointer-events-none text-gray-400">
                                      <svg
                                        className="w-2 h-2 fill-current"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CompactSection>

                            <CompactSection title="8. Global Config">
                              <div className="space-y-3">
                                {/* DARK MODE TOGGLE */}
                                <div className="flex items-center justify-between border-1 border-gray-200 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border dark:border-gray-700 mt-2">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-600 dark:text-gray-300  tracking-tighter">
                                      Logo Config
                                    </span>
                                    <span className="text-[8px] text-gray-400 ">
                                      Dark Mode
                                    </span>
                                  </div>
                                  <Switch
                                    checked={values.darkModeDefault}
                                    onChange={(val) =>
                                      handleChange({
                                        target: {
                                          name: "darkModeDefault",
                                          value: val,
                                        },
                                      })
                                    }
                                    className={`${values.darkModeDefault ? "bg-blue-600 shadow-blue-500/40" : "bg-gray-300 dark:bg-gray-700"} relative inline-flex h-6 w-11 items-center rounded-full transition-all outline-none shadow-inner`}
                                  >
                                    <span
                                      className={`${values.darkModeDefault ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md`}
                                    />
                                  </Switch>
                                </div>
                              </div>
                            </CompactSection>
                          </div>
                        </div>
                        <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-4 mt-10 md:-mx-[25px] px-[20px] md:px-[25px]" />
                        <div className="text-right mt-[20px]">
                          <button
                            type="button"
                            onClick={() => setOpenModal(false)}
                            className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400"
                          >
                            Cancel Changes
                          </button>
                          <button
                            type="submit"
                            className="px-[26.5px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
                          >
                            Save Theme Settings
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

/* --- UI HELPERS --- */
const CompactSection = ({ title, children }: any) => (
  <div className="p-4 border-b border-gray-400 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800/20 shadow-sm hover:shadow-md transition-shadow">
    <h6 className="text-[10px] text-blue-500  tracking-[0.15em] mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 ">
      {title}
    </h6>
    <div className="space-y-3">{children}</div>
  </div>
);

const ColorInput = ({
  label,
  name,
  value,
  onChange,
  textOnly = false,
}: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] text-gray-400  tracking-tight">{label}</label>
    <div className="flex items-center border-1 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden h-8 group focus-within:border-blue-500/50 transition-all">
      {!textOnly && (
        <input
          type="color"
          name={name}
          value={value}
          onChange={onChange}
          className="w-7 h-full cursor-pointer border-none p-0 bg-transparent"
        />
      )}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="flex-1 text-[10px] px-2 font-mono outline-none dark:text-white bg-transparent  font-bold"
      />
    </div>
  </div>
);

const MiniChip = ({ color }: { color: string }) => (
  <div className="w-10 flex justify-center">
    <div
      className="w-5 h-5 rounded-md shadow-sm border border-white dark:border-gray-700 transition-transform group-hover:scale-110"
      style={{ backgroundColor: color || "#ccc" }}
      title={color}
    />
  </div>
);

export default ThemeSettings;
