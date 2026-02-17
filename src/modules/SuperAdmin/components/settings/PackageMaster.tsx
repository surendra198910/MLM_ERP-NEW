"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    FaUpload,
    FaTimes,
    FaRegAddressCard,
    FaFile,
    FaUser,

} from "react-icons/fa";
import {
    Editor,
    EditorProvider,
    Toolbar,
    BtnBold,
    BtnItalic,
    BtnUnderline,
    BtnStrikeThrough,
    BtnBulletList,
    BtnNumberedList,
    BtnLink,
    BtnClearFormatting,
    BtnUndo,
    BtnRedo,
    BtnStyles,
    HtmlButton,
    Separator,
} from "react-simple-wysiwyg";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";

import type { ContentEditableEvent } from "react-simple-wysiwyg";
import { useNavigate, useParams } from "react-router-dom";
import { Formik } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import CropperModal from "../Cropper/Croppermodel";
import { PostService } from "../../../../services/PostService";
import AccessRestricted from "../../common/AccessRestricted";



// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface DocumentValue {
    number?: string;
    file?: File;
    fileName?: string;
    isDeleted?: boolean;
    isExisting?: boolean;
}

interface FormValues {
    companyName: string;
    isPublished: boolean;
    // Package Pricing
    packageType: string;
    minAmount: string;
    maxAmount: string;
    amount: string;

    validity: string;

    companyCodePrefix: string;

    shortDesc: string; // ✅ NEW
    longDesc: string;  // ✅ NEW
}



// ----------------------------------------------------------------------
// VALIDATION SCHEMA
// ----------------------------------------------------------------------

const companyValidationSchema = Yup.object().shape({
    companyName: Yup.string().required("Package Name is required"),

    packageType: Yup.string().required("Package type is required"),

    minAmount: Yup.string().when("packageType", {
        is: "Flexible",
        then: () => Yup.string().required("Min amount required"),
    }),

    maxAmount: Yup.string().when("packageType", {
        is: "Flexible",
        then: () => Yup.string().required("Max amount required"),
    }),

    amount: Yup.string().when("packageType", {
        is: "Fixed",
        then: () => Yup.string().required("Amount required"),
    }),

    shortDesc: Yup.string().nullable(),

    longDesc: Yup.string().nullable(),

    validity: Yup.string().required("Validity is required"),
});


// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function AddCompany() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const { universalService } = ApiService();
    const { postDocument } = PostService();

    const [tab, setTab] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(false);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState<boolean>(false);
    const [showCropper, setShowCropper] = useState<boolean>(false);
    const [rawImage, setRawImage] = useState<string>("");
    const [companyLogo, setCompanyLogo] = useState<string>("");
    const [docValues, setDocValues] = useState<Record<number, DocumentValue>>({});
    const [images, setImages] = useState([]);


    const path = location.pathname;
    // const formName = path.split("/").pop();
    const formName = "add-package";
    const isEditable = isEditMode
        ? SmartActions.canEdit(formName)
        : SmartActions.canAdd(formName);  // must match DB
    const fetchFormPermissions = async () => {
        try {
            setPermissionLoading(true);

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "AssignForm",
                Para: JSON.stringify({
                    ActionMode: "GetForms",
                    FormName: formName,
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
                    formName?.trim().toLowerCase()
            );

            if (
                !pagePermission ||
                !pagePermission.Action ||
                pagePermission.Action.trim() === ""
            ) {
                setHasPageAccess(false);
                return;
            }

            SmartActions.load(data);
            setHasPageAccess(true);

        } catch (err) {
            console.error("Permission fetch failed", err);
            setHasPageAccess(false);
        } finally {
            setPermissionLoading(false);
        }
    };

    // Handle multiple images
    const handleImagesUpload = async (e) => {
        const files = Array.from(e.target.files);

        if (!files.length) return;

        /* ================= VALIDATION ================= */

        if (files.length > 1) {
            toast.error("Please select only one image at a time.");
            return;
        }

        const file = files[0];

        if (file.size > 2 * 1024 * 1024) {
            toast.error(`${file.name} is larger than 2MB`);
            return;
        }

        /* ================= OPEN CROPPER ================= */

        const reader = new FileReader();
        reader.onload = () => {
            setRawImage(reader.result as string);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCroppedImage = async (croppedBase64: string) => {
        try {
            // convert base64 → file
            const res = await fetch(croppedBase64);
            const blob = await res.blob();
            const file = new File([blob], `package_${Date.now()}.png`, {
                type: blob.type,
            });

            const preview = URL.createObjectURL(file);

            const tempImage = {
                file,
                preview,
                fileName: "",
                isDefault: images.length === 0,
                uploading: true,
            };

            setImages((prev) => [...prev, tempImage]);

            const fd = new FormData();
            fd.append("UploadedImage", file);
            fd.append("pagename", "EmpDoc");

            const uploadRes = await postDocument(fd);
            const uploadedFileName =
                uploadRes?.fileName || uploadRes?.Message;

            if (!uploadedFileName) {
                toast.error("Image upload failed");
                return;
            }

            setImages((prev) =>
                prev.map((img) =>
                    img.preview === preview
                        ? {
                            ...img,
                            fileName: uploadedFileName,
                            uploading: false,
                        }
                        : img
                )
            );
        } catch (err) {
            console.error("Cropped upload error:", err);
            toast.error("Image upload failed");
        }
    };



    // Prepare Images JSON for DB
    const imagesPayload = images
        .filter((img) => img.fileName) // only uploaded
        .map((img, index) => ({
            ImageName: img.fileName,
            IsDefault: img.isDefault ? 1 : 0,
            Position: index + 1,
        }));

    const removeImage = (index) => {
        Swal.fire({
            title: "Delete this image?",
            text: "This image will be permanently removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#9ca3af",
            reverseButtons: true,
        }).then((result) => {
            if (!result.isConfirmed) return;

            setImages((prev) => {
                const updated = [...prev];
                const removed = updated.splice(index, 1)[0];

                // If default removed, set first as default
                if (removed?.isDefault && updated.length > 0) {
                    updated[0].isDefault = true;
                }

                return updated;
            });

            Swal.fire({
                title: "Deleted!",
                text: "Image has been removed.",
                icon: "success",
                timer: 1200,
                showConfirmButton: false,
            });
        });
    };


    const setDefaultImage = (index) => {
        Swal.fire({
            title: "Set as Default Image?",
            text: "This image will be used as the main/default image.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, set default",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#22c55e", // green
            cancelButtonColor: "#9ca3af", // gray
            reverseButtons: true,
        }).then((result) => {
            if (!result.isConfirmed) return;

            setImages((prev) =>
                prev.map((img, i) => ({
                    ...img,
                    isDefault: i === index,
                }))
            );

            Swal.fire({
                title: "Updated!",
                text: "Default image has been changed.",
                icon: "success",
                timer: 1200,
                showConfirmButton: false,
            });
        });
    };




    const initialValues: FormValues = {
        companyName: "",
        isPublished: false,
        packageType: "",
        minAmount: "",
        maxAmount: "",
        amount: "",

        validity: "",

        companyCodePrefix: "",

        shortDesc: "", // ✅
        longDesc: "",  // ✅
    };
    const [form, setForm] = useState<FormValues>(initialValues);
    const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

    // --- STYLES ---
    // UPDATED: Added dark mode classes for bg, border, text, placeholder
    const bigInputClasses =
        "w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm h-10 " +
        "placeholder-gray-400 focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg transition-all " +
        "bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";


    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const loadCompanyData = async () => {
            try {
                setInitialLoading(true);

                const payload = {
                    procName: "CreatePackage",
                    Para: JSON.stringify({
                        ActionMode: "Select",
                        ProductId: Number(id),
                    }),
                };


                const res = await universalService(payload);
                const data = res?.data?.[0] || res?.[0];

                if (!data || !isMounted) return;

                // ---------- LOGO ----------
                setCompanyLogo(data.CompanyLogo || "");

                // ---------- FORM VALUES ----------
                const newForm: FormValues = {
                    companyName: data.ProductName || "",

                    packageType: data.Type || "",

                    minAmount: data.MinAmount ? String(data.MinAmount) : "",
                    maxAmount: data.MaxAmount ? String(data.MaxAmount) : "",
                    amount:
                        data.MinAmount && data.MinAmount === data.MaxAmount
                            ? String(data.MinAmount)
                            : "",

                    validity: data.Validity ? String(data.Validity) : "",

                    companyCodePrefix: "",

                    isPublished: data.Publish === 1 || data.Publish === true,


                    shortDesc: data.ShortDescription || "",
                    longDesc: data.LongDescription || "",
                };



                setForm(newForm);

                /* ================= LOAD IMAGES IN EDIT ================= */
                if (data.ImagesJson) {
                    try {
                        const imgs = JSON.parse(data.ImagesJson);

                        const loadedImages = imgs.map((img: any) => ({
                            preview: `${IMAGE_PREVIEW_URL}${img.ImagePath}`,
                            fileName: img.ImagePath,
                            isDefault: img.IsDefault === 1 || img.IsDefault === true,
                            uploading: false,
                        }));

                        setImages(loadedImages);
                    } catch (err) {
                        console.error("Image JSON parse error:", err);
                    }
                }


                // ---------- DOCUMENTS ----------
                if (data.CompanyDocuments) {
                    try {
                        const docs = JSON.parse(data.CompanyDocuments);
                        const newDocValues: Record<number, DocumentValue> = {};

                        docs.forEach((d: any) => {
                            newDocValues[d.DocumentId] = {
                                number: d.DocumentNumber || "",
                                fileName: d.Attachment || "",
                                isExisting: true,
                            };
                        });

                        setDocValues(newDocValues);
                    } catch (err) {
                        console.error("CompanyDocuments JSON parse error:", err);
                    }
                }
            } catch (error) {
                console.error("Failed to load company data:", error);
            } finally {
                if (isMounted) {
                    setInitialLoading(false);
                }
            }
        };

        loadCompanyData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        fetchFormPermissions();
    }, []);



    const handleSubmit = async (
        values: FormValues,
        { resetForm, setSubmitting }: FormikHelpers<FormValues>
    ) => {

        const confirm = await Swal.fire({
            title: isEditMode ? "Update Package?" : "Create Package?",
            text: isEditMode
                ? "Are you sure you want to update this package?"
                : "Are you sure you want to create this package?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: isEditMode ? "Yes, Update" : "Yes, Create",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
        });

        if (!confirm.isConfirmed) return;

        setLoading(true);

        try {

            /* ================= PRICE LOGIC ================= */

            let minPrice: string | null = null;
            let maxPrice: string | null = null;

            if (values.packageType === "Fixed") {
                minPrice = values.amount || null;
                maxPrice = values.amount || null;
            }
            else if (values.packageType === "Flexible") {
                minPrice = values.minAmount || null;
                maxPrice = values.maxAmount || null;
            }

            /* ================= IMAGES ================= */

            const imagesPayload = images.map((img, index) => ({
                ImageName: img.fileName,
                IsDefault: img.isDefault ? 1 : 0,
                Position: index + 1,
            }));

            /* ================= USER ================= */

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            /* ================= MODE ================= */

            const actionMode = isEditMode ? "Update" : "Insert";

            /* ================= BASE DATA ================= */

            const packageData: any = {
                ActionMode: actionMode,
                CompanyId: 1,
                CategoryId: 1,
                Type: values.packageType,
                ProductName: values.companyName,
                MinAmount: minPrice,
                MaxAmount: maxPrice,
                SalePrice: minPrice,
                Publish: values.isPublished ? 1 : 0,
                ShortDesc: values.shortDesc,
                LongDesc: values.longDesc,
                Validity: values.validity,
                EntryBy: employeeId,
                ImagesJson: JSON.stringify(imagesPayload),
            };

            if (isEditMode) {
                packageData.ProductId = Number(id);
            }

            const payload = {
                procName: "CreatePackage",
                Para: JSON.stringify(packageData),
            };

            const response = await universalService(payload);

            const res = Array.isArray(response)
                ? response[0]
                : response?.data?.[0];

            if (res?.StatusCode == 1 || res?.statuscode == 1) {

                Swal.fire(
                    "Success",
                    res?.Msg || "Saved Successfully",
                    "success"
                );

                if (!isEditMode) {
                    resetForm();
                    setImages([]);
                    setTab(0);
                }

                navigate("/superadmin/mlm-setting/manage-package");

            } else {

                Swal.fire(
                    "Error",
                    res?.Msg || "Operation Failed",
                    "error"
                );
            }

        } catch (err) {

            console.error("Submit Error:", err);

            Swal.fire(
                "Error",
                "Server error. Please try again.",
                "error"
            );

        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };





    // UPDATED: Added dark mode text color for labels
    const InputField = ({
        label,
        name,
        type = "text",
        placeholder,
        touched,
        errors,
        handleChange,
        values,
        className,
        disabled,
    }: any) => (
        <div className={`flex flex-col ${className} dark:text-gray-100`}>
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
                className={`${bigInputClasses} ${errors[name] && touched[name]
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                    }`}
            />

            {/* 🔥 Reserve space always */}
            <div className="min-h-[16px] mt-1">
                {errors[name] && touched[name] && (
                    <span className="text-xs text-red-600">
                        {errors[name]}
                    </span>
                )}
            </div>
        </div>
    );

    // ---------------- TOGGLE SWITCH ----------------
    const ToggleSwitch = ({ name, value, onChange }) => {
        return (
            <button
                type="button"
                onClick={() => onChange(name, !value)}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200
        ${value ? "bg-primary-button-bg" : "bg-gray-300 dark:bg-gray-600"}`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200
          ${value ? "translate-x-6" : "translate-x-1"}`}
                />
            </button>
        );
    };


    const tabs = [
        { label: "Pricing", icon: <FaRegAddressCard size={18} /> },
        { label: "Image", icon: <FaFile size={16} /> },
        { label: "Description", icon: <FaUser size={16} /> },
    ];

    if (isEditMode && initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-white dark:bg-[#0c1427] rounded-lg">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Loading package details...
                    </span>
                </div>
            </div>
        );
    }

    if (permissionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0c1427] rounded-md">
                <div className="flex flex-col items-center gap-3">
                    <div className="theme-loader"></div>
                    {/* <p className="text-sm text-gray-500">
          Loading permissions...
        </p> */}

                </div>
            </div>
        );
    }
   

    return (
        <Formik
            initialValues={form}
            validationSchema={companyValidationSchema}
            enableReinitialize
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


                    {(loading || isSubmitting || permissionLoading) && (
                        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0c1427] /50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                            <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                        <div className="text-lg font-bold text-gray-800 dark:text-white">
                            {isEditMode ? "Edit Package" : "Add Package"}
                        </div>

                        <div className="flex gap-x-2">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm font-medium transition-colors"
                            >
                                Back
                            </button>
                            <PermissionAwareTooltip
                                allowed={isEditable}
                                allowedText={isEditMode ? "Update Package" : "Add Package"}
                                deniedText="Permission required"
                            >
                                <button
                                    type="submit"
                                    disabled={!isEditable || loading || isSubmitting}
                                    className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2
        ${!isEditable
                                            ? "bg-gray-300 text-white cursor-not-allowed"
                                            : "bg-primary-button-bg hover:bg-primary-button-bg-hover text-white"
                                        }`}
                                >
                                    {isEditMode ? "Update Package" : "Add Package"}
                                </button>
                            </PermissionAwareTooltip>



                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0c1427] rounded-lg dark:text-gray-100 p-4 px-5 mt-2 mb-3">
                        <div className="flex flex-col md:flex-row gap-8 items-start">


                            {/* --- RIGHT: FORM FIELDS --- */}
                            <div className="flex-1 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                                    <InputField
                                        label="Package Name:*"
                                        name="companyName"
                                        placeholder="Enter package name"
                                        values={values}
                                        handleChange={handleChange}
                                        errors={errors}
                                        touched={touched}
                                    />



                                    <div className="flex flex-col">
                                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            Package Type<span className="text-red-500 ml-0.5">*</span>
                                        </label>

                                        <select
                                            name="packageType"
                                            value={values.packageType || ""}
                                            onChange={handleChange}
                                            onBlur={() => setFieldValue("packageType", values.packageType)}
                                            className={`border rounded px-3 py-2 text-sm h-10
  bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
  focus:outline-none focus:ring-1 focus:ring-primary-button-bg focus:border-primary-button-bg
  ${errors.packageType && touched.packageType
                                                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                                    : "border-gray-300 dark:border-primary-button-bg"
                                                }`}

                                        >
                                            <option value="">Select Package Type</option>
                                            <option value="Flexible">Flexible</option>
                                            <option value="Fixed">Fixed</option>
                                        </select>

                                        {/* Error Message */}
                                        <div className="min-h-[16px] mt-1">
                                            {errors.packageType && touched.packageType && (
                                                <span className="text-xs text-red-600">
                                                    {errors.packageType}
                                                </span>
                                            )}
                                        </div>
                                    </div>



                                    <InputField
                                        label="Validity:*"
                                        name="validity"
                                        placeholder="Enter number of days"
                                        values={values}
                                        handleChange={handleChange}
                                        errors={errors}
                                        touched={touched}
                                    />

                                    {/* Publish Toggle */}
                                    <div className="flex flex-col">
                                        {/* Fake label to match height */}
                                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            &nbsp;
                                        </label>

                                        {/* Toggle Box (same height as input) */}
                                        <div className="flex items-center justify-between h-10
    border border-gray-300 dark:border-gray-700
    rounded-md px-3 bg-white dark:bg-gray-800"
                                        >
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Publish on Website
                                            </span>

                                            <ToggleSwitch
                                                name="isPublished"
                                                value={values.isPublished}
                                                onChange={setFieldValue}
                                            />
                                        </div>

                                        {/* 🔥 Reserve error space (VERY IMPORTANT) */}
                                        <div className="min-h-[16px] mt-1"></div>
                                    </div>

                                </div>
                            </div>
                        </div>



                        {/* ---------------- TABS NAVIGATION ---------------- */}
                        <div className="mt-10 mb-6">
                            <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4 md:gap-6 overflow-x-auto whitespace-nowrap">
                                {tabs.map((t, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setTab(i)}
                                        // FIX APPLIED: flex-shrink-0 prevents the buttons from getting squashed
                                        className={`pb-2 px-5 text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 ${tab === i
                                            ? "border-b-2 border-primary-button-bg text-primary-button-bg"
                                            : "text-gray-500 dark:text-gray-400 hover:text-primary-button-bg dark:hover:text-gray-200 border-b-2 border-transparent"
                                            }`}
                                    >
                                        {t.icon}
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>



                        {/* TAB 3: Pricing */}
                        {tab === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">

                                {/* Flexible Package */}
                                {values.packageType === "Flexible" && (
                                    <>
                                        <InputField
                                            label="Min Amount:*"
                                            name="minAmount"
                                            placeholder="Enter minimum amount"
                                            values={values}
                                            handleChange={handleChange}
                                            errors={errors}
                                            touched={touched}
                                        />

                                        <InputField
                                            label="Max Amount:*"
                                            name="maxAmount"
                                            placeholder="Enter maximum amount"
                                            values={values}
                                            handleChange={handleChange}
                                            errors={errors}
                                            touched={touched}
                                        />
                                    </>
                                )}

                                {/* Fixed Package */}
                                {values.packageType === "Fixed" && (
                                    <InputField
                                        label="Amount:*"
                                        name="amount"
                                        placeholder="Enter amount"
                                        values={values}
                                        handleChange={handleChange}
                                        errors={errors}
                                        touched={touched}
                                    />
                                )}

                                {/* When nothing selected */}
                                {!values.packageType && (
                                    <div className="col-span-full text-gray-400 text-sm">
                                        Please select Package Type first
                                    </div>
                                )}
                            </div>
                        )}



                        {/* TAB: Images */}
                        {tab === 1 && (
                            <div className="space-y-6 animate-fadeIn">

                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                    {/* Upload */}
                                    <label
                                        htmlFor="imageUpload"
                                        className="inline-flex items-center gap-2 px-4 py-2 
        bg-primary-button-bg text-white rounded-md cursor-pointer 
        hover:bg-primary-button-bg-hover transition shadow"
                                    >
                                        <FaUpload />
                                        Upload Images
                                    </label>

                                    <input
                                        id="imageUpload"
                                        type="file"
                                        hidden
                                        multiple
                                        accept="image/*"
                                        onChange={handleImagesUpload}
                                    />

                                    {/* Info */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500">

                                        <span>
                                            {images.length} / 10 Images
                                        </span>

                                        {images.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setImages([])}
                                                className="text-red-500 hover:underline"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>


                                {/* Drag Area */}
                                {/* <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();

                                        if (e.dataTransfer.files.length > 1) {
                                            toast.error("Please drop only one image at a time.");
                                            return;
                                        }

                                        handleImagesUpload({
                                            target: { files: e.dataTransfer.files },
                                        });
                                    }}

                                    className="border-2 border-dashed border-gray-300 dark:border-gray-700
      rounded-lg p-6 text-center text-gray-500
      hover:border-primary-500 transition"
                                >
                                    Drag & Drop images here
                                    <br />
                                    <span className="text-xs">
                                        or click Upload
                                    </span>
                                </div> */}


                                {/* Preview Grid */}
                                {images.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">

                                        {images.map((img, index) => (
                                            <div
                                                key={index}
                                                className="relative group"
                                            >

                                                {/* Image Wrapper */}
                                                <div
                                                    className={`relative w-36 h-36 rounded-xl overflow-hidden
              shadow-lg border-4 transition-all duration-200
              ${img.isDefault
                                                            ? "border-green-500 ring-2 ring-green-400/50"
                                                            : "border-white dark:border-gray-700"
                                                        }`}
                                                >

                                                    {/* Image */}
                                                    <img
                                                        src={img.preview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover cursor-pointer"
                                                        onClick={() => window.open(img.preview, "_blank")}
                                                    />


                                                    {/* Hover Overlay */}
                                                    <div
                                                        className="absolute inset-0 bg-black/40 opacity-0 
                group-hover:opacity-100 transition
                flex items-center justify-center gap-3"
                                                    >

                                                        {/* Default */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setDefaultImage(index)}
                                                            title="Set Default"
                                                            className="w-9 h-9 rounded-full bg-white 
                  text-primary-500 flex items-center justify-center shadow
                  hover:scale-105 transition"
                                                        >
                                                            ⭐
                                                        </button>
                                                        {/* View */}
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(img.preview, "_blank")}
                                                            title="View Image"
                                                            className="w-9 h-9 rounded-full bg-white 
        text-blue-500 flex items-center justify-center shadow
        hover:scale-105 transition"
                                                        >
                                                            👁
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            title="Delete"
                                                            className="w-9 h-9 rounded-full bg-white 
                  text-red-500 flex items-center justify-center shadow
                  hover:scale-105 transition"
                                                        >
                                                            <FaTimes size={14} />
                                                        </button>
                                                    </div>


                                                    {/* Default Badge */}
                                                    {img.isDefault && (
                                                        <span
                                                            className="absolute top-2 left-2 bg-green-600 
                  text-white text-xs px-2 py-0.5 rounded shadow"
                                                        >
                                                            Default
                                                        </span>
                                                    )}
                                                </div>


                                                {/* Index */}
                                                <p className="text-center text-xs text-gray-500 mt-1">
                                                    #{index + 1}
                                                </p>

                                            </div>
                                        ))}

                                    </div>
                                ) : (
                                    <div
                                        className="py-12 text-center border border-dashed
        border-gray-300 dark:border-gray-700 rounded-lg"
                                    >
                                        <FaUpload className="mx-auto text-4xl text-gray-400 mb-2" />

                                        <p className="text-gray-400">
                                            No images uploaded yet
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            Upload product/package images
                                        </p>
                                    </div>
                                )}

                            </div>
                        )}



                        {/* TAB 3: Description */}
                        {tab === 2 && (
                            <div className="space-y-6 animate-fadeIn">

                                {/* Short Description */}
                                <div>
                                    <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
                                        Short Description
                                    </label>

                                    <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#0c1427]">
                                        <EditorProvider>
                                            <Editor
                                                value={values.shortDesc}
                                                onChange={(e: ContentEditableEvent) =>
                                                    setFieldValue("shortDesc", e.target.value)
                                                }
                                                style={{ minHeight: "150px" }}
                                                className="rsw-editor dark:text-gray-100"
                                            >
                                                <Toolbar>
                                                    <BtnUndo />
                                                    <BtnRedo />
                                                    <Separator />

                                                    <BtnBold />
                                                    <BtnItalic />
                                                    <BtnUnderline />
                                                    <Separator />

                                                    <BtnBulletList />
                                                    <BtnNumberedList />
                                                    <Separator />

                                                    <BtnLink />
                                                    <BtnClearFormatting />
                                                    <Separator />

                                                    <BtnStyles />
                                                </Toolbar>
                                            </Editor>
                                        </EditorProvider>
                                    </div>

                                    {errors.shortDesc && touched.shortDesc && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.shortDesc}
                                        </p>
                                    )}
                                </div>

                                {/* Long Description */}
                                <div>
                                    <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
                                        Long Description
                                    </label>

                                    <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#0c1427]">
                                        <EditorProvider>
                                            <Editor
                                                value={values.longDesc}
                                                onChange={(e: ContentEditableEvent) =>
                                                    setFieldValue("longDesc", e.target.value)
                                                }
                                                style={{ minHeight: "250px" }}
                                                className="rsw-editor dark:text-gray-100"
                                            >
                                                <Toolbar>
                                                    <BtnUndo />
                                                    <BtnRedo />
                                                    <Separator />

                                                    <BtnBold />
                                                    <BtnItalic />
                                                    <BtnUnderline />
                                                    <BtnStrikeThrough />
                                                    <Separator />

                                                    <BtnBulletList />
                                                    <BtnNumberedList />
                                                    <Separator />

                                                    <BtnLink />
                                                    <BtnClearFormatting />
                                                    <HtmlButton />
                                                    <Separator />

                                                    <BtnStyles />
                                                </Toolbar>
                                            </Editor>
                                        </EditorProvider>
                                    </div>

                                    {errors.longDesc && touched.longDesc && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.longDesc}
                                        </p>
                                    )}
                                </div>

                            </div>
                        )}


                    </div>


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
