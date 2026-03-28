"use client";

import React, { useEffect, useState } from "react";
import { FaUpload, FaTimes } from "react-icons/fa";
import { Trash2, ImageIcon } from "lucide-react";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useNavigate, useParams } from "react-router-dom";
import { Formik } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import CropperModal from "../Cropper/Croppermodel";
import { PostService } from "../../../../services/PostService";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";


interface FormValues {
    imagePath: string;
}

const validationSchema = Yup.object().shape({
    imagePath: Yup.string().required("Popup image is required"),
});

export default function AddMemberPopupImage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { universalService } = ApiService();
    const { postDocument } = PostService();
    const [loading, setLoading] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(false);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState<boolean>(false);
    const [showCropper, setShowCropper] = useState<boolean>(false);
    const [rawImage, setRawImage] = useState<string>("");
    const [image, setImage] = useState<any>(null);
    const [imagePath, setImagePath] = useState("");
    const formikRef = React.useRef<any>(null);
    const [allImages, setAllImages] = useState<any[]>([]);
    const path = location.pathname;
    const formName = path.split("/").pop();
    const isEditable = isEditMode
        ? SmartActions.canEdit(formName)
        : SmartActions.canAdd(formName);
    const initialValues: FormValues = {
        imagePath: "",
    };
    const [form, setForm] = useState<FormValues>(initialValues);
    const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

    const fetchFormPermissions = async () => {
        try {
            setPermissionLoading(true);

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
                    formName?.trim().toLowerCase()
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

        } catch (err) {
            console.error("Permission fetch failed", err);
            setHasPageAccess(false);
        } finally {
            setPermissionLoading(false);
        }
    };
    const loadAllPopupImages = async () => {
        try {

            const payload = {
                procName: "ManageMemberPopupImage",
                Para: JSON.stringify({
                    ActionMode: "GetAll"
                }),
            };

            const res = await universalService(payload);

            let data = res?.data || res;

            // FIX
            
            if (!data || data === "NoRecord") {
                setAllImages([]);
                return;
            }

            if (!Array.isArray(data)) {
                setAllImages([]);
                return;
            }

            setAllImages(data);

        } catch (err) {

            console.error("GetAll popup error:", err);
            setAllImages([]);

        }
    };

    const handleImageUpload = async (e: any) => {

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

        const reader = new FileReader();

        reader.onload = () => {
            setRawImage(reader.result as string);
            setShowCropper(true);
        };

        reader.readAsDataURL(file);
    };

    const handleCroppedImage = async (croppedBase64: string) => {
        try {

            /* Convert Base64 → File */
            const res = await fetch(croppedBase64);
            const blob = await res.blob();

            const file = new File([blob], `popup_${Date.now()}.png`, {
                type: blob.type,
            });

            const preview = URL.createObjectURL(file);

            /* Preview before upload */
            setImage({
                preview,
                fileName: "",
                uploading: true,
            });

            /* Upload using same folder logic */
            const fd = new FormData();
            fd.append("UploadedImage", file);

            // SAME FOLDER AS PACKAGE MODULE
            fd.append("pagename", "EmpDoc");

            const uploadRes = await postDocument(fd);

            const uploadedFileName =
                uploadRes?.fileName || uploadRes?.Message;

            if (!uploadedFileName) {
                toast.error("Image upload failed");
                setImage(null);
                return;
            }

            setImage({
                preview,
                fileName: uploadedFileName,
                uploading: false,
            });

            setImagePath(uploadedFileName);

            formikRef.current?.setFieldValue("imagePath", uploadedFileName);

            /* AUTO SAVE POPUP */
            await autoSavePopup(uploadedFileName);

        } catch (err) {

            console.error("Upload error:", err);
            toast.error("Image upload failed");

        } finally {
            setShowCropper(false);
        }
    };

    const loadPopupData = async () => {

        try {

            setInitialLoading(true);

            const payload = {
                procName: "ManageMemberPopupImage",
                Para: JSON.stringify({
                    ActionMode: "GetById",
                    MemberPopupImageId: Number(id),
                }),
            };

            const res = await universalService(payload);
            const data = res?.data?.[0] || res?.[0];

            if (!data) return;

            setForm({
                imagePath: data.ImagePath || "",
                isActive: data.IsActive === 1,
            });

            if (data.ImagePath) {
                setImage({
                    preview: `${IMAGE_PREVIEW_URL}${data.ImagePath}`,
                    fileName: data.ImagePath,
                });

                setImagePath(data.ImagePath);
            }

        } catch (err) {

            console.error(err);

        } finally {

            setInitialLoading(false);

        }
    };
    const handleDelete = async (img) => {

        const confirm = await Swal.fire({
            title: "Delete Popup Image?",
            text: "This popup will be removed.",
            icon: "warning",
            showCancelButton: true
        });

        if (!confirm.isConfirmed) return;

        try {

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "ManageMemberPopupImage",
                Para: JSON.stringify({
                    ActionMode: "Delete",
                    MemberPopupImageId: img.MemberPopupImageId,
                    ModifiedBy: employeeId
                })
            };

            const res = await universalService(payload);

            const result = res?.data?.[0] || res?.[0];

            if (result?.StatusCode === 1) {

                toast.success(result.Msg);

                loadAllPopupImages();

            } else {

                toast.error(result?.Msg || "Delete failed");

            }

        } catch (err) {

            console.error(err);
            toast.error("Server error");

        }
    };
    const handleSubmit = async (
        values: FormValues,
        { resetForm, setSubmitting }: FormikHelpers<FormValues>
    ) => {

        if (!imagePath) {
            toast.error("Please upload popup image");
            return;
        }

        const confirm = await Swal.fire({
            title: isEditMode ? "Update Popup Image?" : "Add Popup Image?",
            icon: "question",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        setLoading(true);

        try {

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "ManageMemberPopupImage",
                Para: JSON.stringify({
                    ActionMode: isEditMode ? "Update" : "Insert",
                    MemberPopupImageId: id ? Number(id) : 0,
                    ImagePath: imagePath,
                    EntryBy: employeeId,
                    ModifiedBy: employeeId,
                }),
            };

            const response = await universalService(payload);

            const res = response?.data?.[0] || response?.[0];

            if (res?.StatusCode === 1) {

                Swal.fire("Success", res.Msg, "success");


                loadAllPopupImages(); // refresh list

                if (isEditMode) {
                    loadPopupData();
                } else {
                    resetForm();
                    setImage(null);
                    setImagePath("");
                }

            } else {

                Swal.fire("Error", res?.Msg || "Operation failed", "error");

            }

        } catch (err) {

            Swal.fire("Error", "Server error", "error");

        } finally {

            setLoading(false);
            setSubmitting(false);

        }
    };

    const handleToggleStatus = async (img: any) => {

        try {

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            let actionMode = "SetActive";

            // If already active → deactivate all
            if (img.Status === "Active") {
                actionMode = "DeactivateAll";
            }

            const payload = {
                procName: "ManageMemberPopupImage",
                Para: JSON.stringify({
                    ActionMode: actionMode,
                    MemberPopupImageId: img.MemberPopupImageId,
                    ModifiedBy: employeeId
                })
            };

            const res = await universalService(payload);

            const result = res?.data?.[0] || res?.[0];

            if (result?.StatusCode === 1) {

                toast.success(result.Msg || "Popup status updated");

                loadAllPopupImages();

            } else {

                toast.error(result?.Msg || "Failed to update popup status");

            }

        } catch (err) {

            console.error("Status update error:", err);
            toast.error("Server error");

        }

    };
    const autoSavePopup = async (uploadedFileName: string) => {

        try {

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "ManageMemberPopupImage",
                Para: JSON.stringify({
                    ActionMode: "Insert",
                    MemberPopupImageId: 0,
                    ImagePath: uploadedFileName,
                    EntryBy: employeeId,
                    ModifiedBy: employeeId,
                }),
            };

            const response = await universalService(payload);

            const res = response?.data?.[0] || response?.[0];

            if (res?.StatusCode === 1) {

                toast.success(res.Msg || "Popup uploaded");

                loadAllPopupImages();

                setImage(null);
                setImagePath("");

            } else {

                toast.error(res?.Msg || "Failed to save popup");

            }

        } catch (err) {

            console.error(err);
            toast.error("Server error");

        }

    };
    useEffect(() => {
        if (id) {
            loadPopupData();
        }
    }, [id]);

    useEffect(() => {
        fetchFormPermissions();
        loadAllPopupImages();
    }, []);

    if (isEditMode && initialLoading) {
        return (
            <Loader />
        );
    }

    if (permissionLoading) {
        return (
            <Loader />
        );
    }
    if (!hasPageAccess) {
        return (
            <AccessRestricted />
        );
    }

    return (
        <Formik
            innerRef={formikRef}
            initialValues={form}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
        >
            {({
                values,
                errors,
                touched,
                handleSubmit,
                setFieldValue,
                isSubmitting,
            }) => (
                <form
                    onSubmit={handleSubmit}
                    className="relative bg-white dark:bg-[#0c1427] dark:text-gray-100 rounded-lg mb-10"
                >
                    {(loading || isSubmitting || permissionLoading) && (
                        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0c1427]/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                            <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                        <div className="text-lg font-bold text-gray-800 dark:text-white">
                            {isEditMode
                                ? "Edit Member Panel Popup Image"
                                : "Manage Member Panel Popup Image"}
                        </div>

                        <div className="flex gap-x-2">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm"
                            >
                                Back
                            </button>

                            {/* <PermissionAwareTooltip
                                allowed={isEditable}
                                allowedText={isEditMode ? "Update Popup" : "Add Popup"}
                                deniedText="Permission required"
                            >
                                <button
                                    type="submit"
                                    disabled={!isEditable || loading || isSubmitting}
                                    className={`px-4 py-1.5 rounded text-sm font-medium
                ${!isEditable
                                            ? "bg-gray-300 text-white cursor-not-allowed"
                                            : "bg-primary-button-bg hover:bg-primary-button-bg-hover text-white"
                                        }`}
                                >
                                    {isEditMode ? "Update Popup" : "Add Popup"}
                                </button>
                            </PermissionAwareTooltip> */}
                        </div>
                    </div>

                   {/* BODY */}
                    <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">

                        {/* IMAGE UPLOAD */}
                        <div className="w-full md:w-44 flex-shrink-0 flex justify-center md:justify-start">

                            <div className="relative w-36 h-36 group">

                                <div className="w-full h-full rounded-xl border-[4px] border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">

                                    {image ? (

                                        <img
                                            src={image.preview}
                                            alt="Popup"
                                            className="w-full h-full object-cover"
                                        />

                                    ) : imagePath ? (

                                        <img
                                            src={`${IMAGE_PREVIEW_URL}${imagePath}`}
                                            alt="Popup"
                                            className="w-full h-full object-cover"
                                        />

                                    ) : (

                                        <ImageIcon className="text-6xl text-gray-400 dark:text-gray-600" />

                                    )}

                                    {image?.uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}

                                </div>

                                {/* EDIT BUTTON */}
                                <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">

                                    <FaUpload size={14} />

                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />

                                </label>

                                {/* DELETE BUTTON */}
                                {(image || imagePath) && (

                                    <button
                                        type="button"
                                        onClick={() => {

                                            setImage(null);
                                            setImagePath("");
                                            formikRef.current?.setFieldValue("imagePath", "");

                                        }}
                                        className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 text-red-400 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-200 dark:border-gray-600"
                                    >
                                        <FaTimes size={14} />
                                    </button>

                                )}

                            </div>

                        </div>
                        {/* ALL POPUP IMAGES */}
                        <div className="flex-1 w-full mt-2">
                        {allImages.length > 0 && (
                            <div className="mt-0">

                               
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">

                                    {allImages.map((img) => (

                                        <div
                                            key={img.MemberPopupImageId}
                                            className={`relative group rounded-xl overflow-hidden border transition-all duration-300 shadow-sm
${img.Status === "Active"
                                                    ? "border-green-500 ring-1 ring-green-300"
                                                    : "border-gray-200 dark:border-gray-700"}
`}
                                        >

                                            {/* IMAGE */}
                                            <img
                                                src={`${IMAGE_PREVIEW_URL}${img.ImagePath}`}
                                                className="w-full h-32 object-cover"
                                            />

                                            {/* STATUS BADGE */}
                                            <div className="absolute top-2 left-2">

                                                <span
                                                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium
${img.Status === "Active"
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-500 text-white"}
`}
                                                >
                                                    {img.Status}
                                                </span>

                                            </div>


                                            {/* ACTION BUTTONS */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">


                                                {/* DELETE */}
                                                <PermissionAwareTooltip
                                                    allowed={SmartActions.canDelete(
                                                        formName,
                                                    )}
                                                    allowedText="Delete"
                                                    deniedText="No delete permission"
                                                >

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(img)}
                                                        disabled={!SmartActions.canDelete(
                                                            formName,
                                                        )}
                                                        className="p-1.5 rounded-md bg-white/80 backdrop-blur hover:bg-red-500 hover:text-white text-gray-700 shadow-sm transition disabled:opacity-50"
                                                        title="Delete Popup"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </PermissionAwareTooltip>


                                            </div>


                                            {/* STATUS + TOGGLE ROW */}
                                            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 bg-black/50 backdrop-blur-sm">

                                                <span className="text-[11px] text-white font-medium">
                                                    {img.Status === "Active" ? "Active Popup" : "Inactive"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(img)}
                                                    title={img.Status === "Active" ? "Deactivate Popup" : "Activate Popup"}
                                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200
  ${img.Status === "Active"
                                                            ? "bg-green-500"
                                                            : "bg-gray-300 dark:bg-gray-600"}
`}
                                                >

                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
${img.Status === "Active"
                                                                ? "translate-x-5"
                                                                : "translate-x-1"}
`}
                                                    />

                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </div>
                        )}
                        </div>
                    </div>
                    </div>

                    <ToastContainer position="top-right" autoClose={3000} />

                    <CropperModal
                        open={showCropper}
                        image={rawImage}
                        aspectRatio={1}
                        onCrop={handleCroppedImage}
                        onClose={() => setShowCropper(false)}
                    />
                </form>
            )}
        </Formik>
    );
}
