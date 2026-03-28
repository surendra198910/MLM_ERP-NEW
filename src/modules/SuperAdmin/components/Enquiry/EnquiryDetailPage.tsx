"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaRegTimesCircle,
  FaEnvelope,
  FaCommentDots,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaUserFriends,
  FaPhoneAlt,
  FaBuilding,
  FaCalendarAlt,
  FaGlobe,
  FaPaperPlane,
  FaArrowLeft,
  FaTimes,
  FaQuestion,
  FaComment,
  FaFileAlt,
  FaEye,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import EmailTemplateModal from "./EmailTemplateModal";
import SMSTemplateModal from "./SMSTemplateModal";
import CloseEnquiryModal from "./CloseEnquiryModal";
import ViewEnquiryDetailPopUp from "./ViewEnquiryDetailPopUp";

// --- UTILS ---
export const getEmployeeImage = (
  url?: string,
  baseUrl?: string,
  fallback: string = "/DefaultImages/default-user.png",
): string => {
  if (!url || url === "default-user.png") {
    return fallback;
  }

  if (url.startsWith("http")) return url;

  return `${baseUrl}${url}`;
};

const formatDisplayDate = (date: string) => {
  if (!date) return "";

  const d = new Date(date);

  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();

  return `${day}-${month}-${year}`; // 01-Jan-2026
};

// --- TYPES ---
interface Followup {
  ReplyType: string;
  Message: string;
  MessageStatus: string;
  EntryDate: string;
  EmployeeName: string;
  ProfilePic: string;
}

