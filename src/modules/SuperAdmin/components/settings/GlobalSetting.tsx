"use client";

import React, { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { ApiService } from "../../../../services/ApiService";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaSave, FaSitemap, FaShieldAlt, FaProjectDiagram, FaBell, FaMoneyBillWave, FaWhatsapp, FaEnvelope, FaSms } from "react-icons/fa";
import { PostService } from "../../../../services/PostService";
import CropperModal from "../Cropper/Croppermodel";

// -------------------------------------
// TYPES
// -------------------------------------

const initialValues = {
  SettingId: "",
  UsernamePrefix: "",
  StartSeries: "",
  SeriesType: "",
  UserNameType: "",
  PasswordType: "",
  PlanType: "",
  PlacementType: "",
  MaleDefaultIcon: "",
  FemaleDefaultIcon: "",

  // Wallet settings
  SponsorIncomeWallet: "",
  ROIWallet: "",
  LevelIncomeWallet: "",
  BinaryIncomeWallet: "",
};


// -------------------------------------
// VALIDATION
// -------------------------------------

const validationSchema = Yup.object().shape({
  UsernamePrefix: Yup.string().required("Required"),
  StartSeries: Yup.number().required("Required"),
  SeriesType: Yup.string().required("Required"),
  UserNameType: Yup.string().required("Required"),
  PasswordType: Yup.string().required("Required"),
  PlanType: Yup.string().required("Required"),
  PlacementType: Yup.string().required("Required"),
  SponsorIncomeWallet: Yup.string().required("Required"),
  ROIWallet: Yup.string().required("Required"),
  LevelIncomeWallet: Yup.string().required("Required"),
  BinaryIncomeWallet: Yup.string().required("Required"),
});


// -------------------------------------
// MAIN COMPONENT
// -------------------------------------

