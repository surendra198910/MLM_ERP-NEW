"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { ChangeEvent } from "react";
import {
    FaUserCircle,
    FaTrash,
    FaUpload,
    FaEdit,
    FaTimes,
    FaPencilAlt,
    FaRegAddressCard,
    FaFile,
    FaUser,
    FaBuilding,
    FaBriefcase,
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

import type { ContentEditableEvent } from "react-simple-wysiwyg";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, useFormikContext } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import CropperModal from "../Cropper/Croppermodel";
import { PostService } from "../../../../services/PostService";
import { SmartActions } from "../Security/SmartAction";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface DropdownOption {
    value: string | number;
    label: string;
}

interface MasterDocument {
    DocumentId: number;
    DocumentName: string;
}

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
// FORM OBSERVER
// ----------------------------------------------------------------------

interface ObserverProps {
    setStates: React.Dispatch<React.SetStateAction<DropdownOption[]>>;
    setCities: React.Dispatch<React.SetStateAction<DropdownOption[]>>;
    setLoadingStates: React.Dispatch<React.SetStateAction<boolean>>;
    setLoadingCities: React.Dispatch<React.SetStateAction<boolean>>;
    fetchDDL: (params: any) => Promise<any[]>;
    normalizeDDL: (
        data: any[],
        idKey: string,
        nameKey: string,
    ) => DropdownOption[];
    countries: DropdownOption[];
    states: DropdownOption[];
    cities: DropdownOption[];

    billToManuallyEdited: boolean;
    shipToManuallyEdited: boolean;
}

const buildFullAddress = (
    values: FormValues,
    countries: DropdownOption[],
    states: DropdownOption[],
    cities: DropdownOption[],
) => {
    const getLabel = (options: DropdownOption[], value: any) =>
        options.find((o) => String(o.value) === String(value))?.label || "";

    const countryName = getLabel(countries, values.country);
    const stateName = getLabel(states, values.state);
    const cityName = getLabel(cities, values.city);

    return [
        values.companyName,
        values.address,
        cityName && stateName ? `${cityName}, ${stateName}` : "",
        countryName && values.zip ? `${countryName} - ${values.zip}` : countryName,
    ]
        .filter(Boolean)
        .join(",\n");
};

