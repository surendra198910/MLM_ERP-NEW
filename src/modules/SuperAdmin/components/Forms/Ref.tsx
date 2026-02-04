"use client";

import React, { useState } from "react";
import {
    FaUserCircle,
    FaTimes,
    FaPencilAlt,
    FaIdBadge,
  FaUser,
  FaMobileAlt,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaLayerGroup,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Formik } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ----------------------------------------------------------------------
// STYLES (Exact match to Company Page)
// ----------------------------------------------------------------------

const bigInputClasses =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 " +
  "placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all " +
  "bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface FormValues {
  // Top Section Fields
  sponsorId: string;
  sponsorName: string;
  name: string;
  mobileNo: string;
  // Tab 0 Fields
  email: string;
  country: string;
  position: "Left" | "Right" | "";
  // Tab 1 (Dummy) Fields
  dummyField1: string;
}

const initialValues: FormValues = {
  sponsorId: "",
  sponsorName: "",
  name: "",
  mobileNo: "",
  email: "",
  country: "",
  position: "Left",
  dummyField1: "",
};

// ----------------------------------------------------------------------
// REUSABLE COMPONENTS
// ----------------------------------------------------------------------

const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  touched,
  errors,
  handleChange,
  values,
  disabled,
}: any) => (
  <div className="flex flex-col dark:text-gray-100">
    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
      {label?.includes("*") ? (
        <>
          {label.replace("*", "")}
          <span className="text-red-500 ml-0.5">*</span>
        </>
      ) : (
        label
      )}
    </label>
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={values[name] || ""}
      onChange={handleChange}
      disabled={disabled}
      className={`${bigInputClasses} ${
        disabled
          ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400"
          : ""
      } ${
        errors[name] && touched[name]
          ? "border-red-500 focus:ring-red-500"
          : ""
      }`}
    />
    {errors[name] && touched[name] && (
      <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
    )}
  </div>
);

const SelectField = ({
  label,
  name,
  options,
  touched,
  errors,
  handleChange,
  values,
  disabled,
}: any) => (
  <div className="flex flex-col dark:text-gray-100">
    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
      {label?.includes("*") ? (
        <>
          {label.replace("*", "")}
          <span className="text-red-500 ml-0.5">*</span>
        </>
      ) : (
        label
      )}
    </label>
    <div className="relative">
      <select
        name={name}
        value={values[name] || ""}
        onChange={handleChange}
        disabled={disabled}
        className={`${bigInputClasses} ${
          disabled
            ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400"
            : ""
        } ${errors[name] && touched[name] ? "border-red-500" : ""}`}
      >
        <option value="">Select Option</option>
        {options.map((o: any, i: number) => (
          <option key={i} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
    {errors[name] && touched[name] && (
      <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
    )}
  </div>
);

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function CreateAccountTabs() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Image State (To match the Company Page layout)
  const [imagePreview, setImagePreview] = useState<string>("");

  // Validation
  const validationSchema = Yup.object().shape({
    sponsorId: Yup.string().required("Sponsor ID is required"),
    name: Yup.string().required("Name is required"),
    mobileNo: Yup.string().required("Mobile No is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    country: Yup.string().required("Country is required"),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>
  ) => {
    setLoading(true);
    try {
      console.log("Submitted:", values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Account created successfully!");
      resetForm();
      setImagePreview("");
    } catch (error) {
      toast.error("Error creating account");
    } finally {
      setLoading(false);
    }
  };

  // Define Tabs (Includes Dummy Tab)
  const tabs = [
    { label: "Registration Details", icon: <FaUser size={16} /> },
    { label: "Additional Info (Dummy)", icon: <FaLayerGroup size={16} /> },
  ];

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleSubmit,
        setFieldValue,
        isSubmitting,
      }) => (
        <form
          onSubmit={handleSubmit}
          className="relative bg-white dark:bg-[#0c1427] dark:text-gray-100 rounded-lg mb-10"
        >
          {/* Loading Overlay */}
          {(loading || isSubmitting) && (
            <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0c1427]/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* ---------------- HEADER ROW ---------------- */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              Create Your Account
            </div>

            <div className="flex gap-x-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-primary-50 rounded text-sm font-medium text-white"
              >
                Submit
              </button>
            </div>
          </div>

          {/* ---------------- TOP SECTION (Image Left, Main Info Right) ---------------- */}
          <div className="bg-white dark:bg-[#0c1427] rounded-lg dark:text-gray-100 p-4 px-5 mt-2 mb-3">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* --- LEFT: PROFILE IMAGE SECTION --- */}
              <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
                <div className="relative w-36 h-36 group">
                  <div className="w-full h-full rounded-xl border-[4px] border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="text-7xl text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                  <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-primary-400 text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">
                    <FaPencilAlt size={14} />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => setImagePreview("")}
                      className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-red-400 text-red-400 rounded-full shadow-lg cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-200 dark:border-gray-600"
                    >
                      <FaTimes size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* --- RIGHT: PRIMARY FORM FIELDS --- */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField
                    label="Sponsor ID:*"
                    name="sponsorId"
                    placeholder="Enter Sponsor ID"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  />
                  <InputField
                    label="Sponsor Name:*"
                    name="sponsorName"
                    placeholder="Enter Sponsor Name"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  />
                  <InputField
                    label="Full Name:*"
                    name="name"
                    placeholder="Enter Full Name"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  />
                  <InputField
                    label="Mobile Number:*"
                    name="mobileNo"
                    placeholder="Enter Mobile Number"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  />
                </div>
              </div>
            </div>

            {/* ---------------- TABS NAVIGATION ---------------- */}
            <div className="mt-10 mb-6">
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

            {/* ---------------- TAB CONTENT ---------------- */}

            {/* TAB 0: Registration Details (Remaining Fields) */}
            {tab === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                 {/* Email Field */}
                <div className="md:col-span-1">
                    <InputField
                    label="Email Address:*"
                    name="email"
                    placeholder="Enter Email"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                    />
                </div>

                {/* Country Select */}
                <div className="md:col-span-1">
                    <SelectField
                    label="Country:*"
                    name="country"
                    options={[
                        { value: "IN", label: "India" },
                        { value: "US", label: "USA" },
                        { value: "UK", label: "UK" },
                    ]}
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                    />
                </div>

                {/* Position Radio Buttons (Custom Styling) */}
                <div className="md:col-span-1 flex flex-col">
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Select Position:<span className="text-red-500">*</span>
                  </label>
                  <div className="flex border border-gray-200 dark:border-gray-700 rounded overflow-hidden h-10">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center text-sm font-medium transition ${
                        values.position === "Left"
                          ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400"
                          : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                      onClick={() => setFieldValue("position", "Left")}
                    >
                      Left {values.position === "Left" && "✓"}
                    </button>
                    <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center text-sm font-medium transition ${
                        values.position === "Right"
                          ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400"
                          : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                      onClick={() => setFieldValue("position", "Right")}
                    >
                      Right {values.position === "Right" && "✓"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: Dummy Tab */}
            {tab === 1 && (
              <div className="animate-fadeIn min-h-[200px] flex flex-col justify-center items-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <FaLayerGroup className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    This is a dummy tab.
                </p>
                <p className="text-sm text-gray-400">
                    Add new fields or components here in the code (tab === 1 block).
                </p>
              </div>
            )}

          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </form>
      )}
    </Formik>
  );
}