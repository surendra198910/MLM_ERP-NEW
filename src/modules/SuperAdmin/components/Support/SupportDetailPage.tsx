"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import {
    FaEnvelope,
    FaCommentDots,
    FaCheckCircle,
    FaUserFriends,
    FaPhoneAlt,
    FaBuilding,
    FaCalendarAlt,
    FaGlobe,
    FaTimes,
    FaFileAlt,
    FaEye,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import EmailTemplateModal from "./components/EmailTemplateModal";
import SMSTemplateModal from "./components/SMSTemplateModal";
import CloseEnquiryModal from "./components/CloseSupportModal";
import ViewEnquiryDetailPopUp from "./components/ViewSupportDetailPopUp";
import FollowupChatPanel from "./components/FollowupChatPanel";
import { getEmployeeImage } from "./components/GetEmployeeImage";

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

export default function TicketDetailPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { universalService } = ApiService();
    const ticketId = Number(taskId);

    const [data, setData] = useState<any>(null);
    const [followups, setFollowups] = useState<Followup[]>([]);
    const [assignedEmployees, setAssignedEmployees] = useState<
        AssignedEmployee[]
    >([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [callbackDate, setCallbackDate] = useState(
        new Date().toISOString().split("T")[0],
    );
    const [ticketLifecycle, setTicketLifecycle] = useState<any[]>([]);
    const [replyFrom, setReplyFrom] = useState("Employee");
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showSMSModal, setShowSMSModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [hoveredEmp, setHoveredEmp] = useState<AssignedEmployee | null>(null);
    const [pinnedEmp, setPinnedEmp] = useState<AssignedEmployee | null>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [showRequirementModal, setShowRequirementModal] = useState(false);
    const loggedInEmployeeId =
        Number(localStorage.getItem("EmployeeId")) || 1;
    const [isWorking, setIsWorking] = useState(false);
    const [workingLoading, setWorkingLoading] = useState(false);
    const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

    const chatEndRef = useRef<HTMLDivElement>(null);

    const loadingFollowupsRef = useRef(false);

    const fetchFollowups = useCallback(async () => {
        if (loadingFollowupsRef.current) return;

        try {
            loadingFollowupsRef.current = true;

            const res = await universalService({
                procName: "Task",
                Para: JSON.stringify({
                    ActionMode: "LoadFollowUp",
                    EditId: ticketId,
                }),
            });

            const list = res?.data || res;

            if (Array.isArray(list)) {
                setFollowups(
                    list.map((item: any) => ({
                        ReplyType: item.ReplyType,
                        Message: item.Message,
                        MessageStatus: item.MessageStatus,
                        EntryDate: item.EntryDate,
                        EmployeeName: item.ClientName || "User",
                        ProfilePic: item.ClientLogo,
                    }))
                );
            } else {
                setFollowups([]);
            }
        } catch (err) {
            console.error("Failed to fetch followups:", err);
        } finally {
            loadingFollowupsRef.current = false;
        }
    }, [ticketId]);

    const fetchTicketDetails = async () => {
        try {
            setInitialLoading(true);

            const res = await universalService({
                procName: "Task",
                Para: JSON.stringify({
                    ActionMode: "ShowTask",
                    TaskId: ticketId,
                }),
            });

            const item = res?.data?.[0] || res?.[0];
            setData(item);

            if (item?.EmployeeList) {
                try {
                    setAssignedEmployees(JSON.parse(item.EmployeeList));
                } catch {
                    setAssignedEmployees([]);
                }
            }

            if (item?.Attachments) {
                try {
                    setAttachments(JSON.parse(item.Attachments));
                } catch {
                    setAttachments([]);
                }
            }
            if (item?.TicketLifeCycle) {
                try {
                    const lifecycle = JSON.parse(item.TicketLifeCycle);
                    setTicketLifecycle(lifecycle);
                } catch {
                    setTicketLifecycle([]);
                }
            }

        } catch (err) {
            console.error(err);
        } finally {
            setInitialLoading(false);
        }
    };
    const currentWorker = ticketLifecycle
        ?.slice()
        ?.reverse()
        ?.find((x) => x.CurrentStatus === "Working") || null;

    const hasFetched = useRef(false);

    useEffect(() => {
        if (!ticketId || hasFetched.current) return;

        hasFetched.current = true;

        fetchTicketDetails();
        fetchFollowups();
    }, [ticketId, fetchFollowups]); 


    const handleAddFollowup = async () => {
        if (!message.trim()) return;

        try {
            await universalService({
                procName: "Task",
                Para: JSON.stringify({
                    ActionMode: "InsertFollowUp",
                    TaskId: ticketId,
                    EntryBy: loggedInEmployeeId,
                    Message: message,
                }),
            });

            setMessage("");
            fetchFollowups();

        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseTicket = async (status: string, message: string) => {
        try {
            const res = await universalService({
                procName: "Task",
                Para: JSON.stringify({
                    ActionMode: "ChangeStatus",
                    TaskId: ticketId,
                    Status: status,
                    Message: message,
                    EntryBy: loggedInEmployeeId,
                }),
            });
            const result = res?.data ?? res ?? [];
            const response = Array.isArray(result) ? result[0] : result;

            if (response?.StatusCode === "1") {

                await Swal.fire({
                    icon: "success",
                    title: "Status Updated Successfully",
                    text: response?.msg || "",
                    timer: 1200,
                    showConfirmButton: false,
                });

                setShowCloseModal(false);
                setData((prev: any) => ({
                    ...prev,
                    ActualStatus: status,
                }));
                fetchTicketDetails();

            } else {
                Swal.fire(
                    "Error",
                    response?.msg || "Failed to update status",
                    "error"
                );
            }

        } catch (err) {
            console.error(err);

            Swal.fire(
                "Error",
                "Something went wrong while updating status",
                "error"
            );
        }
    };

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
                return "bg-yellow-50 text-yellow-600 border border-yellow-200";

            case "Open":
                return "bg-green-50 text-green-600 border border-green-200";

            case "Working":
                return "bg-blue-50 text-blue-600 border border-blue-200";

            case "Closed":
                return "bg-red-50 text-red-600 border border-red-200";

            default:
                return "bg-gray-100 text-gray-600 border border-gray-200";
        }
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
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(f.Message),
                    }}
                />
            ) : (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 pl-5">
                    {value || "---"}
                </p>
            )}
        </div>
    );

    useEffect(() => {
        setIsWorking(data?.ActualStatus === "Working");
    }, [data]);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [followups]);
    return (
        <div className="relative bg-white dark:bg-[#0c1427] dark:text-gray-100 rounded-lg mb-10">
            <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
                <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
                    {/* Title */}
                    <div className="trezo-card-title">
                        <h5 className="!mb-0 text-black dark:text-white">
                            Ticket Details
                        </h5>
                    </div>
                    <button
                        disabled={workingLoading || !!currentWorker}
                        onClick={async () => {
                            const confirm = await Swal.fire({
                                title: "Are you sure?",
                                text: "Mark this ticket as Working?",
                                icon: "question",
                                showCancelButton: true,
                                confirmButtonText: "Yes, mark it",
                                cancelButtonText: "Cancel",
                                confirmButtonColor: "#2563eb",
                            });

                            if (!confirm.isConfirmed) return;

                            try {
                                setWorkingLoading(true);

                                const res = await universalService({
                                    procName: "Task",
                                    Para: JSON.stringify({
                                        ActionMode: "ChangeStatus",
                                        TaskId: ticketId,
                                        Status: "Working",
                                        EntryBy: loggedInEmployeeId,
                                    }),
                                });

                                const result = res?.data ?? res ?? [];
                                const response = Array.isArray(result) ? result[0] : result;

                                if (response?.StatusCode === "1") {

                                    await Swal.fire({
                                        icon: "success",
                                        title: "Success",
                                        text: response?.msg || "Ticket marked as Working",
                                        timer: 1200,
                                        showConfirmButton: false,
                                    });

                                    setData((prev: any) => ({
                                        ...prev,
                                        ActualStatus: "Working",
                                    }));

                                    const userName =
                                        JSON.parse(localStorage.getItem("EmployeeDetails") || "{}")?.Name || "You";

                                    // 🔥 update lifecycle
                                    setTicketLifecycle((prev: any[]) => [
                                        ...prev,
                                        {
                                            CurrentStatus: "Working",
                                            StatusDate: new Date().toISOString(),
                                            Name: userName,
                                        },
                                    ]);

                                } else {
                                    Swal.fire("Error", response?.msg || "Failed", "error");
                                }
                            } catch (err) {
                                console.error(err);

                                Swal.fire(
                                    "Error",
                                    "Something went wrong while updating status",
                                    "error"
                                );
                            } finally {
                                setWorkingLoading(false);
                            }
                        }}
                        className={`px-3 py-1 text-xs rounded-md text-white transition flex items-center gap-2
    ${currentWorker
                                ? "bg-green-600 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                    >
                        {workingLoading && (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        )}

                        {workingLoading
                            ? "Updating..."
                            : currentWorker
                                ? `● ${currentWorker.Name} is working on this ticket.`
                                : "Mark as Working"}
                    </button>
                    {/* Right Section */}
                    <div className="flex items-center justify-end gap-[7px]">

                        <button
                            type="button"
                            onClick={() => navigate("/superadmin/support-center/search-ticket-all")}
                            className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-all"
                        >
                            <i className="material-symbols-outlined text-[20px]">
                                arrow_back
                            </i>
                        </button>

                        <button
                            onClick={() => setShowCloseModal(true)}
                            className="flex items-center justify-center h-[34px] px-2 border-primary-button-bg border text-primary-button-bg rounded-md hover:bg-primary-button-bg hover:text-white transition group"
                        >
                            <span className="text-[10px] font-bold uppercase">
                                Change Status
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
                            {data?.ClientName?.charAt(0)}
                        </div>

                        {/* Identity */}
                        <div className="min-w-0 flex flex-col space-y-2">
                            {/* Name + Ticket No */}
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="text-md font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[220px] sm:max-w-[350px] lg:max-w-[420px]">
                                    {data?.ClientName}
                                </div>

                                <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                                    #{data?.TaskNumber}
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

                            {data?.ActualStatus ? (
                                (() => {
                                    const cleanStatus = data?.ActualStatus;

                                    return (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusClass(cleanStatus)}`}>
                                            {cleanStatus}
                                        </span>
                                    );
                                })()
                            ) : (
                                <span className="text-sm font-bold leading-tight">-</span>
                            )}
                        </div>

                        <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10"></div>

                        {/* Ticket Date */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                                Ticket Date
                            </p>
                            <p className="text-sm font-bold text-gray-500 leading-tight">
                                {formatDate(data?.TaskDate)}
                            </p>
                        </div>

                        <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10"></div>

                        {/* Close Date */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                                Close Date
                            </p>
                            <p className="text-sm font-bold text-red-900 leading-tight">
                                {formatDate(data?.CloseDate)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-min-[60vh]">
                {/* === LEFT PANEL: DETAILS (Scrolls Internally) === */}
                <div className="lg:w-2/3 flex flex-col gap-4 border-r border-gray-200">
                    {/* Row 1: Key Details */}
                    <div className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-[#172036] px-5 pt-5 pb-5">
                        {/* Header */}
                        <p className="text-sm font-bold text-gray-800 dark:text-white pb-2 mb-4 flex items-center gap-2">
                            <FaGlobe className="text-blue-500 size-4" />
                            <span className="border-b border-gray-200 pb-0.5">
                                Ticket Overview
                            </span>
                        </p>

                        {/* ===== Row 1 ===== */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 gap-x-6">

                            <InfoRow
                                icon={<FaBuilding />}
                                label="Project Name"
                                value={data?.ProjectName || "-"}
                            />

                            <InfoRow
                                icon={<FaCheckCircle />}
                                label="Ticket Type"
                                value={data?.TaskType || "-"}
                            />

                            <InfoRow
                                icon={<FaCalendarAlt />}
                                label="Priority"
                                value={data?.Priority || "-"}
                            />

                            <InfoRow
                                icon={<FaCheckCircle />}
                                label="Status"
                                value={data?.ActualStatus || "-"}
                            />
                        </div>

                        {/* ===== Row 2 ===== */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-4">

                            {/* Subject */}
                            <InfoRow
                                icon={<FaFileAlt />}
                                label="Subject"
                                value={data?.Subject || "-"}
                            />

                            {/* Ticket Content */}
                            <div className="flex flex-col mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FaCommentDots className="text-gray-400 text-xs" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                                        Ticket Content
                                    </p>
                                </div>

                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 pl-5 line-clamp-2">
                                    {data?.TaskContent
                                        ? data.TaskContent.replace(/<[^>]+>/g, "")
                                        : "-"}
                                </p>
                            </div>
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
                                                marginLeft: i === 0 ? 0 : "-12px", 
                                                zIndex: assignedEmployees.length - i, 
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
              ${isPinned
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
                    <div className="bg-white dark:bg-[#0f172a] px-5 pb-5">
                        <p className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <FaFileAlt className="text-blue-500 size-4" />
                            <span className="border-b border-gray-200 pb-0.5">
                                Ticket Attachments
                            </span>
                        </p>

                        {attachments.length > 0 ? (
                            <div className="space-y-3">
                                {attachments.map((file, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <FaFileAlt className="text-gray-400" />

                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                {file.Title || `File-${i + 1}`}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                window.open(
                                                    `${import.meta.env.VITE_IMAGE_PREVIEW_URL}${file.FilePath}`,
                                                    "_blank"
                                                )
                                            }
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            <FaEye />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No attachments</p>
                        )}
                    </div>
                </div>

                <FollowupChatPanel
                    followups={followups}
                    message={message}
                    setMessage={setMessage}
                    replyFrom={replyFrom}
                    setReplyFrom={setReplyFrom}
                    callbackDate={callbackDate}
                    setCallbackDate={setCallbackDate}
                    handleAddFollowup={handleAddFollowup}
                    loading={loadingFollowupsRef.current}
                    getEmployeeImage={(url) =>
                        getEmployeeImage(url, IMAGE_PREVIEW_URL)
                    }
                />
            </div>

            {/* MODALS */}
            <EmailTemplateModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                ticketId={ticketId}
                companyId={1}
                emailId={data?.EmailId}
                employeeId={loggedInEmployeeId}
                onEmailSuccess={fetchFollowups}
            />
            <SMSTemplateModal
                isOpen={showSMSModal}
                onClose={() => setShowSMSModal(false)}
                ticketId={ticketId}
                companyId={1}
                contactNo={data?.ContactNo}
                employeeId={loggedInEmployeeId}
                onSMSSuccess={fetchFollowups}
            />
            <CloseEnquiryModal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                onSubmit={handleCloseTicket}
            />
            <ViewEnquiryDetailPopUp
                isOpen={showRequirementModal}
                onClose={() => setShowRequirementModal(false)}
                title="Ticket Requirement Details"
                content={data?.Query || "No specific query details."}
            />

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
        </div>
    );
}