export default function GlobalSetting() {
  const { universalService } = ApiService();
  const { postDocument } = PostService();
  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [maleIcon, setMaleIcon] = useState("");
  const [femaleIcon, setFemaleIcon] = useState("");
  const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;
  const [rawMale, setRawMale] = useState("");
  const [rawFemale, setRawFemale] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState("");
  const [cropTarget, setCropTarget] = useState<"male" | "female" | null>(null);
  const [walletOptions, setWalletOptions] = useState([]);
  const [notificationEvents, setNotificationEvents] = useState([]);

  const [tab, setTab] = useState(0);


  const tabs = [
    { label: "Genealogy Settings", icon: <FaSitemap /> },
    { label: "Notification Settings", icon: <FaBell /> },
    { label: "Payout Wallet Settings", icon: <FaMoneyBillWave /> },
  ];




  // -------------------------------------
  // INPUT STYLE (Same Pattern)
  // -------------------------------------

  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 " +
    "focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 " +
    "bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100";
  const onMaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setCropTarget("male");
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };
  const loadNotificationEvents = async () => {
    try {
      const payload = {
        procName: "ManageGlobalSetting",
        Para: JSON.stringify({
          ActionMode: "GetNotificationEvents",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res || [];
      setNotificationEvents(data);
    } catch (err) {
      console.error("Notification load error", err);
      toast.error("Failed to load notification events");
    }
  };

  const onFemaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setCropTarget("female");
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };



  const deleteMale = async () => {
    const res = await Swal.fire({
      title: "Remove Male Icon?",
      text: "This will remove the default male icon.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
    });

    if (res.isConfirmed) {
      setMaleIcon("");
      toast.success("Male icon removed. Click Update to save.");
    }
  };

  const deleteFemale = async () => {
    const res = await Swal.fire({
      title: "Remove Female Icon?",
      text: "This will remove the default female icon.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
    });

    if (res.isConfirmed) {
      setFemaleIcon("");
      toast.success("Female icon removed. Click Update to save.");
    }
  };
  const loadWallets = async () => {
    try {
      const payload = {
        procName: "ManageGlobalSetting",
        Para: JSON.stringify({
          ActionMode: "GetWallet",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res || [];
      setWalletOptions(data);
    } catch (err) {
      console.error("Wallet load error", err);
      toast.error("Failed to load wallets");
    }
  };
  useEffect(() => {
    loadSettings();
    loadWallets();
    loadNotificationEvents();
  }, []);
  const handleCroppedImage = async (croppedBase64: string) => {
    try {
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const file = new File([blob], `icon_${Date.now()}.png`, {
        type: blob.type,
      });

      const fd = new FormData();
      fd.append("UploadedImage", file);
      fd.append("pagename", "EmpDoc");

      const uploadRes = await postDocument(fd);
      const fileName = uploadRes?.fileName || uploadRes?.Message;

      if (!fileName) {
        toast.error("Upload failed");
        return;
      }

      if (cropTarget === "male") {
        setMaleIcon(fileName);
      } else if (cropTarget === "female") {
        setFemaleIcon(fileName);
      }
    } catch (err) {
      console.error("Crop upload error:", err);
      toast.error("Upload failed");
    } finally {
      setShowCropper(false);
      setCropTarget(null);
    }
  };

  // -------------------------------------
  // LOAD DATA (GET)
  // -------------------------------------

  const loadSettings = async () => {
    try {
      setInitialLoading(true);

      const payload = {
        procName: "ManageGlobalSetting",
        Para: JSON.stringify({
          ActionMode: "GET",
        }),
      };

      const res = await universalService(payload);

      const data = res?.data?.[0] || res?.[0];

      if (!data) return;
      setForm({
        SettingId: data.SettingId,
        UsernamePrefix: data.UsernamePrefix || "",
        StartSeries: data.StartSeries || "",
        SeriesType: data.SeriesType || "",
        UserNameType: data.UserNameType || "",
        PasswordType: data.PasswordType || "",
        PlanType: data.PlanType || "",
        PlacementType: data.PlacementType || "",
        MaleDefaultIcon: data.MaleDefaultIcon || "",
        FemaleDefaultIcon: data.FemaleDefaultIcon || "",

        // Wallets (DB → UI)
        SponsorIncomeWallet: data.SponsorIncomeWallet || "",
        ROIWallet: data.ROIIncomeWallet || "",
        LevelIncomeWallet: data.LevelIncomeWallet || "",
        BinaryIncomeWallet: data.BinaryIncomeWallet || "",
      });



      // set icons for preview
      setMaleIcon(data.MaleDefaultIcon || "");
      setFemaleIcon(data.FemaleDefaultIcon || "");

    } catch (err) {
      console.error("Load Error", err);
      toast.error("Failed to load settings");
    } finally {
      setInitialLoading(false);
    }
  };

  // -------------------------------------
  // LOAD ON MOUNT
  // -------------------------------------



  // -------------------------------------
  // UPDATE
  // -------------------------------------

  const handleSubmit = async (values) => {
    const confirm = await Swal.fire({
      title: "Update Settings?",
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
        procName: "ManageGlobalSetting",
        Para: JSON.stringify({
          ActionMode: "UPDATE",

          SettingId: values.SettingId,
          UsernamePrefix: values.UsernamePrefix,
          StartSeries: Number(values.StartSeries),
          SeriesType: values.SeriesType,
          UserNameType: values.UserNameType,
          PasswordType: values.PasswordType,
          PlanType: values.PlanType,
          PlacementType: values.PlacementType,
          MaleDefaultIcon: maleIcon,
          FemaleDefaultIcon: femaleIcon,

          SponsorIncomeWallet: values.SponsorIncomeWallet,
          ROIIncomeWallet: values.ROIWallet,
          LevelIncomeWallet: values.LevelIncomeWallet,
          BinaryIncomeWallet: values.BinaryIncomeWallet,

          JsonData: JSON.stringify(notificationEvents),
          EntryBy: 1,
        }),
      };


      const res = await universalService(payload);

      const result =
        res?.data?.[0] ||
        res?.data ||
        res?.[0] ||
        res;

      if (result?.Status === "SUCCESS") {
        Swal.fire(
          "Success!",
          result?.Message || "Settings updated successfully",
          "success"
        );

        loadSettings();
      } else {
        Swal.fire(
          "Error",
          result?.Message || "Update failed",
          "error"
        );
      }
    } catch (err) {
      console.error("Update Error", err);
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };



  // -------------------------------------
  // LOADING SCREEN
  // -------------------------------------

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
    <Formik
      initialValues={form}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleSubmit,
      }) => (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6 relative"
        >
          {/* LOADER */}
          {(loading) && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center z-10 rounded-lg">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          )}

          {/* HEADER */}
          <div className="flex justify-between items-center border-b border-gray-200  pb-3 mb-6 -mx-[20px] md:-mx-[20px] px-[20px] md:px-[25px]">
            <div className="trezo-card-title">
              <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
                Global Setting
              </h5>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-1.5 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded text-sm"
              >
                <FaSave /> Update
              </button>
            </div>

          </div>

          {/* FORM GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">

            {/* Username Prefix */}
            <div>
              <label className="text-sm mb-1 block">Username Prefix<span className="text-red-500">*</span></label>
              <input
                name="UsernamePrefix"
                value={values.UsernamePrefix}
                onChange={handleChange}

                className={inputClass}
              />
              {errors.UsernamePrefix && touched.UsernamePrefix && (
                <p className="text-xs text-red-500">{errors.UsernamePrefix}</p>
              )}
            </div>

            {/* Start Series */}
            <div>
              <label className="text-sm mb-1 block">Start Series<span className="text-red-500">*</span></label>
              <input
                type="number"
                name="StartSeries"
                value={values.StartSeries}
                onChange={handleChange}

                className={inputClass}
              />
            </div>

            {/* Series Type */}
            {/* Series Type */}
            <div>
              <label className="text-sm mb-1 block">Series Type<span className="text-red-500">*</span></label>

              <select
                name="SeriesType"
                value={values.SeriesType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Series Type</option>
                <option value="Incremental">Incremental</option>
                <option value="Random">Random</option>
              </select>

              {errors.SeriesType && touched.SeriesType && (
                <p className="text-xs text-red-500">{errors.SeriesType}</p>
              )}
            </div>


            {/* Username Type */}
            <div>
              <label className="text-sm mb-1 block">Username Type<span className="text-red-500">*</span></label>

              <select
                name="UserNameType"
                value={values.UserNameType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Username Type</option>
                <option value="Manual">Manual</option>
                <option value="Auto">Auto</option>
              </select>

              {errors.UserNameType && touched.UserNameType && (
                <p className="text-xs text-red-500">{errors.UserNameType}</p>
              )}
            </div>


            {/* Password Type */}
            <div>
              <label className="text-sm mb-1 block">Password Type<span className="text-red-500">*</span></label>

              <select
                name="PasswordType"
                value={values.PasswordType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Password Type</option>
                <option value="Manual">Manual</option>
                <option value="Auto">Auto</option>
              </select>

              {errors.PasswordType && touched.PasswordType && (
                <p className="text-xs text-red-500">{errors.PasswordType}</p>
              )}
            </div>


            {/* Plan Type */}
            <div>
              <label className="text-sm mb-1 block">Plan Type<span className="text-red-500">*</span></label>

              <select
                name="PlanType"
                value={values.PlanType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Plan Type</option>
                <option value="Generation">Generation</option>
                <option value="Binary">Binary</option>
              </select>

              {errors.PlanType && touched.PlanType && (
                <p className="text-xs text-red-500">{errors.PlanType}</p>
              )}
            </div>


            {/* Placement Type */}
            <div>
              <label className="text-sm mb-1 block">Placement Type<span className="text-red-500">*</span></label>

              <select
                name="PlacementType"
                value={values.PlacementType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Placement Type</option>
                <option value="Manual">Manual</option>
                <option value="Auto">Auto</option>
              </select>

              {errors.PlacementType && touched.PlacementType && (
                <p className="text-xs text-red-500">{errors.PlacementType}</p>
              )}
            </div>


          </div>
          {/* TABS */}
          <div className="mt-4 mb-6">
            <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
              {tabs.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`pb-2 text-sm font-medium transition-colors flex items-center gap-2
    ${tab === i
                      ? "border-b-2 border-primary-button-bg text-primary-button-bg"
                      : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                    }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}


            </div>
          </div>
          {tab === 0 && (
            <div className="space-y-6 animate-fadeIn">

              {/* IMAGE SELECTORS */}
              <div className="flex flex-wrap gap-10">

                {/* Male Icon */}
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Male Default Icon</p>

                  <div className="relative w-36 h-36 group">
                    <div className="w-full h-full rounded-xl border-[4px] border-white shadow-md overflow-hidden bg-gray-200 flex items-center justify-center">

                      {maleIcon ? (
                        <img
                          src={
                            maleIcon?.startsWith("data:")
                              ? maleIcon
                              : `${IMAGE_PREVIEW_URL}${maleIcon}`
                          }
                          alt="Male"
                          className="w-full h-full object-cover"
                        />

                      ) : (
                        <span className="text-gray-400 text-xs">
                          No Image
                        </span>
                      )}

                    </div>

                    {/* Upload */}
                    <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white text-primary-button-bg rounded-full shadow-lg cursor-pointer border">
                      ✎
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={onMaleChange}
                      />
                    </label>

                    {/* Delete */}
                    {maleIcon && (
                      <button
                        type="button"
                        onClick={deleteMale}
                        className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white text-red-500 rounded-full shadow-lg border"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Female Icon */}
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Female Default Icon</p>

                  <div className="relative w-36 h-36 group">
                    <div className="w-full h-full rounded-xl border-[4px] border-white shadow-md overflow-hidden bg-gray-200 flex items-center justify-center">

                      {femaleIcon ? (
                        <img
                          src={
                            femaleIcon?.startsWith("data:")
                              ? femaleIcon
                              : `${IMAGE_PREVIEW_URL}${femaleIcon}`
                          }
                          alt="Female"
                          className="w-full h-full object-cover"
                        />

                      ) : (
                        <span className="text-gray-400 text-xs">
                          No Image
                        </span>
                      )}

                    </div>

                    {/* Upload */}
                    <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white text-primary-button-bg rounded-full shadow-lg cursor-pointer border">
                      ✎
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={onFemaleChange}
                      />
                    </label>

                    {/* Delete */}
                    {femaleIcon && (
                      <button
                        type="button"
                        onClick={deleteFemale}
                        className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white text-red-500 rounded-full shadow-lg border"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
          {tab === 1 && (
            <div className="overflow-x-auto animate-fadeIn">
              <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-sm">

                {/* Header */}
                <thead className="bg-primary-table-bg text-primary-table-text dark:bg-gray-800">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left font-semibold tracking-wide">
                      <div className="flex items-center gap-2">
                        <FaBell className="text-primary-button-bg text-lg" />
                        Event
                      </div>
                    </th>

                    <th className="px-6 py-4 text-center font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <FaWhatsapp className="text-green-500 text-lg" />
                        WhatsApp
                      </div>
                    </th>

                    <th className="px-6 py-4 text-center font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <FaSms className="text-yellow-500 text-lg" />
                        SMS
                      </div>
                    </th>

                    <th className="px-6 py-4 text-center font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <FaEnvelope className="text-blue-500 text-lg" />
                        Email
                      </div>
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {notificationEvents.map((event, index) => (
                    <tr
                      key={event.EventTriggerId}
                      className="
              border-b border-gray-100 dark:border-gray-700
              hover:bg-gray-50 dark:hover:bg-[#172036]
              transition-colors duration-200
            "
                    >
                      {/* Event Name */}
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-200 font-medium">
                        {event.EventTriggerType}
                      </td>

                      {/* Toggles */}
                      {["IsWhatsApp", "IsSMS", "IsEmail"].map((field) => (
                        <td key={field} className="px-6 py-4 text-center align-middle">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={event[field]}
                              onChange={(e) => {
                                const updated = [...notificationEvents];
                                updated[index][field] = e.target.checked;
                                setNotificationEvents(updated);
                              }}
                            />

                            <div className="
                    w-11 h-6 bg-gray-300 dark:bg-gray-700
                    rounded-full
                    peer-checked:bg-primary-button-bg
                    transition-colors duration-300
                  "></div>

                            <div className="
                    absolute left-1 top-1 w-4 h-4
                    bg-white rounded-full shadow-sm
                    transition-transform duration-300
                    peer-checked:translate-x-5
                  "></div>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}


          {tab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fadeIn">
              {/* Sponsor Income */}
              <div>
                <label className="text-sm mb-1 block">
                  Sponsor Income (Wallet)<span className="text-red-500">*</span>
                </label>
                <select
                  name="SponsorIncomeWallet"
                  value={values.SponsorIncomeWallet}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Wallet</option>
                  {walletOptions.map((wallet) => (
                    <option key={wallet.Id} value={wallet.Id}>
                      {wallet.Name}
                    </option>
                  ))}
                </select>
                {errors.SponsorIncomeWallet && touched.SponsorIncomeWallet && (
                  <p className="text-xs text-red-500">
                    {errors.SponsorIncomeWallet}
                  </p>
                )}
              </div>


              {/* ROI */}
              <div>
                <label className="text-sm mb-1 block">
                  ROI (Wallet)<span className="text-red-500">*</span>
                </label>
                <select
                  name="ROIWallet"
                  value={values.ROIWallet}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Wallet</option>
                  {walletOptions.map((wallet) => (
                    <option key={wallet.Id} value={wallet.Id}>
                      {wallet.Name}
                    </option>
                  ))}
                </select>
                {errors.ROIWallet && touched.ROIWallet && (
                  <p className="text-xs text-red-500">
                    {errors.ROIWallet}
                  </p>
                )}

              </div>

              {/* Level Income */}
              <div>
                <label className="text-sm mb-1 block">
                  Level Income (Wallet)<span className="text-red-500">*</span>
                </label>
                <select
                  name="LevelIncomeWallet"
                  value={values.LevelIncomeWallet}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Wallet</option>
                  {walletOptions.map((wallet) => (
                    <option key={wallet.Id} value={wallet.Id}>
                      {wallet.Name}
                    </option>
                  ))}
                </select>
                {errors.LevelIncomeWallet && touched.LevelIncomeWallet && (
                  <p className="text-xs text-red-500">
                    {errors.LevelIncomeWallet}
                  </p>
                )}

              </div>

              {/* Binary Income */}
              <div>
                <label className="text-sm mb-1 block">
                  Binary Income (Wallet)<span className="text-red-500">*</span>
                </label>
                <select
                  name="BinaryIncomeWallet"
                  value={values.BinaryIncomeWallet}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Wallet</option>
                  {walletOptions.map((wallet) => (
                    <option key={wallet.Id} value={wallet.Id}>
                      {wallet.Name}
                    </option>
                  ))}
                </select>
                {errors.BinaryIncomeWallet && touched.BinaryIncomeWallet && (
                  <p className="text-xs text-red-500">
                    {errors.BinaryIncomeWallet}
                  </p>
                )}

              </div>

            </div>
          )}


          <ToastContainer position="top-right" autoClose={3000} />
          <CropperModal
            open={showCropper}
            image={rawImage}
            aspectRatio={1}
            onCrop={handleCroppedImage}
            onClose={() => setShowCropper(false)}
          />

        </form>
      )}
    </Formik>
  );
}
