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
import Pagination from "../../common/Pagination";

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
  // Basic Info
  firstName: string;
  middleName: string;
  lastName: string;
  fatherName: string;
  gender: string;
  dob: string;
  doj: string;

  // Contact
  email: string;
  alternateEmail: string;
  contactNo: string;
  alternateContactNo: string;

  // Address (Permanent)
  address: string;
  countryId: number | "";
  stateId: number | "";
  cityId: number | "";
  pincode: string;

  // Address (Current)
  currentAddress: string;
  currentCountryId: number | "";
  currentStateId: number | "";
  currentCityId: number | "";
  currentPincode: string;

  // Joining
  departmentId: number | "";
  designationId: number | "";
  employeeTypeId: number | "";
  reportingManagerId: number | "";
  companyId: number | "";

  // Bank
  bankName: string;
  branchName: string;
  accountNo: string;
  ifscCode: string;
  accountHolderName: string;

  // Login
  loginType: number | "";
  copyRoleFrom: number | "";

  // Skills
  shortAbout: string;
  skills: string;
  totalExperience: number;

  // System
  profilePic: string;
  signature: string;
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
}

const FormObserver: React.FC<any> = ({
  setStates,
  setCities,
  setLoadingStates,
  setLoadingCities,
  fetchDDL,
  normalizeDDL,
}) => {
  const { values } = useFormikContext<FormValues>();

  useEffect(() => {
    if (!values.countryId) {
      setStates([]);
      setCities([]);
      return;
    }

    setLoadingStates(true);
    fetchDDL({
      tbl: "master.state",
      searchField: "statename",
      filterCTL: "countryid",
      filterCTLvalue: values.countryId,
    }).then((data) => {
      setStates(normalizeDDL(data, "id", "name"));
      setLoadingStates(false);
    });
  }, [values.countryId]);

  useEffect(() => {
    if (!values.stateId) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    fetchDDL({
      tbl: "master.city",
      searchField: "cityname",
      filterCTL: "stateid",
      filterCTLvalue: values.stateId,
    }).then((data) => {
      setCities(normalizeDDL(data, "id", "name"));
      setLoadingCities(false);
    });
  }, [values.stateId]);

  return null;
};

// ----------------------------------------------------------------------
// VALIDATION SCHEMA
// ----------------------------------------------------------------------

const employeeValidationSchema = Yup.object({
  // -------- BASIC --------
  firstName: Yup.string().trim().required("First name is required"),
  lastName: Yup.string().trim().required("Last name is required"),
  fatherName: Yup.string().trim().required("Father name is required"),

  gender: Yup.string().required("Gender is required"),
  dob: Yup.date().required("Date of birth is required"),
  doj: Yup.date().required("Joining date is required"),

  // -------- CONTACT --------
  email: Yup.string().email("Invalid email").required("Email is required"),
  contactNo: Yup.string()
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit number")
    .required("Mobile number is required"),

  alternateEmail: Yup.string().email("Invalid email").nullable(),
  alternateContactNo: Yup.string().nullable(),

  // -------- PERMANENT ADDRESS --------
  address: Yup.string().required("Address is required"),
  countryId: Yup.number().required("Country is required"),
  stateId: Yup.number().required("State is required"),
  cityId: Yup.number().required("City is required"),
  pincode: Yup.string().required("Pincode is required"),

  // -------- CURRENT ADDRESS (CONDITIONAL) --------
  currentAddress: Yup.string().when("$sameAsPermanent", {
    is: false,
    then: (s) => s.required("Current address is required"),
  }),
  currentCountryId: Yup.number().when("$sameAsPermanent", {
    is: false,
    then: (s) => s.required("Country is required"),
  }),
  currentStateId: Yup.number().when("$sameAsPermanent", {
    is: false,
    then: (s) => s.required("State is required"),
  }),
  currentCityId: Yup.number().when("$sameAsPermanent", {
    is: false,
    then: (s) => s.required("City is required"),
  }),
  currentPincode: Yup.string().when("$sameAsPermanent", {
    is: false,
    then: (s) => s.required("Pincode is required"),
  }),

  // -------- JOINING --------
  companyId: Yup.number().required("Company is required"),
  departmentId: Yup.number().required("Department is required"),
  designationId: Yup.number().required("Designation is required"),
  employeeTypeId: Yup.number().required("Employee type is required"),

  // -------- BANK --------
  bankName: Yup.string().required("Bank name is required"),
  branchName: Yup.string().required("Branch name is required"),
  accountNo: Yup.string().required("Account number is required"),
  ifscCode: Yup.string().required("IFSC code is required"),

  // -------- LOGIN (handled in submit) --------
  loginType: Yup.number().nullable(),
  copyRoleFrom: Yup.number().nullable(),

  // -------- SKILLS --------
  shortAbout: Yup.string().required("Short about is required"),
  skills: Yup.string().required("Skills are required"),
  totalExperience: Yup.number().min(0).required("Experience is required"),
}).test(
  "login-or-copy-role",
  "Select Login Type or Copy Role From",
  function (values) {
    if (!values) return true;

    if (!values.loginType && !values.copyRoleFrom) {
      return this.createError({
        path: "loginType", // 👈 attach error to a real field
        message: "Select Login Type or Copy Role From",
      });
    }

    return true;
  },
);

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

const SameAddressSync = ({
  sameAsPermanent,
  values,
  setFieldValue,
}: {
  sameAsPermanent: boolean;
  values: any;
  setFieldValue: any;
}) => {
  useEffect(() => {
    if (!sameAsPermanent) return;

    setFieldValue("currentAddress", values.address);
    setFieldValue("currentCountryId", values.countryId);
    setFieldValue("currentStateId", values.stateId);
    setFieldValue("currentCityId", values.cityId);
    setFieldValue("currentPincode", values.pincode);
  }, [
    sameAsPermanent,
    values.address,
    values.countryId,
    values.stateId,
    values.cityId,
    values.pincode,
  ]);

  return null;
};

// 🔥 NORMALIZE IMAGE URL (handles |, full URL, relative file)
const getImageUrl = (img?: string) => {
  if (!img) return "";

  // remove |anything
  const clean = img.split("|")[0];

  // already full URL
  if (clean.startsWith("http")) return clean;

  // relative filename → prepend preview url
  return `${import.meta.env.VITE_IMAGE_PREVIEW_URL}${clean}`;
};

