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
  email: string;
  phone: string;
  websiteUrl: string;
  companyType: string;
  parentCompanyId: string | number;
  address: string;
  billTo: string;
  shipTo: string;
  country: string | number;
  state: string | number;
  city: string | number;
  zip: string;
  contactName: string;
  contactEmail: string;
  contactMobile: string;
  companyCodePrefix: string;
  employeeCodePrefix: string;
  /* Company Settings */
  companyStartSeries: number;
  defaultCurrency: number;
  billPrefix: string;
  invoiceTerms: string;
  isTaxApplicable: boolean;
  /* Employee Settings */
  employeeStartSeries: number;
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
  companyName: Yup.string().required("Company Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone number is required"),
  companyCodePrefix: Yup.string()
    .matches(/^[A-Z]{1,5}$/, "Only uppercase letters (1–5 chars)")
    .required("Company code prefix is required"),

  employeeCodePrefix: Yup.string()
    .matches(/^[A-Z]{1,5}$/, "Only uppercase letters (1–5 chars)")
    .required("Employee code prefix is required"),
  companyType: Yup.string().required("Company Type is required"),
  parentCompanyId: Yup.string().when("companyType", {
    is: (val: string) => val === "Branch",
    then: () =>
      Yup.string().required("Parent Company is required for Branches"),
    otherwise: () => Yup.string().notRequired(),
  }),
  country: Yup.string().required("Country is required"),
  state: Yup.string().required("State is required"),
  city: Yup.string().required("City is required"),
  address: Yup.string().required("Address is required"),
  billTo: Yup.string().required("Bill To address is required"),
  shipTo: Yup.string().required("Ship To address is required"),
  zip: Yup.string().required("Pin Code is required"),
  companyStartSeries: Yup.number().min(1).required(),
  employeeStartSeries: Yup.number().min(1).required(),
  billPrefix: Yup.string().required("Bill prefix is required"),
  defaultCurrency: Yup.number()
    .min(1, "Please select currency")
    .required("Default currency is required"),
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
    email: "",
    phone: "",
    websiteUrl: "",
    companyType: "Company",
    parentCompanyId: "",
    address: "",
    billTo: "",
    shipTo: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    contactName: "",
    contactEmail: "",
    contactMobile: "",
    companyCodePrefix: "",
    employeeCodePrefix: "",
    companyStartSeries: 5000,
    defaultCurrency: 1,
    billPrefix: "",
    invoiceTerms: "",
    isTaxApplicable: true,
    employeeStartSeries: 7000,
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
          FormCategoryId: 11, // Company category
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
      console.error("Company permission fetch failed", err);
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
        tbl: "Company.CompanyMaster",
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
        procName: "Company",
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
          procName: "Company",
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
          email: data.EmailId || "",
          phone: data.ContactNo || "",
          websiteUrl: data.WebUrl || "",

          companyType: data.CompanyType || "Company",
          parentCompanyId: data.ParentCompanyId || "",

          address: data.Address || "",
          billTo: data.BillTo || "",
          shipTo: data.ShipTo || "",

          zip: data.PinCode || "",
          country: data.CountryId?.split("|")?.[0] || "",
          state: data.StateId?.split("|")?.[0] || "",
          city: data.CityId?.split("|")?.[0] || "",

          contactName: data.ContactPersonName || "",
          contactEmail: data.ContactPersonEmail || "",
          contactMobile: data.ContactPersonMobile || "",

          companyCodePrefix: data.CompanyCodePrefix || "",
          employeeCodePrefix: data.EmployeeCodePrefix || "",

          companyStartSeries: Number(data.CompanyStartSeries ?? 1),
          defaultCurrency: Number(data.DefaultCurrency ?? 1),
          billPrefix: data.BillPrefix || "",
          invoiceTerms: data.InvoiceTerms || "",
          isTaxApplicable: Boolean(data.IsTaxApplicable),

          employeeStartSeries: Number(data.EmployeeStartSeries ?? 1),
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
          text: "Company logo has been removed.",
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
    { resetForm }: FormikHelpers<FormValues>,
  ) => {
    setLoading(true);
    const documentsArray = masterDocuments
      .map((doc) => {
        const userEntry = docValues[doc.DocumentId];

        // Edit mode: send all docs
        if (isEditMode) {
          return {
            DocumentId: Number(doc.DocumentId),
            DocumentName: doc.DocumentName,
            DocumentNumber: userEntry?.number || "",
            File: userEntry?.isDeleted ? "" : userEntry?.fileName || "",
            IsDeleted: userEntry?.isDeleted ? "Y" : "N", // ✅ IMPORTANT
          };
        }

        // Insert mode: only send filled ones
        if (userEntry?.fileName || userEntry?.number) {
          return {
            DocumentId: Number(doc.DocumentId),
            DocumentName: doc.DocumentName,
            DocumentNumber: userEntry.number || "",
            File: userEntry.fileName || "",
            IsDeleted: "N",
          };
        }

        return null;
      })
      .filter(Boolean);

    try {
      const payload = {
        procName: "Company",
        Para: JSON.stringify({
          ActionMode: isEditMode ? "Update" : "Insert",
          EditId: isEditMode ? Number(id) : "",
          CompanyCodePrefix: values.companyCodePrefix,
          EmployeeCodePrefix: values.employeeCodePrefix,
          CompanyLogo: companyLogo,
          CompanyName: values.companyName,
          EmailId: values.email,
          ContactNo: values.phone,
          WebUrl: values.websiteUrl,
          CompanyType: values.companyType,
          ParentCompanyId:
            values.companyType === "Branch"
              ? Number(values.parentCompanyId)
              : 0,
          Address: values.address,
          BillTo: values.billTo,
          ShipTo: values.shipTo,
          CountryId: values.country ? Number(values.country) : "",
          StateId: values.state ? Number(values.state) : "",
          CityId: values.city ? Number(values.city) : "",
          PinCode: values.zip,
          ContactPersonName: values.contactName,
          ContactPersonEmail: values.contactEmail,
          ContactPersonMobile: values.contactMobile,
          CompanyDocuments: JSON.stringify(documentsArray),
          DisplayOnWeb: true,
          IsVerified: "Y",
          EntryBy: 1,
          EmployeeId: 1,
          StartSeries: Number(values.companyStartSeries),
          EmpStartSeries: Number(values.employeeStartSeries),
          DefaultCurrency: Number(values.defaultCurrency),
          BillPrefix: values.billPrefix,
          InvoiceTerms: values.invoiceTerms,
          IsTaxApplicable: values.isTaxApplicable ? 1 : 0,
        }),
      };
      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response?.data?.[0];

      if (res?.statuscode === "1" || res?.statuscode === "2") {
        Swal.fire({
          title: isEditMode ? "Updated!" : "Success!",
          text: res?.msg || "Action completed successfully.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3b82f6",
        }).then((result) => {
          if (result.isConfirmed) {
            if (!isEditMode) {
              resetForm();
              setCompanyLogo("");
              setDocValues({});
              setTab(0);
            }
            navigate("/superadmin/company/manage-company/branch");
          }
        });
      } else {
        Swal.fire({
          title: "Error",
          text: res?.msg || "Operation failed",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Submit Error", error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong during submission.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
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
            className={`${bigInputClasses} ${
              disabled || loading
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
        className={`${bigInputClasses.replace("h-10", "h-auto")} ${
          errors[name] && touched[name] ? "border-red-500" : ""
        }`}
      ></textarea>
      {errors[name] && touched[name] && (
        <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
      )}
    </div>
  );

  const tabs = [
    { label: "Address Details", icon: <FaRegAddressCard size={18} /> },
    { label: "Documents", icon: <FaFile size={16} /> },
    { label: "Contact Person Details", icon: <FaUser size={16} /> },
    { label: "Company Settings", icon: <FaBuilding size={16} /> },
    { label: "Employee Settings", icon: <FaBriefcase size={16} /> },
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
          <FormObserver
            setStates={setStates}
            setCities={setCities}
            setLoadingStates={setLoadingStates}
            setLoadingCities={setLoadingCities}
            fetchDDL={fetchDDL}
            normalizeDDL={normalizeDDL}
            countries={countries}
            states={states}
            cities={cities}
            billToManuallyEdited={billToManuallyEdited}
            shipToManuallyEdited={shipToManuallyEdited}
          />

          {(loading || isSubmitting || permissionLoading) && (
            <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0c1427] /50 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              {isEditMode ? "Edit Company" : "Add Company"}
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
                allowed={
                  !permissionLoading &&
                  (isEditMode ? canEditCompany : canAddCompany)
                }
                allowedText="Submit Company"
                deniedText="You do not have permission"
              >
                <button
                  type="submit"
                  disabled={
                    permissionLoading ||
                    (isEditMode ? !canEditCompany : !canAddCompany)
                  }
                  className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2
      ${
        permissionLoading || (isEditMode ? !canEditCompany : !canAddCompany)
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-primary-500 hover:bg-primary-600 text-primary-50"
      }`}
                >
                  Submit
                </button>
              </PermissionAwareTooltip>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c1427] rounded-lg dark:text-gray-100 p-4 px-5 mt-2 mb-3">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* --- LEFT: LOGO SECTION --- */}
              <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
                <div className="relative w-36 h-36 group">
                  <div className="w-full h-full rounded-xl border-[4px] border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
                    {companyLogo ? (
                      <img
                        src={
                          IMAGE_PREVIEW_URL
                            ? `${IMAGE_PREVIEW_URL}${companyLogo}`
                            : companyLogo
                        }
                        alt="Logo"
                        onClick={openLogoInNewTab}
                        title="Click to view logo"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                      />
                    ) : rawImage ? (
                      <img
                        src={rawImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="text-7xl text-gray-400 dark:text-gray-600" />
                    )}
                    {loadingLogo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {!loadingLogo && (
                    <>
                      <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-primary-400 text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">
                        <FaPencilAlt size={14} />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={onLogoChange}
                        />
                      </label>
                      {(companyLogo || rawImage) && (
                        <button
                          type="button"
                          onClick={deleteLogo}
                          className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-red-400 text-red-400 rounded-full shadow-lg cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-200 dark:border-gray-600"
                        >
                          <FaTimes size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* --- RIGHT: FORM FIELDS --- */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <InputField
                    label="Company Name:*"
                    name="companyName"
                    placeholder="Enter company name"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  />
                  <InputField
                    label="Email:*"
                    name="email"
                    placeholder="Enter email"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                    disabled={editDisabled.email}
                  />
                  <InputField
                    label="Phone Number:*"
                    name="phone"
                    placeholder="Enter contact number"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  />
                  <InputField
                    label="Website URL:"
                    name="websiteUrl"
                    placeholder="Enter website URL"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  />
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Company Type:<span className="text-red-500">*</span>
                    </label>
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded overflow-hidden h-10">
                      <button
                        type="button"
                        className={`flex-1 flex items-center justify-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          values.companyType === "Company"
                            ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400"
                            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                        onClick={() => {
                          setFieldValue("companyType", "Company");
                          setFieldValue("parentCompanyId", "");
                        }}
                        disabled={isEditMode}
                      >
                        Company {values.companyType === "Company" && "✓"}
                      </button>
                      <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                      <button
                        type="button"
                        className={`flex-1 flex items-center justify-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          values.companyType === "Branch"
                            ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400"
                            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                        onClick={() => setFieldValue("companyType", "Branch")}
                        disabled={isEditMode}
                      >
                        Branch {values.companyType === "Branch" && "✓"}
                      </button>
                    </div>
                  </div>
                  <div>
                    {values.companyType === "Branch" ? (
                      <SelectField
                        label="Parent Company"
                        name="parentCompanyId"
                        options={parentCompanies}
                        values={values}
                        handleChange={handleChange}
                        errors={errors}
                        touched={touched}
                        disabled={isEditMode && values.companyType !== "Branch"}
                        loading={loadingParent}
                      />
                    ) : (
                      <div className="flex flex-col opacity-50 pointer-events-none">
                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          Parent Company:
                        </label>
                        <div className="border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 h-10 flex items-center">
                          Select Company
                        </div>
                      </div>
                    )}
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
                    className={`pb-2 text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 ${
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

            {/* TAB 0: Address */}
            {tab === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fadeIn">
                <TextAreaField
                  className="col-span-1 md:col-span-4"
                  label="Address Details*"
                  name="address"
                  placeholder="Enter address"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                />
                <SelectField
                  label="Country*"
                  name="country"
                  options={countries}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  onCustomChange={() => {
                    setFieldValue("state", "");
                    setFieldValue("city", "");
                  }}
                />
                <SelectField
                  label="State*"
                  name="state"
                  options={states}
                  loading={loadingStates}
                  disabled={!values.country}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  onCustomChange={() => {
                    setFieldValue("city", "");
                  }}
                />
                <SelectField
                  label="City*"
                  name="city"
                  options={cities}
                  loading={loadingCities}
                  disabled={!values.state}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                />
                <InputField
                  label="Pin Code*"
                  name="zip"
                  placeholder="Enter Pin Code"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                />
                <div className="col-span-1 md:col-span-2 mt-2">
                  <div className="flex items-center gap-2 mb-2 justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bill To Address<span className="text-red-500">*</span>
                    </label>
                  </div>
                  <textarea
                    name="billTo"
                    rows={4}
                    value={values.billTo}
                    onChange={(e) => {
                      setBillToManuallyEdited(true);
                      handleChange(e);
                    }}
                    className={bigInputClasses.replace("h-10", "h-auto")}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 mt-2">
                  <div className="flex items-center gap-2 mb-2 justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ship To Address<span className="text-red-500">*</span>
                    </label>
                  </div>
                  <textarea
                    name="shipTo"
                    rows={4}
                    value={values.shipTo}
                    onChange={(e) => {
                      setShipToManuallyEdited(true);
                      handleChange(e);
                    }}
                    className={bigInputClasses.replace("h-10", "h-auto")}
                  />
                </div>
              </div>
            )}

            {/* TAB 1: Documents */}
            {tab === 1 && (
              <div className="animate-fadeIn">
                {/* Header - Desktop only */}
                <div className="hidden md:grid bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700 px-4 py-3 grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="col-span-3">Document Name</div>
                  <div className="col-span-4">Document Number</div>
                  <div className="col-span-5">File</div>
                </div>

                {/* Rows */}
                <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg">
                  {masterDocuments.map((doc) => {
                    const docState = docValues[doc.DocumentId];

                    return (
                      <div
                        key={doc.DocumentId}
                        className="grid grid-cols-12 px-4 py-4 gap-4 items-start md:items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        {/* Document Name */}
                        <div className="col-span-12 md:col-span-3 text-sm text-gray-800 dark:text-gray-200 font-bold md:font-medium">
                          {doc.DocumentName}
                        </div>

                        {/* Document Number */}
                        <div className="col-span-12 md:col-span-4">
                          <label className="block md:hidden text-xs text-gray-500 mb-1">
                            Document Number
                          </label>
                          <input
                            type="text"
                            placeholder="Enter document number"
                            className={bigInputClasses}
                            value={docState?.number || ""}
                            onChange={(e) =>
                              setDocValues((prev) => ({
                                ...prev,
                                [doc.DocumentId]: {
                                  ...prev[doc.DocumentId],
                                  number: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>

                        {/* Upload Section */}
                        <div className="col-span-12 md:col-span-5">
                          <label className="block md:hidden text-xs text-gray-500 mb-1">
                            Upload File
                          </label>

                          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
                            {/* Choose File */}
                            <label className="shrink-0 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md cursor-pointer whitespace-nowrap text-center transition shadow-sm">
                              Choose file
                              <input
                                type="file"
                                hidden
                                onChange={(e) =>
                                  handleFileUpload(
                                    doc.DocumentId,
                                    e.target.files?.[0],
                                  )
                                }
                              />
                            </label>

                            {/* File Info Box */}
                            {(docState?.fileName || docState?.file) && (
                              <div className="relative flex-1 min-w-0 flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700">
                                <div className="flex-1 min-w-0">
                                  {/* Upload Progress – ONLY for new uploads */}
                                  {!docState?.isExisting && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] uppercase font-bold text-green-600 whitespace-nowrap">
                                        {uploadProgress[doc.DocumentId] ===
                                          100 || !uploadProgress[doc.DocumentId]
                                          ? "Uploaded"
                                          : "Uploading..."}
                                      </span>
                                      <div className="flex-1 h-[4px] bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary-600 transition-all duration-300"
                                          style={{
                                            width: `${
                                              uploadProgress[doc.DocumentId] ||
                                              100
                                            }%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* File Name */}
                                  <p
                                    className="text-xs text-primary-600 truncate font-medium cursor-pointer hover:underline"
                                    title={
                                      docState?.file?.name || docState?.fileName
                                    }
                                    onClick={() =>
                                      openDocument(docState?.fileName)
                                    }
                                  >
                                    {docState?.file?.name || docState?.fileName}
                                  </p>
                                </div>

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFileOnly(
                                      doc.DocumentId,
                                      doc.DocumentName,
                                    )
                                  }
                                  className="shrink-0 text-gray-400 hover:text-red-500 transition p-1"
                                  title="Remove document"
                                >
                                  <FaTimes size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Contact */}
            {tab === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
                <InputField
                  label="Contact Name:"
                  name="contactName"
                  placeholder="Enter Name"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                />
                <InputField
                  label="Email:"
                  name="contactEmail"
                  placeholder="Enter email"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                />
                <InputField
                  label="Contact No:"
                  name="contactMobile"
                  placeholder="Enter Contact Number"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                />
              </div>
            )}

            {/* TAB 3: Company Settings */}
            {tab === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fadeIn">
                <InputField
                  label="Company Code Prefix:*"
                  name="companyCodePrefix"
                  placeholder="Eg: CMP"
                  values={values}
                  handleChange={(e: any) =>
                    setFieldValue(
                      "companyCodePrefix",
                      e.target.value.toUpperCase(),
                    )
                  }
                  errors={errors}
                  touched={touched}
                  disabled={editDisabled.companyCodePrefix}
                />

                <InputField
                  label="Start Series:*"
                  name="companyStartSeries"
                  type="number"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                  disabled={editDisabled.companyStartSeries}
                />

                <SelectField
                  label="Default Currency:*"
                  name="defaultCurrency"
                  options={currencies}
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                  loading={loadingCurrency}
                  disabled={editDisabled.defaultCurrency}
                />

                <InputField
                  label="Bill Prefix:*"
                  name="billPrefix"
                  placeholder="Eg: BILL"
                  values={values}
                  handleChange={(e: any) =>
                    setFieldValue("billPrefix", e.target.value.toUpperCase())
                  }
                  errors={errors}
                  touched={touched}
                  disabled={editDisabled.billPrefix}
                />

                <TextAreaField
                  label="Invoice Terms"
                  name="invoiceTerms"
                  placeholder="Eg: Welcome To Sysfo"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                  className="md:col-span-4"
                  disabled={editDisabled.invoiceTerms}
                />

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={values.isTaxApplicable}
                    onChange={(e) =>
                      setFieldValue("isTaxApplicable", e.target.checked)
                    }
                    disabled={editDisabled.isTaxApplicable}
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Is Tax Applicable
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: Employee Settings */}
            {tab === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
                <InputField
                  label="Employee Code Prefix:*"
                  name="employeeCodePrefix"
                  placeholder="Eg: EMP"
                  values={values}
                  handleChange={(e: any) =>
                    setFieldValue(
                      "employeeCodePrefix",
                      e.target.value.toUpperCase(),
                    )
                  }
                  errors={errors}
                  touched={touched}
                  disabled={editDisabled.employeeStartSeries}
                />

                <InputField
                  label="Start Series:*"
                  name="employeeStartSeries"
                  type="number"
                  values={values}
                  handleChange={handleChange}
                  errors={errors}
                  touched={touched}
                  disabled={editDisabled.employeeStartSeries}
                />
              </div>
            )}
          </div>

          <CropperModal
            open={showCropper}
            image={rawImage}
            aspectRatio={1}
            onClose={() => setShowCropper(false)}
            onCrop={(croppedImage: string) => {
              setRawImage(croppedImage);
              uploadLogo(croppedImage);
              setShowCropper(false);
            }}
          />
          <ToastContainer position="top-right" autoClose={3000} />
        </form>
      )}
    </Formik>
  );
}