interface AssignedEmployee {
  EmployeeId: number;
  EmployeeName: string;
  ProfilePic: string;
  Designation: string;
  Department: string;
}

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { universalService } = ApiService();
  const enquiryId = Number(id);

  const [data, setData] = useState<any>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<
    AssignedEmployee[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingFollowups, setLoadingFollowups] = useState(false);

  // Inputs
  const [message, setMessage] = useState("");
  const [callbackDate, setCallbackDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [replyFrom, setReplyFrom] = useState("Employee");

  // Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Hover State for Team
  const [hoveredEmp, setHoveredEmp] = useState<AssignedEmployee | null>(null);
  const [pinnedEmp, setPinnedEmp] = useState<AssignedEmployee | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Action Dropdown
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);

  // Requirement Modal
  const [showRequirementModal, setShowRequirementModal] = useState(false);

  // Local Storage (CompanyId and EmployeeId are needed in multiple places, so defining here)
  const CompanyIdLocalSTG = localStorage.getItem("CompanyId");

  const EmployeeIdLocalSTG = JSON.parse(
    localStorage.getItem("EmployeeDetails") || "{}",
  ).EmployeeId;

  const loggedInEmployeeId =
    JSON.parse(localStorage.getItem("EmployeeDetails") || "{}").EmployeeId || 0;
  const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- API CALLS ---
  const fetchFollowups = useCallback(async () => {
    try {
      setLoadingFollowups(true);
      const resConvo = await universalService({
        procName: "AddEnquiry",
        Para: JSON.stringify({ ActionMode: "loadConvo", EditId: enquiryId }),
      });
      const convoList = resConvo?.data || resConvo;
      setFollowups(Array.isArray(convoList) ? convoList : []);
    } catch (error) {
      console.error("Error refreshing followups", error);
    } finally {
      setLoadingFollowups(false);
    }
  }, [enquiryId, universalService]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [followups]);

  const fetchEnquiryDetails = useCallback(async () => {
    try {
      setLoading(true);
      const resMain = await universalService({
        procName: "AddEnquiry",
        Para: JSON.stringify({
          ActionMode: "Show",
          EditId: enquiryId,
          CompanyId: CompanyIdLocalSTG,
        }),
      });
      const mainData = resMain?.data?.[0] || resMain?.[0];
      setData(mainData);

      if (mainData?.EmployeeList) {
        setAssignedEmployees(JSON.parse(mainData.EmployeeList));
      }
      await fetchFollowups();
    } catch (error) {
      console.error("Error loading details", error);
    } finally {
      setLoading(false);
    }
  }, [enquiryId, universalService, fetchFollowups]);

  useEffect(() => {
    if (enquiryId) fetchEnquiryDetails();
  }, [enquiryId]);

  // Search Handler (for assigning team or other purposes)
  const handleSearch = async (value: string) => {
    setSearchTerm(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    try {
      const res = await universalService({
        procName: "AddEnquiry",
        Para: JSON.stringify({
          ActionMode: "SearchUniversal",
          SearchTerm: value,
          CompanyId: CompanyIdLocalSTG,
        }),
      });

      const list = res?.data || res;
      setSearchResults(Array.isArray(list) ? list : []);
      setShowSearchDropdown(true);
    } catch (error) {
      console.error("Search error", error);
    }
  };

  // --- HANDLERS ---
  const handleAddFollowup = async () => {
    if (!message.trim())
      return Swal.fire("Required", "Please enter a message", "warning");

    try {
      const res = await universalService({
        procName: "AddEnquiry",
        Para: JSON.stringify({
          ActionMode: "Followup",
          EditId: enquiryId,
          EmployeeId: loggedInEmployeeId,
          ReplyType: replyFrom === "Employee" ? "E" : "C",
          Message: message,
          ExpectedCallBack: callbackDate,
        }),
      });

      const statusCode =
        res?.data?.[0]?.statuscode ||
        res?.data?.statuscode ||
        res?.[0]?.statuscode;

      if (statusCode === "1") {
        setMessage("");
        await fetchFollowups();
        setTimeout(
          () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      }
    } catch (error) {
      Swal.fire("Error", "Failed to send message", "error");
    }
  };

  const handleCloseEnquiry = async (status: string, closeMessage: string) => {
    try {
      const res = await universalService({
        procName: "AddEnquiry",
        Para: JSON.stringify({
          EditId: enquiryId,
          ReplyType: "C",
          Message: closeMessage,
          EnquiryStatus: status,
          EmployeeId: loggedInEmployeeId,
          ActionMode: "UpdateStatus",
        }),
      });

      const statusCode =
        res?.data?.[0]?.statuscode ||
        res?.data?.statuscode ||
        res?.[0]?.statuscode;

      if (statusCode === "1") {
        Swal.fire({
          icon: "success",
          title: "Enquiry Closed Successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowCloseModal(false);
        fetchEnquiryDetails();
      }
    } catch (err) {
      Swal.fire("Error", "Failed to close enquiry", "error");
    }
  };

  // --- HELPERS ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // ✅ Date Formatter
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status?: string | null): string => {
    switch (status) {
      case "New":
        return "bg-primary-50 text-primary-600 border border-primary-200";

      case "Open":
        return "bg-green-50 text-green-600 border border-green-200";

      case "Close":
        return "bg-red-50 text-red-600 border border-red-200";

      case "Closed(Not Converted)":
        return "bg-red-50 text-red-500 border border-red-200";

      case "Closed(Converted)":
        return "bg-green-50 text-green-600 border border-green-200";

      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };
  const extractStatusText = (html?: string | null): string => {
    if (!html) return "";

    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent?.trim() || "";
  };
  const formatAddress = () => {
    if (!data) return "---";
    const parts = [
      data.Address,
      data.CityId,
      data.StateId,
      data.CountryId,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "---";
  };

  const InfoRow = ({ icon, label, value, isHtml = false }: any) => (
    <div className="flex flex-col mb-4">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-gray-400 text-xs">{icon}</span>}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
          {label}
        </p>
      </div>
      {isHtml ? (
        <div
          className="text-sm font-medium text-gray-700 dark:text-gray-300 pl-5"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 pl-5">
          {value || "---"}
        </p>
      )}
    </div>
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-[#0c1427]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-button-bg"></div>
      </div>
    );

  return (
    <div className="relative bg-white dark:bg-[#0c1427] dark:text-gray-100 rounded-lg mb-10">
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
          {/* Title */}
          <div className="trezo-card-title">
            <h5 className="!mb-0 text-black dark:text-white">
              Enquiry Details
            </h5>
          </div>

          {/* Right Section */}
          <div className="flex items-center justify-end gap-[7px]">
            {/* 🔙 Back Button (Same Size + Alignment) */}
            <button
              type="button"
              onClick={() => navigate("/superadmin/enquiry/manage-enquiries")}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-all"
            >
              <i className="material-symbols-outlined text-[20px]">
                arrow_back
              </i>
            </button>
            {/* 🔎 Search Input (EXACT MATCHED DESIGN) */}
            <div className="relative w-[220px]">
              {/* Left Search Icon */}
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                <i className="material-symbols-outlined !text-[18px]">search</i>
              </span>

              <input
                type="text"
                value={searchTerm}
                placeholder="Enter Criteria..."
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
                className="h-[34px] w-full pl-8 pr-8 text-xs rounded-md outline-none border transition-all bg-white dark:bg-[#15203c] text-black dark:text-white border-gray-300 dark:border-[#15203c] focus:border-primary-button-bg"
              />

              {/* Right Close Icon (Aligned Properly) */}
              {searchTerm && (
                <span
                  onClick={() => {
                    setSearchTerm("");
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center cursor-pointer text-gray-400 hover:text-danger-500 transition-all"
                >
                  <i className="material-symbols-outlined !text-[18px]">
                    close
                  </i>
                </span>
              )}

              {/* Dropdown (unchanged) */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 mt-2 w-full bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-white/5 rounded-md shadow-sm max-h-72 overflow-y-auto">
                  {searchResults.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchTerm("");
                        navigate(
                          `/superadmin/enquiry/details/${item.EnquiryId}`,
                        );
                      }}
                      className="px-[16px] py-[9px] cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-[#15203c] border-b last:border-none border-gray-100 dark:border-white/5"
                    >
                      {/* Top Row */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                          {item.Name}
                        </span>

                        {/* ✅ Fixed Status Badge */}
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-[2px] rounded-md leading-none ${
                            item.EnquiryStatus === "New"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                              : item.EnquiryStatus === "Open"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300"
                          }`}
                        >
                          {item.EnquiryStatus}
                        </span>
                      </div>

                      {/* Bottom Row */}
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-[2px] leading-tight">
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          #{item.EnquiryNo}
                        </span>
                        <span className="mx-1 opacity-40">•</span>
                        {item.EmailId}
                        <span className="mx-1 opacity-40">•</span>
                        {item.ContactNo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🔍 Search Button (EXACT SAME STYLE) */}
            <button
              type="button"
              onClick={() => handleSearch(searchTerm)}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all"
            >
              <i className="material-symbols-outlined text-[20px]">search</i>
            </button>

            <div className="relative inline-flex rounded-md shadow-sm">
              {/* LEFT SIDE (PRIMARY ACTION) */}
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 h-[34px] px-3
               border border-blue-400 text-blue-500
               rounded-l-md
               hover:bg-blue-400 hover:text-white
               transition-all text-[10px] font-bold uppercase"
              >
                <FaEnvelope className="text-sm" />
                Send Email
              </button>

              {/* RIGHT SIDE (DROPDOWN TOGGLE) */}
              <button
                onClick={() => setActionDropdownOpen((prev) => !prev)}
                className="flex items-center justify-center w-[34px] h-[34px]
               border-t border-b border-r border-blue-400
               text-blue-500
               rounded-r-md
               hover:bg-blue-400 hover:text-white
               transition-all"
              >
                <i
                  className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${
                    actionDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </i>
              </button>

              {/* DROPDOWN */}
              {actionDropdownOpen && (
                <div
                  className="absolute right-0 top-[38px] w-[130px]
                 bg-white dark:bg-[#0c1427]
                 border border-gray-200 dark:border-white/10
                 rounded-md shadow-lg overflow-hidden z-50"
                >
                  {/* Send Email */}
                  <div
                    onClick={() => {
                      setShowEmailModal(true);
                      setActionDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer
                   hover:bg-blue-50 dark:hover:bg-[#15203c] transition"
                  >
                    <FaEnvelope className="text-blue-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      Send Email
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-white/10"></div>

                  {/* Send SMS */}
                  <div
                    onClick={() => {
                      setShowSMSModal(true);
                      setActionDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer
                   hover:bg-green-50 dark:hover:bg-[#15203c] transition"
                  >
                    <FaCommentDots className="text-green-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      Send SMS
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center justify-center h-[34px] px-2 border-red-500 border text-red-500 rounded-md hover:bg-red-400 hover:text-white transition group"
            >
              <FaRegTimesCircle className="group-hover:scale-110 transition mr-2 mb-[1px]" />
              <span className="text-[10px] font-bold uppercase">
                Close Enquiry
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* --- TOP HEADER (Fixed Height) --- */}
      <div className="bg-white dark:bg-[#0f172a] py-4 -mt-14 pb-8 border-b  flex-shrink-0border-b border-gray-200  px-[20px] md:px-[25px]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* LEFT SECTION */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <div className="w-18 h-18 flex-shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border border-blue-100">
              {data?.Name?.charAt(0)}
            </div>

            {/* Identity */}
            <div className="min-w-0 flex flex-col space-y-2">
              {/* Name + Enquiry No */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-md font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[220px] sm:max-w-[350px] lg:max-w-[420px]">
                  {data?.Name}
                </div>

                <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                  #{data?.EnquiryNo}
                </span>
              </div>

              {/* Contact Info */}
              <div className="flex gap-3 text-xs text-gray-500">
                {/* Phone */}
                <a
                  href={`tel:${data?.ContactNo}`}
                  className="flex items-center gap-1 hover:text-green-600 transition"
                >
                  <FaPhoneAlt size={11} className="text-green-500" />
                  <span className="truncate">{data?.ContactNo || "-"}</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${data?.EmailId}`}
                  className="flex items-center gap-1 hover:text-blue-600 transition"
                >
                  <FaEnvelope size={11} className="text-blue-500" />
                  <span className="truncate">{data?.EmailId || "-"}</span>
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex flex-wrap lg:flex-nowrap items-start lg:items-center gap-x-6 gap-y-3 text-left lg:text-right">
            {/* Status */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                Status
              </p>

              {data?.EnquiryStatus ? (
                (() => {
                  const cleanStatus = extractStatusText(data.EnquiryStatus);

                  return (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusClass(
                        cleanStatus,
                      )}`}
                    >
                      {cleanStatus}
                    </span>
                  );
                })()
              ) : (
                <span className="text-sm font-bold leading-tight">-</span>
              )}
            </div>

            <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10"></div>

            {/* Enquiry Date */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                Enquiry Date
              </p>
              <p className="text-sm font-bold text-gray-500 leading-tight">
                {formatDate(data?.EntryDate)}
              </p>
            </div>

            <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10"></div>

            {/* Callback */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                CallBack
              </p>
              <p className="text-sm font-bold text-red-500 leading-tight">
                {formatDate(data?.ExpectedCallBack)}
              </p>
            </div>

            <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10"></div>

            {/* Closed By */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                Closed By
              </p>
              <p className="text-sm text-blue-400 font-bold leading-tight">
                {data?.LoginId_ClosedBy || "-"}
              </p>
            </div>

            <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10"></div>

            {/* Close Date */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                Close Date
              </p>
              <p className="text-sm font-bold text-red-900 leading-tight">
                {formatDate(data?.EntryDate_Closed)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- SPLIT PANE CONTENT (No Window Scroll) --- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-min-[60vh]">
        {/* === LEFT PANEL: DETAILS (Scrolls Internally) === */}
        <div className="lg:w-2/3 flex flex-col gap-4 border-r border-gray-200">
          {/* Row 1: Key Details */}
          <div className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-[#172036] px-5 pt-5">
            <p className="text-sm font-bold text-gray-800 dark:text-white pb-2 mb-4 flex items-center gap-2">
              <FaGlobe className="text-blue-500 size-4" />
              <span className="border-b-1 border-gray-200 pb-0.5">
                Enquiry Overview
              </span>
            </p>

            {/* ===== First Row (3 Columns) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
              <InfoRow
                icon={<FaCalendarAlt />}
                label="Entry By"
                value={data?.EntryBy || "-"}
              />
              <InfoRow
                icon={<FaBuilding />}
                label="Enquiry For"
                value={data?.EnquiryFor}
              />
              <InfoRow
                icon={<FaCheckCircle />}
                label="Product"
                value={data?.ProductId}
              />
            </div>

            {/* ===== Second Row (2 Columns) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 mt-4">
              <InfoRow
                icon={<FaQuestion />}
                label="How did you find us?:"
                value={data?.HowdidyouFindUs}
              />
              <InfoRow
                icon={<FaMapMarkerAlt />}
                label="Full Address"
                value={formatAddress()}
              />

              <InfoRow
                icon={<FaFileAlt />}
                label="Type"
                value={data?.EnquiryType}
              />
            </div>
          </div>

          {/* Row 2: Query & Address */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-[#172036] px-5 pb-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FaCommentDots className="text-blue-500 size-4" />
                  <span className="border-b border-gray-200 pb-0.5">
                    Requirement
                  </span>
                </p>

                {/* View Button */}
                {data?.Query && (
                  <button
                    onClick={() => setShowRequirementModal(true)}
                    className="flex items-center gap-1 text-xs -mt-5 font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <FaEye size={12} />
                    View
                  </button>
                )}
              </div>

              {/* Preview Box */}
              <div
                className="
        bg-gray-50 dark:bg-[#111827]
        p-3 rounded text-sm text-gray-700 dark:text-gray-300
        whitespace-pre-wrap break-words
        max-h-40 overflow-auto
        leading-relaxed custom-scrollbar
      "
              >
                {data?.Query || "No specific query details."}
              </div>
            </div>
          </div>

          {/* Row 3: Team */}
          <div className="bg-white dark:bg-[#0f172a] dark:border-[#172036] px-5 pb-5">
            {/* <p className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <FaUserFriends className="text-blue-500" /> Assigned Team
            </p> */}
            <p className="text-sm font-bold text-gray-800 dark:text-white pb-2 mb-4 flex items-center gap-2">
              <FaUserFriends className="text-blue-500 size-4" />
              <span className="border-b-1 border-gray-200 pb-0.5">
                Assigned Team
              </span>
            </p>
            <div className="flex items-center">
              {assignedEmployees.length > 0 ? (
                assignedEmployees.map((emp, i) => {
                  const isPinned = pinnedEmp?.EmployeeId === emp.EmployeeId;
                  const isHovered =
                    !pinnedEmp && hoveredEmp?.EmployeeId === emp.EmployeeId;

                  const isActive = isPinned || isHovered;

                  return (
                    <div
                      key={i}
                      className="relative group"
                      style={{
                        marginLeft: i === 0 ? 0 : "-12px", // 👈 overlap control
                        zIndex: assignedEmployees.length - i, // layering
                      }}
                    >
                      {/* Avatar */}
                      <img
                        src={getEmployeeImage(
                          emp.ProfilePic,
                          IMAGE_PREVIEW_URL,
                        )}
                        className={`w-13 h-13 rounded-full object-cover border-2 
                        cursor-pointer transition-all duration-200 shadow-md 
              ${
                isPinned
                  ? "border-blue-500 ring-2 ring-blue-300 scale-110 z-50"
                  : "border-white hover:scale-110 hover:z-50"
              }`}
                        onMouseEnter={() => {
                          if (!pinnedEmp) setHoveredEmp(emp);
                        }}
                        onMouseLeave={() => {
                          if (!pinnedEmp) setHoveredEmp(null);
                        }}
                        onClick={() => {
                          if (isPinned) {
                            setPinnedEmp(null);
                            setHoveredEmp(null);
                          } else {
                            setPinnedEmp(emp);
                            setHoveredEmp(null);
                          }
                        }}
                      />

                      {/* Popup Card */}
                      {isActive && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/8
                            mb-3 w-64 bg-white dark:bg-[#1e293b] 
                            rounded-xl shadow-2xl border border-gray-200 
                            p-4 z-[999] animate-fadeIn"
                        >
                          {pinnedEmp?.EmployeeId === emp.EmployeeId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPinnedEmp(null);
                                setHoveredEmp(null);
                              }}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                            >
                              <FaTimes size={12} />
                            </button>
                          )}

                          <div className="flex justify-center mb-3">
                            <img
                              src={getEmployeeImage(
                                emp.ProfilePic,
                                IMAGE_PREVIEW_URL,
                              )}
                              className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                            />
                          </div>

                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-800 dark:text-white">
                              {emp.EmployeeName}
                            </p>
                            <p className="text-xs text-blue-500 font-semibold uppercase -mt-4">
                              {emp.Designation}
                            </p>
                            <p className="text-xs text-gray-500 -mt-4">
                              {emp.Department}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-sm text-gray-400">No team assigned.</span>
              )}
            </div>
          </div>
        </div>

        {/* === RIGHT PANEL: CHAT & ACTIONS (Fixed Height, Internal Scroll) === */}
        <div className="lg:w-1/3 flex flex-col overflow-y-auto max-h-[70vh] custom-scrollbar">
          {" "}
          {/* Action Header */}
          <div className="text-sm  px-5 font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-[#172036] pb-2 mt-4 mb-3 flex items-center">
            <FaComment className="text-blue-500 mr-2" /> Followup:
          </div>
          {/* Chat History */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 custom-scrollbar bg-white dark:bg-[#0c1427]"
          >
            {followups.length === 0 ? (
              /* ================= EMPTY STATE ================= */
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                {/* Icon Circle */}
                <div className="bg-blue-50 dark:bg-blue-500/10 p-5 rounded-full mb-4">
                  <FaComment className="text-blue-500 text-3xl" />
                </div>

                {/* Title */}
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  No Followups Yet
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 max-w-xs">
                  Start the conversation by sending the first follow-up message.
                </p>
              </div>
            ) : (
              /* ================= CHAT LIST ================= */
              <div className="space-y-4 py-4">
                {followups.map((f, i) => {
                  const isEmployee = f.ReplyType === "E";
                  const isNew = f.MessageStatus === "New";

                  return (
                    <div
                      key={i}
                      className={`flex gap-3 ${
                        isEmployee ? "justify-start" : "justify-end"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`${isEmployee ? "order-1" : "order-2"} flex-shrink-0`}
                      >
                        <img
                          src={getEmployeeImage(
                            f.ProfilePic,
                            IMAGE_PREVIEW_URL,
                          )}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "/DefaultImages/default-user.png";
                          }}
                          className={`w-8 h-8 rounded-full object-cover border-2 ${
                            isEmployee
                              ? "border-gray-300 dark:border-gray-600"
                              : "border-blue-400"
                          }`}
                        />
                      </div>

                      {/* Message Content */}
                      <div
                        className={`flex flex-col max-w-[75%] ${
                          isEmployee
                            ? "items-start order-2"
                            : "items-end order-1"
                        }`}
                      >
                        {/* Name + Time */}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[11px] font-semibold max-w-[140px] truncate ${
                              isEmployee
                                ? "text-gray-600 dark:text-gray-300"
                                : "text-blue-600"
                            }`}
                            title={f.EmployeeName}
                          >
                            {f.EmployeeName}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500">
                            {new Date(f.EntryDate).toLocaleString()}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`relative px-4 py-2 rounded-2xl text-sm shadow-md transition-all duration-200
                ${
                  isEmployee
                    ? "bg-gray-100 dark:bg-[#1e293b] text-gray-800 dark:text-gray-200 rounded-tl-none"
                    : "bg-blue-600 text-white rounded-tr-none"
                }`}
                        >
                          {f.Message}

                          {/* Optional New Indicator */}
                          {/* {isNew && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                )} */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>
          {/* Input Area */}
          <div className=" p-3 border-t border-gray-200">
            <div className="flex gap-4 mb-2">
              {/* Reply From */}
              <div className="flex flex-col flex-1">
                <label className="text-[11px] font-semibold text-gray-600 mb-1">
                  Reply From
                </label>
                <select
                  value={replyFrom}
                  onChange={(e) => setReplyFrom(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md bg-white px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="Employee">Employee</option>
                  <option value="Client">Client</option>
                </select>
              </div>

              {/* Callback Date */}
              <div className="flex flex-col flex-1">
                <label className="text-[11px] font-semibold text-gray-600 mb-1">
                  Callback Date
                </label>
                <input
                  type="text"
                  value={formatDisplayDate(callbackDate)}
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => {
                    e.target.type = "text";

                    // ✅ If empty → reset immediately to today's date
                    if (!e.target.value) {
                      const today = new Date().toISOString().split("T")[0];
                      setCallbackDate(today);
                    }
                  }}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md bg-white px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFollowup()}
                placeholder="Type message..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
              <button
                onClick={handleAddFollowup}
                disabled={loadingFollowups}
                className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loadingFollowups ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <EmailTemplateModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        enquiryId={enquiryId}
        companyId={1}
        emailId={data?.EmailId}
        employeeId={loggedInEmployeeId}
        onEmailSuccess={fetchFollowups}
      />
      <SMSTemplateModal
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
        enquiryId={enquiryId}
        companyId={1}
        contactNo={data?.ContactNo}
        employeeId={loggedInEmployeeId}
        onSMSSuccess={fetchFollowups}
      />
      <CloseEnquiryModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onSubmit={handleCloseEnquiry}
      />
      <ViewEnquiryDetailPopUp
        isOpen={showRequirementModal}
        onClose={() => setShowRequirementModal(false)}
        title="Enquiry Requirement Details"
        content={data?.Query || "No specific query details."}
      />

      {/* Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