const extractId = (val: any): number | "" => {
  if (!val) return "";
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val.split("|")[0]) || "";
  return "";
};

const toDateInput = (val?: string) => (val ? val.split("T")[0] : "");

export default function AddEmployee() {
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
  const [departments, setDepartments] = useState<DropdownOption[]>([]);
  const [designations, setDesignations] = useState<DropdownOption[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<DropdownOption[]>([]);
  const [companies, setCompanies] = useState<DropdownOption[]>([]);
  const [loginTypes, setLoginTypes] = useState<DropdownOption[]>([]);

  // Images & Docs
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [rawImage, setRawImage] = useState<string>("");
  const [profilePic, setProfilePic] = useState<string>("");
  const [masterDocuments, setMasterDocuments] = useState<MasterDocument[]>([]);
  const [docValues, setDocValues] = useState<Record<number, DocumentValue>>({});

  // Progress
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );

  const [showManagerPopup, setShowManagerPopup] = useState(false);
  const [managerList, setManagerList] = useState<any[]>([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [selectedManager, setSelectedManager] = useState<any>(null);

  const [currencies, setCurrencies] = useState<DropdownOption[]>([]);
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [salaryHeads, setSalaryHeads] = useState<any[]>([]);

  const [showCopyRolePopup, setShowCopyRolePopup] = useState(false);
  const [selectedCopyRoleUser, setSelectedCopyRoleUser] = useState<any>(null);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);

  const loggedInEmployeeId =
    JSON.parse(localStorage.getItem("EmployeeDetails") || "{}").EmployeeId || 0;

  const editDisabledFields = {
    email: isEditMode,
    loginType: isEditMode,
    copyRoleFrom: isEditMode,
  };

  const initialValues: FormValues = {
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    gender: "Male",
    dob: "",
    doj: "",

    email: "",
    alternateEmail: "",
    contactNo: "",
    alternateContactNo: "",

    address: "",
    countryId: "",
    stateId: "",
    cityId: "",
    pincode: "",

    currentAddress: "",
    currentCountryId: "",
    currentStateId: "",
    currentCityId: "",
    currentPincode: "",

    departmentId: "",
    designationId: "",
    employeeTypeId: "",
    reportingManagerId: "",
    companyId: "",

    bankName: "",
    branchName: "",
    accountNo: "",
    ifscCode: "",
    accountHolderName: "",

    loginType: "",
    copyRoleFrom: "",

    shortAbout: "",
    skills: "",
    totalExperience: 0,

    profilePic: "",
    signature: "",
  };

  const [form, setForm] = useState<FormValues>(initialValues);
  const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;
  const DOCUMENT_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

  const CURRENT_FORM_ID = 4;
  const canAddEmployee = SmartActions.canAdd(CURRENT_FORM_ID);
  const canEditEmployee = SmartActions.canEdit(CURRENT_FORM_ID);

  const openDocument = (fileName?: string) => {
    if (!fileName) return;
    const url = `${DOCUMENT_PREVIEW_URL}${fileName}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openLogoInNewTab = () => {
    if (!profilePic) return;

    const url = getImageUrl(profilePic);
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

  const fetchManagers = async (companyId: number, search = "") => {
    try {
      const payload = {
        procName: "Employee",
        Para: JSON.stringify({
          CompanyId: companyId,
          searchData: search,
          ActionMode: "getUsersListByCompany",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data)) {
        setManagerList(data);
      } else {
        setManagerList([]);
      }
    } catch (err) {
      console.error("Failed to load managers", err);
      setManagerList([]);
    }
  };

  const fetchCompanyPermissions = async () => {
    try {
      setPermissionLoading(true);

      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "Forms",
          FormCategoryId: 3,
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
          Number(p.FormCategoryId) === 3,
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

  const applySalaryValues = (heads: any[], savedSalaryJson?: string) => {
    if (!savedSalaryJson) return heads;

    try {
      const parsed = JSON.parse(savedSalaryJson);

      return heads.map((h) => {
        const found = parsed.find(
          (p: any) => Number(p.SalaryTypeId) === Number(h.SalaryTypeId),
        );

        return found
          ? { ...h, Value: Number(found.Value ?? found.value ?? 0) }
          : h;
      });
    } catch {
      return heads;
    }
  };

  const fetchSalaryHeads = async (companyId: number, savedSalary?: string) => {
    try {
      const payload = {
        procName: "SalaryHead",
        Para: JSON.stringify({
          CompanyId: companyId,
          ActionMode: "Select",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      const heads = Array.isArray(data)
        ? data.map((x: any) => ({
            SalaryTypeId: Number(x.SalaryTypeId),
            SalaryType: x.SalaryName,
            Type:
              String(x.SalaryType || "")
                .trim()
                .toLowerCase() === "earning"
                ? "Earning"
                : "Deduction",
            Value: 0,
          }))
        : [];

      setSalaryHeads(applySalaryValues(heads, savedSalary));
    } catch (err) {
      console.error("Salary head load failed", err);
      setSalaryHeads([]);
    }
  };

  const fetchMasterDocuments = async (companyId: number) => {
    try {
      setLoadingDocs(true);

      const payload = {
        procName: "EmployeeDocuments",
        Para: JSON.stringify({
          CompanyId: companyId,
          ActionMode: "Select",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      setMasterDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching employee documents:", err);
      setMasterDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const netSalary = Math.max(
    0,
    salaryHeads.reduce((acc, s) => {
      if (s.Type === "Earning") return acc + Number(s.Value || 0);
      if (s.Type === "Deduction") return acc - Number(s.Value || 0);
      return acc;
    }, 0),
  );

  useEffect(() => {
    const loadBasics = async () => {
      setCountries(
        normalizeDDL(
          await fetchDDL({ tbl: "master.country", searchField: "countryname" }),
          "id",
          "name",
        ),
      );
      setDepartments(
        normalizeDDL(
          await fetchDDL({
            tbl: "master.Department",
            searchField: "DepartmentName",
          }),
          "id",
          "name",
        ),
      );
      setDesignations(
        normalizeDDL(
          await fetchDDL({
            tbl: "master.Designation",
            searchField: "DesignationName",
          }),
          "id",
          "name",
        ),
      );
      setEmployeeTypes(
        normalizeDDL(
          await fetchDDL({
            tbl: "master.EmployeeTypeMaster",
            searchField: "EmployeeType",
          }),
          "id",
          "name",
        ),
      );
      setCompanies(
        normalizeDDL(
          await fetchDDL({
            tbl: "Company.CompanyMaster",
            searchField: "CompanyName",
          }),
          "id",
          "name",
        ),
      );
      setLoginTypes(
        normalizeDDL(
          await fetchDDL({ tbl: "Master.LoginType", searchField: "LoginType" }),
          "id",
          "name",
        ),
      );
    };

    loadBasics();
  }, [normalizeDDL]);

  useEffect(() => {
    // 🔥 SWITCHED TO ADD MODE (Edit → Add)
    if (!id) {
      setForm(initialValues); // Reset Formik values
      setProfilePic(""); // Clear logo
      setRawImage("");
      setDocValues({}); // Clear documents
      setTab(0); // Reset tab

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
          procName: "Employee",
          Para: JSON.stringify({
            ActionMode: "Select",
            EditId: Number(id),
          }),
        };

        const res = await universalService(payload);
        const data = res?.data?.[0] || res?.[0];

        if (!data || !isMounted) return;

        // ---------- LOGO ----------
        setProfilePic(data.ProfilePic || "");

        // ---------- FORM VALUES ----------
        const newForm: FormValues = {
          firstName: data.FirstName || "",
          middleName: data.MiddleName || "",
          lastName: data.LastName || "",
          fatherName: data.FatherName || "",

          gender: data.Gender || "Male",
          dob: toDateInput(data.DOB),
          doj: toDateInput(data.DOJ),

          email: data.EmailId || "",
          alternateEmail: data.AlternateEmailId || "",
          contactNo: data.ContactNo || "",
          alternateContactNo: data.AlternateContactNo || "",

          address: data.Address || "",
          countryId: extractId(data.CountryId),
          stateId: extractId(data.StateId),
          cityId: extractId(data.CityId),
          pincode: data.Pincode || "",

          currentAddress: data.CurrentAddress || "",
          currentCountryId: extractId(data.CurrentCountryId),
          currentStateId: extractId(data.CurrentStateId),
          currentCityId: extractId(data.CurrentCityId),
          currentPincode: data.CurrentPinCode || "",

          departmentId: extractId(data.DepartmentId),
          designationId: extractId(data.DesignationId),
          employeeTypeId: Number(data.EmployeeTypeId) || "",
          companyId: extractId(data.CompanyId),
          reportingManagerId: extractId(data.ReportingManagerId),

          bankName: data.BankName || "",
          branchName: data.BranchName || "",
          accountNo: data.AccountNo || "",
          ifscCode: data.IFSCCode || "",
          accountHolderName: data.AccountHolderName || "",

          loginType: Number(data.LoginType) || "",
          copyRoleFrom: extractId(data.CopyRoleFrom),

          shortAbout: data.ShortAbout || "",
          skills: data.Skills || "",
          totalExperience: Number(data.TotalExperience || 0),

          profilePic: data.ProfilePic || "",
          signature: data.Signature || "",
        };

        setForm(newForm);

        if (data.ReportingManagerId) {
          const [id, name] = data.ReportingManagerId.split("|");

          setSelectedManager({
            EmployeeId: Number(id),
            Name: name,
            ProfilePic: data.ReportingManagerProfilePic || "", // 🔥 IMPORTANT
          });
        }

        if (data.CopyRoleFrom) {
          const [id, name] = data.CopyRoleFrom.split("|");
          setSelectedCopyRoleUser({
            EmployeeId: Number(id),
            Name: name,
          });
        }

        setSameAsPermanent(
          data.Address === data.CurrentAddress &&
            data.CountryId?.split("|")[0] ===
              data.CurrentCountryId?.split("|")[0] &&
            data.StateId?.split("|")[0] ===
              data.CurrentStateId?.split("|")[0] &&
            data.CityId?.split("|")[0] === data.CurrentCityId?.split("|")[0] &&
            data.Pincode === data.CurrentPinCode,
        );

        // Load salary heads + apply saved salary together
        if (data.CompanyId) {
          fetchSalaryHeads(Number(data.CompanyId?.split("|")[0]), data.Salary);
        }

        // ---------- DOCUMENTS ----------
        if (data.EmployeeDocuments) {
          try {
            const docs = JSON.parse(data.EmployeeDocuments);

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
        console.error("Failed to load data:", error);
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

  useEffect(() => {
    if (form.companyId) {
      fetchMasterDocuments(Number(form.companyId));
    }
  }, [form.companyId]);

  useEffect(() => {
    if (!form.companyId) return;

    // ADD MODE ONLY
    if (!isEditMode) {
      fetchSalaryHeads(Number(form.companyId));
    }
  }, [form.companyId, isEditMode]);

  const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: "Invalid File",
        text: "Logo must be under 2MB",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfilePic = async (base64Image: string) => {
    try {
      setLoadingLogo(true);

      const res = await fetch(base64Image);
      const blob = await res.blob();

      const mime = blob.type;
      const ext = mime === "image/png" ? ".png" : ".jpg";

      const file = new File([blob], `employee_profile_${Date.now()}${ext}`, {
        type: mime,
      });

      const fd = new FormData();
      fd.append("UploadedImage", file);

      // 🔥 MUST MATCH COMPANY UPLOAD RULE
      fd.append("pagename", "EmpDoc");

      const response = await postDocument(fd);

      const fileName = response?.fileName || response?.Message;

      if (!fileName) {
        toast.error("Profile upload failed");
        return;
      }

      // ✅ Sync with React + Formik
      setProfilePic(fileName);
    } catch (err) {
      console.error(err);
      toast.error("Profile upload failed");
    } finally {
      setLoadingLogo(false);
    }
  };

  const deleteLogo = () => {
    Swal.fire({
      title: "Remove profile picture?",
      text: "This action will remove the employee profile picture.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444", // red
      cancelButtonColor: "#9ca3af", // gray
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setProfilePic("");
        setRawImage("");

        Swal.fire({
          title: "Removed!",
          text: "Profile picture has been removed.",
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
      Swal.fire({
        title: "Upload Failed",
        text: "Document upload failed. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });

      // Revert UI if failed
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
      confirmButtonColor: "#ef4444", // red
      cancelButtonColor: "#9ca3af", // gray
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setDocValues((prev) => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            file: undefined,
            fileName: "",
            isDeleted: true, // 🔥 key for backend delete
          },
        }));

        Swal.fire({
          title: "Removed!",
          text: "Document will be removed after saving.",
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>,
  ) => {
    // if (!values.loginType && !values.copyRoleFrom) {
    //   toast.error("Select Login Type or Copy Role From");
    //   setLoading(false);
    //   return;
    // }

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
          };
        }

        // Insert mode: only send filled ones
        if (userEntry?.fileName || userEntry?.number) {
          return {
            DocumentId: Number(doc.DocumentId),
            DocumentName: doc.DocumentName,
            DocumentNumber: userEntry?.number || "",
            File: userEntry?.isDeleted ? "" : userEntry?.fileName || "",
          };
        }

        return null;
      })
      .filter(Boolean);

    // 🔹 INSERT salary format (OBJECT)
    const salaryObject: Record<string, number> = {};

    salaryHeads.forEach((s) => {
      salaryObject[`Salary_${s.SalaryTypeId}`] = Number(s.Value) || 0;
    });

    // 🔹 UPDATE salary format (ARRAY)
    const salaryArray = salaryHeads.map((s) => ({
      SalaryTypeId: Number(s.SalaryTypeId),
      Value: Number(s.Value) || 0,
    }));

    const salaryPayload = isEditMode ? salaryArray : salaryObject;

    try {
      const payload = {
        procName: "Employee",
        Para: JSON.stringify({
          ActionMode: isEditMode ? "Update" : "Insert",
          EditId: isEditMode ? Number(id) : "",

          FirstName: values.firstName,
          MiddleName: values.middleName || "",
          LastName: values.lastName,
          FatherName: values.fatherName || "",

          Gender: values.gender,
          DOB: values.dob,
          DOJ: values.doj,

          EmailId: values.email,
          AlternateEmailId: values.alternateEmail || "",
          ContactNo: values.contactNo,
          AlternateContactNo: values.alternateContactNo || "",

          Address: values.address,
          CountryId: Number(values.countryId),
          StateId: Number(values.stateId),
          CityId: Number(values.cityId),
          Pincode: values.pincode,

          CurrentAddress: values.currentAddress || "",
          CurrentCountryId: Number(values.currentCountryId || 0),
          CurrentStateId: Number(values.currentStateId || 0),
          CurrentCityId: Number(values.currentCityId || 0),
          CurrentPinCode: values.currentPincode || "",

          DepartmentId: Number(values.departmentId),
          DesignationId: Number(values.designationId),
          EmployeeTypeId: Number(values.employeeTypeId),
          CompanyId: Number(values.companyId),
          ReportingManagerId: Number(values.reportingManagerId || 0),

          BankName: values.bankName,
          BranchName: values.branchName,
          AccountNo: values.accountNo,
          IFSCCode: values.ifscCode,
          // AccountHolderName: values.accountHolderName || "",

          ...(isEditMode
            ? {} // ❌ DO NOT SEND LoginType / CopyRoleFrom in Update
            : {
                LoginType: values.copyRoleFrom ? "" : Number(values.loginType),
                CopyRoleFrom: values.copyRoleFrom
                  ? Number(values.copyRoleFrom)
                  : "",
              }),

          ProfilePic: profilePic || "",
          Signature: values.signature || "",

          ShortAbout: values.shortAbout || "",
          Skills: values.skills || "",
          TotalExperience: Number(values.totalExperience || 0),

          Salary: encodeURIComponent(JSON.stringify(salaryPayload)),
          EmployeeDocuments: encodeURIComponent(JSON.stringify(documentsArray)),

          EntryBy: loggedInEmployeeId,
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
              setProfilePic("");
              setDocValues({});
              setTab(0);
            }
            navigate("/superadmin/employee/manage-employee");
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

  const SelectUserModal = ({
    open,
    onClose,
    users,
    onSelect,
    search,
    setSearch,
  }: any) => {
    const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState(search);
    const pageSize = 8; // users per page

    // Reset page when modal opens, search changes, or users change
    useEffect(() => {
      if (open) setSearchInput(search || "");
      setCurrentPage(1);
    }, [open]);

    if (!open) return null;

    const totalCount = users.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const pagedUsers = users.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    return (
      <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center">
        <div className="bg-white dark:bg-[#0c1427] w-[420px] min-h-[520px] flex flex-col rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                Select User
              </p>
              <p className="text-xs text-gray-500 -mt-4">
                Click on a user to assign
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {/* Input with search icon */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search name, role, company..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();

                      setSearch(searchInput);
                      setCurrentPage(1);
                    }
                  }}
                  className="
          w-full border rounded-md pl-9 pr-9 py-2 text-sm
          bg-white dark:bg-gray-800
          border-gray-200 dark:border-gray-700
          text-gray-800 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
        "
                />

                {/* Clear (X) */}
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search Button */}
              <button
                type="button"
                onClick={() => {
                  setSearch(searchInput);
                  setCurrentPage(1);
                }}
                className="
        px-3 py-2 rounded-md
        bg-primary-500 hover:bg-primary-600
        text-white text-sm
      "
              >
                Search
              </button>
            </div>
          </div>

          {/* User List */}
          <div className="h-[320px] overflow-y-auto">
            {pagedUsers.map((u: any) => {
              // 🔥 REMOVE "|1" OR ANY SUFFIX
              const profilePic = u.ProfilePic || "";

              return (
                <div
                  key={u.EmployeeId}
                  onClick={() => onSelect(u)}
                  className="
    flex items-center gap-3 gap-x-5 px-5 py-3 border-b cursor-pointer
    hover:bg-gray-50 dark:hover:bg-[#16203a]
    border-gray-100 dark:border-gray-700
  "
                >
                  {/* PROFILE IMAGE – FIXED SIZE */}
                  <div className="w-15 h-15 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {profilePic ? (
                      <img
                        src={getImageUrl(profilePic)}
                        alt="Profile Image"
                        onClick={openLogoInNewTab}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-500">
                        {u.Name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* TEXT BLOCK – SAME HEIGHT AS IMAGE */}
                  <div className="h-15 flex flex-col justify-between min-w-0">
                    <span className="text-[13px] leading-none font-medium text-gray-800 dark:text-gray-100 truncate">
                      {u.Name}
                    </span>

                    <span className="text-[12px] leading-none text-gray-500 truncate">
                      {u.DesignationName}
                    </span>

                    <span className="text-[11px] leading-none text-gray-400 truncate">
                      {u.CompanyName}
                    </span>
                  </div>
                </div>
              );
            })}

            {pagedUsers.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">
                No users found
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 mb-2">
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>
    );
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
        value={values?.[name] ?? ""}
        onChange={handleChange}
        disabled={disabled}
        className={`${bigInputClasses} ${
          disabled
            ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400"
            : ""
        } ${
          errors?.[name] && touched?.[name]
            ? "border-red-500 focus:ring-red-500"
            : ""
        }`}
      />
      {errors?.[name] && touched?.[name] && (
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
            value={values?.[name] ?? ""}
            onChange={(e) => {
              handleChange(e);
              if (onCustomChange) onCustomChange(e);
            }}
            disabled={disabled || loading}
            className={`${bigInputClasses} ${
              disabled || loading
                ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400"
                : ""
            } ${errors?.[name] && touched?.[name] ? "border-red-500" : ""}`}
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
        {errors?.[name] && touched?.[name] && (
          <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
        )}
      </div>
    );
  };

  const RadioGroupField = ({
    label,
    name,
    options,
    values,
    errors,
    touched,
    setFieldValue,
    className,
  }: any) => (
    <div className={`flex flex-col ${className}`}>
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-2">
        {label?.includes("*") ? (
          <>
            {label.replace("*", "")}
            <span className="text-red-500 ml-0.5">*</span>
          </>
        ) : (
          label
        )}
      </label>

      <div className="flex items-center gap-6">
        {options.map((opt: any) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={values[name] === opt.value}
              onChange={() => setFieldValue(name, opt.value)}
              className="w-4 h-4 text-primary-500 focus:ring-primary-500"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {errors?.[name] && touched?.[name] && (
        <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
      )}
    </div>
  );

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
        value={values?.[name] ?? ""}
        onChange={handleChange}
        className={`${bigInputClasses.replace("h-10", "h-auto")} ${
          errors?.[name] && touched?.[name] ? "border-red-500" : ""
        }`}
      ></textarea>
      {errors?.[name] && touched?.[name] && (
        <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
      )}
    </div>
  );

  const touchAllFields = (values: any, setTouched: any) => {
    const touchedFields: any = {};

    const traverse = (obj: any, path: string[] = []) => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const currentPath = [...path, key];

        if (typeof value === "object" && value !== null) {
          traverse(value, currentPath);
        } else {
          touchedFields[currentPath.join(".")] = true;
        }
      });
    };

    traverse(values);
    setTouched(touchedFields, true);
  };

  const tabs = [
    { label: "Address Details", icon: <FaRegAddressCard /> },
    { label: "Joining Details", icon: <FaBuilding /> },
    { label: "Documents", icon: <FaFile /> },
    { label: "Bank Account Details", icon: <FaBuilding /> },
    { label: "Salary Details", icon: <FaBriefcase /> },
    { label: "Login Detail", icon: <FaUser /> },
    { label: "Skills & Exp", icon: <FaBriefcase /> },
  ];

  if (isEditMode && initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white dark:bg-[#0c1427] rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading employee details...
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
      validationSchema={employeeValidationSchema}
      enableReinitialize
      context={{ sameAsPermanent }}
      onSubmit={async (values, formikHelpers) => {
        touchAllFields(values, formikHelpers.setTouched);
        await handleSubmit(values, formikHelpers);
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleSubmit,
        setFieldValue,
        isSubmitting,
        submitCount,
      }) => {
        // 🔥 AUTO-SWITCH TO LOGIN TAB WHEN LOGIN VALIDATION FAILS
        useEffect(() => {
          if (submitCount > 0 && errors.loginType) {
            setTab(5);
          }
        }, [submitCount, errors.loginType]);

        const isLoginTypeSelected = Boolean(values.loginType);
        const isCopyRoleSelected = Boolean(values.copyRoleFrom);

        const clearCopyRole = () => {
          setSelectedCopyRoleUser(null);
          setFieldValue("copyRoleFrom", "");
        };

        return (
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
            />

            <SameAddressSync
              sameAsPermanent={sameAsPermanent}
              values={values}
              setFieldValue={setFieldValue}
            />

            {(loading || isSubmitting || permissionLoading) && (
              <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0c1427]/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
              </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {isEditMode ? "Edit Employee" : "Add Employee"}
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
                    (isEditMode ? canEditEmployee : canAddEmployee)
                  }
                  allowedText="Submit Company"
                  deniedText="You do not have permission"
                >
                  <button
                    type="submit"
                    disabled={
                      permissionLoading ||
                      (isEditMode ? !canEditEmployee : !canAddEmployee)
                    }
                    className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2
      ${
        permissionLoading || (isEditMode ? !canEditEmployee : !canAddEmployee)
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
                      {profilePic ? (
                        <img
                          src={getImageUrl(profilePic)}
                          alt="Profile Image"
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
                        {(profilePic || rawImage) && (
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <InputField
                      label="First Name:*"
                      name="firstName"
                      placeholder="Enter first name"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />
                    <InputField
                      label="Middle Name:"
                      name="middleName"
                      placeholder="Enter middle name"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />
                    <InputField
                      label="Last Name:*"
                      name="lastName"
                      placeholder="Enter last name"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />
                    <InputField
                      label="Father's Name:*"
                      name="fatherName"
                      placeholder="Enter father's name"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    <RadioGroupField
                      label="Gender*"
                      name="gender"
                      options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                        // { value: "Other", label: "Other" },
                      ]}
                      values={values}
                      errors={errors}
                      touched={touched}
                      setFieldValue={setFieldValue}
                    />

                    <InputField
                      label="Date of Birth:*"
                      name="dob"
                      type="date"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    <InputField
                      label="Email:*"
                      name="email"
                      placeholder="Enter email address"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                      disabled={editDisabledFields.email}
                    />

                    <InputField
                      label="Alternate Email:"
                      name="alternateEmail"
                      placeholder="Enter alternate email address"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />
                    <InputField
                      label="Phone Number:*"
                      name="contactNo"
                      placeholder="Enter mobile number"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    <InputField
                      label="Alternate Number:"
                      name="alternateContactNo"
                      placeholder="Enter alternate mobile number"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 mb-6">
                {/* Added: overflow-x-auto, whitespace-nowrap, and adjusted gap */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4 md:gap-6 overflow-x-auto whitespace-nowrap">
                  {tabs.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTab(i)}
                      // Added: flex-shrink-0 to prevent buttons from shrinking
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

              {/* TAB 0: Address Details */}
              {tab === 0 && (
                <div className="animate-fadeIn space-y-8">
                  {/* ---------- PERMANENT ADDRESS ---------- */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Permanent Address
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <TextAreaField
                        className="md:col-span-4"
                        label="Address*"
                        name="address"
                        placeholder="Enter permanent address"
                        values={values}
                        handleChange={handleChange}
                        errors={errors}
                        touched={touched}
                      />

                      <SelectField
                        label="Country*"
                        name="countryId"
                        options={countries}
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        onCustomChange={() => {
                          setFieldValue("stateId", "");
                          setFieldValue("cityId", "");
                        }}
                      />

                      <SelectField
                        label="State*"
                        name="stateId"
                        options={states}
                        loading={loadingStates}
                        disabled={!values.countryId}
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        onCustomChange={() => setFieldValue("cityId", "")}
                      />

                      <SelectField
                        label="City*"
                        name="cityId"
                        options={cities}
                        loading={loadingCities}
                        disabled={!values.stateId}
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Pin Code*"
                        name="pincode"
                        placeholder="Enter pin / zip code"
                        values={values}
                        handleChange={handleChange}
                        errors={errors}
                        touched={touched}
                      />
                    </div>
                  </div>

                  {/* ---------- SAME AS PERMANENT ---------- */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sameAsPermanent}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsPermanent(checked);

                        if (!checked) {
                          setFieldValue("currentAddress", "");
                          setFieldValue("currentCountryId", "");
                          setFieldValue("currentStateId", "");
                          setFieldValue("currentCityId", "");
                          setFieldValue("currentPincode", "");
                        }
                      }}
                      className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      Same as permanent address
                    </label>
                  </div>

                  {/* ---------- CURRENT ADDRESS ---------- */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Current Address
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <TextAreaField
                        className="md:col-span-4"
                        label="Address"
                        name="currentAddress"
                        placeholder="Enter current address"
                        values={values}
                        handleChange={handleChange}
                        errors={errors}
                        touched={touched}
                      />

                      <SelectField
                        label="Country"
                        name="currentCountryId"
                        options={countries}
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <SelectField
                        label="State"
                        name="currentStateId"
                        options={states}
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <SelectField
                        label="City"
                        name="currentCityId"
                        options={cities}
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Pin Code"
                        name="currentPincode"
                        placeholder="Enter pin / zip code"
                        values={values}
                        handleChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: Joining Details */}
              {tab === 1 && (
                <div className="animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SelectField
                      label="Company / Branch*"
                      name="companyId"
                      options={companies}
                      values={values}
                      errors={errors}
                      touched={touched}
                      disabled={isEditMode} // 🔒 FIX COMPANY IN EDIT MODE
                      handleChange={handleChange}
                      onCustomChange={(e: any) => {
                        const companyId = Number(e.target.value);

                        setFieldValue("companyId", companyId);

                        // 🔥 ADD MODE ONLY: reset reporting manager
                        if (!isEditMode) {
                          setSelectedManager(null);
                          setFieldValue("reportingManagerId", "");
                        }

                        // Reset documents (safe in both)
                        setDocValues({});

                        if (companyId) {
                          fetchMasterDocuments(companyId);

                          // ADD MODE ONLY: reload salary
                          if (!isEditMode) {
                            fetchSalaryHeads(companyId);
                          }
                        }
                      }}
                    />

                    <div className="md:col-span-1">
                      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                        Reporting Manager
                      </label>

                      <div className="flex">
                        {/* INPUT WITH AVATAR */}
                        <div className="relative flex-1">
                          {/* Avatar */}
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                            {selectedManager?.ProfilePic ? (
                              <img
                                src={getImageUrl(selectedManager.ProfilePic)}
                                alt={selectedManager.Name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaUserCircle className="text-xl text-gray-400 dark:text-gray-600" />
                            )}
                          </div>

                          <input
                            type="text"
                            readOnly
                            value={selectedManager?.Name || ""}
                            placeholder="Select reporting manager"
                            className="
          w-full h-10 pl-11 pr-3
          border border-gray-200 rounded-l-md
          text-sm placeholder-gray-400
          focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
          bg-white dark:bg-gray-800
          dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500
        "
                          />
                        </div>

                        <button
                          type="button"
                          className="px-4 bg-primary-500 text-white rounded-r-md text-sm"
                          onClick={() => {
                            if (!values.companyId) {
                              Swal.fire({
                                title: "Company Required",
                                text: "Please select Company / Branch first.",
                                icon: "warning",
                                confirmButtonText: "OK",
                                confirmButtonColor: "#3b82f6",
                              });
                              return;
                            }

                            setShowManagerPopup(true);
                            fetchManagers(Number(values.companyId));
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>

                    <InputField
                      label="Joining Date*"
                      name="doj"
                      type="date"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    <SelectField
                      label="Employee Type*"
                      name="employeeTypeId"
                      options={employeeTypes}
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                    />

                    <SelectField
                      label="Department*"
                      name="departmentId"
                      options={departments}
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                    />

                    <SelectField
                      label="Designation*"
                      name="designationId"
                      options={designations}
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Documents */}
              {tab === 2 && (
                <div className="animate-fadeIn">
                  {!values.companyId ? (
                    <div className="flex flex-col items-center justify-center min-h-[180px] border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-center">
                      <FaBuilding className="text-3xl text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Company / Branch not selected
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Please select a company or branch to upload documents.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Header - HIDDEN on Mobile, Visible on Desktop */}
                      {/* Adjusted cols: Name(3) Number(4) File(5) to give more room for files */}
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
                              {/* Name (3 Cols) */}
                              <div className="col-span-12 md:col-span-3 text-sm text-gray-800 dark:text-gray-200 font-bold md:font-medium">
                                {doc.DocumentName}
                              </div>

                              {/* Number (4 Cols) */}
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

                              {/* Upload Section (5 Cols) */}
                              <div className="col-span-12 md:col-span-5">
                                <label className="block md:hidden text-xs text-gray-500 mb-1">
                                  Upload File
                                </label>

                                {/* flex-col on mobile, flex-row on desktop */}
                                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
                                  {/* Choose File Button - Fixed width */}
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

                                  {/* File Info Box - Takes remaining space (flex-1) */}
                                  {(docState?.fileName || docState?.file) && (
                                    <div className="relative flex-1 min-w-0 flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700">
                                      <div className="flex-1 min-w-0">
                                        {/* Progress (Only for new uploads) */}
                                        {!docState?.isExisting && (
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] uppercase font-bold text-green-600 whitespace-nowrap">
                                              {uploadProgress[
                                                doc.DocumentId
                                              ] === 100 ||
                                              !uploadProgress[doc.DocumentId]
                                                ? "Uploaded"
                                                : "Uploading..."}
                                            </span>
                                            <div className="flex-1 h-[4px] bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-primary-600 transition-all duration-300"
                                                style={{
                                                  width: `${
                                                    uploadProgress[
                                                      doc.DocumentId
                                                    ] || 100
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
                                            docState?.file?.name ||
                                            docState?.fileName
                                          }
                                          onClick={() =>
                                            openDocument(docState?.fileName)
                                          }
                                        >
                                          {docState?.file?.name ||
                                            docState?.fileName}
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
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: Bank Account Details */}
              {tab === 3 && (
                <div className="animate-fadeIn">
                  {/* <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Bank Details
                </p> */}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <InputField
                      label="Account Number*"
                      name="accountNo"
                      placeholder="Enter bank account number"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    <InputField
                      label="IFSC Code*"
                      name="ifscCode"
                      placeholder="Enter IFSC code"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    <InputField
                      label="Bank Name*"
                      name="bankName"
                      placeholder="Enter bank name"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    <InputField
                      label="Branch Name*"
                      name="branchName"
                      placeholder="Enter branch name"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    {/* <InputField
                    className="md:col-span-2"
                    label="Account Holder Name"
                    name="accountHolderName"
                    placeholder="Enter account holder name"
                    values={values}
                    handleChange={handleChange}
                    errors={errors}
                    touched={touched}
                  /> */}
                  </div>
                </div>
              )}

              {/* TAB 4: Salary Details */}
              {tab === 4 && (
                <div className="animate-fadeIn space-y-6">
                  {!values.companyId ? (
                    // ❌ No company selected
                    <div
                      className="
          flex flex-col items-center justify-center
          min-h-[180px]
          border border-dashed border-gray-300 dark:border-gray-600
          rounded-md
          bg-gray-50 dark:bg-gray-800
          text-center
        "
                    >
                      <FaBriefcase className="text-3xl text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Company / Branch not selected
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Please select a company or branch to configure salary
                        details.
                      </p>
                    </div>
                  ) : salaryHeads.length === 0 ? (
                    // ⚠️ Company selected, but no salary heads
                    <div className="text-sm text-gray-500 italic">
                      No salary heads configured for this company.
                    </div>
                  ) : (
                    <>
                      {/* Earnings */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Earnings
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          {salaryHeads
                            .filter((s) => s.Type === "Earning")

                            .map((head, idx) => (
                              <div key={idx}>
                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                  {head.SalaryType}
                                </label>
                                <input
                                  type="number"
                                  className={bigInputClasses}
                                  value={head.Value || 0}
                                  onChange={(e) => {
                                    const value = Number(e.target.value || 0);
                                    setSalaryHeads((prev) =>
                                      prev.map((x) =>
                                        x.SalaryTypeId === head.SalaryTypeId
                                          ? { ...x, Value: value }
                                          : x,
                                      ),
                                    );
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Deductions */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Deductions
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          {salaryHeads
                            .filter((s) => s.Type === "Deduction")
                            .map((head, idx) => (
                              <div key={idx}>
                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                  {head.SalaryType}
                                </label>
                                <input
                                  type="number"
                                  className={bigInputClasses}
                                  value={head.Value || 0}
                                  onChange={(e) => {
                                    const value = Number(e.target.value || 0);
                                    setSalaryHeads((prev) =>
                                      prev.map((x) =>
                                        x.SalaryTypeId === head.SalaryTypeId
                                          ? { ...x, Value: value }
                                          : x,
                                      ),
                                    );
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Net Salary */}
                      <div>
                        <button
                          type="button"
                          className="px-5 py-2 bg-primary-500 text-white rounded-md text-sm font-medium"
                        >
                          Net Salary: ₹{" "}
                          {salaryHeads
                            .reduce((acc, s) => {
                              if (s.Type === "Earning")
                                return acc + Number(s.Value || 0);
                              if (s.Type === "Deduction")
                                return acc - Number(s.Value || 0);
                              return acc;
                            }, 0)
                            .toLocaleString()}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 5: Login Detail */}
              {tab === 5 && (
                <div className="animate-fadeIn space-y-6">
                  {/* <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Login
                </p> */}

                  {/* FORM-LEVEL LOGIN ERROR */}
                  {/* {errors["login-or-copy-role"] && (
                    <div className="mb-3 text-sm text-red-600 font-medium">
                      {errors["login-or-copy-role"]}
                    </div>
                  )} */}

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr] gap-6">
                    {/* Login Type */}
                    <SelectField
                      label="Login Type*"
                      name="loginType"
                      options={loginTypes}
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={(e: any) => {
                        handleChange(e);

                        // 🔥 Login type selected → clear copy role
                        setSelectedCopyRoleUser(null);
                        setFieldValue("copyRoleFrom", "");
                      }}
                      disabled={
                        editDisabledFields.loginType || isCopyRoleSelected
                      }
                    />

                    <div
                      className={`hidden md:flex items-center justify-center transition-opacity
    ${isLoginTypeSelected || isCopyRoleSelected ? "opacity-40" : "opacity-100"}
  `}
                    >
                      <div className="relative h-full flex items-center">
                        {/* Vertical line */}
                        <div className="w-px h-16 bg-gray-300 dark:bg-gray-600"></div>

                        {/* OR badge */}
                        <span
                          className="
        absolute left-1/2 -translate-x-1/2
        px-2 py-0.5
        text-xs font-semibold
        bg-white dark:bg-[#0c1427]
        text-gray-500 dark:text-gray-300
      "
                        >
                          OR
                        </span>
                      </div>
                    </div>

                    {/* Copy Role From */}
                    <div className="md:col-span-1">
                      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                        Copy Role From
                      </label>

                      <div className="flex relative">
                        {/* INPUT WITH AVATAR */}
                        <div className="relative flex-1">
                          {/* Avatar */}
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                            {selectedCopyRoleUser?.ProfilePic ? (
                              <img
                                src={getImageUrl(
                                  selectedCopyRoleUser.ProfilePic,
                                )}
                                alt={selectedCopyRoleUser.Name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaUserCircle className="text-xl text-gray-400 dark:text-gray-600" />
                            )}
                          </div>

                          <input
                            type="text"
                            readOnly
                            disabled={
                              editDisabledFields.copyRoleFrom ||
                              isLoginTypeSelected
                            }
                            value={selectedCopyRoleUser?.Name || ""}
                            placeholder="Select user to copy role from"
                            className={`
          w-full h-10 pl-11 pr-10
          border border-gray-200 rounded-l-md
          text-sm placeholder-gray-400
          focus:outline-none
          ${
            isLoginTypeSelected
              ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800"
              : "bg-white dark:bg-gray-800"
          }
          dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500
        `}
                          />
                        </div>

                        {/* ❌ CLEAR */}
                        {selectedCopyRoleUser &&
                          !editDisabledFields.copyRoleFrom && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCopyRoleUser(null);
                                setFieldValue("copyRoleFrom", "");
                              }}
                              className="absolute right-[4.5rem] top-1/2 -translate-y-1/2
                   text-gray-400 hover:text-red-500 transition"
                            >
                              <FaTimes size={14} />
                            </button>
                          )}

                        <button
                          type="button"
                          disabled={
                            editDisabledFields.copyRoleFrom ||
                            isLoginTypeSelected
                          }
                          className={`px-4 rounded-r-md text-sm text-white
        ${
          isLoginTypeSelected
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary-500 hover:bg-primary-600"
        }`}
                          onClick={() => {
                            if (!values.companyId) {
                              Swal.fire({
                                title: "Company Required",
                                text: "Please select Company / Branch first.",
                                icon: "warning",
                                confirmButtonText: "OK",
                                confirmButtonColor: "#3b82f6",
                              });
                              return;
                            }

                            setShowCopyRolePopup(true);
                            fetchManagers(Number(values.companyId));
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Skills & Experience */}
              {tab === 6 && (
                <div className="animate-fadeIn space-y-6">
                  {/* <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Skills & Experience
                </p> */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Short About */}
                    <TextAreaField
                      className="md:col-span-3"
                      label="Short About*"
                      name="shortAbout"
                      placeholder="Write a short description about the employee"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    {/* Skills */}
                    <InputField
                      label="Skills*"
                      name="skills"
                      placeholder="Enter skills (e.g. JavaScript, React, SQL, HTML, ASP.NET etc.)"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />

                    {/* Total Experience */}
                    <InputField
                      label="Total Experience (Years)*"
                      name="totalExperience"
                      type="number"
                      placeholder="Enter total experience in years"
                      values={values}
                      handleChange={handleChange}
                      errors={errors}
                      touched={touched}
                    />
                  </div>
                </div>
              )}
            </div>

            <SelectUserModal
              open={showManagerPopup}
              onClose={() => setShowManagerPopup(false)}
              users={managerList.filter((u) =>
                `${u.Name} ${u.DesignationName} ${u.CompanyName}`
                  .toLowerCase()
                  .includes(managerSearch.toLowerCase()),
              )}
              search={managerSearch}
              setSearch={(text: string) => {
                setManagerSearch(text);
                fetchManagers(Number(values.companyId), text);
              }}
              onSelect={(user: any) => {
                setSelectedManager(user);
                setFieldValue("reportingManagerId", user.EmployeeId);
                setShowManagerPopup(false);
              }}
            />

            <SelectUserModal
              open={showCopyRolePopup}
              onClose={() => setShowCopyRolePopup(false)}
              users={managerList.filter((u) =>
                `${u.Name} ${u.DesignationName} ${u.CompanyName}`
                  .toLowerCase()
                  .includes(managerSearch.toLowerCase()),
              )}
              search={managerSearch}
              setSearch={(text: string) => {
                setManagerSearch(text);
                // fetchManagers(Number(values.companyId), text);
              }}
              onSelect={(user: any) => {
                setSelectedCopyRoleUser(user);

                // 🔥 Copy role selected → clear login type
                setFieldValue("copyRoleFrom", user.EmployeeId);
                setFieldValue("loginType", "");

                setShowCopyRolePopup(false);
              }}
            />

            <CropperModal
              open={showCropper}
              image={rawImage}
              aspectRatio={1}
              onClose={() => setShowCropper(false)}
              onCrop={(croppedImage: string) => {
                setRawImage(croppedImage);
                uploadProfilePic(croppedImage);
                setShowCropper(false);
              }}
            />
            <ToastContainer position="top-right" autoClose={3000} />
          </form>
        );
      }}
    </Formik>
  );
}