const FormObserver: React.FC<ObserverProps> = ({
    setStates,
    setCities,
    setLoadingStates,
    setLoadingCities,
    fetchDDL,
    normalizeDDL,
    countries,
    states,
    cities,
    billToManuallyEdited,
    shipToManuallyEdited,
}) => {
    const { values, setFieldValue } = useFormikContext<FormValues>();

    useEffect(() => {
        if (!values.country) {
            setStates([]);
            setCities([]);
            return;
        }
        let isActive = true;
        const loadStates = async () => {
            setLoadingStates(true);
            const data = await fetchDDL({
                tbl: "master.state",
                searchField: "statename",
                filterCTL: "countryid",
                filterCTLvalue: values.country,
            });
            if (isActive) {
                setStates(normalizeDDL(data, "id", "name"));
                setLoadingStates(false);
            }
        };
        loadStates();
        return () => {
            isActive = false;
        };
    }, [values.country, normalizeDDL, setStates, setCities, setLoadingStates]);

    useEffect(() => {
        if (!values.state) {
            setCities([]);
            return;
        }
        let isActive = true;
        const loadCities = async () => {
            setLoadingCities(true);
            const data = await fetchDDL({
                tbl: "master.city",
                searchField: "cityname",
                filterCTL: "stateid",
                filterCTLvalue: values.state,
            });
            if (isActive) {
                setCities(normalizeDDL(data, "id", "name"));
                setLoadingCities(false);
            }
        };
        loadCities();
        return () => {
            isActive = false;
        };
    }, [values.state, normalizeDDL, setCities, setLoadingCities]);

    useEffect(() => {
        const autoAddress = buildFullAddress(values, countries, states, cities);

        if (!billToManuallyEdited) {
            setFieldValue("billTo", autoAddress);
        }

        if (!shipToManuallyEdited) {
            setFieldValue("shipTo", autoAddress);
        }
    }, [
        values.companyName,
        values.address,
        values.country,
        values.state,
        values.city,
        values.zip,
        countries,
        states,
        cities,
        billToManuallyEdited,
        shipToManuallyEdited,
    ]);

    return null;
};

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
    const [loadingDocs, setLoadingDocs] = useState<boolean>(false);

    // Loaders
    const [loadingStates, setLoadingStates] = useState<boolean>(false);
    const [loadingCities, setLoadingCities] = useState<boolean>(false);
    const [loadingParent, setLoadingParent] = useState<boolean>(false);
    const [loadingLogo, setLoadingLogo] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(false);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState<boolean>(false);

    // Data
    const [countries, setCountries] = useState<DropdownOption[]>([]);
    const [states, setStates] = useState<DropdownOption[]>([]);
    const [cities, setCities] = useState<DropdownOption[]>([]);
    const [parentCompanies, setParentCompanies] = useState<DropdownOption[]>([]);

    // Images & Docs
    const [showCropper, setShowCropper] = useState<boolean>(false);
    const [rawImage, setRawImage] = useState<string>("");
    const [companyLogo, setCompanyLogo] = useState<string>("");
    const [masterDocuments, setMasterDocuments] = useState<MasterDocument[]>([]);
    const [docValues, setDocValues] = useState<Record<number, DocumentValue>>({});

    // Progress
    const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
        {},
    );

    const [currencies, setCurrencies] = useState<DropdownOption[]>([]);
    const [loadingCurrency, setLoadingCurrency] = useState(false);

    const [billToManuallyEdited, setBillToManuallyEdited] = useState(false);
    const [shipToManuallyEdited, setShipToManuallyEdited] = useState(false);

    // Multiple Images
    const [images, setImages] = useState([]);
    // { file, preview, fileName, isDefault, uploading }

    const [uploadingIndex, setUploadingIndex] = useState(null);
    // Handle multiple images
    const handleImagesUpload = async (e) => {
        const files = Array.from(e.target.files);

        if (!files.length) return;

        for (let file of files) {

            if (file.size > 2 * 1024 * 1024) {
                toast.error(`${file.name} is larger than 2MB`);
                continue;
            }

            // Preview immediately
            const preview = URL.createObjectURL(file);

            const tempImage = {
                file,
                preview,
                fileName: "",
                isDefault: images.length === 0, // 🔥 First image = default
                uploading: true,
            };


            // Add temp image first
            setImages((prev) => [...prev, tempImage]);

            try {

                /* ===== Upload via PostService ===== */

                const fd = new FormData();
                fd.append("UploadedImage", file);
                fd.append("pagename", "EmpDoc");

                const res = await postDocument(fd);

                const uploadedFileName = res?.fileName || res?.Message;

                if (!uploadedFileName) {
                    toast.error("Image upload failed");
                    continue;
                }

                /* ===== Update uploaded image ===== */

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

                console.error("Image upload error:", err);
                toast.error("Image upload failed");

                // Remove failed upload
                setImages((prev) =>
                    prev.filter((img) => img.preview !== preview)
                );
            }
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


    // Remove image
    // Remove image with confirmation
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



    // Set default image
    // Set default image with confirmation
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



    const editDisabled = {
        email: isEditMode,
        companyType: isEditMode,
        parentCompanyId: isEditMode,
        companyCodePrefix: isEditMode,
        employeeCodePrefix: isEditMode,
        companyStartSeries: isEditMode,
        employeeStartSeries: isEditMode,
        defaultCurrency: isEditMode,
        billPrefix: isEditMode,
        invoiceTerms: isEditMode,
        isTaxApplicable: isEditMode,
    };
    const initialValues: FormValues = {
        companyName: "",
        isPublished: true,
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
    const DOCUMENT_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

    const CURRENT_FORM_ID = 20;
    const canAddCompany = SmartActions.canAddCompany(CURRENT_FORM_ID);
    const canEditCompany = SmartActions.canEditCompany(CURRENT_FORM_ID);

    const openDocument = (fileName?: string) => {
        if (!fileName) return;
        const url = `${DOCUMENT_PREVIEW_URL}${fileName}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const openLogoInNewTab = () => {
        if (!companyLogo) return;
        const url = IMAGE_PREVIEW_URL
            ? `${IMAGE_PREVIEW_URL}${companyLogo}`
            : companyLogo;

        window.open(url, "_blank", "noopener,noreferrer");
    };

    // --- STYLES ---
    // UPDATED: Added dark mode classes for bg, border, text, placeholder
    const bigInputClasses =
        "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 " +
        "placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all " +
        "bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

    const normalizeDDL = useCallback(
        (data: any[], idKey: string, nameKey: string): DropdownOption[] =>
            data.map((x) => ({ value: x[idKey], label: x[nameKey] })),
        [],
    );

    const fetchCompanyPermissions = async () => {
        try {
            setPermissionLoading(true);

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "AssignForm",
                Para: JSON.stringify({
                    ActionMode: "Forms",
                    FormCategoryId: 11, // Package category
                    EmployeeId: employeeId,
                }),
            };

            const response = await universalService(payload);
            const data = response?.data ?? response;

            // ❌ Invalid response
            if (!Array.isArray(data)) {
                setHasPageAccess(false);
                return;
            }

            // 🔍 Find THIS PAGE permission
            const pagePermission = data.find(
                (p) =>
                    Number(p.FormId) === CURRENT_FORM_ID &&
                    Number(p.FormCategoryId) === 11,
            );

            // ❌ No Action = No Access
            if (!pagePermission || !pagePermission.Action?.trim()) {
                setHasPageAccess(false);
                return;
            }

            // ✅ Permission OK
            SmartActions.load(data);
            setHasPageAccess(true);
        } catch (err) {
            console.error("Package permission fetch failed", err);
            setHasPageAccess(false);
        } finally {
            setPermissionLoading(false);
        }
    };

    const fetchDDL = useCallback(
        async ({ tbl, searchField, filterCTL = "", filterCTLvalue = "" }: any) => {
            try {
                const payload = {
                    procName: "GetDDLData",
                    Para: JSON.stringify({
                        tbl,
                        searchField,
                        filterCTL,
                        filterCTLvalue,
                        filterData: "",
                    }),
                };
                const response = await universalService(payload);
                return Array.isArray(response?.data) ? response.data : response || [];
            } catch (err) {
                console.log("DDL Error:", err);
                return [];
            }
        },
        [universalService],
    );

    const fetchMasterDocuments = useCallback(async () => {
        try {
            setLoadingDocs(true);
            const payload = {
                procName: "CompanyDocuments",
                Para: JSON.stringify({ ActionMode: "Select" }),
            };
            const res = await universalService(payload);
            const data = res?.data || res;
            if (Array.isArray(data)) setMasterDocuments(data);
        } catch (err) {
            console.error("Error fetching documents:", err);
        } finally {
            setLoadingDocs(false);
        }
    }, [universalService]);

    const fetchParentCompanies = useCallback(async () => {
        try {
            setLoadingParent(true);
            const data = await fetchDDL({
                tbl: "Package.CompanyMaster",
                searchField: "CompanyName",
            });
            setParentCompanies(normalizeDDL(data, "id", "name"));
        } catch (err) {
            console.error("Error fetching companies", err);
        } finally {
            setLoadingParent(false);
        }
    }, [normalizeDDL]);

    const fetchCurrencies = useCallback(async () => {
        try {
            setLoadingCurrency(true);

            const payload = {
                procName: "Package",
                Para: JSON.stringify({
                    ActionMode: "GetCurrency",
                }),
            };

            const res = await universalService(payload);
            const data = res?.data || res;

            if (Array.isArray(data)) {
                setCurrencies(
                    data.map((x: any) => ({
                        value: x.id,
                        label: x.name,
                    })),
                );
            }
        } catch (err) {
            console.error("Currency DDL error", err);
        } finally {
            setLoadingCurrency(false);
        }
    }, [universalService]);

    useEffect(() => {
        const loadBasics = async () => {
            const countryData = await fetchDDL({
                tbl: "master.country",
                searchField: "countryname",
            });
            setCountries(normalizeDDL(countryData, "id", "name"));
            fetchMasterDocuments();
            fetchParentCompanies();
            fetchCurrencies();
        };
        loadBasics();
    }, [normalizeDDL]);

    useEffect(() => {
        // 🔥 SWITCHED TO ADD MODE (Edit → Add)
        if (!id) {
            setForm(initialValues); // Reset Formik values
            setCompanyLogo(""); // Clear logo
            setRawImage("");
            setDocValues({}); // Clear documents
            setTab(0); // Reset tab
            setBillToManuallyEdited(false);
            setShipToManuallyEdited(false);

            // Clear dependent dropdowns
            setStates([]);
            setCities([]);
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const loadCompanyData = async () => {
            try {
                setInitialLoading(true);

                const payload = {
                    procName: "Package",
                    Para: JSON.stringify({
                        ActionMode: "Select",
                        EditId: Number(id),
                    }),
                };

                const res = await universalService(payload);
                const data = res?.data?.[0] || res?.[0];

                if (!data || !isMounted) return;

                // ---------- LOGO ----------
                setCompanyLogo(data.CompanyLogo || "");

                // ---------- FORM VALUES ----------
                const newForm: FormValues = {
                    companyName: data.CompanyName || "",

                    packageType: data.PackageType || "",
                    minAmount: data.MinAmount || "",
                    maxAmount: data.MaxAmount || "",
                    amount: data.Amount || "",

                    validity: data.Validity || "",

                    companyCodePrefix: data.CompanyCodePrefix || "",
                    isPublished: data.IsPublished === 1,
                    shortDesc: data.ShortDesc || "", // ✅
                    longDesc: data.LongDesc || "",   // ✅
                };


                setForm(newForm);

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
        fetchCompanyPermissions();
    }, []);

    const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Logo must be under 2MB");
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
            const file = new File([blob], `company_logo${ext}`, { type: mime });
            const fd = new FormData();
            fd.append("UploadedImage", file);
            fd.append("pagename", "EmpDoc");

            const response = await postDocument(fd);
            const fileName = response?.fileName || response?.Message;
            if (fileName) setCompanyLogo(fileName);
        } catch (err) {
            console.error(err);
            toast.error("Logo upload failed");
        } finally {
            setLoadingLogo(false);
        }
    };

    const deleteLogo = () => {
        Swal.fire({
            title: "Remove company logo?",
            text: "This action will remove the company logo.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, remove it",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444", // red
            cancelButtonColor: "#9ca3af", // gray
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                setCompanyLogo("");
                setRawImage("");

                Swal.fire({
                    title: "Removed!",
                    text: "Package logo has been removed.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    // --- HANDLE FILE UPLOAD USING POSTSERVICE (WITH PROGRESS) ---
    const handleFileUpload = async (docId: number, file?: File) => {
        if (!file) return;

        // Reset progress
        setUploadProgress((prev) => ({ ...prev, [docId]: 0 }));

        // Set temporary file for UI while uploading
        setDocValues((prev) => ({
            ...prev,
            [docId]: {
                ...prev[docId],
                file,
                isExisting: false,
            }, // Store file object to show name
        }));

        try {
            const fd = new FormData();
            fd.append("UploadedImage", file);
            fd.append("pagename", "EmpDoc");

            // Use PostService, passing the onProgress callback as second arg
            const response = await postDocument(fd, (percent) => {
                setUploadProgress((prev) => ({ ...prev, [docId]: percent }));
            });

            const fileName = response?.fileName || response?.Message;

            if (fileName) {
                setDocValues((prev) => ({
                    ...prev,
                    [docId]: { ...prev[docId], fileName }, // Save real filename
                }));

                // Ensure progress is 100%
                setUploadProgress((prev) => ({ ...prev, [docId]: 100 }));

                // Clear progress after delay
                setTimeout(() => {
                    setUploadProgress((prev) => {
                        const newState = { ...prev };
                        delete newState[docId];
                        return newState;
                    });
                }, 1000);
            } else {
                toast.error("Upload failed: No filename received");
                // Revert UI if failed
                setDocValues((prev) => ({
                    ...prev,
                    [docId]: { ...prev[docId], file: undefined },
                }));
            }
        } catch (error) {
            console.error("Document upload failed:", error);
            toast.error("Document upload failed");
            // Revert UI if failed
            setDocValues((prev) => ({
                ...prev,
                [docId]: { ...prev[docId], file: undefined },
            }));
        }
    };

    const removeFileOnly = (
        docId: number,
        docName?: string,
        fileName?: string,
    ) => {
        Swal.fire({
            title: "Remove document?",
            text: docName
                ? `Are you sure you want to remove "${docName}"?`
                : "Are you sure you want to remove this document?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, remove it",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#9ca3af",
            reverseButtons: true,
        }).then((result) => {
            if (!result.isConfirmed) return;

            setDocValues((prev) => ({
                ...prev,
                [docId]: {
                    ...prev[docId],
                    file: undefined,
                    fileName: "",
                    isDeleted: true, // 🔥 backend delete flag
                },
            }));

            Swal.fire({
                title: "Removed!",
                text: "Document will be removed after saving.",
                icon: "success",
                timer: 1400,
                showConfirmButton: false,
            });
        });
    };

    const handleSubmit = async (
        values: FormValues,
        { resetForm, setSubmitting }: FormikHelpers<FormValues>
    ) => {

        setLoading(true);

        try {

            /* ================= PRICE LOGIC ================= */

            let minPrice: string | null = null;
            let maxPrice: string | null = null;

            if (values.packageType === "Fixed") {
                // Fixed → Same value for Min & Max
                minPrice = values.amount || null;
                maxPrice = values.amount || null;
            }
            else if (values.packageType === "Flexible") {
                // Flexible → Use Min / Max
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


            /* ================= PAYLOAD ================= */

            const payload = {
                procName: "CreatePackage", // ✅ Stored Procedure
                Para: JSON.stringify({

                    ActionMode: actionMode,

                    // For Update (if needed later)
                    // ProductId: isEditMode ? Number(id) : null,

                    CompanyId: 1,
                    CategoryId: 1,

                    Type: values.packageType,
                    ProductName: values.companyName,

                    // ✅ Correct price values
                    MinAmount: minPrice,
                    MaxAmount: maxPrice,

                    Publish: values.isPublished ? 1 : 0,

                    ShortDesc: values.shortDesc,
                    LongDesc: values.longDesc,

                    Validity: values.validity,

                    EntryBy: employeeId,

                    ImagesJson: JSON.stringify(imagesPayload),
                }),
            };


            /* ================= API ================= */

            const response = await universalService(payload);

            const res = Array.isArray(response)
                ? response[0]
                : response?.data?.[0];


            /* ================= RESULT ================= */

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

                navigate("/superadmin/company/manage-company/branch");

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


    // UPDATED: Added dark mode text color for labels
    const SelectField = ({
        label,
        name,
        options,
        touched,
        errors,
        handleChange,
        values,
        loading,
        disabled,
        className,
        onCustomChange,
    }: any) => {
        const cleanLabel = label ? label.replace("*", "").trim() : "Option";
        const placeholder = `Select ${cleanLabel}`;

        return (
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
                <div className="relative">
                    <select
                        name={name}
                        value={values[name] || ""}
                        onChange={(e) => {
                            handleChange(e);
                            if (onCustomChange) onCustomChange(e);
                        }}
                        disabled={disabled || loading}
                        className={`${bigInputClasses} ${disabled || loading
                            ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400"
                            : ""
                            } ${errors[name] && touched[name] ? "border-red-500" : ""}`}
                    >
                        <option value="">{placeholder}</option>
                        {options.map((o: DropdownOption, i: number) => (
                            <option key={i} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    {loading && (
                        <div className="absolute right-3 top-3 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
                {errors[name] && touched[name] && (
                    <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
                )}
            </div>
        );
    };

    const TextAreaField = ({
        label,
        name,
        placeholder,
        touched,
        errors,
        handleChange,
        values,
        className,
    }: any) => (
        <div className={`flex flex-col ${className}`}>
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
            <textarea
                name={name}
                rows={3}
                placeholder={placeholder}
                value={values[name] || ""}
                onChange={handleChange}
                className={`${bigInputClasses.replace("h-10", "h-auto")} ${errors[name] && touched[name] ? "border-red-500" : ""
                    }`}
            ></textarea>
            {errors[name] && touched[name] && (
                <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
            )}
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
                        Loading company details...
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
    if (!hasPageAccess) {
        return (
            <div
                className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 
                 dark:border-[#172036] p-25 flex flex-col md:flex-row 
                 items-center md:items-start justify-center md:gap-x-40 min-h-[450px]"
            >
                {/* LEFT SECTION */}
                <div className="md:max-w-md md:px-3 px-0 py-14">
                    <h1 className="text-3xl font-semibold text-black dark:text-white mb-4">
                        Access Restricted
                    </h1>

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-[15px]">
                        You do not have the necessary permissions to view this module.
                        <br />
                        Please contact your administrator to request access or switch to an
                        authorized account.
                    </p>
                </div>

                {/* RIGHT ILLUSTRATION (Primary Themed Shield) */}
                <div className="hidden md:flex">
                    <svg
                        viewBox="0 0 512 512"
                        className="w-[320px] h-auto opacity-100 select-none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Main Shield - Primary 500 */}
                        <path
                            d="M256 40C150 40 60 80 60 180C60 300 256 472 256 472C256 472 452 300 452 180C452 80 362 40 256 40Z"
                            className="fill-primary-500"
                        />

                        {/* Inner Highlight - Primary 400 */}
                        <path
                            d="M256 75C185 75 105 105 105 180C105 265 256 405 256 405C256 405 407 265 407 180C407 105 327 75 256 75Z"
                            className="fill-primary-400"
                        />

                        {/* White Padlock Body */}
                        <rect
                            x="186"
                            y="215"
                            width="140"
                            height="105"
                            rx="12"
                            className="fill-white"
                        />

                        {/* Padlock Shackle */}
                        <path
                            d="M210 215V175C210 149.5 230.5 129 256 129C281.5 129 302 149.5 302 175V215"
                            fill="none"
                            stroke="white"
                            strokeWidth="22"
                            strokeLinecap="round"
                        />

                        {/* Keyhole detail - Primary 500 */}
                        <circle cx="256" cy="265" r="10" className="fill-primary-500" />
                        <path
                            d="M251 270L261 270L264 290L248 290Z"
                            className="fill-primary-500"
                        />
                    </svg>
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
                            <button
                                type="submit"
                                disabled={loading || isSubmitting}
                                className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2
    ${loading || isSubmitting
                                        ? "bg-gray-300 text-white cursor-not-allowed"
                                        : "bg-primary-button-bg hover:bg-primary-button-bg-hover text-white"
                                    }`}
                            >
                                {loading || isSubmitting ? "Submitting..." : "Submit"}
                            </button>

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
                                        placeholder="Enter company name"
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
      ${errors.packageType && touched.packageType
                                                    ? "border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 dark:border-gray-700"
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
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
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
                                </div>


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
                </form>
            )}
        </Formik>
    );
}
