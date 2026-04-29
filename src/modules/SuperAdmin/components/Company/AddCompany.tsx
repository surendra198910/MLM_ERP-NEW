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
//Component
import { ApiService } from "../../../../services/ApiService";
import { PostService } from "../../../../services/PostService";
import { SmartActions } from "../Security/SmartActionWithFormName";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import CropperModal from "../Cropper/Croppermodel.jsx";
import { ImageIcon, Trash2 } from "lucide-react";

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

  // Banner image states (for Tab 5)
  const [bannerImage, setBannerImage] = useState<any>(null);
  const [bannerImagePath, setBannerImagePath] = useState("");
  const [allImages, setAllImages] = useState<any[]>([]);

  const { universalService } = ApiService();
  const { postDocument } = PostService();
  const formikRef = React.useRef<any>(null);
  const [tab, setTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);

  // Loaders
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingCities, setLoadingCities] = useState<boolean>(false);
  const [loadingParent, setLoadingParent] = useState<boolean>(false);
  const [loadingLogo, setLoadingLogo] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);

  // Data
  const [countries, setCountries] = useState<DropdownOption[]>([]);
  const [states, setStates] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);
  const [parentCompanies, setParentCompanies] = useState<DropdownOption[]>([]);

  // Company Logo states (for main logo at top)
  const [showLogoCropper, setShowLogoCropper] = useState<boolean>(false);
  const [rawLogoImage, setRawLogoImage] = useState<string>("");
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Banner Cropper states

  const [selectedLogoType, setSelectedLogoType] = useState<string>(""); // Track which logo is being uploaded

  // Separate states for dark and light logos
  const [darkLogo, setDarkLogo] = useState<any>(null);
  const [darkLogoPath, setDarkLogoPath] = useState<string>("");
  const [lightLogo, setLightLogo] = useState<any>(null);
  const [lightLogoPath, setLightLogoPath] = useState<string>("");

  const [showBannerCropper, setShowBannerCropper] = useState<boolean>(false);
  const [rawBannerImage, setRawBannerImage] = useState<string>("");

  const [masterDocuments, setMasterDocuments] = useState<MasterDocument[]>([]);
  const [docValues, setDocValues] = useState<Record<number, DocumentValue>>({});

  // Progress
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );

  const [currencies, setCurrencies] = useState<DropdownOption[]>([]);
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [companyData, setCompanyData] = useState([]);

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
  const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL_2;
  const DOCUMENT_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

  const openDocument = (fileName?: string) => {
    if (!fileName) return;
    const url = `${DOCUMENT_PREVIEW_URL}${fileName}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openLogoInNewTab = () => {
    if (!companyLogo) return;
    const url = IMAGE_PREVIEW_URL
      ? `${IMAGE_PREVIEW_URL}CompanyDocs/${companyLogo}`
      : companyLogo;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // --- STYLES ---
  const bigInputClasses =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 " +
    "placeholder-gray-400 focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg transition-all " +
    "bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

  const normalizeDDL = useCallback(
    (data: any[], idKey: string, nameKey: string): DropdownOption[] =>
      data.map((x) => ({ value: x[idKey], label: x[nameKey] })),
    [],
  );

  // SMART ACTION SYSTEM
  const location = window.location.pathname;
  const segments = location.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const isIdSegment = !isNaN(Number(last));
  const formName = isIdSegment ? segments[segments.length - 2] : last;

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
          formName?.trim().toLowerCase(),
      );
      if (!pagePermission || !pagePermission.Action) {
        setHasPageAccess(false);
        return;
      }
      SmartActions.load(data);
      setHasPageAccess(true);
    } catch {
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const loadAllBannerImages = async () => {
    try {
      const payload = {
        procName: "ManageWebsiteBannerImages",
        Para: JSON.stringify({
          ActionMode: "GetAll",
        }),
      };
      const res = await universalService(payload);
      let data = res?.data || res || [];
      if (!Array.isArray(data)) {
        data = data?.data || [];
      }
      setAllImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("GetAll banner error:", err);
      setAllImages([]);
    }
  };

  const autoSaveBanner = async (uploadedFileName: string, logoType: string) => {
    try {
      // const saved = localStorage.getItem("EmployeeDetails");
      // const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
      // const payload = {
      //   procName: "ManageMemberBannerImages",
      //   Para: JSON.stringify({
      //     ActionMode: "Insert",
      //     MemberBannerImageId: 0,
      //     ImagePath: uploadedFileName,
      //     LogoType: logoType, // Add this field to your backend
      //     EntryBy: employeeId,
      //     ModifiedBy: employeeId,
      //   }),
      // };
      // const response = await universalService(payload);
      // const res = response?.data?.[0] || response?.[0];
      // if (res?.StatusCode === 1) {
      //   toast.success(res.Msg || `${logoType} logo uploaded successfully`);
      //   loadAllBannerImages();
      // } else {
      //   toast.error(res?.Msg || "Failed to save logo");
      // }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const handleImageUpload = (e: any, logoType: string) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length > 1) {
      toast.error("Please select only one image at a time.");
      return;
    }
    const file: any = files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`${file.name} is larger than 2MB`);
      return;
    }

    setSelectedLogoType(logoType); // Store which logo is being uploaded

    const reader = new FileReader();
    reader.onload = () => {
      setRawBannerImage(reader.result as string);
      setShowBannerCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (croppedBase64: string) => {
    try {
      console.log("Starting crop handler for banner...");
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const file = new File([blob], `${selectedLogoType}_${Date.now()}.png`, {
        type: blob.type,
      });

      // Set immediate preview based on logo type
      if (selectedLogoType === "dark") {
        setDarkLogo({
          preview: croppedBase64,
          fileName: "",
          uploading: true,
        });
      } else if (selectedLogoType === "light") {
        setLightLogo({
          preview: croppedBase64,
          fileName: "",
          uploading: true,
        });
      }

      // Upload
      const fd = new FormData();
      fd.append("UploadedImage", file);
      fd.append("pagename", "CompanyDocs");

      const uploadRes = await postDocument(fd);
      const uploadedFileName = uploadRes?.fileName || uploadRes?.Message;

      if (!uploadedFileName) {
        toast.error("Image upload failed");
        if (selectedLogoType === "dark") {
          setDarkLogo(null);
        } else if (selectedLogoType === "light") {
          setLightLogo(null);
        }
        return;
      }

      // Update state after successful upload
      if (selectedLogoType === "dark") {
        setDarkLogo({
          preview: croppedBase64,
          fileName: uploadedFileName,
          uploading: false,
        });
        setDarkLogoPath(uploadedFileName);
        formikRef.current?.setFieldValue("darkLogoPath", uploadedFileName);
      } else if (selectedLogoType === "light") {
        setLightLogo({
          preview: croppedBase64,
          fileName: uploadedFileName,
          uploading: false,
        });
        setLightLogoPath(uploadedFileName);
        formikRef.current?.setFieldValue("lightLogoPath", uploadedFileName);
      }

      // await autoSaveBanner(uploadedFileName, selectedLogoType);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Image upload failed");
    } finally {
      setShowBannerCropper(false);
      setSelectedLogoType("");
    }
  };

  const deleteLogoImage = async (logoType: string, imagePath: string) => {
    const confirm = await Swal.fire({
      title: `Delete ${logoType} Logo?`,
      text: "This logo will be removed.",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
      const payload = {
        procName: "ManageMemberBannerImages",
        Para: JSON.stringify({
          ActionMode: "Delete",
          ImagePath: imagePath,
          LogoType: logoType,
          ModifiedBy: employeeId,
        }),
      };
      const res = await universalService(payload);
      const result = res?.data?.[0] || res?.[0];
      if (result?.StatusCode === 1) {
        toast.success(result.Msg);
        if (logoType === "dark") {
          setDarkLogo(null);
          setDarkLogoPath("");
        } else if (logoType === "light") {
          setLightLogo(null);
          setLightLogoPath("");
        }
        loadAllBannerImages();
      } else {
        toast.error(result?.Msg || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const handleToggleStatus = async (img) => {
    try {
      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
      const payload = {
        procName: "ManageMemberBannerImages",
        Para: JSON.stringify({
          ActionMode: "ChangeStatus",
          MemberBannerImageId: img.MemberBannerImageId,
          Status: img.Status === "Active" ? "Inactive" : "Active",
          ModifiedBy: employeeId,
        }),
      };
      const res = await universalService(payload);
      const result = res?.data?.[0] || res?.[0];
      if (result?.StatusCode === 1) {
        toast.success(result.Msg || "Status Updated");
        loadAllBannerImages();
      } else {
        toast.error(result?.Msg || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
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

  const fetchCompanyByLOgo = useCallback(async () => {
    try {
      const payload = {
        procName: "Company",
        Para: JSON.stringify({ ActionMode: "Select", EditId: id }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      if (Array.isArray(data)) setCompanyData(data);
    } catch (err) {
      console.error("Error fetching CompanyData:", err);
    }
  }, [universalService]);

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
    if (!id) {
      setForm(initialValues);
      setCompanyLogo("");
      setLogoPreview("");
      setRawLogoImage("");
      setDocValues({});
      setTab(0);
      setBillToManuallyEdited(false);
      setShipToManuallyEdited(false);
      setStates([]);
      setCities([]);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchCompanyByLOgo();
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

        setCompanyLogo(data.CompanyLogo || "");

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

  const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = reader.result as string;
      setLogoPreview(previewUrl);
      setRawLogoImage(previewUrl);
      setShowLogoCropper(true);
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
      fd.append("pagename", "CompanyDocs");
      const response = await postDocument(fd);
      const fileName = response?.fileName || response?.Message;
      if (fileName) {
        setCompanyLogo(fileName);
        setLogoPreview("");
      }
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
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setCompanyLogo("");
        setLogoPreview("");
        setRawLogoImage("");
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

  const handleFileUpload = async (docId: number, file?: File) => {
    if (!file) return;
    setUploadProgress((prev) => ({ ...prev, [docId]: 0 }));
    setDocValues((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        file,
        isExisting: false,
      },
    }));
    try {
      const fd = new FormData();
      fd.append("UploadedImage", file);
      fd.append("pagename", "EmpDoc");
      const response = await postDocument(fd, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [docId]: percent }));
      });
      const fileName = response?.fileName || response?.Message;
      if (fileName) {
        setDocValues((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], fileName },
        }));
        setUploadProgress((prev) => ({ ...prev, [docId]: 100 }));
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newState = { ...prev };
            delete newState[docId];
            return newState;
          });
        }, 1000);
      } else {
        toast.error("Upload failed: No filename received");
        setDocValues((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], file: undefined },
        }));
      }
    } catch (error) {
      console.error("Document upload failed:", error);
      toast.error("Document upload failed");
      setDocValues((prev) => ({
        ...prev,
        [docId]: { ...prev[docId], file: undefined },
      }));
    }
  };

  const removeFileOnly = (docId: number, docName?: string) => {
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
          isDeleted: true,
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
    if (isEditMode && !SmartActions.canEdit(formName)) return;
    if (!isEditMode && !SmartActions.canAdd(formName)) return;
    setLoading(true);
    const documentsArray = masterDocuments
      .map((doc) => {
        const userEntry = docValues[doc.DocumentId];
        if (isEditMode) {
          return {
            DocumentId: Number(doc.DocumentId),
            DocumentName: doc.DocumentName,
            DocumentNumber: userEntry?.number || "",
            File: userEntry?.isDeleted ? "" : userEntry?.fileName || "",
            IsDeleted: userEntry?.isDeleted ? "Y" : "N",
          };
        }
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
          DarkThemeLogo: darkLogoPath,
          LightThemeLogo: lightLogoPath,
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
              setLogoPreview("");
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
            <div className="absolute right-3 top-3 w-4 h-4 border-2 border-primary-button-bg border-t-transparent rounded-full animate-spin" />
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
    { label: "Logo Settings", icon: <FaBriefcase size={16} /> },
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

  if (permissionsLoading) {
    return <Loader />;
  }

  if (!hasPageAccess) {
    return <AccessRestricted />;
  }

  return (
    <Formik
      innerRef={formikRef}
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

          {(loading || isSubmitting || permissionsLoading) && (
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
                  isEditMode
                    ? SmartActions.canEdit(formName)
                    : SmartActions.canAdd(formName)
                }
                allowedText="Submit Company"
                deniedText="You do not have permission"
              >
                <button
                  type="submit"
                  disabled={
                    isEditMode
                      ? !SmartActions.canEdit(formName)
                      : !SmartActions.canAdd(formName)
                  }
                  className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${
                    (
                      isEditMode
                        ? !SmartActions.canEdit(formName)
                        : !SmartActions.canAdd(formName)
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary-button-bg hover:bg-primary-button-bg-hover text-white"
                  }`}
                >
                  {isEditMode ? "Update" : "Submit"}
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
                    {/* Show preview first, then saved logo, then default */}
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : companyLogo ? (
                      <img
                        src={
                          IMAGE_PREVIEW_URL
                            ? `${IMAGE_PREVIEW_URL}CompanyDocs/${companyLogo}`
                            : companyLogo
                        }
                        alt="Logo"
                        onClick={openLogoInNewTab}
                        title="Click to view logo"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
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
                      <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-primary-400 text-primary-button-bg rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">
                        <FaPencilAlt size={14} />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={onLogoChange}
                        />
                      </label>
                      {(companyLogo || logoPreview) && (
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

            {/* TABS NAVIGATION */}
            <div className="mt-10 mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4 md:gap-6 overflow-x-auto whitespace-nowrap">
                {tabs.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTab(i)}
                    className={`pb-2 text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 ${
                      tab === i
                        ? "border-b-2 border-primary-button-bg text-primary-button-bg"
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
                <div className="hidden md:grid bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700 px-4 py-3 grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="col-span-3">Document Name</div>
                  <div className="col-span-4">Document Number</div>
                  <div className="col-span-5">File</div>
                </div>
                <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg">
                  {masterDocuments.map((doc) => {
                    const docState = docValues[doc.DocumentId];
                    return (
                      <div
                        key={doc.DocumentId}
                        className="grid grid-cols-12 px-4 py-4 gap-4 items-start md:items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="col-span-12 md:col-span-3 text-sm text-gray-800 dark:text-gray-200 font-bold md:font-medium">
                          {doc.DocumentName}
                        </div>
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
                        <div className="col-span-12 md:col-span-5">
                          <label className="block md:hidden text-xs text-gray-500 mb-1">
                            Upload File
                          </label>
                          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
                            <label className="shrink-0 px-4 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white text-xs font-medium rounded-md cursor-pointer whitespace-nowrap text-center transition shadow-sm">
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
                            {(docState?.fileName || docState?.file) && (
                              <div className="relative flex-1 min-w-0 flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700">
                                <div className="flex-1 min-w-0">
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
                                          className="h-full bg-primary-button-bg-hover transition-all duration-300"
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

            {/* TAB 5: Logo Settings (Banner Images) */}
            {tab === 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                {/* Dark Theme Logo */}
                <div className="p-6 space-y-6">
                  <p className="text-lg font-semibold">Dark Theme Logo</p>
                  <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
                    <div className="relative w-36 h-36 group">
                      <div className="w-full h-full rounded-xl border-[4px] border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
                        {companyData[0]?.DarkThemeLogo ? (
                          <img
                            src={`${IMAGE_PREVIEW_URL}CompanyDocs/${companyData[0]?.DarkThemeLogo}`}
                            alt="Dark Logo Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : darkLogoPath ? (
                          <img
                            src={`${IMAGE_PREVIEW_URL}CompanyDocs/${darkLogoPath}`}
                            alt="Dark Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                darkLogoPath,
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon className="text-6xl text-gray-400 dark:text-gray-600" />
                        )}
                        {darkLogo?.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">
                        <FaUpload size={14} />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "dark")}
                        />
                      </label>
                      {(darkLogo?.preview || darkLogoPath) && (
                        <button
                          type="button"
                          onClick={() => {
                            setDarkLogo(null);
                            setDarkLogoPath("");
                            formikRef.current?.setFieldValue(
                              "darkLogoPath",
                              "",
                            );
                          }}
                          className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 text-red-400 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-200 dark:border-gray-600"
                        >
                          <FaTimes size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Light Theme Logo */}
                <div className="p-6 space-y-6">
                  <p className="text-lg font-semibold">Light Theme Logo</p>
                  <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
                    <div className="relative w-36 h-36 group">
                      <div className="w-full h-full rounded-xl border-[4px] border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
                        {companyData[0]?.LightThemeLogo ? (
                          <img
                            src={`${IMAGE_PREVIEW_URL}CompanyDocs/${companyData[0]?.LightThemeLogo}`}
                            alt="Light Logo Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : lightLogoPath ? (
                          <img
                            src={`${IMAGE_PREVIEW_URL}CompanyDocs/${lightLogoPath}`}
                            alt="Light Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                lightLogoPath,
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon className="text-6xl text-gray-400 dark:text-gray-600" />
                        )}
                        {lightLogo?.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">
                        <FaUpload size={14} />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "light")}
                        />
                      </label>
                      {(lightLogo?.preview || lightLogoPath) && (
                        <button
                          type="button"
                          onClick={() => {
                            setLightLogo(null);
                            setLightLogoPath("");
                            formikRef.current?.setFieldValue(
                              "lightLogoPath",
                              "",
                            );
                          }}
                          className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 text-red-400 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-200 dark:border-gray-600"
                        >
                          <FaTimes size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cropper Modal */}
                <CropperModal
                  open={showBannerCropper}
                  image={rawBannerImage}
                  aspectRatio={1}
                  onClose={() => {
                    setShowBannerCropper(false);
                    setSelectedLogoType("");
                  }}
                  onCrop={(croppedImage: string) => {
                    handleCroppedImage(croppedImage);
                  }}
                />
                <ToastContainer position="top-right" autoClose={3000} />
              </div>
            )}
          </div>

          {/* Company Logo Cropper Modal */}
          <CropperModal
            open={showLogoCropper}
            image={rawLogoImage}
            aspectRatio={1}
            onClose={() => {
              setShowLogoCropper(false);
              setLogoPreview("");
              setRawLogoImage("");
            }}
            onCrop={(croppedImage: string) => {
              setLogoPreview(croppedImage);
              uploadLogo(croppedImage);
              setShowLogoCropper(false);
            }}
          />

          <ToastContainer position="top-right" autoClose={3000} />
        </form>
      )}
    </Formik>
  );
}
