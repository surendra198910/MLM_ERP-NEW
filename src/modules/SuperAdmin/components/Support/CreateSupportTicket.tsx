"use client";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Formik, Form, type FormikProps } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { FaTimes } from "react-icons/fa";
import { ApiService } from "../../../../services/ApiService";
import SelectUserModal from "../../../../components/CommonFormElements/PopUp/SelectUserModal";
import { InputField } from "../../../../components/CommonFormElements/InputTypes/InputField";
import { SelectField } from "../../../../components/CommonFormElements/InputTypes/SelectField";
import { BtnBold, BtnBulletList, BtnClearFormatting, BtnItalic, BtnLink, BtnNumberedList, BtnRedo, BtnStyles, BtnUnderline, BtnUndo, Editor, EditorProvider, Separator, Toolbar, type ContentEditableEvent } from "react-simple-wysiwyg";
import SelectClientModal from "../../../../components/CommonFormElements/PopUp/SelectClientModal";
import { Plus, Search, X } from "lucide-react";
import { PostService } from "../../../../services/PostService";
import Loader from "../../common/Loader";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";

const enquiryValidationSchema = Yup.object({
    name: Yup.string().required("Client is required"),
    subject: Yup.string().min(3).required("Subject is required"),
    shortDesc: Yup.string().test("is-empty", "Short Description is required", (value) => {
        const text = value?.replace(/<[^>]*>/g, "").trim();
        return !!text;
    }
    ).min(10, "Description must be at least 10 characters"),
    enquiryFor: Yup.number().required("Priority is required"),
    enquiryType: Yup.number().required("Ticket Type is required"),
    status: Yup.number().required("Status is required"),
    clientId: Yup.number().required("Client is required"),
});
interface DropdownOption {
    value: number | string;
    label: string;
}
interface EnquiryFormValues {
    name: string;
    subject: string;
    status: number;
    shortDesc: string;
    contactNumber: string;
    clientId: number | "";
    email: string;
    productService: number | "";
    enquiryFor: number | "";
    enquiryType: number | "";
    enquiryDetail: string;
    country: number | "";
    state: number | "";
    city: number | "";
    address: string;
    callbackDate: string;
    findUs: number | "";
}
const parseJSONSafe = (value: any) => {
    try {
        return typeof value === "string" ? JSON.parse(value) : value || [];
    } catch (err) {
        console.error("JSON parse error:", err);
        return [];
    }
};
const hasValidProfileImage = (profilePic?: string) => {
    if (!profilePic) return false;
    const cleanPic = profilePic.split("|")[0].toLowerCase();
    return cleanPic !== "avatar.png" && cleanPic !== "avatar2.png";
};
export default function EnquiryFormPage() {

    const { taskId } = useParams();
    const location = useLocation();
    const path = location.pathname;
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    const isId = !isNaN(Number(last));
    const formName = isId ? segments[segments.length - 2] : last;
    const isEditMode = Boolean(taskId);
    const enquiryId = taskId ? Number(taskId) : 0;
    const [documents, setDocuments] = useState([{ name: "", file: null as File | null, fileName: "" },]);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [clientSearch, setClientSearch] = useState("");
    const navigate = useNavigate();
    const { universalService } = ApiService();
    const { postDocument } = PostService();
    const [uploadProgress, setUploadProgress] = useState({});
    const loggedInEmployeeId = JSON.parse(localStorage.getItem("EmployeeDetails") || "{}").EmployeeId || 0;
    const todayDate = new Date().toISOString().split("T")[0];
    const [products, setProducts] = useState<DropdownOption[]>([]);
    const [enquiryForList] = useState<DropdownOption[]>([
        { value: 1, label: "Low" },
        { value: 2, label: "Medium" },
        { value: 3, label: "High" },
        { value: 4, label: "Urgent" },
    ]);
    const [Status] = useState<DropdownOption[]>([
        { value: 1, label: "New" },
        { value: 2, label: "In Progress" },
        { value: 3, label: "Resolved" },
        { value: 4, label: "Closed" },
        { value: 5, label: "Open" },
    ]);
    const formikRef = useRef<FormikProps<EnquiryFormValues>>(null);
    const [enquiryTypes, setEnquiryTypes] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [editData, setEditData] = useState<any>("");
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);
    const CompanyIdLocalSTG = localStorage.getItem("CompanyId") || "1";
    const canSubmit = isEditMode? SmartActions.canEdit(formName): SmartActions.canAdd(formName);

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
        } catch (error) {
            console.error("Form permission fetch failed:", error);
            setHasPageAccess(false);
        } finally {
            setPermissionsLoading(false);
        }
    };
    const fetchTaskTypes = async () => {
        try {
            const payload = {
                procName: "GetDDLData",
                Para: JSON.stringify({
                    tbl: "master.TaskType",
                    searchField: "tasktype",
                    filterCTL: "",
                    filterData: JSON.stringify({
                        CompanyId: CompanyIdLocalSTG,
                    }),
                }),
            };

            const res = await universalService(payload);

            const data = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                    ? res
                    : [];

            // ✅ FIXED MAPPING (name instead of tasktype)
            const mapped = data.map((x: any) => ({
                value: x.id,
                label: x.name,
            }));

            setEnquiryTypes(mapped);
        } catch (err) {
            console.error("TaskType error:", err);
            setEnquiryTypes([]); // fallback
        }
    };
    const handleFileUpload = async (index, file) => {
        if (!file) return;

        setUploadProgress((prev) => ({ ...prev, [index]: 0 }));

        try {
            const fd = new FormData();
            fd.append("UploadedImage", file);
            fd.append("pagename", "EmpDoc");

            const res = await postDocument(fd, (progress) => {
                setUploadProgress((prev) => ({ ...prev, [index]: progress }));
            });

            const fileName = res?.fileName || res?.Message;

            setDocuments((prev) =>
                prev.map((doc, i) =>
                    i === index
                        ? { ...doc, file, fileName }
                        : doc
                )
            );

            setUploadProgress((prev) => ({ ...prev, [index]: 100 }));

        } catch (err) {
            console.error(err);
        }
    };
    const fetchTaskById = async () => {
        if (!taskId) return;

        try {
            setLoading(true);

            const payload = {
                procName: "Task",
                Para: JSON.stringify({
                    ActionMode: "Select",
                    TaskId: Number(taskId),
                }),
            };

            const res = await universalService(payload);
            const result = res?.data ?? res ?? [];

            const data = Array.isArray(result) ? result[0] : result;

            setEditData(data);

            if (data?.ClientId) {
                const [clientId, clientName] = data.ClientId.split("|");

                formikRef.current?.setFieldValue("clientId", Number(clientId));
                formikRef.current?.setFieldValue("name", clientName);

                await fetchProjectsByClient(Number(clientId));

                formikRef.current?.setFieldValue("productService", data.ProjectId);
            }

            const employees = parseJSONSafe(data?.EmployeeList);

            const mappedEmployees = employees.map((emp: any) => ({
                EmployeeId: emp.EmployeeId,
                Name: emp.EmployeeName || "Unknown",
                DesignationName: emp.Designation || "-",
                ProfilePic: emp.ProfilePic || "",   // 🔥 IMPORTANT FIX
                isFixed: true,
            }));

            setAssignedEmployees(mappedEmployees);

            // ✅ ATTACHMENTS (FIXED & SAFE)
            const docs = parseJSONSafe(data?.Attachments);

            const mappedDocs = docs.map((d: any) => ({
                name: d.Title,
                file: null,
                fileName: d.FilePath,
            }));

            setDocuments(
                mappedDocs.length
                    ? mappedDocs
                    : [{ name: "", file: null, fileName: "" }]
            );

        } catch (err) {
            console.error("Fetch task error:", err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await fetchTaskTypes();

                const userRes = await universalService({
                    procName: "Task",
                    Para: JSON.stringify({
                        CompanyId: CompanyIdLocalSTG,
                        ActionMode: "getEnquiryUsers",
                    }),
                });

                const rawUsers = Array.isArray(userRes?.data)
                    ? userRes.data
                    : Array.isArray(userRes)
                        ? userRes
                        : [];

                const fixedUsers = rawUsers.map((u: any) => ({
                    EmployeeId: u.EmployeeId,
                    Name: `${u.FirstName ?? ""} ${u.LastName ?? ""}`.trim(),
                    DesignationName: u.DesignationName,
                    ProfilePic: u.ProfilePic,
                    isFixed: true,
                }));

                if (!isEditMode) {

                    let defaultEmp = fixedUsers.find((u: any) => u.EmployeeId === 1);

                    // ❗ if not found → manually add it
                    if (!defaultEmp) {
                        defaultEmp = {
                            EmployeeId: 1,
                            Name: "MLM ERP",
                            DesignationName: "Director",
                            ProfilePic: "", // or default image
                            isFixed: true,
                        };
                    }

                    setAssignedEmployees([defaultEmp]); // ✅ always set
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isEditMode]);
    useEffect(() => {
        fetchFormPermissions();
    }, [])
    const handleSubmitForm = async (
        values: EnquiryFormValues,
        { setSubmitting }: any
    ) => {
        // 1. Validation for assigned employees
        if (assignedEmployees.length === 0) {
            Swal.fire({
                title: "Assignment Required",
                text: "Please assign at least one employee.",
                icon: "warning",
            });
            setSubmitting(false);
            return;
        }
        const confirmResult = await Swal.fire({
            title: isEditMode ? "Update Ticket?" : "Create Ticket?",
            text: isEditMode
                ? "Are you sure you want to update this ticket?"
                : "Do you want to submit this ticket?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: isEditMode ? "Yes, Update" : "Yes, Submit",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
        })
        if (!confirmResult.isConfirmed) {
            setSubmitting(false);
            return;
        }

        try {
            setLoading(true);
            const employeeObj: any = {};
            assignedEmployees.forEach((emp, index) => {
                employeeObj[`EmployeeId${index}`] = String(emp.EmployeeId);
            });

            const attachmentList = documents
                .filter((d) => d.file || d.fileName)
                .map((d, i) => ({
                    id: i + 1,
                    DocumentId: "",
                    DocumentName: d.name || "Attachment",
                    File: d.fileName || d.file?.name || "",
                    Action: "",
                }));

            const finalPayload = {
                ClientId: String(values.clientId || ""),
                ProjectId: String(values.productService || ""),
                Subject: values.subject,
                TaskContent: values.shortDesc,
                TaskTypeId: String(values.enquiryType || ""),
                Priority: enquiryForList.find((p) => p.value === values.enquiryFor)?.label || "Low",
                Status: Status.find((s) => s.value === values.status)?.label || "Open",
                EmployeeList: JSON.stringify(employeeObj),
                Attachments: JSON.stringify(attachmentList),
                ActionMode: isEditMode ? "Update" : "Insert",
                EditId: isEditMode ? enquiryId : 0,
                CompanyId: Number(CompanyIdLocalSTG),
                EntryBy: loggedInEmployeeId,
                Type: "Ticket",
            };

            const payload = {
                procName: "Task",
                Para: JSON.stringify(finalPayload),
            };
            const res = await universalService(payload);
            const responseData = Array.isArray(res)
                ? res[0]
                : (Array.isArray(res?.data) ? res.data[0] : res);

            if (responseData?.statuscode === "1" || responseData?.statuscode === "2") {
                await Swal.fire({
                    title: "Success!",
                    text: responseData.msg,
                    icon: "success",
                    confirmButtonColor: "#3085d6"
                });

                navigate("/superadmin/support-center/search-ticket-all");
            } else {
                Swal.fire("Error", responseData?.msg || "Operation failed", "error");
            }
        } catch (error) {
            console.error("Submission error:", error);
            Swal.fire("Error", "Something went wrong while connecting to the server", "error");
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };
    const removeEmployee = async (id: number) => {

        if (assignedEmployees.length === 1) {
            Swal.fire({
                title: "Action not allowed",
                text: "At least one employee must remain assigned.",
                icon: "info",
            });
            return;
        }

        const confirm = await Swal.fire({
            title: "Remove Employee?",
            text: "Are you sure you want to unassign this employee from the ticket?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Remove",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
        });

        if (!confirm.isConfirmed) return;

        setAssignedEmployees(
            assignedEmployees.filter((emp) => emp.EmployeeId !== id)
        );
    };
    const handleAddRow = () => {
        setDocuments([...documents, { name: "", file: null }]);
    };
    const handleRemoveRow = (index: number) => {
        if (documents.length === 1) return;

        Swal.fire({
            title: "Remove document?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
        }).then((res) => {
            if (res.isConfirmed) {
                setDocuments((prev) => prev.filter((_, i) => i !== index));
            }
        });
    };
    const filteredUsers = users.filter((u) => {
        const notAssigned = !assignedEmployees.some(
            (emp) => emp.EmployeeId === u.EmployeeId,
        );
        const searchText = userSearch.toLowerCase();
        return (
            notAssigned &&
            (u.Name?.toLowerCase().includes(searchText) ||
                u.DesignationName?.toLowerCase().includes(searchText))
        );
    });
    const fetchClients = async (searchText = "") => {
        try {
            const payload = {
                procName: "SalesOrder",
                Para: JSON.stringify({
                    CompanyId: CompanyIdLocalSTG,
                    searchData: searchText,
                    ActionMode: "GetClientList",
                }),
            };

            const res = await universalService(payload);

            const data = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                    ? res
                    : [];

            setClients(
                data.map((c: any) => ({
                    ClientId: c.ClientId,
                    ClientName: c.ClientName,
                    Email: c.EmailId,
                    ContactNo: c.ContactNo,
                    ClientLogo: c.ClientLogo,
                }))
            );
        } catch (err) {
            console.error("Client fetch error:", err);
        }
    };
    useEffect(() => {
        if (isClientModalOpen) {
            fetchClients("");
        }
    }, [isClientModalOpen]);
    useEffect(() => {
        if (!isClientModalOpen) return;

        const delay = setTimeout(() => {
            if (clientSearch.length >= 2 || clientSearch === "") {
                fetchClients(clientSearch);
            }
        }, 400);

        return () => clearTimeout(delay);
    }, [clientSearch]);
    useEffect(() => {
        if (!isModalOpen) return;

        const fetchModalUsers = async () => {
            try {
                const res = await universalService({
                    procName: "Employee",
                    Para: JSON.stringify({
                        CompanyId: CompanyIdLocalSTG,
                        ActionMode: "getUsersListByCompany",
                    }),
                });

                const rawUsers = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res)
                        ? res
                        : [];

                const formattedUsers = rawUsers.map((u: any) => ({
                    EmployeeId: u.EmployeeId,
                    Name:
                        u.Name || `${u.FirstName ?? ""} ${u.LastName ?? ""}`.trim(),
                    DesignationName: u.DesignationName,
                    ProfilePic: u.ProfilePic,
                    isFixed: false,
                }));

                setUsers(formattedUsers);
            } catch (err) {
                console.error(err);
            }
        };

        fetchModalUsers();
    }, [isModalOpen]);
    const fetchProjectsByClient = async (clientId: number) => {
        try {
            const payload = {
                procName: "Task",
                Para: JSON.stringify({
                    ClientId: clientId,
                    ActionMode: "getClientProjects",
                }),
            };

            const res = await universalService(payload);

            const data = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                    ? res
                    : [];

            // map to dropdown format
            const mapped = data.map((p: any) => ({
                value: p.ProjectId,
                label: p.ProjectName,
            }));

            setProducts(mapped); // 🔥 update dropdown
        } catch (err) {
            console.error("Project fetch error:", err);
            setProducts([]); // fallback
        }
    };
    const handleDocumentChange = (index, field, value) => {
        setDocuments((prev) =>
            prev.map((doc, i) => {
                if (i !== index) return doc;

                // 🔥 clear both file + fileName
                if (field === "file" && value === null) {
                    return { ...doc, file: null, fileName: "" };
                }

                return { ...doc, [field]: value };
            })
        );
    };
    useEffect(() => {
        if (isEditMode) {
            fetchTaskById();
        }
    }, [taskId]);
    useEffect(() => {
        if (!taskId) {
            setEditData("");
            setAssignedEmployees([]);
            setDocuments([{ name: "", file: null, fileName: "" }]);
            setProducts([]);
        }
    }, [taskId]);
    if (permissionsLoading) {
        return <Loader />;
    }
    if (!hasPageAccess) {
        return <AccessRestricted />;
    }
    return (

        <Formik<EnquiryFormValues>
            enableReinitialize
            innerRef={formikRef}
            initialValues={{
                name: editData?.ClientId?.split("|")[1] ?? "",
                clientId: editData?.ClientId? Number(editData.ClientId.split("|")[0]): "",
                subject: editData?.Subject ?? "",
                shortDesc: editData?.TaskContent ?? "",
                enquiryType: editData?.TaskTypeId ?? "",
                productService: editData?.ProjectId ?? "",
                enquiryFor:enquiryForList.find(p => p.label === editData?.Priority)?.value ?? "",
                status:Status.find(s => s.label === editData?.Status)?.value ?? "",
                enquiryDetail: "",
                country: "",
                state: "",
                city: "",
                address: "",
                callbackDate: todayDate,
            }}
            validationSchema={enquiryValidationSchema}
            onSubmit={handleSubmitForm}
        >
            {(formik: FormikProps<EnquiryFormValues>) => {
                const {
                    values,
                    errors,
                    touched,
                    handleChange,
                    setFieldValue,
                    isSubmitting,
                } = formik;

                return (
                    <div className="relative bg-white dark:bg-[#0c1427] dark:text-gray-100  mb-10 rounded-md">
                        {(loading || isSubmitting) && (
                            <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0c1427]/50 backdrop-blur-sm flex items-center justify-center ">
                                <div><Loader /></div>
                            </div>
                        )}

                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                            <div className="text-lg font-bold text-gray-800 dark:text-white">
                                {isEditMode ? "Manage Support Ticket" : "Create Support Ticket"}
                            </div>
                            <div className="flex gap-x-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-4 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600"
                                >
                                    Back
                                </button>

                                <PermissionAwareTooltip
                                    allowed={canSubmit}
                                    allowedText=""
                                >
                                    <button
                                        type="submit"
                                        form="enquiryForm"
                                        disabled={!canSubmit}
                                        className="px-4 py-1.5 rounded text-sm font-medium text-white bg-primary-button-bg hover:bg-primary-button-bg-hover shadow-sm disabled:opacity-50"
                                    >
                                        {isEditMode ? "Update" : "Submit"}
                                    </button>
                                </PermissionAwareTooltip>
                            </div>
                        </div>

                        <Form
                            id="enquiryForm"
                            className="flex flex-col lg:flex-row min-h-[500px]"
                        >
                            <div className="flex-[3] p-6 bg-white dark:bg-gray-900   shadow-sm dark:border-gray-700 overflow-y-auto max-h-[calc(100vh-210px)]">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">

                                    <div className="flex flex-col w-full">

                                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            Select Client: <span className="text-red-500">*</span>
                                        </label>

                                        <div className="flex h-10 w-full">

                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Select Client"
                                                value={values.name}
                                                readOnly

                                                className={`flex-1 min-w-0 px-3 py-2.5 text-sm border 
        border-gray-200 dark:border-gray-600 
        rounded-l-lg rounded-r-none 
        bg-white dark:bg-gray-900 
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${errors.clientId && touched.clientId ? "border-red-500 focus:ring-red-500" : ""}
      `}
                                            />

                                            {/* Search Button */}
                                            <button
                                                type="button"
                                                disabled={isEditMode}
                                                onClick={() => setIsClientModalOpen(true)}
                                                className={`h-10 w-15 px-3 bg-primary-button-bg text-white rounded-r-lg transition flex items-center justify-center
    ${isEditMode
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : "hover:bg-primary-button-bg-hover cursor-pointer"
                                                    }`}
                                            >
                                                <Search size={18} />
                                            </button>
                                        </div>

                                        {/* Error */}
                                        {errors.name && touched.name && (
                                            <span className="text-xs text-red-500 mt-1">
                                                {errors.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Project */}
                                    <SelectField
                                        label="Select Project:"
                                        name="productService"
                                        options={products}
                                        value={values.productService}
                                        onChange={(e) =>
                                            setFieldValue("productService", Number(e.target.value))
                                        }
                                        error={errors.productService}
                                        touched={touched.productService}
                                        disabled={!values.clientId || isEditMode}
                                    />
                                </div>

                                {/* Subject */}
                                <div className="mb-4">
                                    <InputField
                                        label="Subject:*"
                                        disabled={isEditMode}
                                        name="subject"
                                        placeholder="Enter subject"
                                        value={values.subject}
                                        onChange={handleChange}
                                        error={errors.subject}
                                        touched={touched.subject}
                                    />
                                </div>

                                {/* Description */}
                                <div className="mb-5">
                                    <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
                                        Ticket Description: <span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        className={`border rounded-md mb-0 bg-white dark:bg-[#0c1427] transition
      ${errors.shortDesc && touched.shortDesc
                                                ? "border-red-500"
                                                : "border-gray-200 dark:border-gray-700"
                                            }`}
                                    >
                                        <EditorProvider>
                                            <Editor
                                                value={values.shortDesc}
                                                disabled={isEditMode}
                                                onChange={(e: ContentEditableEvent) => {
                                                    setFieldValue("shortDesc", e.target.value);
                                                }}
                                                onBlur={() => {
                                                    formik.setFieldTouched("shortDesc", true);
                                                }}
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
                                        <p className="text-xs text-red-500">
                                            {errors.shortDesc}
                                        </p>
                                    )}
                                </div>

                                {/* Ticket Meta */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">

                                    <SelectField
                                        label="Ticket Type:*"
                                        name="enquiryType"
                                        options={enquiryTypes}
                                        value={values.enquiryType}
                                        onChange={(e) => setFieldValue("enquiryType", Number(e.target.value))}
                                        error={errors.enquiryType}
                                        touched={touched.enquiryType}
                                    />

                                    <SelectField
                                        label="Priority:*"
                                        name="enquiryFor"
                                        options={enquiryForList}
                                        value={values.enquiryFor}
                                        onChange={(e) => setFieldValue("enquiryFor", Number(e.target.value))}
                                        error={errors.enquiryFor}
                                        touched={touched.enquiryFor}
                                    />

                                    <SelectField
                                        label="Status:*"
                                        name="status"
                                        options={Status}
                                        value={values.status}
                                        onChange={(e) => setFieldValue("status", Number(e.target.value))}
                                        error={errors.status}
                                        touched={touched.status}
                                    />
                                </div>

                                <div className="mt-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Ticket Documents
                                        </label>
                                        <span className="text-xs text-gray-400">
                                            Add supporting files (PDF, Image)
                                        </span>
                                    </div>

                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">

                                        {/* Table Header */}
                                        <div className="hidden md:grid grid-cols-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                            <div>Document Name</div>
                                            <div>Upload File</div>
                                            <div className="text-center">Action</div>
                                        </div>

                                        {/* Rows */}
                                        {documents.map((doc, index) => (
                                            <div
                                                key={index}
                                                className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-4 border-t border-gray-200 dark:border-gray-700"
                                            >
                                                {/* Document Name */}
                                                <div className="flex flex-col">
                                                    <label className="md:hidden text-xs text-gray-500 mb-1">
                                                        Document Name
                                                    </label>

                                                    <input
                                                        type="text"
                                                        placeholder="Enter document name"
                                                        value={doc.name}
                                                        onChange={(e) =>
                                                            handleDocumentChange(index, "name", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2.5 text-sm rounded-lg border 
              border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-800 
              text-gray-700 dark:text-gray-200 
              placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-primary-button-bg"
                                                    />
                                                </div>

                                                {/* Upload File (NEW STYLE) */}
                                                <div className="flex flex-col">
                                                    <label className="md:hidden text-xs text-gray-500 mb-1">
                                                        Upload File
                                                    </label>

                                                    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">

                                                        {/* Choose File Button */}
                                                        <label className="shrink-0 px-4 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white text-xs font-medium rounded-md cursor-pointer whitespace-nowrap text-center transition shadow-sm">
                                                            Choose file
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) =>
                                                                    handleFileUpload(index, e.target.files?.[0])
                                                                }
                                                            />
                                                        </label>

                                                        {/* File Preview Box */}
                                                        {(doc.file || doc.fileName) && (
                                                            <div className="relative flex-1 min-w-0 flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700">

                                                                <div className="flex-1 min-w-0">

                                                                    {uploadProgress?.[index] !== undefined && (
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[10px] uppercase font-bold text-green-600 whitespace-nowrap">
                                                                                {uploadProgress[index] === 100
                                                                                    ? "Uploaded"
                                                                                    : "Uploading..."}
                                                                            </span>

                                                                            <div className="flex-1 h-[4px] bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-primary-button-bg transition-all duration-300"
                                                                                    style={{
                                                                                        width: `${uploadProgress[index] || 0}%`,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}


                                                                    <p
                                                                        className="text-xs text-primary-button-bg truncate font-medium cursor-pointer hover:underline"
                                                                        title={doc.file?.name || doc.fileName}
                                                                        onClick={() => {
                                                                            if (doc.fileName) {
                                                                                const url = `${import.meta.env.VITE_IMAGE_PREVIEW_URL}${doc.fileName}`;
                                                                                window.open(url, "_blank");
                                                                            }
                                                                        }}
                                                                    >
                                                                        {doc.file?.name || doc.fileName}
                                                                    </p>
                                                                </div>

                                                                {/* Remove File Only */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDocumentChange(index, "file", null)}
                                                                    className="shrink-0 text-gray-400 hover:text-red-500 transition p-1"
                                                                    title="Remove file"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-start md:justify-center gap-2 mt-1 md:mt-0">

                                                    {/* Add Row */}
                                                    {index === documents.length - 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleAddRow}
                                                            className="w-9 h-9 flex items-center justify-center rounded-md 
              bg-primary-button-bg text-white hover:bg-primary-button-bg-hover transition"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    )}

                                                    {/* Remove Row */}
                                                    {documents.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(index)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-md 
              bg-red-500 text-white hover:bg-red-600 transition"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* --- EXACT ORIGINAL DESIGN FOR ASSIGN ENQUIRY --- */}
                            <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-[#0c1427] overflow-y-auto max-h-[calc(100vh-210px)]">
                                <div className="p-5 flex items-center border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex-1">
                                        <p className="text-lg font-bold text-gray-800 dark:text-white tracking-wider">
                                            Assign Ticket
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium -mt-5">
                                            Assigned to {assignedEmployees.length} Employee(s)
                                        </p>
                                    </div>

                                    <PermissionAwareTooltip
                                        allowed={SmartActions.canAssignUser(formName)}
                                        allowedText=""
                                    >
                                        <button
                                            type="button"
                                            disabled={!SmartActions.canAssignUser(formName)}
                                            onClick={() => setIsModalOpen(true)}
                                            className="w-[34px] h-[34px] flex items-center justify-center border border-primary-500 text-primary-500 rounded-md hover:bg-primary-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                        >
                                            <span className="text-xl font-light"><Plus size={16} /></span>
                                        </button>
                                    </PermissionAwareTooltip>
                                </div>

                                <div className="p-5 flex-1 space-y-3">
                                    {assignedEmployees.length > 0 ? (
                                        assignedEmployees.map((emp) => (
                                            <div
                                                key={emp.EmployeeId}
                                                className="flex items-center gap-x-5 px-5 py-3 border-b bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#16203a] transition-all"
                                            >
                                                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                                    {hasValidProfileImage(emp.ProfilePic) ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_IMAGE_PREVIEW_URL}${emp.ProfilePic.split("|")[0]}`}
                                                            alt={emp.Name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                            {emp.Name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-center min-w-0 flex-1">
                                                    <span className="text-[13px] font-medium text-gray-800 dark:text-white truncate">
                                                        {emp.Name}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500 truncate">
                                                        {emp.DesignationName}
                                                    </span>
                                                </div>
                                                {(isEditMode || !emp.isFixed) && (
                                                    <PermissionAwareTooltip
                                                        allowed={SmartActions.canRemoveTicketUser(formName)}
                                                        allowedText=""
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={!SmartActions.canRemoveTicketUser(formName)}
                                                            onClick={() => removeEmployee(emp.EmployeeId)}
                                                            className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                                                            title="Remove Employee"
                                                        >
                                                            <FaTimes size={16} />
                                                        </button>
                                                    </PermissionAwareTooltip>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                            <p className="text-xs text-gray-400 font-medium">
                                                No employee assigned
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </Form>
                        {/* {Object.keys(errors).length > 0 && (
                            <div className="bg-red-100 text-red-600 p-2">
                                Errors: {JSON.stringify(errors)}
                            </div>
                        )} */}
                        <SelectUserModal
                            open={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            users={filteredUsers}
                            onSelect={(user: any) => {
                                setAssignedEmployees([
                                    ...assignedEmployees,
                                    { ...user, isFixed: false },
                                ]);
                                setIsModalOpen(false);
                            }}
                            search={userSearch}
                            setSearch={setUserSearch}
                        />
                        <SelectClientModal
                            open={isClientModalOpen}
                            onClose={() => setIsClientModalOpen(false)}
                            clients={clients}
                            search={clientSearch}
                            setSearch={setClientSearch}
                            onSelect={(client) => {
                                setFieldValue("name", client.ClientName);
                                setFieldValue("clientId", client.ClientId);
                                setFieldValue("productService", "");
                                fetchProjectsByClient(Number(client.ClientId));
                                setIsClientModalOpen(false);
                            }}
                        />
                    </div>
                );
            }}
        </Formik>
    );
}
