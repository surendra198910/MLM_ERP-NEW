"use client";
import React, { useEffect, useState } from "react";
import {
  FaUserCircle,
  FaUpload,
  FaTrash,
  FaPencilAlt,
  FaRegAddressCard,
  FaCalendarAlt,
  FaFileAlt,
  FaUniversity,
  FaMoneyCheckAlt,
  FaSignInAlt,
  FaTimes,
  FaTools,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import { useNavigate } from "react-router-dom";
import { Formik } from "formik";
import { employeeValidationSchema } from "../Yup/AddEmployeeValidation";
import CropperModal from "../Cropper/Croppermodel.jsx";
import { toast, ToastContainer } from "react-toastify";
import { useParams } from "react-router-dom";
import { PostService } from "../../../../services/PostService";

const getImageUrl = (file?: string) => {
  if (!file) return "/images/admin.png";

  const base = import.meta.env.VITE_IMAGE_PREVIEW_URL;
  const clean = file.split("|")[0].trim();

  if (!base) return clean;

  return `${base.replace(/\/$/, "")}/${clean}`;
};

export default function AddEmployee() {
  const { postDocument } = PostService();

  const [tab, setTab] = useState(0);
  const [sameAddress, setSameAddress] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [cStates, setCStates] = useState([]);
  const [cCities, setCCities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docValues, setDocValues] = useState({});
  const [companies, setCompanies] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loginTypes, setLoginTypes] = useState([]);
  const [salaryHeads, setSalaryHeads] = useState([]);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [profilePic, setProfilePic] = useState<string | "">("");
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCCountry, setSelectedCCountry] = useState("");
  const [selectedCState, setSelectedCState] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [editData, setEditData] = useState(null);
  const [existingProfilePic, setExistingProfilePic] = useState("");

  const { id } = useParams(); // employee id
  const isEditMode = Boolean(id);
  // backend filename
  const navigate = useNavigate();
  interface imgArr {
    documentId: number | string;
    documentNumber?: string;
    fileName: string;
  }

  const base64ToFile = async (base64: string, filename: string) => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const [imageList, setImageList] = useState<imgArr[]>([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState("");
  const { universalService, postDocumentService, postUserImage } = ApiService();

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      const payload = {
        procName: "Employee",
        Para: JSON.stringify({
          CompanyId: "1",
          searchData: "",
          ActionMode: "getUsersListByCompany",
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setUsers(res);
      }
    } catch (error) {
      console.log("User List Error:", error);
    } finally {
      setLoadingUsers(false);
    }
  };
  const fetchEmployeeById = async (empId: string) => {
    const payload = {
      procName: "Employee",
      Para: JSON.stringify({
        ActionMode: "Select",
        EditId: empId,
      }),
    };

    const response = await universalService(payload);
    return response?.data?.[0] || response?.[0];
  };

  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    return {
      firstName: parts[0] || "",
      middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
      lastName: parts.length > 1 ? parts[parts.length - 1] : "",
    };
  };

  const findIdByName = (list: { value: any; label: string }[], name: string) =>
    list.find((i) => i.label === name)?.value || "";

  useEffect(() => {
    if (!id) return;

    const loadEmployee = async () => {
      const res = await universalService({
        procName: "Employee",
        Para: JSON.stringify({
          ActionMode: "Select",
          EditId: id,
        }),
      });

      const data = res?.data?.[0] || res?.[0];
      setEditData(data);
      if (!data) return;
      let loginTypeName = "";
      try {
        const loginArr = JSON.parse(data.LoginDetails || "[]");
        loginTypeName = loginArr?.[0]?.LoginType || "";
      } catch (e) {
        loginTypeName = "";
      }
      const { firstName, middleName, lastName } = splitName(data.Name || "");

      // 🔹 Salary
      const salaryArr = JSON.parse(data.Salary || "[]");
      const salaryObj = {};

      salaryArr.forEach((s) => {
        salaryObj[s.SalaryTypeId] = Number(s.Value || 0);
      });

      setForm((p) => ({
        ...p,
        salary: salaryObj,
      }));
      const extractYears = (val) => {
        if (!val) return "";
        const match = String(val).match(/\d+/);
        return match ? match[0] : "";
      };

      setForm((prev) => ({
        ...prev,
        firstName,
        middleName,
        lastName,
        fatherName: data.FatherName || "",
        gender: data.Gender || "Male",
        dob: data.DOB?.split("T")[0] || "",
        joiningDate: data.DOJ?.split("T")[0] || "",
        email: data.EmailId || "",
        altEmail: data.AlternateEmailId || "",
        phone: data.ContactNo || "",
        altPhone: data.AlternateContactNo || "",
        address: data.Address || "",
        country: findIdByName(countries, data.CountryName),
        // state: findIdByName(states, data.StateName),
        // city: findIdByName(cities, data.CityName),
        zip: data.Pincode || "",
        c_address: data.CurrentAddress || "",
        c_country: findIdByName(countries, data.CurrentCountryName),
        // c_state: findIdByName(cStates, data.CurrentStateName),
        // c_city: findIdByName(cCities, data.CurrentCityName),
        c_zip: data.CurrentPinCode || "",
        manager: data.ReportingManager || "",
        branch: findIdByName(companies, data.Company),
        department: findIdByName(departments, data.DepartmentName),
        designation: findIdByName(designations, data.DesignationName),
        employeeType: findIdByName(employeeTypes, data.EmployeeType),
        accountNumber: data.AccountNo || "",
        ifsc: data.IFSCCode || "",
        bankName: data.BankName || "",
        branchName: data.BranchName || "",
        shortAbout: data.ShortAbout || "",
        skills: data.Skills || "",
        totalExperience: extractYears(data.TotalExperience),
        salary: salaryObj,
        loginType: findIdByName(loginTypes, loginTypeName),
      }));

      setProfilePic(data.ProfilePic || "");
      setExistingProfilePic(data.ProfilePic || "");
    };

    loadEmployee();
  }, [
    id,
    countries,
    states,
    cities,
    cStates,
    cCities,
    departments,
    designations,
    employeeTypes,
    companies,
    loginTypes,
  ]);

  const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;
  const fetchSalaryHeads = async () => {
    try {
      const payload = {
        procName: "SalaryHead",
        Para: JSON.stringify({
          CompanyId: 1,
          ActionMode: "Select",
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setSalaryHeads(res);
      }
    } catch (error) {
      console.log("SalaryHead Error:", error);
    }
  };

  const fetchLoginTypes = async () => {
    try {
      const payload = {
        procName: "GetDDLData",
        Para: JSON.stringify({
          tbl: "master.logintype",
          searchField: "logintype",
          filterCTL: "",
          filterData: JSON.stringify({
            status: "Active",
            CompanyId: 1,
          }),
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setLoginTypes(
          res.map((l) => ({
            value: l.id, // ✅ from API
            label: l.name, // ✅ from API
          })),
        );
      }
    } catch (error) {
      console.log("Login Type Error:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const payload = {
        procName: "GetDDLData",
        Para: JSON.stringify({
          tbl: "master.Department",
          searchField: "DepartmentName",
          filterCTL: "",
          filterData: JSON.stringify({ CompanyId: 1 }),
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setDepartments(
          res.map((d) => ({
            value: d.id, // ✅ from API
            label: d.name, // ✅ from API
          })),
        );
      }
    } catch (error) {
      console.log("Department Error:", error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const payload = {
        procName: "GetDDLData",
        Para: JSON.stringify({
          tbl: "master.Designation",
          searchField: "DesignationName",
          filterCTL: "",
          filterData: JSON.stringify({ CompanyId: 1 }),
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setDesignations(
          res.map((d) => ({
            value: d.id, // ✅ from API
            label: d.name, // ✅ from API
          })),
        );
      }
    } catch (error) {
      console.log("Designation Error:", error);
    }
  };

  const fetchEmployeeTypes = async () => {
    try {
      const payload = {
        procName: "GetDDLData",
        Para: JSON.stringify({
          tbl: "master.EmployeeTypeMaster",
          searchField: "EmployeeType",
          filterCTL: "",
          filterData: JSON.stringify({ CompanyId: 1 }),
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setEmployeeTypes(
          res.map((e) => ({
            value: e.id, // ✅ from API
            label: e.name, // ✅ from API
          })),
        );
      }
    } catch (error) {
      console.log("Employee Type Error:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const payload = {
        procName: "Company",
        Para: JSON.stringify({
          EmployeeId: localStorage.getItem("EmployeeId") || 1,
          ActionMode: "getCompanyList",
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setCompanies(
          res.map((c) => ({
            value: c.CompanyId ?? c.id,
            label: c.CompanyName ?? c.name,
          })),
        );
      }
    } catch (error) {
      console.log("Company List Error:", error);
    }
  };
  const deleteLogo = () => {
    Swal.fire({
      title: "Remove profile image?",
      text: "This action will remove the profile image.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444", // red
      cancelButtonColor: "#9ca3af", // gray
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setProfilePic(""); // ✅ backend value
        setRawImage(""); // ✅ preview
        setAvatar(""); // ✅ cropped image
        setProfileUploadProgress(0); // ✅ loader reset

        Swal.fire({
          title: "Removed!",
          text: "profile image has been removed.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const fetchEmployeeDocuments = async () => {
    try {
      const payload = {
        procName: "EmployeeDocuments",
        Para: JSON.stringify({
          CompanyId: 1,
          ActionMode: "Select",
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      if (Array.isArray(res)) {
        setDocuments(res);
      }
    } catch (error) {
      console.log("EmployeeDocuments Error:", error);
    }
  };

  const fetchDDL = async ({
    tbl,
    searchField,
    filterCTL = "",
    filterCTLvalue = "",
    filterData = "",
  }) => {
    try {
      const payload = {
        procName: "GetDDLData",
        Para: JSON.stringify({
          tbl,
          searchField,
          filterCTL,
          filterCTLvalue,
          filterData,
        }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;

      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.log("DDL Error:", err);
      return [];
    }
  };

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    gender: "Male",
    dob: "",
    email: "",
    altEmail: "",
    phone: "",
    altPhone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    c_address: "",
    c_country: "",
    c_state: "",
    c_city: "",
    c_zip: "",
    branch: "",
    manager: "",
    joiningDate: "",
    employeeType: "",
    department: "",
    designation: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branchName: "",
    basic: "",
    hra: "",
    da: "",
    ta: "",
    esic: "",
    otherAllowance: "",
    pf: "",
    loginType: "",
    copyRoleFrom: "",
    shortAbout: "",
    skills: "",
    totalExperience: "",
    salary: {},
  });
  const handleSalaryChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      salary: {
        ...prev.salary,
        [id]: value,
      },
    }));
  };
  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const tabs = [
    { label: "Address Details", icon: <FaRegAddressCard size={18} /> },
    { label: "Joining Details", icon: <FaCalendarAlt size={18} /> },
    { label: "Documents", icon: <FaFileAlt size={18} /> },
    { label: "Bank Account Details", icon: <FaUniversity size={18} /> },
    { label: "Salary Details", icon: <FaMoneyCheckAlt size={18} /> },
    { label: "Login Detail", icon: <FaSignInAlt size={18} /> },
    { label: "Skills & Exp", icon: <FaTools size={18} /> },
  ];

  // Avatar Handler

  const handleFileUpload = async (docId: number, file?: File) => {
    if (!file) return;

    // Reset progress
    setUploadProgress((prev) => ({ ...prev, [docId]: 0 }));

    // Set temporary file for UI while uploading
    setDocValues((prev) => ({
      ...prev,
      [docId]: { ...prev[docId], file: file }, // Store file object to show name
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

  const DOCUMENT_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;
  const openDocument = (fileName?: string) => {
    if (!fileName) return;
    const url = `${DOCUMENT_PREVIEW_URL}${fileName}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const removeFileOnly = (docId: number) => {
    setDocValues((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        file: undefined,
        fileName: "",
        isDeleted: true,
      },
    }));
  };

  useEffect(() => {
    console.log("Updated Image List:", imageList);
  }, [imageList]);

  const handleDocChange = (docId, key, value) => {
    setDocValues((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [key]: value,
      },
    }));

    if (key === "number") {
      setUploadedDocuments((prev) =>
        prev.map((d) =>
          d.documentId === docId ? { ...d, documentNumber: value } : d,
        ),
      );
    }
  };

  // ⭐ Dark-mode compatible input style
  const bigInputClasses =
    "w-full border border-gray-300 dark:border-gray-700 rounded-md px-4 py-3 text-base h-12 " +
    "placeholder-gray-400 dark:placeholder-gray-500 " +
    "bg-white dark:bg-[#0c1427]  text-gray-800 dark:text-gray-200 " +
    "focus:outline-none focus:ring-2 focus:ring-primary-500";

  const InputField = ({
    label,
    placeholder = "",
    type = "text",
    name,
    className,
    errors,
    touched,
    handleChange,
    values,
    disabled = false,
  }) => (
    <div className={`flex flex-col ${className || ""}`}>
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
        {label?.includes("*") ? (
          <>
            {label.replace("*", "")}
            <span className="text-red-500 font-semibold ml-0.5">*</span>
          </>
        ) : (
          label
        )}
      </label>

      <input
        name={name}
        type={type}
        value={values[name] ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${bigInputClasses} ${
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
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();

    return (
      u.Name?.toLowerCase().includes(q) ||
      u.DesignationName?.toLowerCase().includes(q) ||
      u.CompanyName?.toLowerCase().includes(q)
    );
  });

  const SelectField = ({
    label,
    name,
    options = [],
    errors,
    touched,
    handleChange,
    values,
    loading = false,
    disabled = false, // ✅ add this
  }) => (
    <div className="flex flex-col relative">
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
        {label?.includes("*") ? (
          <>
            {label.replace("*", "")}
            <span className="text-red-500 font-semibold ml-0.5">*</span>
          </>
        ) : (
          label
        )}
      </label>

      <select
        name={name}
        value={values[name] ?? ""}
        onChange={handleChange}
        disabled={disabled || loading} // 🔥 DISABLE HERE
        className={`
        ${bigInputClasses}
        pr-10
        ${
          disabled || loading
            ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70"
            : ""
        }
        ${
          errors[name] && touched[name]
            ? "border-red-500 focus:ring-red-500"
            : ""
        }
      `}
      >
        <option value="">{loading ? "Loading..." : "Select"}</option>

        {!loading &&
          options.map((o, idx) => (
            <option key={idx} value={o.value}>
              {o.label}
            </option>
          ))}
      </select>

      {/* Spinner */}
      {loading && (
        <div className="absolute right-3 top-9">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {errors[name] && touched[name] && (
        <span className="text-xs text-red-600 mt-1">{errors[name]}</span>
      )}
    </div>
  );

  const TabButton = ({ i, label }) => (
    <button
      onClick={() => setTab(i)}
      className={`py-3 px-2 text-sm transition-colors ${
        tab === i
          ? "text-primary-500 border-b-2 border-primary-500"
          : "text-gray-500 dark:text-gray-400"
      }`}
      aria-current={tab === i}
    >
      {label.toUpperCase()}
    </button>
  );
  const toNumber = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };
  const totalEarnings = salaryHeads
    .filter((s) => s.SalaryType === "Earning")
    .reduce((sum, s) => sum + toNumber(form.salary[s.SalaryTypeId]), 0);

  const totalDeductions = salaryHeads
    .filter((s) => s.SalaryType === "Deduction")
    .reduce((sum, s) => sum + toNumber(form.salary[s.SalaryTypeId]), 0);

  const netSalary = totalEarnings - totalDeductions;

  const uploadProfileImage = async (base64Image: string) => {
    try {
      setProfileUploadProgress(0);

      // Convert base64 → blob
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const mime = blob.type;
      const ext = mime === "image/png" ? ".png" : ".jpg";

      const file = new File([blob], `profile${ext}`, { type: mime });

      const fd = new FormData();
      fd.append("UploadedImage", file);
      fd.append("pagename", "EmpDoc");

      const response = await postDocument(fd, (percent) => {
        setProfileUploadProgress(percent);
      });

      // ✅ Support both response formats
      const fileName = response?.fileName || response?.Message;

      if (fileName) {
        setProfilePic(fileName); // 🔥 save backend filename
      }
    } catch (err) {
      console.error("Profile upload failed", err);
      toast.error("Profile image upload failed");
    }
  };

  const buildSalaryJson = () => {
    const obj = {};
    Object.entries(form.salary).forEach(([k, v]) => {
      const num = parseFloat(String(v));

      if (!isNaN(Number(v))) {
        obj[k] = num;
      }
    });
    return JSON.stringify(obj);
  };

  const buildDocumentsJson = () => {
    const result = [];

    // Loop over all document inputs (number OR file)
    Object.entries(docValues).forEach(([docId, val]) => {
      const uploaded = imageList.find(
        (d) => String(d.documentId) === String(docId),
      );

      // Push even if file is not uploaded
      const docVal = val as { number?: string };
      result.push({
        DocumentId: Number(docId),

        DocumentNumber: docVal.number || "",

        File: uploaded?.fileName || "", // empty if not uploaded
      });
    });

    return JSON.stringify(result);
  };
  useEffect(() => {
    if (!editData || !documents.length) return;

    const docs = JSON.parse(editData.EmployeeDocuments || "[]");

    setDocValues(
      docs.reduce((acc, d) => {
        const match = documents.find((x) => x.DocumentName === d.DocumentName);
        if (!match) return acc;

        acc[match.DocumentId] = {
          number: d.DocumentNumber,
          fileName: d.Attachment,
        };
        return acc;
      }, {}),
    );
  }, [documents]);

  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      setCities([]);
      return;
    }

    const loadStates = async () => {
      try {
        setLoadingStates(true);

        const data = await fetchDDL({
          tbl: "master.state",
          searchField: "statename",
          filterCTL: "countryid",
          filterCTLvalue: selectedCountry,
        });

        setStates(
          data.map((s) => ({
            value: s.id,
            label: s.name,
          })),
        );
      } finally {
        setLoadingStates(false);
      }
    };

    loadStates();
  }, [selectedCountry]);

  useEffect(() => {
    const loadCountries = async () => {
      const data = await fetchDDL({
        tbl: "master.country",
        searchField: "countryname",
      });

      setCountries(
        data.map((c) => ({
          value: c.id || c.CountryId,
          label: c.name || c.CountryName,
        })),
      );
    };

    loadCountries();
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      try {
        setLoadingCities(true);
        const data = await fetchDDL({
          tbl: "master.city",
          searchField: "cityname",
          filterCTL: "stateid",
          filterCTLvalue: selectedState,
        });
        setCities(data.map((c) => ({ value: c.id, label: c.name })));
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, [selectedState]);

  useEffect(() => {
    if (!sameAddress) return;
    if (!cStates.length) return;

    setForm((p) => ({
      ...p,
      c_state: p.state,
    }));
  }, [cStates]);

  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      try {
        setLoadingCities(true);
        const data = await fetchDDL({
          tbl: "master.city",
          searchField: "cityname",
          filterCTL: "stateid",
          filterCTLvalue: selectedState,
        });
        setCities(data.map((c) => ({ value: c.id, label: c.name })));
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, [selectedState]);

  useEffect(() => {
    if (!selectedCCountry) {
      setCStates([]);
      setCCities([]);
      return;
    }

    const loadStates = async () => {
      const data = await fetchDDL({
        tbl: "master.state",
        searchField: "statename",
        filterCTL: "countryid",
        filterCTLvalue: selectedCCountry,
      });

      setCStates(
        data.map((s) => ({
          value: s.id,
          label: s.name,
        })),
      );
    };

    loadStates();
  }, [selectedCCountry]);

  useEffect(() => {
    if (!selectedCState) {
      setCCities([]);
      return;
    }

    const loadCities = async () => {
      const data = await fetchDDL({
        tbl: "master.city",
        searchField: "cityname",
        filterCTL: "stateid",
        filterCTLvalue: selectedCState,
      });

      setCCities(
        data.map((c) => ({
          value: c.id,
          label: c.name,
        })),
      );
    };

    loadCities();
  }, [selectedCState]);

  useEffect(() => {
    const loadAllMasterData = async () => {
      try {
        await Promise.all([
          fetchCompanies(),
          fetchEmployeeTypes(),
          fetchDesignations(),
          fetchDepartments(),
          fetchLoginTypes(),
          fetchSalaryHeads(),
          fetchEmployeeDocuments(),
        ]);
      } catch (err) {
        console.error("Initial master data load failed", err);
      }
    };

    loadAllMasterData();
  }, []);

  useEffect(() => {
    if (sameAddress && cCities.length && form.c_city) {
      // setFieldValue("c_city", form.c_city, false);
    }
  }, [cCities]);

  useEffect(() => {
    if (!editData || !countries.length) return;

    const countryId = findIdByName(countries, editData.CountryName);
    const cCountryId = findIdByName(countries, editData.CurrentCountryName);

    setSelectedCountry(countryId);
    setSelectedCCountry(cCountryId);

    setForm((p) => ({
      ...p,
      country: countryId,
      c_country: cCountryId,
    }));
  }, [countries, editData]);

  useEffect(() => {
    if (!editData || !states.length) return;

    const stateId = findIdByName(states, editData.StateName);
    setSelectedState(stateId);
    setForm((p) => ({ ...p, state: stateId }));
  }, [states]);

  useEffect(() => {
    if (!editData || !cities.length) return;

    const cityId = findIdByName(cities, editData.CityName);
    setForm((p) => ({ ...p, city: cityId }));
  }, [cities]);

  useEffect(() => {
    if (!editData || !cStates.length) return;

    const stateId = findIdByName(cStates, editData.CurrentStateName);
    setSelectedCState(stateId);
    setForm((p) => ({ ...p, c_state: stateId }));
  }, [cStates]);

  useEffect(() => {
    if (!editData || !cCities.length) return;

    const cityId = findIdByName(cCities, editData.CurrentCityName);
    setForm((p) => ({ ...p, c_city: cityId }));
  }, [cCities]);

  return (
    <Formik
      initialValues={form}
      validationSchema={employeeValidationSchema}
      enableReinitialize
      onSubmit={async (values, { resetForm, setSubmitting }) => {
        try {
          const payload = {
            procName: "Employee",
            Para: JSON.stringify({
              ActionMode: isEditMode ? "Update" : "Insert",

              // ===== EMPLOYEE DETAILS =====
              FirstName: values.firstName || "",
              MiddleName: values.middleName || "",
              LastName: values.lastName || "",
              FatherName: values.fatherName || "",
              Gender: values.gender || "Male",
              DOB: values.dob || "",
              DOJ: values.joiningDate || "",

              EmailId: values.email || "",
              AlternateEmailId: values.altEmail || "",
              ContactNo: values.phone || "",
              AlternateContactNo: values.altPhone || "",

              // ===== IDs (NUMERIC) =====
              DepartmentId: Number(values.department || 0),
              DesignationId: Number(values.designation || 0),
              EmployeeTypeId: Number(values.employeeType || 0),
              CompanyId: Number(values.branch || 0),
              ReportingManagerId: Number(values.manager || 0) || 0,

              // ===== ADDRESS =====
              Address: values.address || "",
              CountryId: Number(values.country || 0),
              StateId: Number(values.state || 0),
              CityId: Number(values.city || 0),
              Pincode: values.zip || "",

              CurrentAddress: values.c_address || "",
              CurrentCountryId: Number(values.c_country || 0),
              CurrentStateId: Number(values.c_state || 0),
              CurrentCityId: Number(values.c_city || 0),
              CurrentPinCode: values.c_zip || "",

              // ===== BANK =====
              AccountNo: values.accountNumber || "",
              IFSCCode: values.ifsc || "",
              BankName: values.bankName || "",
              BranchName: values.branchName || "",

              // ===== FILES =====
              ProfilePic: profilePic || existingProfilePic,

              Signature: "",

              // ===== EXTRA =====
              LoginType: values.loginType || "Aministrator",
              CopyRoleFrom: Number(values.copyRoleFrom || 0),
              ShortAbout: values.shortAbout || "",
              Skills: values.skills || "",
              TotalExperience: Number(values.totalExperience || 0),

              // ===== JSON FIELDS =====
              Salary: buildSalaryJson() || "{}",
              EmployeeDocuments: buildDocumentsJson() || "[]",

              EntryBy: 1,
            }),
          };

          const response = await universalService(payload);
          const res = Array.isArray(response)
            ? response[0]
            : response?.data?.[0];

          if (res?.statuscode === "1" || res?.statuscode === "2") {
            toast.success(
              res?.msg ||
                (res?.statuscode === "2"
                  ? "Employee updated successfully 🎉"
                  : "Employee added successfully 🎉"),
            );

            // 🔄 RESET EVERYTHING
            resetForm();
            setTab(0);
            setSameAddress(false);
            setAvatar("");
            setProfilePic("");
            setDocValues({});
            setImageList([]);
            setUploadedDocuments([]);
            navigate("/superadmin/employee/manage-employee");
          } else {
            toast.error(res?.msg || "Failed to save employee");
          }
        } catch (error) {
          console.error("Insert failed", error);
          toast.error("Failed to add employee");
        } finally {
          setSubmitting(false);
        }
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
      }) => (
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={`
    transition-all duration-300
    ${isSubmitting ? "blur-sm pointer-events-none select-none" : ""}
  `}
          >
            <div className="p-1">
              <div className="bg-white dark:bg-[#0c1427]  dark:border-gray-700 rounded-lg shadow-sm p-0">
                {/* Header Row */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
                  <div className="text-lg font-bold text-gray-800">
                    {isEditMode ? "Edit Employee" : "Add Employee"}
                  </div>
                  <div className="flex gap-x-2">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-sm font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium flex items-center gap-2"
                    >
                      Submit
                    </button>
                  </div>
                </div>
                {/* ================= TOP PROFILE ================= */}
                <div className="grid grid-cols-12 gap-6 items-start p-6">
                  {/* --- LEFT: LOGO SECTION --- */}
                  <div className="grid grid-cols-0 gap-0 col-span-12 md:col-span-2 justify-center items-center">
                    <div className="relative w-36 h-36 group">
                      <div className="w-full h-full rounded-xl border-[4px] border-white shadow-md overflow-hidden bg-gray-200 flex items-center justify-center relative">
                        {profilePic ? (
                          <img
                            src={getImageUrl(profilePic)}
                            onError={(e) =>
                              (e.currentTarget.src = "/images/admin.png")
                            }
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : rawImage ? (
                          <img
                            src={rawImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaUserCircle className="text-7xl text-gray-400" />
                        )}
                        {profileUploadProgress > 0 &&
                          profileUploadProgress < 100 && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                      </div>
                      {/* EDIT (always visible) */}
                      <label
                        className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center 
bg-white text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 
transition-all z-10 border border-gray-100"
                      >
                        <FaPencilAlt size={14} />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={onLogoChange}
                        />
                      </label>

                      {/* DELETE (only when image exists) */}
                      {(profilePic || rawImage) && (
                        <button
                          type="button"
                          onClick={deleteLogo}
                          className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center 
    bg-white text-red-400 rounded-full shadow-lg cursor-pointer hover:bg-red-50 
    transition-all z-10 border border-gray-200"
                        >
                          <FaTimes size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ================= MAIN FIELDS ================= */}
                  <div className="col-span-12 md:col-span-10">
                    <div className="grid grid-cols-12 gap-6">
                      <InputField
                        label="First Name *"
                        name="firstName"
                        placeholder="Enter first name"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Middle Name"
                        name="middleName"
                        placeholder="Enter middle name"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Last Name *"
                        name="lastName"
                        placeholder="Enter last name"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Father's Name *"
                        name="fatherName"
                        placeholder="Enter father's name"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      {/* Gender */}
                      <div className="flex flex-col col-span-12 md:col-span-3">
                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          Gender
                        </label>
                        <div className="flex items-center gap-4 mt-2 text-gray-700 dark:text-gray-300">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="gender"
                              value="Male"
                              checked={values.gender === "Male"}
                              onChange={handleChange}
                            />
                            Male
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="gender"
                              value="Female"
                              checked={values.gender === "Female"}
                              onChange={handleChange}
                            />
                            Female
                          </label>
                        </div>
                      </div>

                      <InputField
                        label="Date of Birth *"
                        name="dob"
                        type="date"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Email *"
                        name="email"
                        placeholder="example@mail.com"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Alternate Email"
                        name="altEmail"
                        placeholder="example@mail.com"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Phone Number *"
                        name="phone"
                        placeholder="Enter phone number"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />

                      <InputField
                        label="Alternate Number"
                        name="altPhone"
                        placeholder="Enter alternate number"
                        className="col-span-12 md:col-span-3"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                {/* <div className="my-7 border-t border-gray-200 dark:border-gray-700" /> */}

                {/* ================= TABS ================= */}
                <div className="border-b border-gray-200 dark:border-gray-700 mt-16">
                  <nav className="flex flex-wrap gap-12 px-10">
                    {tabs.map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTab(i)}
                        className={`pb-2 text-sm font-medium transition-colors flex items-center gap-2 ${tab === i ? "border-b-2 border-primary-500 text-primary-500" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"}`}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="pt-6 mb-10 p-6">
                  {/* ================= TAB 0 – ADDRESS ================= */}
                  {tab === 0 && (
                    <>
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                        Permanent Address
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        <InputField
                          label="Address *"
                          name="address"
                          placeholder="Enter full address"
                          className="col-span-12 md:col-span-4"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />

                        {/* COUNTRY */}
                        <div className="col-span-12 md:col-span-2">
                          <SelectField
                            label="Country *"
                            name="country"
                            options={countries}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={(e) => {
                              const v = e.target.value;
                              handleChange(e);

                              setSelectedCountry(v);
                              setSelectedState("");

                              setFieldValue("state", "");
                              setFieldValue("city", "");

                              setStates([]);
                              setCities([]);

                              if (sameAddress) {
                                setFieldValue("c_country", v);
                                setSelectedCCountry(v);
                              }
                            }}
                          />
                        </div>

                        {/* STATE */}
                        <div className="col-span-12 md:col-span-2">
                          <SelectField
                            label="State *"
                            name="state"
                            options={states}
                            loading={loadingStates}
                            disabled={!selectedCountry || loadingStates}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={(e) => {
                              const v = e.target.value;
                              handleChange(e);

                              setSelectedState(v);
                              setFieldValue("city", "");

                              if (sameAddress) {
                                setFieldValue("c_state", v);
                                setSelectedCState(v);
                              }
                            }}
                          />
                        </div>

                        {/* CITY */}
                        <div className="col-span-12 md:col-span-2">
                          <SelectField
                            label="City *"
                            name="city"
                            options={cities}
                            loading={loadingCities}
                            disabled={!selectedState || loadingCities}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={(e) => {
                              handleChange(e);
                              if (sameAddress)
                                setFieldValue("c_city", e.target.value);
                            }}
                          />
                        </div>

                        <InputField
                          label="Pin / Zip Code *"
                          name="zip"
                          placeholder="Enter zip code"
                          className="col-span-12 md:col-span-2"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />
                      </div>

                      {/* SAME ADDRESS */}
                      <label className="flex items-center gap-2 mt-4 text-sm">
                        <input
                          type="checkbox"
                          checked={sameAddress}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAddress(checked);

                            if (checked) {
                              setFieldValue("c_address", values.address);
                              setFieldValue("c_country", values.country);
                              setFieldValue("c_state", values.state);
                              setFieldValue("c_city", values.city);
                              setFieldValue("c_zip", values.zip);

                              setSelectedCCountry(values.country);
                              setSelectedCState(values.state);
                            } else {
                              setFieldValue("c_address", "");
                              setFieldValue("c_country", "");
                              setFieldValue("c_state", "");
                              setFieldValue("c_city", "");
                              setFieldValue("c_zip", "");

                              setSelectedCCountry("");
                              setSelectedCState("");
                            }
                          }}
                        />
                        Same as permanent address
                      </label>

                      {/* CURRENT ADDRESS */}
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mt-6 mb-4">
                        Current Address
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        <InputField
                          label="Address"
                          name="c_address"
                          placeholder="Enter full address"
                          className="col-span-12 md:col-span-4"
                          values={values}
                          errors={errors}
                          touched={touched}
                          disabled={sameAddress}
                          handleChange={handleChange}
                        />

                        {/* CURRENT COUNTRY */}
                        <div className="col-span-12 md:col-span-2">
                          <SelectField
                            label="Country"
                            name="c_country"
                            options={countries}
                            disabled={sameAddress}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={(e) => {
                              const v = e.target.value;
                              handleChange(e);
                              setSelectedCCountry(v);
                              setSelectedCState("");
                              setFieldValue("c_state", "");
                              setFieldValue("c_city", "");
                            }}
                          />
                        </div>

                        {/* CURRENT STATE */}
                        <div className="col-span-12 md:col-span-2">
                          <SelectField
                            label="State"
                            name="c_state"
                            options={cStates}
                            disabled={sameAddress || !selectedCCountry}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={(e) => {
                              const v = e.target.value;
                              handleChange(e);
                              setSelectedCState(v);
                              setFieldValue("c_city", "");
                            }}
                          />
                        </div>

                        {/* CURRENT CITY */}
                        <div className="col-span-12 md:col-span-2">
                          <SelectField
                            label="City"
                            name="c_city"
                            options={cCities}
                            disabled={sameAddress || !selectedCState}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={handleChange}
                          />
                        </div>

                        <InputField
                          label="Zip Code"
                          name="c_zip"
                          placeholder="Enter zip code"
                          className="col-span-12 md:col-span-2"
                          disabled={sameAddress}
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {/* ================= TAB 1 – JOINING DETAILS ================= */}
                  {tab === 1 && (
                    <>
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                        Joining Details
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        {/* ================= COMPANY / BRANCH ================= */}
                        <div className="flex flex-col col-span-12 md:col-span-3">
                          <SelectField
                            label="Company/Branch *"
                            name="branch"
                            options={companies}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={(e) => {
                              handleChange(e);
                              setFieldValue("manager", "");
                            }}
                          />
                        </div>

                        {/* ================= MANAGER (ALWAYS VISIBLE) ================= */}
                        <div className="col-span-12 md:col-span-3">
                          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                            Manager
                          </label>

                          <div className="relative">
                            <input
                              name="manager"
                              readOnly
                              value={
                                typeof values.manager === "number"
                                  ? users.find(
                                      (u) => u.EmployeeId === values.manager,
                                    )?.Name || ""
                                  : values.manager || ""
                              }
                              placeholder="Select Manager"
                              className={`${bigInputClasses} pl-12`}
                            />

                            {/* Avatar */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full overflow-hidden">
                              <img
                                src={
                                  users.find((u) => u.Name === values.manager)
                                    ?.ProfilePic
                                    ? `https://your-cdn-url/${
                                        users
                                          .find(
                                            (u) => u.Name === values.manager,
                                          )
                                          ?.ProfilePic.split("|")[0]
                                      }`
                                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                }
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Select Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!values.branch) {
                                  // alert("Please select company name first");
                                  toast.error(
                                    "Please select company name first",
                                  );
                                  return;
                                }

                                setShowUserPopup(true);
                                fetchUsers();
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 
              bg-gray-100 dark:bg-gray-800 
              border border-gray-300 dark:border-gray-600 
              px-3 py-1.5 rounded text-sm"
                            >
                              Select
                            </button>
                          </div>
                        </div>

                        {/* ================= JOINING DATE ================= */}
                        <InputField
                          label="Joining Date *"
                          name="joiningDate"
                          type="date"
                          className="col-span-12 md:col-span-3"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />

                        {/* ================= EMPLOYEE TYPE ================= */}
                        <div className="flex flex-col col-span-12 md:col-span-3">
                          <SelectField
                            label="Employee Type *"
                            name="employeeType"
                            options={employeeTypes}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={handleChange}
                          />
                        </div>

                        {/* ================= DEPARTMENT ================= */}
                        <div className="flex flex-col col-span-12 md:col-span-3">
                          <SelectField
                            label="Department *"
                            name="department"
                            options={departments}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={handleChange}
                          />
                        </div>

                        {/* ================= DESIGNATION ================= */}
                        <div className="flex flex-col col-span-12 md:col-span-3">
                          <SelectField
                            label="Designation *"
                            name="designation"
                            options={designations}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={handleChange}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ================= TAB 2 – DOCUMENTS ================= */}
                  {tab === 2 && (
                    <div className="animate-fadeIn">
                      {/* Header */}
                      <div className="bg-gray-50 rounded-t-lg border-b border-gray-200 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="col-span-3">Document Name</div>
                        <div className="col-span-5">Document Number</div>
                        <div className="col-span-4">File</div>
                      </div>

                      <div className="border border-t-0 border-gray-200 rounded-b-lg">
                        {documents.map((doc) => (
                          <div
                            key={doc.DocumentId}
                            className="grid grid-cols-12 px-4 py-3 gap-4 items-center border-b border-gray-100 last:border-0"
                          >
                            {/* Document Name */}
                            <div className="col-span-12 md:col-span-3 text-sm text-gray-800 font-medium">
                              {doc.DocumentName}
                            </div>

                            {/* Document Number */}
                            <div className="col-span-12 md:col-span-5">
                              <input
                                type="text"
                                placeholder="Enter document number"
                                className={bigInputClasses}
                                value={docValues[doc.DocumentId]?.number || ""}
                                onChange={(e) =>
                                  handleDocChange(
                                    doc.DocumentId,
                                    "number",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            {/* Upload Section */}
                            <div className="col-span-12 md:col-span-4">
                              <div className="flex items-center gap-4">
                                {/* Choose File */}
                                <label className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md cursor-pointer whitespace-nowrap transition shadow-sm">
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

                                {/* Upload Status Card */}
                                {(docValues[doc.DocumentId]?.file ||
                                  docValues[doc.DocumentId]?.fileName) && (
                                  <div className="relative flex items-center gap-3 bg-gray-100 rounded-md px-3 py-2 border border-gray-200 w-full max-w-[250px]">
                                    <div className="flex-1 min-w-0">
                                      {/* Status + Progress */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] uppercase font-bold text-green-600 whitespace-nowrap">
                                          {uploadProgress[doc.DocumentId] ===
                                            100 ||
                                          !uploadProgress[doc.DocumentId]
                                            ? "Uploaded"
                                            : "Uploading..."}
                                        </span>
                                        <div className="flex-1 h-[4px] bg-gray-300 rounded-full overflow-hidden">
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

                                      {/* File name (clickable) */}
                                      <p
                                        className="text-xs text-primary-600 truncate font-medium cursor-pointer hover:underline"
                                        title={
                                          docValues[doc.DocumentId]?.file
                                            ?.name ||
                                          docValues[doc.DocumentId]?.fileName
                                        }
                                        onClick={() =>
                                          openDocument(
                                            docValues[doc.DocumentId]?.fileName,
                                          )
                                        }
                                      >
                                        {docValues[doc.DocumentId]?.file
                                          ?.name ||
                                          docValues[doc.DocumentId]?.fileName}
                                      </p>
                                    </div>

                                    {/* Remove */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeFileOnly(doc.DocumentId)
                                      }
                                      className="text-gray-400 hover:text-red-500 transition p-1"
                                    >
                                      <FaTimes size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ================= TAB 3 – BANK ================= */}
                  {tab === 3 && (
                    <>
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                        Bank Details
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        <InputField
                          label="Account Number *"
                          name="accountNumber"
                          placeholder="Enter Account Number"
                          className="col-span-12 md:col-span-3"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />

                        <InputField
                          label="IFSC *"
                          name="ifsc"
                          placeholder="Enter IFSC Code"
                          className="col-span-12 md:col-span-3"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />

                        <InputField
                          label="Bank Name *"
                          name="bankName"
                          placeholder="Enter Bank Name"
                          className="col-span-12 md:col-span-3"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />

                        <InputField
                          label="Branch Name *"
                          name="branchName"
                          placeholder="Enter Branch Name"
                          className="col-span-12 md:col-span-3"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {/* ================= TAB 4 – SALARY ================= */}
                  {tab === 4 && (
                    <>
                      {/* ================= EARNINGS ================= */}
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                        Earnings
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        {salaryHeads
                          .filter((s) => s.SalaryType === "Earning")
                          .map((s) => (
                            <div
                              key={s.SalaryTypeId}
                              className="col-span-12 md:col-span-2"
                            >
                              <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                {s.SalaryName}
                              </label>
                              <input
                                placeholder="0"
                                value={form.salary[s.SalaryTypeId] || ""}
                                onChange={(e) =>
                                  handleSalaryChange(
                                    s.SalaryTypeId,
                                    e.target.value,
                                  )
                                }
                                className={bigInputClasses}
                              />
                            </div>
                          ))}
                      </div>

                      {/* ================= DEDUCTIONS ================= */}
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mt-6 mb-2">
                        Deductions
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        {salaryHeads
                          .filter((s) => s.SalaryType === "Deduction")
                          .map((s) => (
                            <div
                              key={s.SalaryTypeId}
                              className="col-span-12 md:col-span-2"
                            >
                              <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                {s.SalaryName}
                              </label>
                              <input
                                placeholder="0"
                                value={form.salary[s.SalaryTypeId] || ""}
                                onChange={(e) =>
                                  handleSalaryChange(
                                    s.SalaryTypeId,
                                    e.target.value,
                                  )
                                }
                                className={bigInputClasses}
                              />
                            </div>
                          ))}
                      </div>

                      <button className="bg-primary-600 text-white px-6 py-3 rounded-md mt-4">
                        Net Salary: ₹ {netSalary.toLocaleString("en-IN")}
                      </button>
                    </>
                  )}

                  {/* ================= TAB 5 – LOGIN ================= */}
                  {tab === 5 && (
                    <>
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                        Login
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        {/* LOGIN TYPE */}
                        <div className="flex flex-col col-span-12 md:col-span-3">
                          <SelectField
                            label="Login Type *"
                            name="loginType"
                            options={loginTypes}
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={handleChange}
                          />
                        </div>

                        {/* COPY ROLE FROM */}
                        <div className="col-span-12 md:col-span-3">
                          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                            Copy Role Form
                          </label>

                          <div className="relative">
                            <input
                              name="manager"
                              readOnly
                              // value={values.manager || ""}
                              placeholder="Select Manager"
                              className={`${bigInputClasses} pl-12`}
                            />

                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full overflow-hidden">
                              <img
                                src={
                                  users.find((u) => u.Name === values.manager)
                                    ?.ProfilePic
                                    ? `https://your-cdn-url/${
                                        users
                                          .find(
                                            (u) => u.Name === values.manager,
                                          )
                                          ?.ProfilePic.split("|")[0]
                                      }`
                                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                }
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowUserPopup(true);
                                fetchUsers();
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 
             bg-gray-100 dark:bg-gray-800 
             border border-gray-300 dark:border-gray-600 
             px-3 py-1.5 rounded text-sm"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ================= TAB 6 – SKILLS ================= */}
                  {tab === 6 && (
                    <>
                      <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                        Skills & Experience
                      </h6>

                      <div className="grid grid-cols-12 gap-6">
                        <InputField
                          label="Short About *"
                          name="shortAbout"
                          placeholder="Write brief description"
                          className="col-span-12 md:col-span-6"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />

                        <InputField
                          label="Skills *"
                          name="skills"
                          placeholder="e.g JavaScript, React"
                          className="col-span-12 md:col-span-6"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />

                        <InputField
                          label="Total Experience (Years)*"
                          name="totalExperience"
                          placeholder="e.g 2 Years"
                          className="col-span-12 md:col-span-6"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ================= SUBMIT ================= */}
              {/* <div className="mt-8 mb-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`
      relative inline-flex items-center justify-center gap-2
      px-8 py-3.5 rounded-lg font-semibold text-sm
      transition-all duration-300
      shadow-md
      ${isSubmitting
                      ? "bg-primary-400 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:scale-95"
                    }
      text-white
    `}
                >
                  {isSubmitting && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}

                  <span className="tracking-wide">
                    {isSubmitting ? "Submitting..." : "Submit Employee"}
                  </span>
                </button>
              </div> */}
            </div>

            {showUserPopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                {/* MODAL */}
                <div
                  className="
        bg-white dark:bg-[#0c1427] 
        w-[400px] max-w-[400px]
        h-[700px]
        rounded-2xl shadow-2xl
        overflow-hidden
        transform transition-all duration-200
        scale-100 animate-[zoomFade_.2s_ease-out]
      "
                >
                  {/* HEADER */}
                  <div className="sticky top-0 z-10 bg-white dark:bg-[#0c1427]  px-6 py-4 border-b dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Select User
                        </h5>
                        <span className="text-xs text-gray-500">
                          Click on a user to assign
                        </span>
                      </div>

                      <button
                        onClick={() => setShowUserPopup(false)}
                        className="w-9 h-9 flex items-center justify-center rounded-full
            hover:bg-gray-100 dark:hover:bg-gray-800
            text-gray-500 hover:text-red-500 transition"
                      >
                        ✕
                      </button>
                    </div>

                    {/* SEARCH */}
                    <div className="mt-3">
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name, role, company…"
                        className="
    w-full h-9 px-4 rounded-lg
    border border-gray-300 dark:border-gray-700
    bg-gray-50 dark:bg-gray-800 text-sm
    focus:outline-none focus:ring-2 focus:ring-primary-500
  "
                      />
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="flex-1 overflow-y-auto divide-y dark:divide-gray-800">
                    {/* LOADING */}
                    {loadingUsers && (
                      <div className="p-10 flex flex-col items-center text-gray-500">
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mb-3" />
                        Loading users…
                      </div>
                    )}

                    {/* EMPTY */}
                    {!loadingUsers && filteredUsers.length === 0 && (
                      <div className="p-10 text-center text-gray-500 text-sm">
                        No matching users found
                      </div>
                    )}

                    {/* USERS LIST */}
                    {!loadingUsers &&
                      filteredUsers.map((u) => {
                        const isSelected = values.manager === u.Name;

                        return (
                          <div
                            key={u.EmployeeId}
                            onClick={() => {
                              setFieldValue("manager", u.EmployeeId); // ✅ store ID
                              setShowUserPopup(false);
                            }}
                            className={`
          flex items-center justify-between
          px-5 py-0
          cursor-pointer transition
          ${
            isSelected
              ? "bg-primary-50 dark:bg-gray-800"
              : "hover:bg-primary-50 dark:hover:bg-gray-800"
          }
        `}
                          >
                            {/* LEFT SIDE */}
                            <div className="flex items-center gap-4 min-w-0">
                              {/* Avatar / Logo */}
                              <img
                                src={`https://your-cdn-url/${
                                  u.ProfilePic?.split("|")[0]
                                }`}
                                onError={(e) =>
                                  (e.currentTarget.src =
                                    "https://cdn-icons-png.flaticon.com/512/149/149071.png")
                                }
                                className="w-10 h-10 rounded-full object-cover border"
                              />

                              {/* TEXT STACK (MATCH IMAGE) */}
                              <div className="min-w-0 leading-tight py-1">
                                {/* Name */}
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-2 mt-2">
                                  {u.Name}
                                </span>
                                <br />
                                {/* Role */}
                                {/* <p className="text-[12px] text-gray-600 dark:text-gray-400 truncate">
              {u.DesignationName}
            </p> */}
                                <span className="text-[12px] text-gray-600 dark:text-gray-400 truncate">
                                  {u.LoginType}
                                </span>

                                {/* Company */}
                                <p className="text-[11px] text-gray-400 truncate">
                                  {u.CompanyName}
                                </p>
                              </div>
                            </div>

                            {/* RIGHT SIDE: CHECK */}
                            {isSelected && (
                              <span className="text-primary-600 text-xl font-semibold">
                                ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
            <CropperModal
              open={showCropper}
              image={rawImage}
              aspectRatio={1}
              onClose={() => setShowCropper(false)}
              onCrop={(croppedImage) => {
                setAvatar(croppedImage); // preview
                uploadProfileImage(croppedImage); // 🔥 actual upload
              }}
            />
            <ToastContainer position="top-right" />
          </div>
          {isSubmitting && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm font-medium tracking-wide">
                  Saving employee details...
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </Formik>
  );
}
