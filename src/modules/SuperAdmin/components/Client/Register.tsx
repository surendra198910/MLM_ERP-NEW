"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { FormikHelpers } from "formik";
import { Formik } from "formik";
import { useFormikContext } from "formik";
import {
  FaBuilding,
  FaFile,
  FaLock,
  FaUserFriends,
  FaMapMarkedAlt,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";
// --- Custom Component Imports ---
import { InputField } from "../../../../components/CommonFormElements/InputTypes/InputField";
import { SelectField } from "../../../../components/CommonFormElements/InputTypes/SelectField";
import RadioGroupField from "../../../../components/CommonFormElements/InputTypes/RadioGroupField";
import { TextAreaField } from "../../../../components/CommonFormElements/InputTypes/TextAreaField";
import ImageUploaderWithCropper from "../../../../components/CommonFormElements/ImageUploader/ImageUploaderWithCropper";
import { Header } from "../../../../components/CommonFormElements/Header/Header";
import DocumentUploadTab from "../../../../components/CommonFormElements/Document/DocumentUploadTab";
import { SubmitButton } from "../../../../components/CommonFormElements/Buttons/SubmitButton";
import { RadioBoxField } from "../../../../components/CommonFormElements/InputTypes/RadioBoxField";
import { ApiService } from "../../../../services/ApiService";
import { PostService } from "../../../../services/PostService";
// --- Import Separated Types & Schema ---
import type {
  FormValues,
  MasterDocument,
  DropdownOption,
} from "./RegisterTypes";
import { getRegisterValidationSchema } from "./RegisterSchema"; // Adjust path as needed
import { SponsorInputField } from "../../../../components/CommonFormElements/InputTypes/SponsorInputField";
import { useRef } from "react";

// ----------------------------------------------------------------------
// DUMMY DATA (View Specific Data can stay here or move to a constants file)
// ----------------------------------------------------------------------

const relations = [
  { label: "Spouse", value: "Spouse" },
  { label: "Father", value: "Father" },
  { label: "Mother", value: "Mother" },
  { label: "Son", value: "Son" },
  { label: "Daughter", value: "Daughter" },
];

const positions = [
  { label: "Left", value: "1" },
  { label: "Right", value: "2" },
];
const genders = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];
// Register.tsx (TOP of the component file, outside the component if you want)

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function MLMRegisterPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clientId = queryParams.get("clientId");
  const isEditMode = !!clientId;
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const { universalService } = ApiService();
  const { postDocument } = PostService();
  // --- Image Uploader State ---
  const [profilePic, setProfilePic] = useState<string>(""); // backend filename
  const [previewImage, setPreviewImage] = useState<string>(""); // base64 preview
  const [uploadingImage, setUploadingImage] = useState(false);
  const [masterDocuments, setMasterDocuments] = useState<MasterDocument[]>([]);
  const [countries, setCountries] = useState<DropdownOption[]>([]);
  const [states, setStates] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);
  const [settings, setSettings] = useState({
    UserNameType: "Auto",
    PasswordType: "Auto",
    PlacementType: "Manual",
    PlanType: "Binary",
    GenderEnabled: true,
  });


  // --- KYC Document State ---
  const [docValues, setDocValues] = useState<Record<number, any>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );
  const [walletTypes, setWalletTypes] = useState<any[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<any>({});

  const lastCountryRef = useRef<string | null>(null);
  const lastStateRef = useRef<string | null>(null);
  const base64ToFile = async (
    base64: string,
    fileName: string,
  ): Promise<File> => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type });
  };
  const uploadProfileImage = async (base64: string) => {
    try {
      setUploadingImage(true);

      const file = await base64ToFile(base64, `mlm_profile_${Date.now()}.png`);

      const fd = new FormData();
      fd.append("UploadedImage", file);
      fd.append("pagename", "EmpDoc"); // 🔥 change if backend expects different

      const response = await postDocument(fd);

      const fileName = response?.fileName || response?.Message;

      if (!fileName) {
        Swal.fire("Upload Failed", "Image upload failed", "error");
        return;
      }

      // ✅ SAVE
      setProfilePic(fileName); // backend value
      setPreviewImage(base64); // instant UI preview
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Profile image upload failed", "error");
    } finally {
      setUploadingImage(false);
    }
  };
  const deleteProfileImage = () => {
    setProfilePic("");
    setPreviewImage("");
  };
  const viewProfileImage = () => {
    if (!profilePic) return;

    const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;
    window.open(`${IMAGE_PREVIEW_URL}${profilePic}`, "_blank");
  };
  const verifySponsor = async (sponsorId: string): Promise<string> => {
    const payload = {
      procName: "CheckSponsor",
      Para: JSON.stringify({
        UserName: sponsorId,
      }),
    };

    const response = await universalService(payload);

    // 🔥 API returns ARRAY
    const data = Array.isArray(response) ? response[0] : response;

    if (data?.StatusCode === 1) {
      return data.Name?.trim(); // Sponsor Name
    } else {
      throw new Error(data?.Msg || "User Not Found");
    }
  };
  const checkPlaceUnderAvailability = async (
    placeUnderUsername: string,
    position: number,
  ): Promise<boolean> => {
    const payload = {
      procName: "CheckPlaceUnderAvailability",
      Para: JSON.stringify({
        PlaceUnderUsername: placeUnderUsername,
        Position: position,
      }),
    };

    const response = await universalService(payload);

    if (!Array.isArray(response) || response.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid response from server",
      });
      return false;
    }

    const { StatusCode, Msg } = response[0];

    if (StatusCode === "1") {
      // ✅ AVAILABLE
      Swal.fire({
        icon: "success",
        title: "Available",
        text: Msg,
        timer: 1500,
        showConfirmButton: false,
      });
      return true;
    }

    // ❌ NOT AVAILABLE
    Swal.fire({
      icon: "error",
      title: "Not Available",
      text: Msg,
    });

    return false;
  };
  const fetchMLMSettings = useCallback(async () => {
    try {
      const payload = {
        procName: "GetMLMSettings",
        Para: JSON.stringify({
          ActionMode: "MLMSetting",
        }),
      };

      const res = await universalService(payload);

      const data = res?.data || res;

      if (Array.isArray(data) && data.length > 0) {
        setSettings(data[0]); // first row only
      }
    } catch (err) {
      console.error("Error fetching MLM settings:", err);
    }
  }, [universalService]);
  const fetchWalletMaster = useCallback(async () => {
    try {
      const payload = {
        procName: "GetMLMSettings",
        Para: JSON.stringify({ ActionMode: "WalletMaster" }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data)) {
        const normalized = data.map((w) => ({
          walletTypeId: w.WalletTypeId,
          name: w.Name,
          chain: w.Chain,
          rate: w.Rate,
          apiEndpoint: w.ApiEndpoint,
        }));

        setWalletTypes(normalized);

        // initialize addresses
        const init: any = {};
        normalized.forEach((w) => {
          init[w.walletTypeId] = "";
        });
        setWalletAddresses(init);
      }
    } catch (err) {
      console.error("Error fetching wallet master:", err);
    }
  }, [universalService]);

  const fetchMasterDocuments = useCallback(async () => {
    try {
      //setLoadingDocs(true);
      const payload = {
        procName: "ClientDocuments",
        Para: JSON.stringify({ ActionMode: "Select" }),
      };
      const res = await universalService(payload);
      const data = res?.data || res;
      if (Array.isArray(data)) setMasterDocuments(data);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      //setLoadingDocs(false);
    }
  }, [universalService]);
  const bigInputClasses =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

  const initialValues: FormValues = {
    sponsorId: "",
    placeUnderId: "",
    position: "Left",
    firstName: "",
    lastName: "",
    username: "",
    gender: "Male",
    email: "",
    mobileNumber: "",
    profilePic: "",

    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    accountHolderName: "",
    walletAddress: "",
    newPassword: "",
    confirmPassword: "",
    nomineeName: "",
    nomineeRelation: "",
    nomineeDob: "",
    address: "",
    country: "",
    state: "",
    city: "",
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
        //toast.error("Upload failed: No filename received");
        // Revert UI if failed
        setDocValues((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], file: undefined },
        }));
      }
    } catch (error) {
      console.error("Document upload failed:", error);
      //toast.error("Document upload failed");
      // Revert UI if failed
      setDocValues((prev) => ({
        ...prev,
        [docId]: { ...prev[docId], file: undefined },
      }));
    }
  };
  const removeDoc = (docId: number) => {
    setDocValues((prev) => {
      const copy = { ...prev };
      delete copy[docId];
      return copy;
    });
    setUploadProgress((prev) => {
      const copy = { ...prev };
      delete copy[docId];
      return copy;
    });
  };
  const normalizeDDL = useCallback(
    (data: any[], idKey: string, nameKey: string): DropdownOption[] =>
      data.map((x) => ({ value: x[idKey], label: x[nameKey] })),
    [],
  );
  const buildWalletPayload = () => {
    return Object.keys(walletAddresses)
      .filter(
        (key) => walletAddresses[key] && walletAddresses[key].trim() !== "",
      )
      .map((key) => ({
        walletTypeId: Number(key),
        walletAddress: walletAddresses[key].trim(),
      }));
  };

  // --- Main Submit Handler ---
  const handleSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>,
  ) => {
    setLoading(true);
    const documentsArray = masterDocuments
      .map((doc) => {
        const userEntry = docValues[doc.DocumentId];

        // 🔹 EDIT MODE → send all docs (File empty = remove attachment)
        if (isEditMode) {
          return {
            DocumentId: Number(doc.DocumentId),
            DocumentName: doc.DocumentName,
            DocumentNumber: userEntry?.number || "",
            File: userEntry?.isDeleted ? "" : userEntry?.fileName || "",
          };
        }

        // 🔹 INSERT MODE → send only filled documents
        if (userEntry?.number) {
          return {
            DocumentId: Number(doc.DocumentId),
            DocumentName: doc.DocumentName,
            DocumentNumber: userEntry.number,
            File: userEntry?.fileName || "",
          };
        }

        return null;
      })
      .filter(Boolean);
    const wallets = buildWalletPayload();
    try {
      const payload = {
        procName: "RegisterNewClient",
        Para: JSON.stringify({
          SponsorUserName: values.sponsorId,
          PlaceUnderUsername: values.placeUnderId,
          Position: values.position,
          FirstName: values.firstName,
          LastName: values.lastName,
          ClientLogo: profilePic,
          Username: values.username,
          Gender: values.gender,
          EmailId: values.email,
          MobileNo: values.mobileNumber,
          AccountNo: values.accountNumber,
          IFSC: values.ifscCode,
          BankName: values.bankName,
          BranchName: values.branchName,
          AccountHolderName: values.accountHolderName,
          WalletAddress: values.walletAddress,
          NomineeName: values.nomineeName,
          NomineeRelation: values.nomineeRelation,
          NomineeDOB: values.nomineeDob,
          ClientDocuments: JSON.stringify(documentsArray),
          MemberWallets: JSON.stringify(wallets),
          CountryId: values.country,
          StateId: values.state,
          CityId: values.city,
          Address: values.address,
          ActionMode: "Insert",
        }),
      };
      //console.log(payload);
      //return;
      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response?.data?.[0];

      if (res?.StatusCode == "1") {
        Swal.fire({
          title: "Success!",
          text: res?.Msg || "Action completed successfully.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3b82f6",
        }).then((result) => {
          if (result.isConfirmed) {
            //navigate("/superadmin/company/manage-company/branch");
          }
        });
      } else {
        Swal.fire({
          title: "Error",
          text: res?.Msg || "Operation failed",
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

  const AddressDDLWatcher = ({
    fetchDDL,
    normalizeDDL,
    setStates,
    setCities,
  }: {
    fetchDDL: any;
    normalizeDDL: any;
    setStates: any;
    setCities: any;
  }) => {
    const { values } = useFormikContext<FormValues>();

    // Country → State
    useEffect(() => {
      if (!values.country) return;

      // 🚫 SAME COUNTRY → DO NOTHING
      if (lastCountryRef.current === values.country) return;

      lastCountryRef.current = values.country;

      const loadStates = async () => {
        const stateData = await fetchDDL({
          tbl: "master.state",
          searchField: "statename",
          filterCTL: "countryid",
          filterCTLvalue: values.country,
        });

        setStates(normalizeDDL(stateData, "id", "name"));
        setCities([]);
        lastStateRef.current = null; // reset state cache
      };

      loadStates();
    }, [values.country]);

    // State → City
    useEffect(() => {
      if (!values.state) return;

      // 🚫 SAME STATE → DO NOTHING
      if (lastStateRef.current === values.state) return;

      lastStateRef.current = values.state;

      const loadCities = async () => {
        const cityData = await fetchDDL({
          tbl: "master.city",
          searchField: "cityname",
          filterCTL: "stateid",
          filterCTLvalue: values.state,
        });

        setCities(normalizeDDL(cityData, "id", "name"));
      };

      loadCities();
    }, [values.state]);

    return null; // 👈 important (no UI)
  };

  useEffect(() => {
    const loadBasics = async () => {
      const countryData = await fetchDDL({
        tbl: "master.country",
        searchField: "countryname",
      });
      setCountries(normalizeDDL(countryData, "id", "name"));
      fetchMLMSettings();
      fetchWalletMaster();
      fetchMasterDocuments();
    };
    loadBasics();
  }, []);
  const tabs = [
    { label: "Address", icon: <FaMapMarkedAlt /> },
    { label: "Bank & Crypto Details", icon: <FaBuilding /> },
    { label: "KYC Documents", icon: <FaFile /> },
    { label: "Nominee", icon: <FaUserFriends /> },
    // ✅ Only show in Edit Mode
    isEditMode && { label: "Change Password", icon: <FaLock /> },
  ].filter(Boolean);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={getRegisterValidationSchema(settings)}
      onSubmit={handleSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
      }) => (
        <>
          <AddressDDLWatcher
            fetchDDL={fetchDDL}
            normalizeDDL={normalizeDDL}
            setStates={setStates}
            setCities={setCities}
          />

          <form
            onSubmit={handleSubmit}
            className="relative bg-white dark:bg-[#0c1427] dark:text-gray-100 rounded-lg mb-10 pb-6"
          >
            {/* 1. Header */}
            <Header
              title="Add New Client"
              actionButton={<SubmitButton label="Register" loading={loading} />}
            />

            {/* 2. Top Section (Image + Basic Info) */}
            <div className="p-4 px-5">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Left: Profile Image */}
                <ImageUploaderWithCropper
                  imageUrl={
                    profilePic
                      ? `${import.meta.env.VITE_IMAGE_PREVIEW_URL}${profilePic}`
                      : undefined
                  }
                  previewImage={previewImage}
                  loading={uploadingImage}
                  aspectRatio={1}
                  onCrop={uploadProfileImage}
                  onDelete={deleteProfileImage}
                  onViewImage={viewProfileImage}
                />

                {/* Right: Basic Info Grid */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Sponsor */}
                  <SponsorInputField
                    label="Sponsor ID*"
                    name="sponsorId"
                    placeholder="Enter Sponsor Username"
                    value={values.sponsorId}
                    onChange={handleChange}
                    onBlur={handleBlur} // Formik's handleBlur is passed here
                    error={errors.sponsorId}
                    touched={touched.sponsorId}
                    verifyApi={verifySponsor}
                  />
                  {settings?.PlacementType === "Manual" && (
                    <SponsorInputField
                      label="Place Under*"
                      name="placeUnderId"
                      placeholder="Enter Placement Username"
                      value={values.placeUnderId}
                      onChange={handleChange}
                      onBlur={handleBlur} // Formik's handleBlur is passed here
                      error={errors.placeUnderId}
                      touched={touched.placeUnderId}
                      verifyApi={verifySponsor}
                    />
                  )}
                  {/* Position (Left/Right) */}
                  {settings?.PlanType === "Binary" && (
                    <RadioBoxField
                      label="Position*"
                      name="position"
                      options={positions}
                      value={values.position}
                      setFieldValue={setFieldValue}
                      onChange={async (position) => {
                        if (!values.placeUnderId) {
                          Swal.fire({
                            icon: "warning",
                            title: "Missing Place Under",
                            text: "Please enter Place Under username first",
                          });
                          setFieldValue("position", "");
                          return;
                        }

                        const isAvailable = await checkPlaceUnderAvailability(
                          values.placeUnderId,
                          Number(position),
                        );

                        if (!isAvailable) {
                          // Reset selection if invalid
                          setFieldValue("position", "");
                        }
                      }}
                    />
                  )}

                  {/* Personal Info */}
                  <InputField
                    label="First Name*"
                    name="firstName"
                    placeholder="First Name"
                    value={values.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    touched={touched.firstName}
                  />
                  <InputField
                    label="Last Name*"
                    name="lastName"
                    placeholder="Last Name"
                    value={values.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    touched={touched.lastName}
                  />

                  {settings?.GenderEnabled !== false && (
                    <RadioBoxField
                      label="Gender*"
                      name="gender"
                      options={genders}
                      value={values.gender}
                      setFieldValue={setFieldValue}
                    />
                  )}



                  {settings?.UserNameType === "Manual" && (
                    <InputField
                      label="Username*"
                      name="username"
                      placeholder="User Name"
                      value={values.username}
                      onChange={handleChange}
                      error={errors.username}
                      touched={touched.username}
                    />
                  )}


                  <InputField
                    label="Email*"
                    name="email"
                    placeholder="mail@example.com"
                    value={values.email}
                    onChange={handleChange}
                    error={errors.email}
                    touched={touched.email}
                  />
                  <InputField
                    label="Mobile Number*"
                    name="mobileNumber"
                    placeholder="10 digit number"
                    value={values.mobileNumber}
                    onChange={handleChange}
                    error={errors.mobileNumber}
                    touched={touched.mobileNumber}
                  />
                </div>
              </div>
            </div>

            {/* 3. Tab Navigation */}
            <div className="mt-6 mb-6 px-5">
              <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6 overflow-x-auto whitespace-nowrap">
                {tabs.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTab(i)}
                    className={`pb-2 text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 ${tab === i
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

            {/* 4. Tab Content */}
            <div className="px-5 animate-fadeIn">
              {/* TAB 1: Address */}
              {tab === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Address Textbox (Full width) */}
                  <div className="md:col-span-3">
                    <InputField
                      label="Address*"
                      name="address"
                      placeholder="Enter Full Address"
                      value={values.address}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Country */}
                  <SelectField
                    label="Country*"
                    name="country"
                    options={countries}
                    value={values.country}
                    onChange={(e) => {
                      handleChange(e);
                      setFieldValue("state", "");
                      setFieldValue("city", "");
                    }}
                  />

                  {/* State */}
                  <SelectField
                    label="State*"
                    name="state"
                    options={states}
                    value={values.state}
                    onChange={(e) => {
                      handleChange(e);
                      setFieldValue("city", "");
                    }}
                    disabled={!values.country}
                  />

                  {/* City */}
                  <SelectField
                    label="City*"
                    name="city"
                    options={cities}
                    value={values.city}
                    onChange={handleChange}
                    disabled={!values.state}
                  />
                </div>
              )}
              {/* TAB 2: Bank & Crypto */}
              {tab === 1 && (
                <div>
                  {/* Bank Details */}
                  <p className="text-lg font-semibold text-gray-700 mb-4">
                    Bank Details
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField
                      label="Account Number"
                      name="accountNumber"
                      placeholder="Enter Account No"
                      value={values.accountNumber}
                      onChange={handleChange}
                    />

                    <InputField
                      label="IFSC Code"
                      name="ifscCode"
                      placeholder="Enter IFSC"
                      value={values.ifscCode}
                      onChange={handleChange}
                    />

                    <InputField
                      label="Bank Name"
                      name="bankName"
                      placeholder="Enter Bank Name"
                      value={values.bankName}
                      onChange={handleChange}
                    />

                    <InputField
                      label="Branch Name"
                      name="branchName"
                      placeholder="Enter Branch"
                      value={values.branchName}
                      onChange={handleChange}
                    />

                    <div className="md:col-span-2">
                      <InputField
                        label="Account Holder Name"
                        name="accountHolderName"
                        placeholder="Enter Name as per Bank"
                        value={values.accountHolderName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Crypto Wallet */}
                  <p className="text-lg font-semibold text-gray-700 mt-8 mb-4">
                    Crypto Wallet Details
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {walletTypes.map((w) => (
                      <div key={w.walletTypeId}>
                        <InputField
                          label={`${w.name} - ${w.chain}`}
                          name={`wallet_${w.walletTypeId}`}
                          placeholder={`Enter ${w.name} (${w.chain}) Address`}
                          value={walletAddresses[w.walletTypeId] || ""}
                          onChange={(e) =>
                            setWalletAddresses({
                              ...walletAddresses,
                              [w.walletTypeId]: e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    Please ensure the wallet address is correct. Wrong
                    address may result in permanent loss of funds.
                  </p>
                </div>
              )}

              {/* TAB 3: KYC Documents */}
              {tab === 2 && (
                <DocumentUploadTab
                  masterDocuments={masterDocuments}
                  docValues={docValues}
                  setDocValues={setDocValues}
                  uploadProgress={uploadProgress}
                  bigInputClasses={bigInputClasses}
                  handleFileUpload={handleFileUpload}
                  removeFileOnly={removeDoc}
                  openDocument={(name) => alert(`Opening preview for: ${name}`)}
                />
              )}
              {/* TAB 4: Nominee */}
              {tab === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField
                    label="Nominee Name"
                    name="nomineeName"
                    placeholder="Enter Nominee Name"
                    value={values.nomineeName}
                    onChange={handleChange}
                  />
                  <SelectField
                    label="Nominee Relation"
                    name="nomineeRelation"
                    options={relations}
                    value={values.nomineeRelation}
                    onChange={handleChange}
                  />
                  <InputField
                    label="Nominee Date of Birth"
                    name="nomineeDob"
                    type="date"
                    value={values.nomineeDob}
                    onChange={handleChange}
                  />
                </div>
              )}
              {/* TAB 2: Change Password */}
              {tab === 4 && isEditMode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField
                    label="Password"
                    name="newPassword"
                    type="password"
                    placeholder="********"
                    value={values.newPassword}
                    onChange={handleChange}
                  />
                  <InputField
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="********"
                    value={values.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </form>
        </>
      )}
    </Formik>
  );
}
