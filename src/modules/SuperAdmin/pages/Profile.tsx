import React, { useState, useEffect, useRef } from "react";
import { ApiService } from "../../../services/ApiService";
import { useAuth } from "../../../context/AuthContext";
import CropperModal from "../components/Cropper/Croppermodel";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";

const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
  Name: string;
  FatherName: string;
  DepartmentName: string;
  DesignationName: string;
  EmployeeType: string;
  EmployeeCode: string;
  Gender: string;
  DOB: string;
  DOJ: string;
  Address: string;
  CountryName: string;
  StateName: string;
  CityName: string;
  CurrentAddress: string;
  CurrentCountryName: string;
  CurrentStateName: string;
  CurrentCityName: string;
  Pincode: string;
  CurrentPinCode: string;
  ContactNo: string;
  AlternateContactNo: string;
  EmailId: string;
  AlternateEmailId: string | null;
  ProfilePic: string;
  AccountNo: string;
  IFSCCode: string;
  BankName: string;
  BranchName: string;
  IsActive: boolean;
  ExitDate: string | null;
  ExitReason: string | null;
  ExitType: string | null;
  ShortAbout: string;
  Skills: string;
  TotalExperience: string;
  ReportingManager: string;
  Company: string;
  LoginDetails: string;
  EmployeeDocuments: string;
  Salary: string;
  CompanyList: string;
  AssetDetails: string | null;
}

interface LoginDetail {
  LoginType: string;
  LastLogin_Failed: string;
  LastLogin_Successful: string;
}

interface EmpDocument {
  DocumentName: string;
  DocumentNumber: string;
  Attachment: string;
}

interface SalaryItem {
  SalaryType: string;
  SalaryName: string;
  Value: string;
}

interface CompanyItem {
  CompanyId: number;
  CompanyName: string;
  CompanyLogo: string;
  CompanyType: string;
}

interface AssetItem {
  AssetName: string;
  AssetCode: string;
  IssuedDate: string;
  Status: string;
}

const TABS = [
  { label: "Overview", icon: "person" },
  { label: "Work Info", icon: "badge" },
  { label: "Documents", icon: "description" },
  { label: "Salary", icon: "payments" },
  { label: "Assets", icon: "devices" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw && raw !== "NoRecord" ? JSON.parse(raw) : fallback;
  }
  catch {
    return fallback;
  }
}

const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }
  catch {
    return s;
  }
};

const fmtDateTime = (s?: string | null) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  catch {
    return s;
  }
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-[#172036] rounded ${className}`} />
);

// ─── InfoRow ──────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: string; label: string; value?: string | null }> = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-[11px] border-b border-gray-100 dark:border-[#172036] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#172036] flex items-center justify-center flex-shrink-0">
        <i className="material-symbols-outlined !text-[15px] text-[#605DFF]">{icon}</i>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-black dark:text-white break-words">{value}</p>
      </div>
    </div>
  );
};

// ─── SectionTitle ─────────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 pb-[10px] border-b border-gray-100 dark:border-[#172036]">
    <span className="w-1 h-[18px] bg-[#605DFF] rounded-full inline-block flex-shrink-0" />
    <i className="material-symbols-outlined !text-[15px] text-[#605DFF]">{icon}</i>
    <span className="text-sm font-medium text-black dark:text-white">{title}</span>
  </div>
);

// ─── Chip ─────────────────────────────────────────────────────────────────────
const Chip: React.FC<{ icon: string; text?: string | null }> = ({ icon, text }) => {
  if (!text) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#172036] text-gray-600 dark:text-gray-400 text-xs font-medium border border-gray-200 dark:border-[#172036]">
      <i className="material-symbols-outlined !text-[12px] text-[#605DFF]">{icon}</i>
      {text}
    </span>
  );
};

// ─── PasswordModal ────────────────────────────────────────────────────────────
const PasswordModal: React.FC<{
  onClose: () => void;
  onSubmit: (old: string, newPw: string) => Promise<void>;
  loading: boolean;
}> = ({ onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({ old: "", new: "", confirm: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const mismatch = !!form.confirm && !!form.new && form.confirm !== form.new;

  const handle = async () => {
    if (!form.old || !form.new || !form.confirm) {
      toast.error("Please fill all fields");
      return;
    }
    if (mismatch) {
      toast.error("Passwords do not match");
      return;
    }
    await onSubmit(form.old, form.new);
  };

  const FIELDS: { key: "old" | "new" | "confirm"; label: string; placeholder: string }[] = [
    { key: "old", label: "Current password", placeholder: "Enter current password" },
    { key: "new", label: "New password", placeholder: "Enter new password" },
    { key: "confirm", label: "Confirm new password", placeholder: "Re-enter new password" },
  ];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#0c1427] rounded-md shadow-2xl w-full max-w-[420px] overflow-hidden border border-gray-200 dark:border-[#172036]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#172036] bg-gray-50 dark:bg-[#0a1020]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#172036] flex items-center justify-center">
              <i className="material-symbols-outlined !text-[18px] text-[#605DFF]">lock_reset</i>
            </div>
            <div>
              <p className="text-sm font-medium text-black dark:text-white !mb-0">Change password</p>
              <p className="text-[11px] text-gray-400 !mb-0">Update your account password</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded transition-colors">
            <i className="material-symbols-outlined !text-[20px]">close</i>
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-[14px]">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show[key] ? "text" : "password"}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className={`w-full px-3 py-[10px] pr-10 text-sm rounded-md border bg-gray-50 dark:bg-[#172036] text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#605DFF] transition-colors ${key === "confirm" && mismatch
                    ? "border-red-400 dark:border-red-500"
                    : "border-gray-200 dark:border-[#172036]"
                    }`}
                />
                <button type="button"
                  onClick={() => setShow((p) => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className="material-symbols-outlined !text-[17px]">{show[key] ? "visibility_off" : "visibility"}</i>
                </button>
              </div>
              {key === "confirm" && mismatch && (
                <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                  <i className="material-symbols-outlined !text-[12px]">error</i>Passwords do not match
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-[10px] px-5 py-4 border-t border-gray-100 dark:border-[#172036] bg-gray-50 dark:bg-[#0a1020]">
          <button onClick={onClose}
            className="flex-1 py-[9px] text-sm font-medium border border-gray-200 dark:border-[#172036] text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-[#172036] transition-colors">
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading || mismatch}
            className="flex-1 py-[9px] text-sm font-semibold bg-[#605DFF] hover:bg-[#4d4bd9] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Saving…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAuth();
  const { universalService, postUserImage } = ApiService();
  const universalServiceRef = useRef(universalService);
  universalServiceRef.current = universalService;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const employeeId = userProfile?.EmployeeId ??
    JSON.parse(localStorage.getItem("EmployeeDetails") || "{}").EmployeeId;
  // Open popup from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("popup") === "change-password") {
      setShowPwModal(true);
    }
  }, [location.search]);
  // Fetch profile data
  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const response = await universalServiceRef.current({
          procName: "Employee",
          Para: JSON.stringify({ ActionMode: "ProfileData", EditId: employeeId }),
        });

        console.log("API Response:", response); // Debug log

        // Handle different response structures
        let profileData = null;

        if (Array.isArray(response)) {
          // If response is directly an array
          profileData = response[0];
        } else if (response?.data && Array.isArray(response.data)) {
          // If response has data property that is an array
          profileData = response.data[0];
        } else if (response?.data && !Array.isArray(response.data)) {
          // If response.data is a single object
          profileData = response.data;
        } else if (response && !Array.isArray(response)) {
          // If response is a single object
          profileData = response;
        }

        if (profileData) {
          setProfile(profileData);
          console.log("Profile data set:", profileData);
        } else {
          console.error("No profile data found in response:", response);
          toast.error("No profile data found");
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
        toast.error("Failed to load profile data");
      }
      finally {
        setLoading(false);
      }
    })();
  }, [employeeId]);

  // Avatar upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImage(ev.target?.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCrop = async (blob: Blob) => {
    setCropperOpen(false);
    setRawImage(null);
    try {
      setUploadingPic(true);
      const fd = new FormData();
      fd.append("ProfilePic", blob, "profile.jpg");
      fd.append("EmployeeId", String(employeeId));
      const res = await postUserImage(fd, null);
      const newPic = res?.data?.ProfilePic ?? res?.ProfilePic;
      if (newPic) {
        setProfile((p) => p ? { ...p, ProfilePic: newPic } : p);
        if (userProfile) updateUserProfile({ ...userProfile, ProfilePic: newPic });
        toast.success("Profile picture updated");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Failed to update profile picture");
    }
    finally {
      setUploadingPic(false);
    }
  };

  // Password change
  const handlePasswordChange = async (oldPw: string, newPw: string) => {
    try {
      setPwLoading(true);

      const response = await universalServiceRef.current({
        procName: "Employee",
        Para: JSON.stringify({
          ActionMode: "ChangePassword",
          EditId: employeeId,
          OldPassword: oldPw,
          NewPassword: newPw,
          ConfirmPassword:newPw,
        }),
      });

      console.log("Change Password Response:", response);

      // Handle array response
      const result = Array.isArray(response)
        ? response[0]
        : response?.data?.[0] || response?.data || response;

      if (result?.statuscode === "1") {
        toast.success(result?.msg || "Password changed successfully");
        setShowPwModal(false);
      } else {
        toast.error(result?.msg || "Failed to change password");
      }

    } catch (error) {
      console.error("Password Change Error:", error);
      toast.error("Something went wrong");
    } finally {
      setPwLoading(false);
    }
  };

  // Parse all JSON data safely - only if profile exists
  const companies: CompanyItem[] = profile?.CompanyList ? parseJson(profile.CompanyList, []) : [];
  const documents: EmpDocument[] = profile?.EmployeeDocuments ? parseJson(profile.EmployeeDocuments, []) : [];
  const salaryItems: SalaryItem[] = profile?.Salary ? parseJson(profile.Salary, []) : [];
  const loginDetails: LoginDetail[] = profile?.LoginDetails ? parseJson(profile.LoginDetails, []) : [];
  const assets: AssetItem[] = profile?.AssetDetails ? parseJson(profile.AssetDetails, []) : [];

  // Filter salary items
  const earnings = salaryItems.filter((s) => s.SalaryType === "Earning");
  const deductions = salaryItems.filter((s) => s.SalaryType === "Deduction");
  const loginType = loginDetails[0]?.LoginType ?? "";

  // Format addresses
  const permanentAddr = [
    profile?.Address,
    profile?.CityName,
    profile?.StateName,
    profile?.CountryName,
    profile?.Pincode
  ].filter(Boolean).join(", ");

  const currentAddr = [
    profile?.CurrentAddress,
    profile?.CurrentCityName,
    profile?.CurrentStateName,
    profile?.CurrentCountryName,
    profile?.CurrentPinCode
  ].filter(Boolean).join(", ");

  // Get profile image
  const profileImage = profile?.ProfilePic && IMAGE_PREVIEW_URL
    ? `${IMAGE_PREVIEW_URL}${profile.ProfilePic}`
    : null;

  // Get full name
  const fullName = profile?.Name?.trim() ||
    `${userProfile?.FirstName ?? ""} ${userProfile?.LastName ?? ""}`.trim() ||
    "User";

  const initials = fullName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // Skills array - trim and clean
  const skillsArray = profile?.Skills?.trim()
    ? profile.Skills.trim().split(",").filter(s => s.trim()).map(s => s.trim())
    : [];

  // Loading skeleton
  if (loading) return (
    <div>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] rounded-md overflow-hidden">
        <Sk className="h-[140px] rounded-none" />
        <div className="p-[20px] md:p-[25px]">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <Sk className="w-24 h-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 pb-2 space-y-2">
              <Sk className="h-5 w-40" />
              <Sk className="h-3 w-64" />
            </div>
          </div>
          <div className="space-y-2">
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-2/3" />
          </div>
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">
        <div className="space-y-[25px]">
          <Sk className="h-48 trezo-card" />
          <Sk className="h-36 trezo-card" />
        </div>
        <div className="lg:col-span-2">
          <Sk className="h-[400px] trezo-card" />
        </div>
      </div>
    </div>
  );

  // If no profile data after loading
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="material-symbols-outlined !text-[48px] text-gray-400">person_off</i>
          <p className="text-gray-500 mt-2">No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <CropperModal
        open={cropperOpen}
        image={rawImage || ""}
        onCrop={handleCrop}
        onClose={() => {
          setCropperOpen(false);
          setRawImage(null);
        }}
        aspectRatio={1}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {showPwModal &&
        <PasswordModal
          onClose={() => {
            setShowPwModal(false);

            // remove query param after close
            navigate("/superadmin/my-profile", { replace: true });
          }}
          onSubmit={handlePasswordChange}
          loading={pwLoading}
        />
      }

      {/* HEADER CARD */}
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] rounded-md overflow-hidden">

        {/* Cover */}
        <div className="relative h-[140px] overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a3a6e 0%, #1a5276 40%, #117a65 100%)" }}>
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5" />
          <div className="absolute -bottom-14 -left-5 w-56 h-56 rounded-full bg-white/5" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gp" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gp)" />
          </svg>
        </div>

        <div className="px-[20px] md:px-[24px] pb-[20px] md:pb-[24px]">
          {/* Avatar row */}
          <div className="flex flex-wrap items-end justify-between gap-3 -mt-[50px] mb-4">

            {/* Avatar */}
            <div className="relative inline-block">
              <div className="relative w-24 h-24 rounded-[14px] border-[3px] border-white dark:border-[#0c1427] overflow-hidden shadow-md bg-[#1a3a6e] flex items-center justify-center flex-shrink-0">
                {uploadingPic && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {profileImage
                  ? <img src={profileImage} alt={fullName} className="w-full h-full object-cover" />
                  : <span className="text-[26px] font-medium text-[#a8c8f0] tracking-wide">{initials}</span>
                }
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#172036] border-2 border-white dark:border-[#0c1427] flex items-center justify-center shadow cursor-pointer hover:bg-gray-200 dark:hover:bg-[#1e2d4a] transition-colors"
              >
                <i className="material-symbols-outlined !text-[13px] text-[#605DFF]">photo_camera</i>
              </button>
            </div>

            {/* Status + actions */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${profile?.IsActive
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile?.IsActive ? "bg-emerald-500" : "bg-red-500"}`} />
                {profile?.IsActive ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => navigate("/superadmin/my-profile?popup=change-password")}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#172036] text-gray-600 dark:text-gray-300 hover:border-[#605DFF] hover:text-[#605DFF] transition-colors"
              >
                <i className="material-symbols-outlined !text-[14px] text-[#605DFF]">lock_reset</i>
                Change password
              </button>
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="!mb-0 text-black dark:text-white font-medium">{fullName}</h4>
            {profile?.EmployeeCode && (
              <span className="text-[11px] font-mono bg-gray-100 dark:bg-[#172036] text-gray-500 px-2 py-0.5 rounded border border-gray-200 dark:border-[#172036]">
                {profile.EmployeeCode}
              </span>
            )}
            {loginType && (
              <span className="text-[11px] font-medium bg-[#605DFF]/10 text-[#605DFF] px-2 py-0.5 rounded border border-[#605DFF]/20 capitalize">
                {loginType}
              </span>
            )}
          </div>

          {/* Chips row */}
          <div className="flex flex-wrap gap-[6px] mb-[10px]">
            <Chip icon="work" text={profile?.DesignationName} />
            <Chip icon="corporate_fare" text={profile?.DepartmentName} />
            <Chip icon="business" text={profile?.Company} />
            <Chip icon="email" text={profile?.EmailId} />
            <Chip icon="phone" text={profile?.ContactNo} />
            <Chip icon="timeline" text={profile?.TotalExperience} />
          </div>

          {/* Skills */}
          {skillsArray.length > 0 && (
            <div className="flex flex-wrap gap-[5px] mb-[10px]">
              {skillsArray.map((sk) => (
                <span key={sk} className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#172036] text-gray-500 border border-gray-200 dark:border-[#172036]">
                  {sk}
                </span>
              ))}
            </div>
          )}

          {/* About */}
          {profile?.ShortAbout?.trim() && (
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed border-l-2 border-[#605DFF]/40 pl-3 !mb-0">
              {profile.ShortAbout.trim()}
            </p>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="lg:grid lg:grid-cols-3 gap-[25px]">

        {/* LEFT PANEL */}
        <div>

          {/* Assigned Companies */}
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] rounded-md overflow-hidden">
            <div className="flex items-center gap-3 px-[16px] py-[14px] border-b border-gray-100 dark:border-[#172036]">
              <div className="w-[30px] h-[30px] rounded-lg bg-gray-100 dark:bg-[#172036] flex items-center justify-center">
                <i className="material-symbols-outlined !text-[15px] text-[#605DFF]">business</i>
              </div>
              <span className="text-sm font-medium text-black dark:text-white">Assigned companies</span>
            </div>
            <div className="p-[12px] md:p-[14px]">
              {companies.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No companies assigned</p>
              ) : (
                companies.map((c) => (
                  <div key={c.CompanyId}
                    className="flex items-center gap-3 p-[10px] rounded-lg bg-gray-50 dark:bg-[#0a1020] border border-gray-100 dark:border-[#172036] mb-2 last:mb-0">
                    {c.CompanyLogo && IMAGE_PREVIEW_URL ? (
                      <img
                        src={`${IMAGE_PREVIEW_URL}CompanyDocs/${c.CompanyLogo}`}
                        alt={c.CompanyName}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-[#172036]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#605DFF]/10 flex items-center justify-center text-[#605DFF] font-medium flex-shrink-0">
                        {String(c.CompanyName || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white truncate">{c.CompanyName}</p>
                      {c.CompanyType && <p className="text-[11px] text-gray-400 truncate">{c.CompanyType}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Login Activity */}
          {loginDetails.length > 0 && (
            <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] rounded-md overflow-hidden">
              <div className="flex items-center gap-3 px-[16px] py-[14px] border-b border-gray-100 dark:border-[#172036]">
                <div className="w-[30px] h-[30px] rounded-lg bg-gray-100 dark:bg-[#172036] flex items-center justify-center">
                  <i className="material-symbols-outlined !text-[15px] text-gray-500">login</i>
                </div>
                <span className="text-sm font-medium text-black dark:text-white">Login activity</span>
              </div>
              <div className="p-[12px] md:p-[14px] space-y-[8px]">
                {loginDetails.map((l, i) => (
                  <div key={i} className="space-y-[8px]">
                    {l.LastLogin_Successful && (
                      <div className="p-[10px] rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <i className="material-symbols-outlined !text-[13px] text-emerald-600 dark:text-emerald-400">check_circle</i>
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Last successful login</span>
                        </div>
                        <p className="text-[11px] text-gray-500 !mb-0">{fmtDateTime(l.LastLogin_Successful)}</p>
                      </div>
                    )}
                    {l.LastLogin_Failed && (
                      <div className="p-[10px] rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <i className="material-symbols-outlined !text-[13px] text-red-500">cancel</i>
                          <span className="text-[11px] font-medium text-red-600 dark:text-red-400">Last failed attempt</span>
                        </div>
                        <p className="text-[11px] text-gray-500 !mb-0">{fmtDateTime(l.LastLogin_Failed)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] rounded-md overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-gray-100 dark:border-[#172036] overflow-x-auto bg-gray-50 dark:bg-[#0a1020]">
              {TABS.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-1.5 px-5 py-[13px] text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === i
                    ? "text-[#605DFF] border-[#605DFF] bg-white dark:bg-[#0c1427]"
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                  <i className="material-symbols-outlined !text-[14px]">{tab.icon}</i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-[20px] md:p-[22px]">

              {/* Tab 0: Overview */}
              {activeTab === 0 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <SectionTitle icon="person" title="Personal information" />
                    <InfoRow icon="wc" label="Gender" value={profile?.Gender} />
                    <InfoRow icon="cake" label="Date of birth" value={fmtDate(profile?.DOB)} />
                    <InfoRow icon="family_restroom" label="Father's name" value={profile?.FatherName?.trim()} />
                    <InfoRow icon="work_history" label="Employee type" value={profile?.EmployeeType} />
                    <InfoRow icon="phone_forwarded" label="Alternate contact" value={profile?.AlternateContactNo} />
                    <InfoRow icon="alternate_email" label="Alternate email" value={profile?.AlternateEmailId} />
                    <InfoRow icon="location_on" label="Permanent address" value={permanentAddr} />
                    <InfoRow icon="location_city" label="Current address" value={currentAddr} />
                  </div>

                  <div>
                    <SectionTitle icon="account_balance" title="Bank details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                      {[
                        { icon: "account_balance", label: "Bank name", value: profile?.BankName },
                        { icon: "password", label: "Account number", value: profile?.AccountNo },
                        { icon: "tag", label: "IFSC code", value: profile?.IFSCCode },
                        { icon: "store", label: "Branch", value: profile?.BranchName },
                      ].filter((f) => f.value).map(({ icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 p-[12px] rounded-lg bg-gray-50 dark:bg-[#0a1020] border border-gray-100 dark:border-[#172036]">
                          <div className="w-[30px] h-[30px] rounded-lg bg-white dark:bg-[#172036] flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-[#172036]">
                            <i className="material-symbols-outlined !text-[14px] text-[#605DFF]">{icon}</i>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                            <p className="text-sm font-medium text-black dark:text-white truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Work Info */}
              {activeTab === 1 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <SectionTitle icon="badge" title="Joining information" />
                    <InfoRow icon="calendar_today" label="Date of joining" value={fmtDate(profile?.DOJ)} />
                    <InfoRow icon="work" label="Designation" value={profile?.DesignationName} />
                    <InfoRow icon="corporate_fare" label="Department" value={profile?.DepartmentName} />
                    <InfoRow icon="supervisor_account" label="Reporting manager" value={profile?.ReportingManager} />
                    <InfoRow icon="manage_accounts" label="Employee type" value={profile?.EmployeeType} />
                    <InfoRow icon="key" label="Login type" value={loginType} />
                    <InfoRow icon="business" label="Company" value={profile?.Company} />
                  </div>

                  {profile?.ExitDate || profile?.ExitReason ? (
                    <div>
                      <SectionTitle icon="exit_to_app" title="Exit information" />
                      <InfoRow icon="event" label="Exit date" value={fmtDate(profile.ExitDate)} />
                      <InfoRow icon="label" label="Exit type" value={profile.ExitType ?? null} />
                      <InfoRow icon="notes" label="Exit reason" value={profile.ExitReason ?? null} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-[14px] rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                      <i className="material-symbols-outlined !text-[18px] text-emerald-600 dark:text-emerald-400">verified</i>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 !mb-0">Currently active — No exit recorded</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Documents */}
              {activeTab === 2 && (
                documents.length === 0
                  ? (
                    <div className="text-center py-10">
                      <i className="material-symbols-outlined !text-[40px] text-gray-300 dark:text-gray-600 mb-2">folder_open</i>
                      <p className="text-sm text-gray-400">No documents uploaded</p>
                    </div>
                  )
                  : (
                    <div className="flex flex-col gap-[6px]">
                      {documents.map((d, i) => (
                        <div key={i}
                          className="flex items-center justify-between p-[11px] rounded-lg bg-gray-50 dark:bg-[#0a1020] border border-gray-100 dark:border-[#172036] hover:border-[#605DFF]/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#172036] flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-[#172036]">
                              <i className={`material-symbols-outlined !text-[15px] ${d.Attachment ? "text-[#605DFF]" : "text-gray-400"}`}>
                                {d.Attachment ? "description" : "draft"}
                              </i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-black dark:text-white truncate">{d.DocumentName}</p>
                              <p className="text-[11px] text-gray-400 truncate">{d.DocumentNumber || "No number"}</p>
                            </div>
                          </div>
                          {d.Attachment ? (
                            <a
                              href={`${IMAGE_PREVIEW_URL}${d.Attachment}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 ml-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#605DFF] bg-[#605DFF]/10 hover:bg-[#605DFF]/20 px-2.5 py-1.5 rounded border border-[#605DFF]/20 transition-colors"
                            >
                              <i className="material-symbols-outlined !text-[12px]">open_in_new</i>
                              View
                            </a>
                          ) : (
                            <span className="flex-shrink-0 ml-3 inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 dark:bg-[#172036] px-2.5 py-1.5 rounded">
                              <i className="material-symbols-outlined !text-[12px]">attach_file_off</i>
                              No file
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
              )}

              {/* Tab 3: Salary */}
              {activeTab === 3 && (
                salaryItems.length === 0
                  ? (
                    <div className="text-center py-10">
                      <i className="material-symbols-outlined !text-[40px] text-gray-300 dark:text-gray-600 mb-2">payments</i>
                      <p className="text-sm text-gray-400">No salary details available</p>
                    </div>
                  )
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[24px]">
                      <div>
                        <div className="flex items-center gap-2 mb-[14px]">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <i className="material-symbols-outlined !text-[14px] text-emerald-600 dark:text-emerald-400">trending_up</i>
                          </div>
                          <span className="text-sm font-medium text-black dark:text-white">Earnings</span>
                        </div>
                        {earnings.length === 0
                          ? <p className="text-sm text-gray-400">No earnings data</p>
                          : earnings.map((s, i) => (
                            <div key={i} className="flex items-center justify-between py-[9px] border-b border-gray-100 dark:border-[#172036] last:border-0">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{s.SalaryName}</span>
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">₹{s.Value}</span>
                            </div>
                          ))
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-[14px]">
                          <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <i className="material-symbols-outlined !text-[14px] text-red-500">trending_down</i>
                          </div>
                          <span className="text-sm font-medium text-black dark:text-white">Deductions</span>
                        </div>
                        {deductions.length === 0
                          ? <p className="text-sm text-gray-400">No deductions data</p>
                          : deductions.map((s, i) => (
                            <div key={i} className="flex items-center justify-between py-[9px] border-b border-gray-100 dark:border-[#172036] last:border-0">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{s.SalaryName}</span>
                              <span className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">₹{s.Value}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )
              )}

              {/* Tab 4: Assets */}
              {activeTab === 4 && (
                assets.length === 0
                  ? (
                    <div className="text-center py-10">
                      <i className="material-symbols-outlined !text-[40px] text-gray-300 dark:text-gray-600 mb-2">devices</i>
                      <p className="text-sm text-gray-400">No assets issued</p>
                    </div>
                  )
                  : (
                    <div className="flex flex-col gap-[6px]">
                      {assets.map((a, i) => (
                        <div key={i}
                          className="flex items-center justify-between p-[11px] rounded-lg bg-gray-50 dark:bg-[#0a1020] border border-gray-100 dark:border-[#172036]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#605DFF]/10 flex items-center justify-center flex-shrink-0">
                              <i className="material-symbols-outlined !text-[15px] text-[#605DFF]">devices</i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-black dark:text-white truncate">{a.AssetName}</p>
                              <p className="text-[11px] text-gray-400">{a.AssetCode ? `#${a.AssetCode}` : "No code"} · {fmtDate(a.IssuedDate)}</p>
                            </div>
                          </div>
                          <span className={`flex-shrink-0 ml-3 text-[11px] font-medium px-2.5 py-1 rounded ${a.Status === "Returned"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                            }`}>
                            {a.Status || "In use"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;